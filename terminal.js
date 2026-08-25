// terminal.js — owns everything inside the terminal panel: command registry, input loop,
// history/completion, easter eggs. ide-shell.js only owns the panel's open/close/resize/persist.
// REGISTRY is module-level and exported (Phase 3 prerequisite) so palette.js can import it
// without any circular dependency. Command handlers receive (args, ctx) where ctx carries
// whatever DOM/state hooks they need — no closures over initTerminal's locals anymore.

import { about, experience, projects, skills, achievements, contact, resumeHref, codingProfiles, readme, interview, posts } from './file-contents.js';
import { FILES, DIRS, fileByPathOrName, rootListing } from './files.js';
import { THEMES, applyTheme, getCurrentTheme } from './theme.js';
import { get as getLiveData, refresh as refreshLiveData } from './livedata.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const HISTORY_KEY = 'ide.term.history.v1';
const MAX_LINES = 500;
const MAX_HISTORY = 50;

/* file listing now lives in files.js (single source shared with ide-shell + palette) */
function yamlText(e) {
  return `company: "${e.company}"\nrole: "${e.role}"\nperiod: "${e.period}"\nlocation: "${e.location}"\nhighlights:\n${e.highlights.map((h) => `  - "${h.body}"`).join('\n')}`;
}
function projectMarkdownText(p) {
  const tags = p.tags.map((t) => `\`${t}\``).join(' ');
  const challenges = p.challenges.map((c) => `**Challenge:** ${c.problem}\n**Solution:** ${c.solution}`).join('\n\n');
  const metrics = p.metrics.map((m) => `- **${m.value}** — ${m.label}`).join('\n');
  return `# ${p.title}\n### ${p.subtitle}\n\n${tags}\n\n${p.summary}\n\n## Role\n${p.role}\n\n## Architecture\n${p.architectureList.map((a) => `- ${a}`).join('\n')}\n\n## Challenges & Solutions\n${challenges}\n\n## Metrics\n${metrics}\n\n[View on GitHub](${p.github})`;
}
function commitHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0').slice(0, 7);
}
function buildCommitList() {
  const list = [];
  experience.forEach((role, i) => {
    const isCurrent = i === 0;
    if (isCurrent) list.push({ header: true, current: true, roleId: role.id, text: `HEAD -> ${role.id} (in progress) — ${role.role} · ${role.period}`, hash: commitHash(`head:${role.id}`) });
    else list.push({ header: true, roleId: role.id, text: `Merge branch '${role.id}' — ${role.role} · ${role.period}`, hash: commitHash(`merge:${role.id}`) });
    role.highlights.forEach((h, hi) => list.push({ roleId: role.id, type: h.type, scope: h.scope, subject: h.subject, hash: commitHash(`${role.id}:${hi}:${h.subject}`) }));
  });
  return list;
}
function rawContentFor(id) {
  if (id === 'about') return about.markdown;
  const exp = experience.find((e) => e.id === id);
  if (exp) return yamlText(exp);
  const proj = projects.find((p) => p.id === id);
  if (proj) return projectMarkdownText(proj);
  if (id === 'skills') return JSON.stringify(skills, null, 2);
  if (id === 'profiles') return codingProfiles.map((p) => `${p.name}: ${p.statValue} (${p.statLabel}) — ${p.url}`).join('\n');
  if (id === 'achievements') return achievements.map((a) => `[${a.ts}] ${a.level}  ${a.text}`).join('\n');
  if (id === 'history') return buildCommitList().map((c) => c.header ? `* ${c.hash} ${c.text}` : `* ${c.hash} ${c.type}(${c.scope}): ${c.subject}`).join('\n');
  if (id === 'contact') return `#!/bin/bash\n# contact.sh — reach me here\necho "Email:    ${contact.email}"\necho "LinkedIn: ${contact.linkedin}"\necho "GitHub:   ${contact.github}"\necho "Phone:    ${contact.phone}"`;
  return null;
}

