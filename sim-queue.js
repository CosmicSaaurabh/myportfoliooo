// sim-queue.js — interactive simulation of Sentinel Engine's durable task queue.
//
// The point of this file is one line in the event log:
//
//     W3 write REJECTED — fence 4 < current 5
//
// Lease expiry alone only bounds how long you wait for a dead worker. It says nothing
// about what that worker does when it wakes up. The fence token is what makes the late
// write harmless, and this lets a reviewer cause that exact race on purpose.
//
// DOM + CSS rather than canvas: themable through the existing custom properties,
// readable by a screen reader, and it survives the print stylesheet.

const TICK_MS = 100;
const LEASE_MS = 4200;
const HEARTBEAT_MS = 1400;  // a healthy worker renews its lease; a failed one stops
const WORK_MIN = 2400;
const WORK_MAX = 6200;
// Must exceed LEASE_MS, or the zombie wakes before the reaper has requeued its task
// and there is nothing to fence it off from.
const RECOVER_MS = LEASE_MS + 1600;
const STALL_MS = LEASE_MS + 1200;  // long enough that the lease actually lapses
const MAX_LOG = 60;

const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountSim(host) {
  const narrow = window.innerWidth <= 768;
  const workerCount = narrow ? 3 : 4;

  /* ---------- state ---------- */
  let nextTaskId = 1;
  let tasks = [];       // {id, state:'pending'|'leased'|'done', fence, attempts}
  let workers = [];
  let log = [];
  let counters = { completed: 0, requeued: 0, fenced: 0, duplicates: 0 };
  let timer = null;
  let paused = false;
  let speed = 1;
  let logDirty = true;
  const stepMode = reduceMotion();

  function reset() {
    nextTaskId = 1;
    tasks = [];
    for (let i = 0; i < 7; i++) tasks.push(newTask());
    workers = Array.from({ length: workerCount }, (_, i) => ({
      id: `W${i + 1}`, state: 'idle', taskId: null, fence: 0,
      heartbeat: HEARTBEAT_MS, work: 0, workTotal: 0, recoverIn: 0, partitioned: false, stalledFor: 0,
    }));
    log = [];
    counters = { completed: 0, requeued: 0, fenced: 0, duplicates: 0 };
    say('sim', `queue ready — 7 tasks, ${workerCount} workers`);
    draw();
  }
  // The lease lives on the TASK, not on the worker. That is the whole point: the store is
  // the authority on who currently owns a task, and a dead worker's opinion does not count.
  function newTask() {
    return { id: `t${nextTaskId++}`, state: 'pending', fence: 0, attempts: 0, leasedBy: null, lease: 0 };
  }
  function say(kind, text) {
    log.unshift({ kind, text });
    if (log.length > MAX_LOG) log.pop();
    logDirty = true;
    announce(kind, text);
  }
  const taskOf = (w) => tasks.find((x) => x.id === w.taskId);

  /* ---------- simulation step ---------- */
  function step(dt) {
    // 1. Idle workers claim pending work. Every lease grant bumps the task's fence token.
    workers.forEach((w) => {
      if (w.state !== 'idle') return;
      const t = tasks.find((x) => x.state === 'pending');
      if (!t) return;
      t.state = 'leased';
      t.fence += 1;
      t.attempts += 1;
      t.leasedBy = w.id;
      t.lease = LEASE_MS;
      w.state = 'running';
      w.taskId = t.id;
      w.fence = t.fence;
      w.heartbeat = HEARTBEAT_MS;
      w.work = 0;
      w.workTotal = rand(WORK_MIN, WORK_MAX);
      say('claim', `${w.id} claimed ${t.id} — lease ${(LEASE_MS / 1000).toFixed(1)}s, fence ${t.fence}`);
    });

    // 2. Running workers make progress and heartbeat. A partitioned worker keeps computing
    //    but cannot reach the store, so it cannot renew — which is how the reaper notices.
    workers.forEach((w) => {
      if (w.state === 'running') {
        // A stalled worker is alive but frozen: no progress, and crucially no heartbeat.
        // This is the classic long-GC-pause zombie, and the reason lease expiry alone is unsafe.
        if (w.stalledFor > 0) {
          w.stalledFor -= dt;
          if (w.stalledFor <= 0) say('wake', `${w.id} resumed after stall, still believes it owns ${w.taskId}`);
          return;
        }
        w.work += dt;
        const t = taskOf(w);
        if (!w.partitioned && t && t.leasedBy === w.id) {
          w.heartbeat -= dt;
          if (w.heartbeat <= 0) { t.lease = LEASE_MS; w.heartbeat = HEARTBEAT_MS; }
        }
        if (w.work >= w.workTotal) attemptWrite(w);
      } else if (w.state === 'dead') {
        w.recoverIn -= dt;
        if (w.recoverIn <= 0) {
          say('wake', `${w.id} restarted and retried its in-flight write for ${w.taskId}`);
          attemptWrite(w, true);
        }
      }
    });

    // 3. The reaper scans TASKS, not workers.
    tasks.forEach((t) => {
      if (t.state !== 'leased') return;
      t.lease -= dt;
      if (t.lease > 0) return;
      counters.requeued += 1;
      say('reap', `reaper: lease on ${t.id} expired → requeued (held by ${t.leasedBy})`);
      t.state = 'pending';
      t.leasedBy = null;
      // A worker still running this task loses ownership but keeps its now-stale fence.
      const w = workers.find((x) => x.taskId === t.id && x.state === 'running');
      // A stalled worker stays running: it will thaw, finish, and get fenced on write.
      if (w && !w.stalledFor) { w.state = 'dead'; w.recoverIn = RECOVER_MS; }
    });

    // Keep a little work flowing so the queue never sits empty.
    if (tasks.filter((t) => t.state !== 'done').length < 4) tasks.push(newTask());
    if (tasks.length > 16) tasks = tasks.filter((t) => t.state !== 'done').slice(-16);
  }

  // The whole point of the simulation lives here.
  function attemptWrite(w, isLate = false) {
    const t = taskOf(w);
    if (!t) { retire(w); return; }
    if (w.partitioned && !isLate) {
      say('drop', `${w.id} finished ${t.id} but is partitioned — write dropped`);
      w.state = 'dead';
      w.recoverIn = RECOVER_MS;
      return;
    }
    if (w.fence < t.fence) {
      // Stale token. The store rejects it, so the duplicate never happens.
      counters.fenced += 1;
      say('fence', `${w.id} write REJECTED — fence ${w.fence} < current ${t.fence}`);
      retire(w);
      return;
    }
    if (t.state === 'done') {
      // Unreachable while the fence check above holds. Counted so the claim is falsifiable.
      counters.duplicates += 1;
      say('dupe', `${w.id} DOUBLE-EXECUTED ${t.id} — invariant broken`);
      retire(w);
      return;
    }
    t.state = 'done';
    t.leasedBy = null;
    counters.completed += 1;
    say('done', `${w.id} committed ${t.id} — fence ${w.fence} accepted`);
    retire(w);
  }
  function retire(w) {
    w.state = 'idle'; w.taskId = null; w.partitioned = false; w.work = 0; w.fence = 0; w.stalledFor = 0;
  }

  /* ---------- actions ---------- */
  function killWorker() {
    const live = workers.filter((w) => w.state === 'running');
    if (!live.length) { say('sim', 'no running worker to kill'); draw(); return; }
    const w = live[Math.floor(Math.random() * live.length)];
    w.state = 'dead';
    w.partitioned = false;
    w.recoverIn = RECOVER_MS;
    // It stops heartbeating, so its task's lease now drains to zero.
    say('kill', `${w.id} KILLED mid-task (${w.taskId}) — it stops heartbeating`);
    draw();
  }
  function partitionWorker() {
    const live = workers.filter((w) => w.state === 'running' && !w.partitioned);
    if (!live.length) { say('sim', 'no running worker to partition'); draw(); return; }
    const w = live[Math.floor(Math.random() * live.length)];
    w.partitioned = true;
    say('part', `${w.id} PARTITIONED — still computing ${w.taskId}, cannot reach the store`);
    draw();
  }
  function stallWorker() {
    const live = workers.filter((w) => w.state === 'running' && !w.stalledFor);
    if (!live.length) { say('sim', 'no running worker to stall'); draw(); return; }
    const w = live[Math.floor(Math.random() * live.length)];
    w.stalledFor = STALL_MS;
    say('stall', `${w.id} STALLED on ${w.taskId} (GC pause) — no heartbeat while frozen`);
    draw();
  }
  function addLoad() {
    for (let i = 0; i < 4; i++) tasks.push(newTask());
    say('sim', '4 tasks enqueued');
    draw();
  }

  /* ---------- view ---------- */
  host.innerHTML = `
    <div class="sim">
      <header class="sim-head">
        <h2 class="sim-title">Durable task queue — failure simulation</h2>
        <p class="sim-sub">Sentinel Engine claims tasks with <code>SELECT FOR UPDATE SKIP LOCKED</code> and a time-bounded lease.
        A healthy worker renews its lease by heartbeat, so leases only run out when something has actually gone wrong.
        Kill a worker and watch its lease drain, the reaper requeue the task, and another worker pick it up.
        When the dead worker restarts and retries its in-flight write, its fence token is stale and the store rejects it.
        <strong>Duplicate executions never leaves zero.</strong></p>
      </header>
      <div class="sim-controls">
        <button type="button" class="sim-btn sim-btn-danger" data-act="kill">Kill a worker</button>
        <button type="button" class="sim-btn sim-btn-warn" data-act="partition">Partition a worker</button>
        <button type="button" class="sim-btn sim-btn-warn" data-act="stall" title="Freeze a worker mid-task, like a long GC pause">Stall a worker</button>
        <button type="button" class="sim-btn" data-act="load">Add load</button>
        ${stepMode
          ? `<button type="button" class="sim-btn" data-act="step">Step ▸</button>`
          : `<button type="button" class="sim-btn" data-act="pause">Pause</button>
             <label class="sim-speed">Speed
               <input type="range" min="0.5" max="3" step="0.5" value="1" data-act="speed" aria-label="Simulation speed">
             </label>`}
        <button type="button" class="sim-btn" data-act="reset">Reset</button>
      </div>
      <div class="sim-counters" data-role="counters"></div>
      <div class="sim-grid">
        <section class="sim-col">
          <h3 class="sim-h">Queue</h3>
          <div class="sim-queue" data-role="queue"></div>
        </section>
        <section class="sim-col">
          <h3 class="sim-h">Workers</h3>
          <div class="sim-workers" data-role="workers"></div>
        </section>
      </div>
      <section class="sim-col">
        <h3 class="sim-h">Event log</h3>
        <div class="sim-log" data-role="log" role="log" aria-live="off"></div>
        <p class="sr-only" data-role="announce" role="status" aria-live="polite"></p>
      </section>
    </div>`;

  const $ = (sel) => host.querySelector(sel);
  const elQueue = $('[data-role="queue"]');
  const elWorkers = $('[data-role="workers"]');
  const elLog = $('[data-role="log"]');
  const elCounters = $('[data-role="counters"]');
  const elAnnounce = $('[data-role="announce"]');

  // The visual log adds ~2 rows a second. Announcing all of it would flood a screen reader,
  // so only failure-path events are spoken, and at most one every few seconds.
  const NOTABLE = new Set(['kill', 'part', 'stall', 'reap', 'fence', 'dupe', 'wake']);
  let lastAnnounceAt = 0;
  let pendingAnnounce = null;
  let simClock = 0;
  function announce(kind, text) {
    if (!NOTABLE.has(kind)) return;
    pendingAnnounce = text;
  }
  function flushAnnounce() {
    if (!pendingAnnounce || simClock - lastAnnounceAt < 3000) return;
    elAnnounce.textContent = pendingAnnounce;
    pendingAnnounce = null;
    lastAnnounceAt = simClock;
  }

  function draw() {
    // Live work first, a few completed tasks after it for context.
    const shown = [...tasks.filter((t) => t.state !== 'done'), ...tasks.filter((t) => t.state === 'done').slice(-5)];
    elQueue.innerHTML = shown.slice(0, 14).map((t) => {
      const cls = t.state === 'done' ? 'is-done' : t.state === 'leased' ? 'is-leased' : 'is-pending';
      const title = `${t.id} — ${t.state}, fence ${t.fence}${t.attempts > 1 ? `, attempt ${t.attempts}` : ''}`;
      return `<span class="sim-task ${cls}" title="${title}">${t.id}${t.fence > 1 ? `<sup>${t.fence}</sup>` : ''}</span>`;
    }).join('');

    elWorkers.innerHTML = workers.map((w) => {
      const t = tasks.find((x) => x.id === w.taskId);
      const pct = t && t.state === 'leased' ? Math.max(0, Math.min(100, (t.lease / LEASE_MS) * 100)) : 0;
      const low = pct < 30;
      let status = 'idle';
      let scls = 'is-idle';
      if (w.state === 'running' && w.stalledFor > 0) { status = 'stalled'; scls = 'is-stall'; }
      else if (w.state === 'running' && w.partitioned) { status = 'partitioned'; scls = 'is-part'; }
      else if (w.state === 'running') { status = 'running'; scls = 'is-run'; }
      else if (w.state === 'dead') { status = 'down'; scls = 'is-dead'; }
      return `<div class="sim-worker ${scls}">
        <span class="sim-w-id">${w.id}</span>
        <span class="sim-w-status">${status}</span>
        <span class="sim-w-task">${w.taskId ? `${w.taskId} · fence ${w.fence}` : '—'}</span>
        <span class="sim-w-lease" aria-hidden="true"><i style="width:${pct.toFixed(0)}%" class="${low ? 'low' : ''}"></i></span>
      </div>`;
    }).join('');

    elCounters.innerHTML = [
      ['completed', counters.completed, ''],
      ['requeued by reaper', counters.requeued, ''],
      ['writes fenced off', counters.fenced, 'is-fence'],
      ['duplicate executions', counters.duplicates, counters.duplicates ? 'is-bad' : 'is-good'],
    ].map(([label, val, cls]) => `<div class="sim-counter ${cls}"><span class="n">${val}</span><span class="l">${label}</span></div>`).join('');

    if (logDirty) {
      elLog.innerHTML = log.map((l) => `<div class="sim-log-row k-${l.kind}">${l.text}</div>`).join('');
      logDirty = false;
    }
  }

  /* ---------- loop ---------- */
  function tick() {
    // offsetParent is null when an ancestor is display:none — e.g. the plain view is showing.
    if (paused || host.offsetParent === null) return;
    simClock += TICK_MS * speed;
    step(TICK_MS * speed);
    draw();
    flushAnnounce();
  }
  function start() {
    if (stepMode || timer) return;
    timer = setInterval(tick, TICK_MS);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  host.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'kill') killWorker();
    else if (act === 'partition') partitionWorker();
    else if (act === 'stall') stallWorker();
    else if (act === 'load') addLoad();
    else if (act === 'reset') reset();
    else if (act === 'step') { step(400); draw(); }
    else if (act === 'pause') {
      paused = !paused;
      btn.textContent = paused ? 'Resume' : 'Pause';
    }
  });
  host.addEventListener('input', (e) => {
    if (e.target.dataset.act === 'speed') speed = Number(e.target.value) || 1;
  });

  // Never burn battery in a background tab.
  const onVis = () => { if (document.hidden) stop(); else start(); };
  document.addEventListener('visibilitychange', onVis);

  reset();
  start();

  return function unmount() {
    stop();
    document.removeEventListener('visibilitychange', onVis);
  };
}
