// search.js — Ctrl/Cmd+Shift+F content search across every file.
//
// The palette jumps to files by name. It cannot find "Raft", "Kafka" or "SKIP LOCKED"
// *inside* them, which is exactly how a technical reviewer skims a portfolio. This closes
// that gap. Deliberately substring + word matching with surrounding context, not the
// palette's fuzzy subsequence matcher — fuzzy is right for filenames and wrong for prose.

import { about, experience, projects, skills, achievements, contact, codingProfiles, readme, interview, posts } from './file-contents.js';
import { FILES, fileById } from './files.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MAX_PER_FILE = 4;
const MAX_FILES = 12;

/* ---------- searchable text, built once, from the same content the renderers use ---------- */
let INDEX = null;
function buildIndex() {
  if (INDEX) return INDEX;
  const doc = (id, lines) => ({ id, lines: lines.filter(Boolean).map((l) => String(l).trim()).filter((l) => l.length > 1) });
  const out = [];

  out.push(doc('readme', [readme.name, readme.title, readme.pitch, ...readme.metrics.map((m) => `${m.value} ${m.label}`), ...readme.startHere.flatMap((s) => [s.title, s.blurb])]));
  out.push(doc('about', about.markdown.split('\n')));
  experience.forEach((e) => out.push(doc(e.id, [`${e.role} at ${e.company}`, e.period, e.location, ...e.highlights.map((h) => h.body)])));
  out.push(doc('history', experience.flatMap((e) => [`${e.role} — ${e.company} · ${e.period}`, ...e.highlights.map((h) => `${h.type}(${h.scope}): ${h.subject}`)])));
  projects.forEach((p) => {
    const lines = [p.title, p.subtitle, p.summary, p.role, ...p.tags, ...(p.architectureNotes || []), ...(p.architectureList || []),
      ...p.challenges.flatMap((c) => [c.problem, c.solution]), ...p.metrics.map((m) => `${m.value} ${m.label}`)];
    out.push(doc(p.featured ? p.id : 'also-built', lines));
  });
  out.push(doc('skills', Object.entries(skills).flatMap(([g, items]) => [g, ...items.map((s) => `${s.name} (${s.depth}) — ${s.blurb}`)])));
  out.push(doc('profiles', codingProfiles.map((p) => `${p.name} — ${p.statValue} ${p.statLabel}`)));
  out.push(doc('achievements', achievements.map((a) => a.text)));
  out.push(doc('interview', [interview.intro, ...interview.topics.flatMap((t) => [t.q, t.a])]));
  out.push(doc('contact', [contact.email, contact.linkedin, contact.github, contact.phone]));
  posts.filter((p) => p.status === 'published').forEach((p) => out.push(doc(p.id, [p.title, p.summary, ...p.markdown.split('\n')])));

  // also-built collects three projects; merge their line lists into one doc.
  const merged = [];
  out.forEach((d) => {
    const hit = merged.find((m) => m.id === d.id);
    if (hit) hit.lines.push(...d.lines);
    else merged.push(d);
  });
  INDEX = merged.filter((d) => fileById(d.id));
  return INDEX;
}

function highlight(line, q) {
  const i = line.toLowerCase().indexOf(q);
  if (i < 0) return esc(line);
  // Trim long lines around the hit so the match stays visible.
  const start = Math.max(0, i - 34);
  const clipped = (start > 0 ? '…' : '') + line.slice(start);
  const j = clipped.toLowerCase().indexOf(q);
  const head = clipped.slice(0, j);
  const hit = clipped.slice(j, j + q.length);
  const tail = clipped.slice(j + q.length, j + q.length + 120);
  return `${esc(head)}<mark>${esc(hit)}</mark>${esc(tail)}${clipped.length > j + q.length + 120 ? '…' : ''}`;
}

export function initSearch({ onOpen }) {
  const backdrop = document.getElementById('search-backdrop');
  const input = document.getElementById('search-input');
  const list = document.getElementById('search-results');
  const summary = document.getElementById('search-summary');
  if (!backdrop || !input || !list) return {};

  let flat = [];      // flattened selectable rows
  let sel = 0;
  let lastFocused = null;

  function open() {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    input.value = '';
    render('');
    input.focus();
  }
  function close() {
    backdrop.hidden = true;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  const isOpen = () => !backdrop.hidden;

  function render(query) {
    const q = query.trim().toLowerCase();
    flat = [];
    if (q.length < 2) {
      list.innerHTML = '';
      summary.textContent = 'Type at least 2 characters. Searches every file on the site.';
      return;
    }
    const groups = [];
    buildIndex().forEach((docu) => {
      const hits = [];
      docu.lines.forEach((line) => {
        if (hits.length >= MAX_PER_FILE) return;
        if (line.toLowerCase().includes(q)) hits.push(line);
      });
      if (hits.length) groups.push({ id: docu.id, hits });
    });
    const total = groups.reduce((s, g) => s + g.hits.length, 0);
    if (!groups.length) {
      list.innerHTML = '';
      summary.textContent = `No results for "${query.trim()}"`;
      return;
    }
    summary.textContent = `${total} match${total === 1 ? '' : 'es'} in ${groups.length} file${groups.length === 1 ? '' : 's'}`;
    list.innerHTML = groups.slice(0, MAX_FILES).map((g) => {
      const f = fileById(g.id);
      const rows = g.hits.map((line) => {
        const idx = flat.length;
        flat.push(g.id);
        return `<li class="sr-row" role="option" id="sr-${idx}" data-idx="${idx}" data-open="${esc(g.id)}" aria-selected="false">${highlight(line, q)}</li>`;
      }).join('');
      return `<li class="sr-group"><p class="sr-file">${esc(f.path)}</p><ul class="sr-rows" role="group">${rows}</ul></li>`;
    }).join('');
    sel = 0;
    paint();
  }
  function paint() {
    const rows = list.querySelectorAll('.sr-row');
    rows.forEach((r, i) => {
      const on = i === sel;
      r.setAttribute('aria-selected', on ? 'true' : 'false');
      r.classList.toggle('is-sel', on);
      if (on) {
        input.setAttribute('aria-activedescendant', r.id);
        r.scrollIntoView({ block: 'nearest' });
      }
    });
  }
  function choose(i) {
    const id = flat[i];
    if (!id) return;
    close();
    onOpen(id);
  }

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (!flat.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % flat.length; paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + flat.length) % flat.length; paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
    else if (e.key === 'Tab') e.preventDefault();
  });
  list.addEventListener('click', (e) => {
    const row = e.target.closest('.sr-row');
    if (row) choose(Number(row.dataset.idx));
  });
  list.addEventListener('mousemove', (e) => {
    const row = e.target.closest('.sr-row');
    if (row) { sel = Number(row.dataset.idx); paint(); }
  });
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });

  return { open, close, isOpen, toggle: () => (isOpen() ? close() : open()) };
}