/* ---------- module-level command registry (exported for palette.js) ---------- */
export const REGISTRY = {
  help: {
    description: 'List available commands', group: 'core',
    run: () => {
      // Derived from REGISTRY: a new command shows up here without a second edit.
      const order = ['core', 'navigation', 'content'];
      const lines = [];
      order.forEach((g) => {
        const cmds = Object.entries(REGISTRY).filter(([, v]) => v.group === g && !v.hidden);
        if (!cmds.length) return;
        lines.push(`<span class="tok-comment">## ${g}</span>`);
        const width = Math.max(...cmds.map(([k, v]) => (v.usage || k).length));
        cmds.forEach(([k, v]) => lines.push(`  <span class="tok-fn">${esc((v.usage || k).padEnd(width, ' '))}</span>  ${esc(v.description)}`));
      });
      return lines;
    },
  },
  clear: { description: 'Clear the terminal', group: 'core', run: (args, ctx) => { ctx.output.innerHTML = ''; return []; } },
  history: {
    description: 'List past commands', group: 'core',
    run: (args, ctx) => ctx.getHistory().map((h, i) => `${String(i + 1).padStart(3, ' ')}  ${esc(h)}`),
  },
  echo: { usage: 'echo <text>', description: 'Print arguments back', group: 'core', run: (args) => [esc(args.join(' '))] },
  pwd: { description: 'Print working directory', group: 'core', run: () => ['~/portfolio'] },
  date: { description: 'Print current date/time', group: 'core', run: () => [new Date().toString()] },
  ls: {
    usage: 'ls [path]', description: 'List files', group: 'navigation',
    run: (args) => {
      const raw = (args[0] || '').replace(/\/$/, '');
      // Derived, not hardcoded — the old literal list had already drifted (no profiles.md).
      if (!raw) return rootListing().map((n) => `<span class="tok-key">${esc(n)}</span>`);
      const singleFile = fileByPathOrName(args[0]);
      const inDir = FILES.filter((f) => f.path.startsWith(`${raw}/`));
      if (inDir.length) return inDir.map((f) => `<span class="tok-plain">${esc(f.name)}</span>`);
      if (singleFile) return [`<span class="tok-plain">${esc(singleFile.name)}</span>`];
      return [`ls: cannot access '${esc(raw)}': No such file or directory`];
    },
  },
  cat: {
    usage: 'cat <file>', description: "Print a file's raw content", group: 'navigation',
    run: (args) => {
      if (!args[0]) return ['usage: cat <file>'];
      const f = fileByPathOrName(args[0]);
      if (!f) return [`cat: ${esc(args[0])}: No such file`];
      return [esc(rawContentFor(f.id))];
    },
  },
  open: {
    usage: 'open <file>', description: 'Open a file as an editor tab', group: 'navigation',
    run: (args, ctx) => {
      if (!args[0]) return ['usage: open <file>'];
      const f = fileByPathOrName(args[0]);
      if (!f) return [`open: ${esc(args[0])}: No such file`];
      ctx.openFile(f.id);
      if (window.innerWidth <= 768) ctx.closeIfMobile();
      return [`Opened <span class="tok-fn">${esc(f.name)}</span>.`];
    },
  },
  whoami: {
    description: 'Quick intro', group: 'content',
    run: () => [
      `<span class="tok-fn">${esc(readme.name)}</span>`,
      esc(readme.title),
      'Focus: distributed systems, SDKs, cloud-native backend infra.',
      `Currently at ${esc(experience[0].company)}; previously ${esc(experience[1].company)} (${esc(experience[1].period)}).`,
    ],
  },
  experience: {
    description: 'Work history timeline', group: 'content',
    run: () => experience.map((e) => `<span class="tok-comment">${e.period.padEnd(22, ' ')}</span> <span class="tok-key">${esc(e.company)}</span> — ${esc(e.role)}`),
  },
  projects: {
    description: 'One line per project', group: 'content',
    run: () => [
      ...projects.filter((p) => p.featured).map((p) => `<span class="tok-fn">${esc(p.id)}</span>  <span class="tok-comment">[${p.tags.slice(0, 3).map(esc).join(', ')}]</span>  ${esc(p.subtitle)}`),
      '<span class="tok-comment">## also built</span>',
      ...projects.filter((p) => !p.featured).map((p) => `<span class="tok-plain">${esc(p.id)}</span>  <span class="tok-comment">${esc(p.subtitle)}</span>`),
    ],
  },
  skills: {
    description: 'Skills as a table', group: 'content',
    run: () => {
      const rows = [];
      Object.values(skills).forEach((items) => {
        items.forEach((s) => rows.push(`<span class="tok-key">${esc(s.name.padEnd(28, ' '))}</span> <span class="tok-str">${s.depth.padEnd(11, ' ')}</span> <span class="tok-comment">${esc(s.usedAt.join(', '))}</span>`));
      });
      return rows;
    },
  },
  resume: {
    description: 'Download the résumé PDF', group: 'content',
    run: () => {
      const a = document.createElement('a');
      a.href = resumeHref; a.download = ''; a.click();
      return ['Downloading résumé…'];
    },
  },
  contact: {
    description: 'Email / LinkedIn / GitHub', group: 'content',
    run: () => [
      `Email:    <a href="mailto:${contact.email}">${esc(contact.email)}</a>`,
      `LinkedIn: <a href="${contact.linkedin}" target="_blank" rel="noopener">${esc(contact.linkedin)}</a>`,
      `GitHub:   <a href="${contact.github}" target="_blank" rel="noopener">${esc(contact.github)}</a>`,
      `Phone:    ${esc(contact.phone)}`,
    ],
  },
  github: {
    description: 'Open GitHub profile in a new tab', group: 'content',
    run: () => { window.open(contact.github, '_blank', 'noopener'); return ['Opening GitHub…']; },
  },
  theme: {
    usage: 'theme [name]', description: 'Switch editor theme', group: 'content',
    run: (args) => {
      if (!args[0]) {
        const current = getCurrentTheme();
        return THEMES.map((t) => `${t.id === current ? '<span class="tok-fn">✓</span>' : ' '} <span class="tok-key">${t.id}</span> — ${esc(t.label)}`);
      }
      const ok = applyTheme(args[0]);
      if (!ok) return [`theme: unknown theme '${esc(args[0])}' — valid: ${THEMES.map((t) => t.id).join(', ')}`];
      return [`Switched to <span class="tok-fn">${esc(THEMES.find((t) => t.id === args[0]).label)}</span>.`];
    },
  },
  profiles: {
    description: 'Coding profiles, live rows marked', group: 'content',
    run: () => codingProfiles.map((p) => {
      const liveId = p.name === 'Codeforces' ? 'codeforces' : p.name === 'LeetCode' ? 'leetcode' : null;
      const d = liveId ? getLiveData(liveId) : null;
      const provenance = d && d.live ? '<span class="tok-fn">live</span>' : '<span class="tok-comment">static</span>';
      return `<span class="tok-key">${esc(p.name.padEnd(14, ' '))}</span> ${esc(String(p.statValue).padEnd(8, ' '))} ${provenance}`;
    }),
  },
  refresh: {
    description: 'Force-refresh live data and print a summary', group: 'content',
    run: async () => {
      const results = await refreshLiveData({ force: true });
      const lines = Object.entries(results).map(([id, status]) => {
        const color = status === 'updated' ? 'tok-fn' : status === 'cached' ? 'tok-key' : status === 'rate-limited' ? 'tok-str' : 'tok-comment';
        return `<span class="${color}">${esc(status)}</span>  ${esc(id)}`;
      });
      return ['Refreshing live data…', ...lines];
    },
  },
  hire: {
    description: 'what I am looking for, and how to reach me', group: 'content',
    run: () => [
      '<span class="tok-fn">Open to backend / distributed-systems roles.</span>',
      '',
      `  ${esc(readme.now)} · ${esc(readme.prev)} · ${esc(readme.years)}`,
      '  Interested in: durable execution, consensus, storage, high-throughput backends.',
      '',
      `  <span class="tok-key">email</span>     <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`,
      `  <span class="tok-key">linkedin</span>  <a href="${esc(contact.linkedin)}" target="_blank" rel="noopener">${esc(contact.linkedin)}</a>`,
      `  <span class="tok-key">resume</span>    <a href="${esc(resumeHref)}" download>${esc(resumeHref)}</a>`,
      '',
      '<span class="tok-comment">(there is also a `sudo hire-me`, if you prefer ceremony.)</span>',
    ],
  },
  sim: {
    description: 'open the durable-queue failure simulation', group: 'content',
    run: (args, ctx) => { ctx.openFile('sentinel-sim'); return ['<span class="tok-comment">opening projects/sentinel-engine.sim — try "Kill a worker"</span>']; },
  },
  interview: {
    description: 'questions I can go deep on, with answers', group: 'content',
    run: (args, ctx) => { ctx.openFile('interview'); return ['<span class="tok-comment">opening interview.md</span>']; },
  },
  posts: {
    description: 'technical write-ups', group: 'content',
    run: () => {
      const live = posts.filter((p) => p.status === 'published');
      if (!live.length) return ['<span class="tok-comment">no posts published yet — drafts are in progress.</span>'];
      return live.map((p) => `<span class="tok-fn">${esc(p.id)}</span>  <span class="tok-comment">${esc(p.date)} · ${p.readingMinutes} min</span>  ${esc(p.title)}`);
    },
  },
  plain: {
    description: 'switch to the plain résumé view', group: 'content',
    run: () => {
      const u = new URL(location.href);
      u.searchParams.set('view', 'plain');
      location.href = u.toString();
      return ['<span class="tok-comment">switching to plain view…</span>'];
    },
  },
  npm: {
    description: 'try: npm run interview', group: 'content', usage: 'npm run <script>',
    run: (args, ctx) => {
      if (args[0] === 'run' && args[1] === 'interview') {
        ctx.openFile('interview');
        return ['<span class="tok-comment">> portfolio@1.0.0 interview</span>', '<span class="tok-comment">> open interview.md</span>', '', 'opening interview.md'];
      }
      if (args[0] === 'run' && args[1] === 'build') {
        return ['<span class="tok-comment">There is no build step. That is the point.</span>', 'Static HTML, CSS and ES modules. Deploys by pushing to main.'];
      }
      if (args[0] === 'install' || args[0] === 'i') {
        return ['<span class="tok-comment">up to date, audited 0 packages in 0ms</span>', '', '<span class="tok-fn">found 0 vulnerabilities</span>', '<span class="tok-comment">(zero dependencies. also the point.)</span>'];
      }
      return ['Available: <span class="tok-fn">npm run interview</span>, <span class="tok-fn">npm run build</span>, <span class="tok-fn">npm install</span>'];
    },
  },
  shortcuts: {
    description: 'Open the keyboard shortcuts overlay', group: 'content',
    run: (args, c) => { c.openShortcuts && c.openShortcuts(); return ['Opening shortcuts…']; },
  },
  git: {
    description: 'git log / branch / blame / diff HEAD~1', group: 'content',
    run: (args) => {
      const sub = args[0];
      if (sub === 'diff') {
        // Diffs the two most recent roles: what the move actually changed.
        const [cur, prev] = experience;
        const out = [
          `<span class="tok-comment">diff --git a/${esc(prev.id)} b/${esc(cur.id)}</span>`,
          `<span class="tok-comment">--- a/${esc(prev.id)}  ${esc(prev.period)}</span>`,
          `<span class="tok-comment">+++ b/${esc(cur.id)}  ${esc(cur.period)}</span>`,
          `<span class="tok-comment">@@ role @@</span>`,
          `<span class="tok-pink">- ${esc(prev.role)} @ ${esc(prev.company)}</span>`,
          `<span class="tok-fn">+ ${esc(cur.role)} @ ${esc(cur.company)}</span>`,
          '',
          `<span class="tok-comment">@@ what changed @@</span>`,
        ];
        cur.highlights.slice(0, 4).forEach((h) => out.push(`<span class="tok-fn">+ ${esc(h.type)}(${esc(h.scope)}): ${esc(h.subject)}</span>`));
        out.push('', `<span class="tok-comment">${cur.highlights.length} insertions(+), ${prev.highlights.length} deletions(-)</span>`);
        return out;
      }
      if (sub === 'blame') {
        return [
          `<span class="tok-comment">${esc(commitHash(contact.email))} (${esc(readme.name)} 2018-08-01) 1)</span> started writing code`,
          `<span class="tok-comment">${esc(commitHash('couchbase'))} (${esc(readme.name)} 2022-08-01) 2)</span> discovered distributed systems are mostly about failure`,
          `<span class="tok-comment">${esc(commitHash('sentinel'))} (${esc(readme.name)} 2026-01-01) 3)</span> built a task queue to prove it`,
          '',
          '<span class="tok-comment">blame assigned. no further investigation required.</span>',
        ];
      }
      const list = buildCommitList();
      if (!sub || (sub !== 'log' && sub !== 'branch' && sub !== 'blame' && sub !== 'diff')) {
        return [
          `git: '${esc(sub || '')}'${sub ? ' is not a git command. ' : ' '}See 'git --help'.`.trim(),
          '',
          '<span class="tok-comment">Supported here:</span>',
          '  <span class="tok-fn">git log</span>            — commit graph of Saurabh\'s career',
          '  <span class="tok-fn">git log --oneline</span>  — one line per commit, no graph',
          '  <span class="tok-fn">git branch</span>         — list roles as branches',
          '  <span class="tok-fn">git blame</span>          — who is responsible for all this',
        ];
      }
      if (sub === 'branch') {
        return experience.map((role, i) => `${i === 0 ? '<span class="tok-fn">*</span>' : ' '} ${esc(role.id)}`);
      }
      const oneline = args.includes('--oneline');
      return list.map((c) => {
        const hash = `<span class="tok-comment">${esc(c.hash)}</span>`;
        if (c.header) {
          const glyph = c.current ? '◉' : '●';
          return oneline
            ? `${hash} ${esc(glyph)} ${esc(c.text)}`
            : `<span class="tok-fn">${esc(glyph)}</span> ${hash} ${esc(c.text)}`;
        }
        const subj = `<span class="tok-key">${esc(c.type)}</span><span class="tok-plain">(</span><span class="tok-str">${esc(c.scope)}</span><span class="tok-plain">):</span> ${esc(c.subject)}`;
        return oneline
          ? `${hash} ${subj}`
          : `<span class="tok-comment">│</span> <span class="tok-fn">●</span> ${hash} ${subj}`;
      });
    },
  },
  sudo: {
    hidden: true,
    run: (args) => {
      if (args.join(' ') === 'hire-me') {
        return [
          '[sudo] password for saurabh: ********',
          '<span class="tok-fn">Access granted.</span>',
          'Initiating hire sequence...',
          '✓ Résumé compiled',
          '✓ Skills verified',
          '✓ References checked',
          'Contact Saurabh Mishra to complete hiring:',
          `  <a href="mailto:${contact.email}">${esc(contact.email)}</a>`,
          `  <a href="${contact.linkedin}" target="_blank" rel="noopener">${esc(contact.linkedin)}</a>`,
        ];
      }
      return ["Nice try. Try 'sudo hire-me' instead."];
    },
  },
  rm: {
    hidden: true,
    run: (args, ctx) => {
      if (args.join(' ') === '-rf /') { ctx.rmSequence(); return []; }
      return ['rm: permission denied (this portfolio is read-only, nice try).'];
    },
  },
  exit: { hidden: true, run: () => ['there is no escape. try \'contact\' instead.'] },
  vim: { hidden: true, run: (args, ctx) => { ctx.enterEditorMode(args[0]); return []; } },
  vi: { hidden: true, run: (args, ctx) => { ctx.enterEditorMode(args[0]); return []; } },
  nano: { hidden: true, run: (args, ctx) => { ctx.enterEditorMode(args[0]); return []; } },
};

