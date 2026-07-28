// palette.js — Ctrl/Cmd+K command palette. Increment 3: hand-rolled fuzzy matcher + the file
// provider (all file paths from the tree), full keyboard nav (wrap + hover selection),
// aria-activedescendant wiring, and Enter-to-open. Command mode ('>' prefix) arrives in
// increment 4 alongside runInTerminal + recents-for-commands.

import { experience, projects } from './file-contents.js';
import { REGISTRY } from './terminal.js';
import { THEMES } from './theme.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const RECENTS_KEY = 'ide.palette.v1';
const MAX_RECENTS = 8;

const FILES = [
  { id: 'about', name: 'about.md', path: 'about.md' },
  ...experience.map((e) => ({ id: e.id, name: `${e.id}.yaml`, path: `experience/${e.id}.yaml` })),
  ...projects.map((p) => ({ id: p.id, name: `${p.id}.md`, path: `projects/${p.id}.md` })),
  { id: 'skills', name: 'skills.json', path: 'skills.json' },
  { id: 'achievements', name: 'achievements.log', path: 'achievements.log' },
  { id: 'contact', name: 'contact.sh', path: 'contact.sh' },
];
const EXT_GLYPH = { md: 'M', yaml: 'Y', json: '{}', log: '≡', sh: '$' };
const extOf = (name) => name.split('.').pop();

/* ---------- hand-rolled fuzzy subsequence matcher ---------- */
function fuzzyMatch(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  let score = 0;
  let consecutive = 0;
  const idxs = [];
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      idxs.push(ti);
      score += 10 + consecutive * 5 + (ti === 0 || /[/\-_. ]/.test(t[ti - 1]) ? 8 : 0);
      consecutive++;
      qi++;
    } else {
      consecutive = 0;
    }
  }
  if (qi < q.length) return null;
  if (t.startsWith(q)) score += 20;
  return { score, idxs };
}
function highlight(text, idxs) {
  if (!idxs || !idxs.length) return esc(text);
  const set = new Set(idxs);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = esc(text[i]);
    out += set.has(i) ? `<mark>${ch}</mark>` : ch;
  }
  return out;
}

/* ---------- recents ---------- */
function loadRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); } catch (e) { return []; }
}
function pushRecent(item) {
  let recents = loadRecents().filter((r) => !(r.type === item.type && r.id === item.id));
  recents.unshift(item);
  recents = recents.slice(0, MAX_RECENTS);
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(recents)); } catch (e) {}
}

