// tour.js — a 15-second guided tour, once per visitor.
//
// Most of the work already shipped on this site is invisible: without a nudge, a first-time
// visitor never opens the terminal, the palette, or the simulation. This spotlights four
// things and gets out of the way.

const TOUR_KEY = 'ide.tour.v1';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DESKTOP_STEPS = [
  { sel: '#file-tree', title: 'This is a real file tree', body: 'Every file opens as an editor tab. Start with README.md, or jump straight to the git-graph career view.', place: 'right' },
  { sel: '#act-search', title: 'Search inside every file', body: 'Ctrl/Cmd+Shift+F searches the content, not just filenames. Try "Raft" or "SKIP LOCKED".', place: 'right' },
  { sel: '#palette-trigger', title: 'Command palette', body: 'Ctrl/Cmd+K jumps to any file. Type > to run terminal commands — including git log.', place: 'left' },
  { sel: '#view-toggle', title: 'Not into IDEs?', body: 'Plain view flattens all of this into a normal scrollable résumé page with the PDF and my contact details.', place: 'left' },
];
const MOBILE_STEPS = [
  { sel: '#view-toggle', title: 'Plain view', body: 'Flattens this into a normal scrollable résumé page. Probably what you want on a phone.', place: 'below' },
  { sel: '#hamburger', title: 'Files live here', body: 'Tap for the file tree. README.md is the place to start.', place: 'below' },
];

export function initTour({ openFile }) {
  try { if (localStorage.getItem(TOUR_KEY) === '1') return; } catch (_) { return; }

  const steps = (window.innerWidth <= 768 ? MOBILE_STEPS : DESKTOP_STEPS)
    .filter((s) => document.querySelector(s.sel));
  if (!steps.length) return;

  let i = 0;
  let lastFocused = document.activeElement;

  const root = document.createElement('div');
  root.className = 'tour-root';
  root.innerHTML = `
    <div class="tour-backdrop" data-tour-skip></div>
    <div class="tour-ring" aria-hidden="true"></div>
    <div class="tour-pop" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <p class="tour-step" data-role="count"></p>
      <h2 class="tour-title" id="tour-title" data-role="title"></h2>
      <p class="tour-body" data-role="body"></p>
      <div class="tour-actions">
        <button type="button" class="tour-skip" data-tour-skip>Skip</button>
        <button type="button" class="tour-next" data-tour-next></button>
      </div>
    </div>`;
  document.body.appendChild(root);

  const ring = root.querySelector('.tour-ring');
  const pop = root.querySelector('.tour-pop');
  const setText = (role, text) => { root.querySelector(`[data-role="${role}"]`).textContent = text; };

  function place() {
    const step = steps[i];
    const el = document.querySelector(step.sel);
    if (!el) { finish(); return; }
    const r = el.getBoundingClientRect();
    const pad = 6;
    Object.assign(ring.style, {
      top: `${r.top - pad}px`, left: `${r.left - pad}px`,
      width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px`,
    });

    setText('count', `${i + 1} of ${steps.length}`);
    setText('title', step.title);
    setText('body', step.body);
    root.querySelector('[data-tour-next]').textContent = i === steps.length - 1 ? 'Done' : 'Next';

    // Measure the popover, then keep it inside the viewport on every edge.
    pop.style.visibility = 'hidden';
    pop.style.top = '0px'; pop.style.left = '0px';
    const pr = pop.getBoundingClientRect();
    let top = r.top;
    let left = step.place === 'left' ? r.left - pr.width - 14 : r.right + 14;
    if (step.place === 'below') { top = r.bottom + 12; left = r.left; }
    left = Math.max(10, Math.min(left, window.innerWidth - pr.width - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - pr.height - 10));
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
    pop.style.visibility = 'visible';
  }

  function next() {
    i += 1;
    if (i >= steps.length) { finish(); return; }
    place();
  }
  function finish() {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (_) { /* private mode */ }
    root.remove();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', place);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); finish(); }
    else if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'Tab') {
      // Trap focus in the popover so Tab cannot wander behind the backdrop.
      const f = pop.querySelectorAll('button');
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-tour-skip]')) finish();
    else if (e.target.closest('[data-tour-next]')) next();
  });
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', place);

  if (reduceMotion()) root.classList.add('no-motion');
  place();
  root.querySelector('[data-tour-next]').focus();
}