/* ---------- module-level handle for palette.js's runInTerminal ---------- */
let _termApi = null;
export function runInTerminal(commandString) {
  if (!_termApi) return; // no-op gracefully if the terminal hasn't initialized yet
  _termApi.ensureOpen();
  if (_termApi.isBlocked()) {
    _termApi.printText(`Busy right now — try '${commandString}' again in a moment.`);
    return;
  }
  _termApi.pushHistory(commandString);
  _termApi.runCommand(commandString);
}

export function initTerminal(ctx) {
  const output = document.getElementById('term-output');
  const input = document.getElementById('term-input');
  const body = document.querySelector('.term-body');

  let history = [];
  try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { history = []; }
  let historyPos = history.length;
  let draft = '';
  let busy = false;

  function printRaw(html) {
    const row = document.createElement('div');
    row.className = 'term-line';
    row.innerHTML = html;
    output.appendChild(row);
    while (output.children.length > MAX_LINES) output.removeChild(output.firstChild);
    output.scrollTop = output.scrollHeight;
  }
  function printText(text) { printRaw(esc(text)); }
  function promptHTML(cmd) {
    return `<span class="term-user">saurabh@portfolio</span><span class="term-plain">:</span><span class="term-path">~$</span> ${esc(cmd)}`;
  }

  /* ---------- fake vim/vi/nano trap ---------- */
  let editorMode = null;
  let savedOutputHTML = null;
  function renderEditorScreen() {
    output.innerHTML = '';
    printRaw(`<span class="tok-comment">"${esc(editorMode.filename)}" [New File]</span>`);
    editorMode.buffer.forEach((line) => printText(line));
    printRaw('<span class="tok-fn">-- INSERT --</span>');
  }
  function enterEditorMode(filename) {
    savedOutputHTML = output.innerHTML;
    editorMode = { filename: filename || '[No Name]', buffer: [] };
    renderEditorScreen();
  }
  function exitEditorMode(saved) {
    output.innerHTML = savedOutputHTML;
    printRaw(saved
      ? `<span class="tok-comment">"${esc(editorMode.filename)}" written. As if any of this was real.</span>`
      : '<span class="tok-comment">No changes saved. Wise.</span>');
    editorMode = null;
  }

  function rmSequence() {
    busy = true;
    printText('Deleting portfolio...');
    setTimeout(() => printText('rm: reticulating splines...'), 500);
    setTimeout(() => { printText('Restoring from backup (nice try).'); busy = false; }, 1600);
  }

  const cmdCtx = {
    openFile: ctx.openFile,
    closeIfMobile: ctx.closeIfMobile,
    openShortcuts: ctx.openShortcuts,
    output,
    getHistory: () => history,
    enterEditorMode,
    rmSequence,
  };

  function runCommand(raw) {
    printRaw(promptHTML(raw));
    const trimmed = raw.trim();
    if (!trimmed) return;
    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = REGISTRY[name];
    if (cmd) {
      const result = cmd.run(args, cmdCtx);
      if (result && typeof result.then === 'function') {
        result.then((lines) => (lines || []).forEach((line) => printRaw(line)));
      } else {
        (result || []).forEach((line) => printRaw(line));
      }
    } else {
      printText(`command not found: ${name} — try 'help'`);
    }
  }

  function pushHistory(cmd) {
    if (!cmd.trim()) return;
    if (history[history.length - 1] === cmd) return; // skip consecutive duplicates, bash-style
    history.push(cmd);
    if (history.length > MAX_HISTORY) history.shift();
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
    historyPos = history.length;
  }

  function longestCommonPrefix(strs) {
    if (!strs.length) return '';
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
      while (!strs[i].startsWith(prefix)) prefix = prefix.slice(0, -1);
    }
    return prefix;
  }
  function getCompletions(value) {
    const parts = value.split(/\s+/);
    if (parts.length <= 1) {
      const prefix = parts[0] || '';
      return Object.keys(REGISTRY).filter((k) => !REGISTRY[k].hidden && k.startsWith(prefix));
    }
    const cmdName = parts[0];
    const last = parts[parts.length - 1];
    if (cmdName === 'theme') {
      return THEMES.map((t) => t.id).filter((id) => id.startsWith(last));
    }
    if (cmdName === 'git') {
      if (parts.length === 2) return ['log', 'branch'].filter((s) => s.startsWith(last));
      if (parts[1] === 'log') return ['--oneline', '--graph'].filter((s) => s.startsWith(last));
      return [];
    }
    if (!['ls', 'cat', 'open'].includes(cmdName)) return [];
    const dirCandidates = DIRS.filter((d) => d.startsWith(last));
    const pathCandidates = FILES.map((f) => f.path).filter((p) => p.startsWith(last));
    const nameCandidates = last.includes('/') ? [] : FILES.map((f) => f.name).filter((n) => n.startsWith(last));
    return Array.from(new Set([...dirCandidates, ...pathCandidates, ...nameCandidates]));
  }
  function applyCompletion(value, completion) {
    const parts = value.split(/\s+/);
    parts[parts.length - 1] = completion;
    input.value = parts.join(' ');
  }
  let lastTabState = null;

  input.addEventListener('keydown', (e) => {
    if (editorMode) {
      if (e.key === 'Tab') e.preventDefault();
      if (e.key === 'Enter') {
        const val = input.value;
        input.value = '';
        const t = val.trim();
        if (t === ':q' || t === ':q!') exitEditorMode(false);
        else if (t === ':wq') exitEditorMode(true);
        else { editorMode.buffer.push(val); renderEditorScreen(); }
      }
      return;
    }
    if (busy) { e.preventDefault(); return; }
    if (e.key === 'Enter') {
      const val = input.value;
      pushHistory(val);
      runCommand(val);
      input.value = '';
      draft = '';
      lastTabState = null;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyPos > 0) {
        if (historyPos === history.length) draft = input.value;
        historyPos--;
        input.value = history[historyPos];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPos < history.length) {
        historyPos++;
        input.value = historyPos === history.length ? draft : history[historyPos];
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      output.innerHTML = '';
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      printRaw(promptHTML(input.value) + '<span class="term-plain">^C</span>');
      input.value = '';
      lastTabState = null;
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const value = input.value;
      const candidates = getCompletions(value);
      if (candidates.length === 1) {
        applyCompletion(value, candidates[0]);
        lastTabState = null;
      } else if (candidates.length > 1) {
        const parts = value.split(/\s+/);
        const lastPart = parts[parts.length - 1] || '';
        const common = longestCommonPrefix(candidates);
        if (common.length > lastPart.length) {
          applyCompletion(value, common);
          lastTabState = { value: input.value, candidates };
        } else if (lastTabState && lastTabState.value === value) {
          printRaw(promptHTML(value));
          printText(candidates.join('  '));
          lastTabState = null;
        } else {
          lastTabState = { value, candidates };
        }
      }
    }
  });

  body.addEventListener('click', () => {
    if (window.getSelection().toString().length === 0) input.focus();
  });

  /* ---------- konami code (arrow keys + b a), anywhere on the page ---------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIdx = 0;
  function playMatrixRain(durationMs) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { printText("You found it. Now try 'sudo hire-me'."); return; }
    const rect = output.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.className = 'term-matrix';
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.position = 'fixed';
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    document.body.appendChild(canvas);
    const rootStyle = getComputedStyle(document.documentElement);
    const bgColor = rootStyle.getPropertyValue('--bg').trim() || '#272822';
    const glyphColor = rootStyle.getPropertyValue('--green').trim() || '#a6e22e';
    const c2d = canvas.getContext('2d');
    const cols = Math.max(1, Math.floor(canvas.width / 14));
    const drops = new Array(cols).fill(0);
    const chars = 'アイウエオカキクケコ0123456789';
    const start = performance.now();
    function frame(t) {
      c2d.fillStyle = bgColor;
      c2d.globalAlpha = 0.15;
      c2d.fillRect(0, 0, canvas.width, canvas.height);
      c2d.globalAlpha = 1;
      c2d.fillStyle = glyphColor;
      c2d.font = '14px monospace';
      drops.forEach((y, i) => {
        c2d.fillText(chars[Math.floor(Math.random() * chars.length)], i * 14, y * 14);
        drops[i] = (y * 14 > canvas.height && Math.random() > 0.975) ? 0 : y + 1;
      });
      if (t - start < durationMs) requestAnimationFrame(frame);
      else { canvas.remove(); printText("You found it. Now try 'sudo hire-me'."); }
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        ctx.ensureOpen();
        playMatrixRain(3000);
      }
    } else {
      konamiIdx = key === KONAMI[0] ? 1 : 0;
    }
  });

  _termApi = { runCommand, pushHistory, ensureOpen: ctx.ensureOpen, isBlocked: () => busy || !!editorMode, printText };
}