/* ---------- file provider ---------- */
function fileResults(query) {
  if (!query) return FILES.slice(0, 5).map((f) => ({ type: 'file', id: f.id, name: f.name, path: f.path, idxs: null }));
  const scored = [];
  FILES.forEach((f) => {
    const m = fuzzyMatch(query, f.path) || fuzzyMatch(query, f.name);
    if (m) scored.push({ type: 'file', id: f.id, name: f.name, path: f.path, idxs: m.idxs, score: m.score });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
function commandResults(q) {
  const registryCmds = Object.entries(REGISTRY).filter(([, c]) => !c.hidden).map(([name, c]) => ({ name, description: c.description, id: name }));
  const themeCmds = THEMES.map((t) => ({ name: `theme: ${t.label}`, description: 'Switch editor theme', id: `theme ${t.id}` }));
  const combined = registryCmds.concat(themeCmds);
  if (!q) return combined.map((c) => ({ type: 'command', id: c.id, name: c.name, description: c.description, idxs: null }));
  const scored = [];
  combined.forEach((c) => {
    const nameMatch = fuzzyMatch(q, c.name);
    const descMatch = !nameMatch ? fuzzyMatch(q, c.description || '') : null;
    const m = nameMatch || descMatch;
    if (m) scored.push({ type: 'command', id: c.id, name: c.name, description: c.description, idxs: nameMatch ? nameMatch.idxs : null, score: m.score });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function initPalette(ctx) {
  const backdrop = document.getElementById('palette-backdrop');
  const input = document.getElementById('palette-input');
  const list = document.getElementById('palette-list');
  const status = document.getElementById('palette-status');
  const closeBtn = document.getElementById('palette-close');

  let lastFocused = null;
  let currentItems = [];
  let selectedIndex = -1;

  function itemRowHTML(item, idx) {
    if (item.type === 'file') {
      const glyph = EXT_GLYPH[extOf(item.name)] || 'F';
      return `<li class="palette-option" id="palette-opt-${idx}" role="option" aria-selected="${idx === selectedIndex}" data-idx="${idx}">
        <span class="tree-icon">${glyph}</span>
        <span class="opt-name">${highlight(item.name, item.idxs)}</span>
        <span class="opt-path">${esc(item.path)}</span>
      </li>`;
    }
    if (item.type === 'command') {
      return `<li class="palette-option" id="palette-opt-${idx}" role="option" aria-selected="${idx === selectedIndex}" data-idx="${idx}">
        <span class="tree-icon">&gt;</span>
        <span class="opt-name">${highlight(item.name, item.idxs)}</span>
        <span class="opt-path">${esc(item.description || '')}</span>
      </li>`;
    }
    return '';
  }

  function render(query) {
    const trimmed = query.trim();
    let sectionsHTML = '';
    if (!trimmed) {
      const files = fileResults('');
      currentItems = files;
      sectionsHTML += `<li class="palette-section" role="presentation">Files</li>`;
      sectionsHTML += files.map((f, i) => itemRowHTML(f, i)).join('');
      sectionsHTML += `<li class="palette-section" role="presentation">Type <strong>&gt;</strong> for commands</li>`;
      const recents = loadRecents().filter((r) => r.type === 'file' && FILES.some((f) => f.id === r.id) && !files.some((f) => f.id === r.id)).slice(0, 3);
      if (recents.length) {
        const offset = files.length;
        const recentItems = recents.map((r) => FILES.find((f) => f.id === r.id)).map((f) => ({ type: 'file', id: f.id, name: f.name, path: f.path, idxs: null }));
        currentItems = currentItems.concat(recentItems);
        sectionsHTML += `<li class="palette-section" role="presentation">Recent</li>`;
        sectionsHTML += recentItems.map((f, i) => itemRowHTML(f, offset + i)).join('');
      }
    } else if (trimmed.startsWith('>')) {
      const rest = trimmed.slice(1).trim();
      const cmds = commandResults(rest);
      currentItems = cmds;
      sectionsHTML += `<li class="palette-section" role="presentation">Commands</li>`;
      sectionsHTML += cmds.length ? cmds.map((c, i) => itemRowHTML(c, i)).join('') : `<li class="palette-section" role="presentation">No matching commands</li>`;
      if (!rest) {
        const recents = loadRecents().filter((r) => r.type === 'command' && REGISTRY[r.id.split(' ')[0]] && !REGISTRY[r.id.split(' ')[0]].hidden && !cmds.some((c) => c.id === r.id)).slice(0, 3);
        if (recents.length) {
          const offset = cmds.length;
          const recentItems = recents.map((r) => {
            const themeMatch = THEMES.find((t) => r.id === `theme ${t.id}`);
            return themeMatch
              ? { type: 'command', id: r.id, name: `theme: ${themeMatch.label}`, description: 'Switch editor theme', idxs: null }
              : { type: 'command', id: r.id, name: r.id, description: REGISTRY[r.id].description, idxs: null };
          });
          currentItems = currentItems.concat(recentItems);
          sectionsHTML += `<li class="palette-section" role="presentation">Recent</li>`;
          sectionsHTML += recentItems.map((c, i) => itemRowHTML(c, offset + i)).join('');
        }
      }
    } else {
      currentItems = fileResults(trimmed);
      sectionsHTML = currentItems.length
        ? currentItems.map((f, i) => itemRowHTML(f, i)).join('')
        : `<li class="palette-section" role="presentation">No matches</li>`;
    }
    list.innerHTML = sectionsHTML;
    selectedIndex = currentItems.length ? 0 : -1;
    updateSelection();
    status.textContent = currentItems.length
      ? `${currentItems.length} result${currentItems.length === 1 ? '' : 's'}`
      : 'No results';
  }

  function updateSelection() {
    list.querySelectorAll('.palette-option').forEach((row) => {
      const idx = Number(row.dataset.idx);
      const isSel = idx === selectedIndex;
      row.setAttribute('aria-selected', String(isSel));
      if (isSel) row.scrollIntoView({ block: 'nearest' });
    });
    if (selectedIndex >= 0) {
      input.setAttribute('aria-expanded', 'true');
      input.setAttribute('aria-activedescendant', `palette-opt-${selectedIndex}`);
    } else {
      input.setAttribute('aria-expanded', 'false');
      input.setAttribute('aria-activedescendant', '');
    }
  }

  function activate(idx) {
    const item = currentItems[idx];
    if (!item) return;
    if (item.type === 'file') {
      ctx.openFile(item.id);
      pushRecent({ type: 'file', id: item.id });
      close();
    } else if (item.type === 'command') {
      close();
      ctx.runInTerminal(item.id);
      pushRecent({ type: 'command', id: item.id });
    }
  }

  function clearResults() {
    list.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-activedescendant', '');
    status.textContent = '';
    currentItems = [];
    selectedIndex = -1;
  }

  function open() {
    if (!backdrop.hidden) return;
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    input.value = '';
    render('');
    input.focus();
  }
  function close() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    clearResults();
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }
  function toggle() { if (backdrop.hidden) open(); else close(); }

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  closeBtn.addEventListener('click', close);
  input.addEventListener('input', () => render(input.value));
  list.addEventListener('mousemove', (e) => {
    const row = e.target.closest('.palette-option');
    if (!row) return;
    const idx = Number(row.dataset.idx);
    if (idx !== selectedIndex) { selectedIndex = idx; updateSelection(); }
  });
  list.addEventListener('click', (e) => {
    const row = e.target.closest('.palette-option');
    if (row) activate(Number(row.dataset.idx));
  });

  document.addEventListener('keydown', (e) => {
    if (backdrop.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { e.preventDefault(); return; }
    if (!currentItems.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentItems.length;
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(selectedIndex);
    }
  });

  return { open, close, toggle };
}
