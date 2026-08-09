// ide-shell.js — IDE shell: layout, file tree, tabs, editor renderers, hash routing, persistence.
// Terminal logic (Phase 2) lives entirely in terminal.js; this file only owns the panel's
// open/close/resize plumbing once that phase starts.
import { about, experience, projects, skills, achievements, contact, resumeHref, codingProfiles } from './file-contents.js';
import { initTerminal, runInTerminal } from './terminal.js';
import { initPalette } from './palette.js';
import { THEMES, applyTheme, getCurrentTheme, onThemeChange } from './theme.js';
import { get as getLiveData, refresh as refreshLiveData, onLiveDataChange } from './livedata.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- file registry & tree shape ---------- */
const FILES = [
  { id: 'about', name: 'about.md', ext: 'md', path: 'about.md' },
  { id: 'history', name: 'history.git', ext: 'git', path: 'experience/history.git' },
  ...experience.map((e) => ({ id: e.id, name: `${e.id}.yaml`, ext: 'yaml', path: `experience/${e.id}.yaml` })),
  ...projects.map((p) => ({ id: p.id, name: `${p.id}.md`, ext: 'md', path: `projects/${p.id}.md` })),
  { id: 'skills', name: 'skills.json', ext: 'json', path: 'skills.json' },
  { id: 'profiles', name: 'profiles.md', ext: 'md', path: 'profiles.md' },
  { id: 'achievements', name: 'achievements.log', ext: 'log', path: 'achievements.log' },
  { id: 'contact', name: 'contact.sh', ext: 'sh', path: 'contact.sh' },
];
const TREE = [
  { kind: 'file', id: 'about' },
  { kind: 'folder', name: 'experience', children: ['history', ...experience.map((e) => e.id)] },
  { kind: 'folder', name: 'projects', children: projects.map((p) => p.id) },
  { kind: 'file', id: 'skills' },
  { kind: 'file', id: 'profiles' },
  { kind: 'file', id: 'achievements' },
  { kind: 'file', id: 'contact' },
];
const EXT_META = {
  md: { glyph: 'M', color: 'var(--blue)' },
  yaml: { glyph: 'Y', color: 'var(--purple)' },
  json: { glyph: '{}', color: 'var(--yellow)' },
  log: { glyph: '≡', color: 'var(--comment)' },
  sh: { glyph: '$', color: 'var(--green)' },
  git: { glyph: '⎇', color: 'var(--orange)' },
};
const fileById = (id) => FILES.find((f) => f.id === id);

/* ---------- state ---------- */
let openTabs = [];
let activeId = null;
const mdMode = {}; // fileId -> 'preview' | 'source'
const STORE_KEY = 'ide.state.v1';

/* ---------- markdown mini-parser ---------- */
function parseMarkdown(md) {
  const lines = md.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^### /.test(line)) { blocks.push({ t: 'h3', text: line.slice(4) }); i++; }
    else if (/^## /.test(line)) { blocks.push({ t: 'h2', text: line.slice(3) }); i++; }
    else if (/^# /.test(line)) { blocks.push({ t: 'h1', text: line.slice(2) }); i++; }
    else if (/^- /.test(line)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      blocks.push({ t: 'ul', items });
    } else if (line.trim() === '') { i++; }
    else {
      const paras = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^#|^- /.test(lines[i])) { paras.push(lines[i]); i++; }
      blocks.push({ t: 'p', text: paras.join(' ') });
    }
  }
  return blocks;
}
function inlineFormat(text) {
  let s = esc(text);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}
function renderMarkdownPreview(md) {
  const blocks = parseMarkdown(md);
  return blocks.map((b) => {
    if (b.t === 'h1') return `<h1 class="md-h1">${inlineFormat(b.text)}</h1>`;
    if (b.t === 'h2') return `<h2 class="md-h2">${inlineFormat(b.text)}</h2>`;
    if (b.t === 'h3') return `<h3 class="md-h3">${inlineFormat(b.text)}</h3>`;
    if (b.t === 'ul') return `<ul class="md-ul">${b.items.map((it) => `<li>${inlineFormat(it)}</li>`).join('')}</ul>`;
    return `<p class="md-p">${inlineFormat(b.text)}</p>`;
  }).join('');
}
const TOK_TINT = { key: 'var(--pink)', str: 'var(--yellow)', fn: 'var(--green)', num: 'var(--purple)', type: 'var(--blue)', comment: 'var(--comment)', plain: 'var(--fg-dim)' };
function lineRow(n, html) {
  const text = (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  const m = (html || '').match(/tok-(\w+)/);
  const tint = m ? (TOK_TINT[m[1]] || 'var(--fg-dim)') : 'var(--fg-dim)';
  return `<div class="ln-row" data-len="${text.length}" data-tint="${tint}"><span class="ln" aria-hidden="true">${n}</span><span class="ln-content">${html || '&nbsp;'}</span></div>`;
}
function renderMarkdownSource(md) {
  return md.split('\n').map((line, idx) => {
    let cls = 'tok-plain';
    if (/^#{1,3} /.test(line)) cls = 'tok-key';
    else if (/^- /.test(line)) cls = 'tok-fn';
    return lineRow(idx + 1, `<span class="${cls}">${esc(line)}</span>`);
  }).join('');
}

/* ---------- per-type editor renderers ---------- */
function renderMarkdownFile(id, md) {
  const mode = mdMode[id] || 'preview';
  const toolbar = `<div class="editor-toolbar"><button type="button" class="md-toggle" data-id="${id}">${mode === 'preview' ? 'View source' : 'View preview'}</button></div>`;
  const body = mode === 'preview'
    ? `<div class="md-preview">${renderMarkdownPreview(md)}</div>`
    : `<div class="code">${renderMarkdownSource(md)}</div>`;
  return toolbar + body;
}
function kv(k, v) { return `<span class="tok-key">${esc(k)}</span><span class="tok-plain">: </span><span class="tok-str">"${esc(v)}"</span>`; }
function renderYamlFile(entry) {
  const lines = [kv('company', entry.company), kv('role', entry.role), kv('period', entry.period), kv('location', entry.location)];
  lines.push(`<span class="tok-key">highlights</span><span class="tok-plain">:</span>`);
  entry.highlights.forEach((h) => lines.push(`&nbsp;&nbsp;<span class="tok-fn">-</span> <span class="tok-str">"${esc(h.body)}"</span>`));
  return `<div class="code">${lines.map((l, idx) => lineRow(idx + 1, l)).join('')}</div>`;
}
const USEDAT_PROJECT_MAP = {
  'Sentinel Engine': 'sentinel-engine',
  'Distributed KV Store': 'distributed-kv-store',
  'E-Commerce platform': 'ecommerce-platform',
  'Splitwise': 'splitwise',
  'CtrlBudget': 'ctrlbudget',
  'WeDiscussCP': 'wediscusscp',
};
const DEPTH_META = {
  expert: { label: 'Expert', color: 'var(--green)' },
  proficient: { label: 'Proficient', color: 'var(--blue)' },
  working: { label: 'Working', color: 'var(--orange)' },
};
const GROUP_LABELS = {
  languages: 'Languages',
  backend: 'Backend & Architecture',
  cloud_devops: 'Cloud & DevOps',
  databases: 'Databases',
  specializations: 'Observability & Specializations',
};
function skillCard(s) {
  const depth = DEPTH_META[s.depth];
  const chips = s.usedAt.map((u) => {
    const pid = USEDAT_PROJECT_MAP[u];
    return pid
      ? `<button type="button" class="chip chip-link" data-open="${pid}">${esc(u)}</button>`
      : `<span class="chip">${esc(u)}</span>`;
  }).join('');
  return `<div class="skill-card">
    <div class="skill-card-top"><span class="skill-card-name">${esc(s.name)}</span><span class="depth-badge" style="color:${depth.color}"><span class="depth-dot" style="background:${depth.color}"></span>${depth.label}</span></div>
    <div class="skill-chips">${chips}</div>
    <p class="skill-blurb">${esc(s.blurb)}</p>
  </div>`;
}
function renderSkillsPreview(obj) {
  const legend = `<div class="depth-legend">${Object.entries(DEPTH_META).map(([k, v]) => `<span class="legend-item"><span class="depth-dot" style="background:${v.color}"></span>${v.label}</span>`).join('')}</div>`;
  const groups = Object.entries(obj).map(([key, items]) => `<section class="skill-group-section"><h2 class="md-h2">${GROUP_LABELS[key] || key}</h2><div class="skill-cards">${items.map(skillCard).join('')}</div></section>`).join('');
  return `<div class="md-preview">${legend}${groups}</div>`;
}
function renderSkillsFile() {
  const mode = mdMode['skills'] || 'preview';
  const toolbar = `<div class="editor-toolbar"><button type="button" class="md-toggle" data-id="skills">${mode === 'preview' ? 'View source' : 'View preview'}</button></div>`;
  const body = mode === 'preview' ? renderSkillsPreview(skills) : renderJsonFile(skills);
  return toolbar + body;
}
function renderJsonFile(obj) {
  const json = JSON.stringify(obj, null, 2);
  const lines = json.split('\n').map((line) => {
    let out = esc(line);
    out = out.replace(/"([^"]+)":/g, '<span class="tok-key">"$1"</span>:');
    out = out.replace(/: "([^"]*)"/g, ': <span class="tok-str">"$1"</span>');
    out = out.replace(/: (-?\d+(\.\d+)?)/g, ': <span class="tok-num">$1</span>');
    return out;
  });
  return `<div class="code">${lines.map((l, idx) => lineRow(idx + 1, l)).join('')}</div>`;
}
function renderLogFile(list) {
  const lines = list.map((a) => `<span class="tok-comment">[${esc(a.ts)}]</span> <span class="tok-fn">${esc(a.level)}</span>&nbsp;&nbsp;<span class="tok-plain">${esc(a.text)}</span>`);
  return `<div class="code">${lines.map((l, idx) => lineRow(idx + 1, l)).join('')}</div>`;
}
function linkify(s) {
  return esc(s)
    .replace(/(https?:\/\/[^\s"]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/([\w.+-]+@[\w-]+\.[\w.-]+)/g, '<a href="mailto:$1">$1</a>');
}
function renderShFile(c) {
  const raw = [
    '#!/bin/bash',
    '# contact.sh — reach me here',
    `echo "Email:    ${c.email}"`,
    `echo "LinkedIn: ${c.linkedin}"`,
    `echo "GitHub:   ${c.github}"`,
    `echo "Phone:    ${c.phone}"`,
  ];
  const lines = raw.map((line) => {
    if (line.startsWith('#')) return `<span class="tok-comment">${esc(line)}</span>`;
    const m = line.match(/^echo "(.*)"$/);
    if (m) return `<span class="tok-key">echo</span> <span class="tok-str">"${linkify(m[1])}"</span>`;
    return esc(line);
  });
  return `<div class="code">${lines.map((l, idx) => lineRow(idx + 1, l)).join('')}</div>`;
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
function liveDot(label) {
  return `<span class="live-dot" title="${esc(label)}" aria-label="${esc(label)}"></span>`;
}
function profileCard(p) {
  let liveLine = '';
  if (p.name === 'Codeforces') {
    const d = getLiveData('codeforces');
    if (d && d.live && d.value) {
      liveLine = `<div class="profile-live">${liveDot(`Live — updated ${timeAgo(new Date(d.updatedAt).toISOString())}`)} rating <strong>${esc(String(d.value.rating))}</strong> (max ${esc(String(d.value.maxRating))}, ${esc(d.value.maxRank || '')})</div>`;
    }
  }
  if (p.name === 'LeetCode') {
    const d = getLiveData('leetcode');
    if (d && d.live && d.value) {
      liveLine = `<div class="profile-live">${liveDot(`Live — updated ${timeAgo(new Date(d.updatedAt).toISOString())}`)} rating <strong>${esc(String(Math.round(d.value.rating || 0)))}</strong>${d.value.totalSolved ? `, ${esc(String(d.value.totalSolved))} solved` : ''}</div>`;
    }
  }
  const badgeHtml = p.badge
    ? `<img class="profile-badge-icon" src="${p.badge.icon}" alt="${esc(p.badge.name)} badge" title="${esc(p.badge.name)} badge" loading="lazy">`
    : '';
  return `<a class="profile-card" href="${p.url}" target="_blank" rel="noopener">
    ${p.icon ? `<img class="profile-icon" src="${p.icon}" alt="" loading="lazy">` : `<span class="profile-icon profile-icon-fallback">${esc(p.name.slice(0, 2).toUpperCase())}</span>`}
    <div class="profile-body">
      <div class="profile-name">${esc(p.name)}${badgeHtml}</div>
      <div class="profile-stat">${esc(p.statValue)} <span class="profile-stat-label">${esc(p.statLabel)}</span></div>
      ${liveLine}
    </div>
  </a>`;
}
function renderProfilesFile() {
  const cards = codingProfiles.map(profileCard).join('');
  return `<div class="repo-view repo-enter">
    <section class="repo-section">
      <h2>Coding profiles</h2>
      <p class="repo-prose">Ratings below are static except where marked <span class="live-dot" style="position:static; display:inline-block; vertical-align:middle"></span> live — those refresh from each platform's public API in the background.</p>
      <div class="profile-grid">${cards}</div>
    </section>
  </div>`;
}
/* ---------- git-log graph (Phase 6) ---------- */
const GRAPH_COLORS = ['var(--orange)', 'var(--blue)', 'var(--purple)', 'var(--pink)', 'var(--green)'];
function commitHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0').slice(0, 7);
}
function buildGraphRows() {
  const rows = [];
  experience.forEach((role, i) => {
    const color = GRAPH_COLORS[i % GRAPH_COLORS.length];
    const isCurrent = i === 0;
    if (isCurrent) {
      rows.push({ kind: 'header', roleId: role.id, color, current: true, g0: ' ', g1: '◉',
        text: `HEAD -> ${role.id} (in progress) — ${role.role} · ${role.period}`, hash: commitHash(`head:${role.id}`) });
    } else {
      rows.push({ kind: 'header', roleId: role.id, color, g0: '●', g1: ' ',
        text: `Merge branch '${role.id}' — ${role.role} · ${role.period}`, hash: commitHash(`merge:${role.id}`) });
    }
    role.highlights.forEach((h, hi) => {
      rows.push({ kind: 'commit', roleId: role.id, color, g0: isCurrent ? ' ' : '│', g1: '●',
        type: h.type, scope: h.scope, subject: h.subject, hash: commitHash(`${role.id}:${hi}:${h.subject}`) });
    });
    rows.push({ kind: 'branch', roleId: role.id, color, g0: isCurrent ? ' ' : '╭', g1: '╯' });
  });
  return rows;
}
function graphGutterHTML(g0, g1, color) {
  const c0color = g0 === '│' || g0 === '╭' ? 'var(--fg-dim)' : g0 === ' ' ? 'transparent' : color;
  return `<span class="graph-gutter" aria-hidden="true"><span style="color:${c0color}">${g0}</span><span style="color:${color}">${g1}</span></span>`;
}
function renderGraphRow(row) {
  const gutter = graphGutterHTML(row.g0, row.g1, row.color);
  if (row.kind === 'branch') return `<div class="graph-row graph-row-branch" role="presentation">${gutter}</div>`;
  const label = row.kind === 'header' ? row.text : `${row.type}(${row.scope}): ${row.subject}`;
  const content = row.kind === 'header'
    ? `<span class="graph-context">${esc(row.text)}</span>`
    : `<span class="commit-type">${esc(row.type)}</span><span class="commit-punct">(</span><span class="commit-scope">${esc(row.scope)}</span><span class="commit-punct">):</span> <span class="commit-subject">${esc(row.subject)}</span>`;
  return `<div class="graph-row" role="listitem" tabindex="0" data-open="${row.roleId}" aria-label="${esc(fileById(row.roleId).name)} — ${esc(label)}">
    ${gutter}
    <span class="graph-hash">${esc(row.hash)}</span>
    ${content}
  </div>`;
}
function renderGraphRowMobile(row) {
  if (row.kind === 'branch') return '';
  const label = row.kind === 'header' ? row.text : `${row.type}(${row.scope}): ${row.subject}`;
  const content = row.kind === 'header'
    ? `<span class="graph-context">${esc(row.text)}</span>`
    : `<span class="commit-type">${esc(row.type)}</span><span class="commit-punct">(</span><span class="commit-scope">${esc(row.scope)}</span><span class="commit-punct">):</span> <span class="commit-subject">${esc(row.subject)}</span>`;
  return `<div class="timeline-item" role="listitem" tabindex="0" data-open="${row.roleId}" aria-label="${esc(fileById(row.roleId).name)} — ${esc(label)}">
    <span class="timeline-dot" aria-hidden="true" style="background:${row.color}"></span>
    <span class="graph-hash">${esc(row.hash)}</span>
    ${content}
  </div>`;
}
function renderGraphFile() {
  const rows = buildGraphRows();
  const desktop = rows.map(renderGraphRow).join('');
  const mobile = rows.map(renderGraphRowMobile).join('');
  return `<div class="graph-desktop" role="list" aria-label="Career history, rendered as a git commit graph">${desktop}</div>
    <div class="graph-mobile" role="list" aria-label="Career history timeline">${mobile}</div>`;
}
function renderFileHTML(id) {
  const f = fileById(id);
  if (id === 'about') return renderMarkdownFile(id, about.markdown);
  if (id === 'history') return renderGraphFile();
  if (f.ext === 'yaml') return renderYamlFile(experience.find((e) => e.id === id));
  if (id === 'skills') return renderSkillsFile();
  if (id === 'profiles') return renderProfilesFile();
  if (id === 'achievements') return renderLogFile(achievements);
  if (id === 'contact') return renderShFile(contact);
  if (f.ext === 'md') return renderProjectFile(id);
  return '<div class="code">Unsupported file type.</div>';
}
function projectToMarkdown(p) {
  const tags = p.tags.map((t) => `\`${t}\``).join(' ');
  const challenges = p.challenges.map((c) => `**Challenge:** ${c.problem}\n**Solution:** ${c.solution}`).join('\n\n');
  const metrics = p.metrics.map((m) => `- **${m.value}** — ${m.label}`).join('\n');
  return `# ${p.title}
### ${p.subtitle}

${tags}

${p.summary}

## Role
${p.role}

## Architecture
${p.architectureList.map((a) => `- ${a}`).join('\n')}

## Challenges & Solutions
${challenges}

## Metrics
${metrics}

[View on GitHub](${p.github})`;
}

/* ---------- project repo view ---------- */
function labelClass(l) { return l === 'bug' ? 'bug' : l === 'perf' ? 'perf' : 'design'; }
function decisionCard(c) {
  return `<div class="decision-card">
    <div class="decision-top">
      <span class="decision-glyph" aria-hidden="true">●</span>
      <span class="decision-title">${esc(c.problem)}</span>
      <span class="decision-label ${labelClass(c.label)}">${esc(c.label || 'design')}</span>
    </div>
    <div class="decision-resolution">
      <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,182.63,218.34,60.34a8,8,0,0,1,11.32,11.32Z"></path></svg>
      <p>${esc(c.solution)}</p>
    </div>
  </div>`;
}
function repoNav(id) {
  const idx = projects.findIndex((p) => p.id === id);
  const prev = projects[idx - 1];
  const next = projects[idx + 1];
  return `<nav class="repo-nav" aria-label="Adjacent projects">
    ${prev ? `<button type="button" class="chip-nav" data-open="${prev.id}">← ${esc(prev.title)}</button>` : '<span></span>'}
    ${next ? `<button type="button" class="chip-nav" data-open="${next.id}">${esc(next.title)} →</button>` : '<span></span>'}
  </nav>`;
}
function renderRepoPreview(p) {
  const badges = `<span class="badge"><span class="badge-label">build</span><span class="badge-value bg-green">passing</span></span><span class="badge"><span class="badge-label">coverage</span><span class="badge-value bg-blue">tested</span></span>`;
  const stack = p.tags.map((t) => `<span class="stack-pill">${esc(t)}</span>`).join('');
  const stats = p.metrics.map((m) => `<div class="stat-card"><span class="num">${esc(m.value)}</span><span class="label">${esc(m.label)}</span></div>`).join('');
  const notes = (p.architectureNotes || []).map((n) => `<li>${esc(n)}</li>`).join('');
  const decisions = p.challenges.map(decisionCard).join('');
  const ghDisabled = !p.github || p.repoStatus === 'private' || p.repoStatus === 'none';
  let liveMeta = '';
  if (p.repoStatus === 'public') {
    const repoData = getLiveData(`github-repo-${p.id}`);
    const langData = getLiveData(`github-langs-${p.id}`);
    if (repoData && repoData.live && repoData.value) {
      liveMeta += `<span class="lang-label">${liveDot(`Live — updated ${timeAgo(repoData.value.pushedAt)}`)} updated ${timeAgo(repoData.value.pushedAt)}</span>`;
    }
    if (langData && langData.live && langData.value) {
      const entries = Object.entries(langData.value);
      const total = entries.reduce((s, [, v]) => s + v, 0);
      if (total > 0) {
        const palette = ['var(--blue)', 'var(--green)', 'var(--orange)', 'var(--purple)', 'var(--pink)', 'var(--yellow)'];
        const segs = entries.map(([name, v], i) => `<span class="lang-seg" style="width:${(v / total * 100).toFixed(1)}%; background:${palette[i % palette.length]}" title="${esc(name)} ${(v / total * 100).toFixed(0)}%"></span>`).join('');
        liveMeta += `<div class="lang-bar-wrap">${liveDot('Live language breakdown')}<div class="lang-bar">${segs}</div></div>`;
      }
    }
  }
  return `<div class="repo-view repo-enter">
    <div class="repo-header">
      <svg class="repo-icon" width="20" height="20" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M208,32H72A24,24,0,0,0,48,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H64v-8a8,8,0,0,1,8-8H208a8,8,0,0,0,8-8V40A8,8,0,0,0,208,32ZM72,48H200V184H72a23.85,23.85,0,0,0-8,1.37V56A8,8,0,0,1,72,48Z"></path></svg>
      <h1 class="repo-title"><span class="owner">sauraabh /</span> ${esc(p.id)}</h1>
    </div>
    <p class="repo-desc">${esc(p.summary)}</p>
    <div class="repo-meta">
      <span class="lang-label"><span class="lang-dot" style="background:${p.language.color}"></span>${esc(p.language.name)}</span>
      ${badges}${stack}
    </div>
    ${liveMeta ? `<div class="repo-live-meta">${liveMeta}</div>` : ''}
    <div class="stat-strip">${stats}</div>
    <section class="repo-section">
      <h2>About</h2>
      <div class="repo-prose"><p>${esc(p.summary)}</p><p><strong>My role:</strong> ${esc(p.role)}</p></div>
    </section>
    <section class="repo-section">
      <h2>Architecture</h2>
      <div class="ascii-wrap"><pre class="ascii-diagram">${esc(p.architecture)}</pre></div>
      <ul class="arch-captions">${notes}</ul>
    </section>
    <section class="repo-section">
      <h2>Engineering Decisions</h2>
      <div class="decision-list">${decisions}</div>
      ${p.repoStatus === 'public' ? `<a class="decision-track-link" href="${p.github}/issues" target="_blank" rel="noopener">Track progress on GitHub →</a>` : ''}
    </section>
    <div class="repo-footer">
      ${ghDisabled
        ? `<button type="button" class="gh-btn" disabled title="going public soon">View on GitHub →</button>`
        : `<a class="gh-btn" href="${p.github}" target="_blank" rel="noopener">View on GitHub →</a>`}
      ${repoNav(p.id)}
    </div>
  </div>`;
}
function renderProjectFile(id) {
  const p = projects.find((x) => x.id === id);
  const mode = mdMode[id] || 'preview';
  const toolbar = `<div class="editor-toolbar"><button type="button" class="md-toggle" data-id="${id}">${mode === 'preview' ? 'View source' : 'View preview'}</button></div>`;
  if (mode === 'preview') return toolbar + renderRepoPreview(p);
  return toolbar + `<div class="code">${renderMarkdownSource(projectToMarkdown(p))}</div>`;
}

/* ---------- welcome view (canonical copy lives in index.html; captured on init) ---------- */
let WELCOME_HTML = '';
const WELCOME_TYPED_KEY = 'ide.welcome-typed.v1';
function playWelcomeTyping() {
  const pane = document.getElementById('editor-pane');
  const titleEl = pane.querySelector('.welcome-title');
  const subEl = pane.querySelector('.welcome-sub');
  if (!titleEl || !subEl) return;
  let played = false;
  try { played = sessionStorage.getItem(WELCOME_TYPED_KEY) === '1'; } catch (e) {}
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (played || reduced) return;
  try { sessionStorage.setItem(WELCOME_TYPED_KEY, '1'); } catch (e) {}
  animateTyping(titleEl, () => animateTyping(subEl, () => {}));
}
function animateTyping(el, done) {
  const fullText = el.textContent;
  const originalColor = getComputedStyle(el).color;
  el.style.color = 'transparent';
  el.style.position = 'relative';
  const overlay = document.createElement('span');
  overlay.className = 'type-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.color = originalColor;
  const textSpan = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'type-cursor';
  overlay.appendChild(textSpan);
  overlay.appendChild(cursor);
  el.appendChild(overlay);
  let i = 0;
  function tick() {
    i++;
    textSpan.textContent = fullText.slice(0, i);
    if (i < fullText.length) {
      setTimeout(tick, 45 + Math.random() * 20 - 10);
    } else {
      setTimeout(() => { cursor.remove(); }, 900);
      done();
    }
  }
  tick();
}

/* ---------- tree DOM ---------- */
function fileRow(id, depth) {
  const f = fileById(id);
  const meta = EXT_META[f.ext];
  const row = document.createElement('div');
  row.className = 'tree-row';
  row.setAttribute('role', 'treeitem');
  row.tabIndex = 0;
  row.style.paddingLeft = `${12 + depth * 14}px`;
  row.dataset.id = id;
  row.innerHTML = `<span class="tree-chevron" aria-hidden="true"></span><span class="tree-icon" style="color:${meta.color}">${meta.glyph}</span><span>${f.name}</span>`;
  row.addEventListener('click', () => openFile(id));
  row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFile(id); } });
  return row;
}
function folderRow(node) {
  const wrap = document.createElement('div');
  const header = document.createElement('div');
  header.className = 'tree-row';
  header.setAttribute('role', 'treeitem');
  header.setAttribute('aria-expanded', 'true');
  header.tabIndex = 0;
  header.innerHTML = `<span class="tree-chevron open" aria-hidden="true">▸</span><span class="tree-icon">📁</span><span>${esc(node.name)}</span>`;
  const childrenWrap = document.createElement('div');
  childrenWrap.className = 'tree-children';
  childrenWrap.setAttribute('role', 'group');
  node.children.forEach((cid) => childrenWrap.appendChild(fileRow(cid, 1)));
  const toggle = () => {
    const open = header.getAttribute('aria-expanded') === 'true';
    header.setAttribute('aria-expanded', String(!open));
    header.querySelector('.tree-chevron').classList.toggle('open', !open);
    childrenWrap.hidden = open;
  };
  header.addEventListener('click', toggle);
  header.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  wrap.appendChild(header);
  wrap.appendChild(childrenWrap);
  return wrap;
}
function buildTree() {
  const root = document.getElementById('file-tree');
  root.innerHTML = '';
  root.setAttribute('role', 'tree');
  TREE.forEach((node) => root.appendChild(node.kind === 'file' ? fileRow(node.id, 0) : folderRow(node)));
}
function syncTreeSelection() {
  document.querySelectorAll('.tree-row').forEach((row) => {
    row.setAttribute('aria-selected', String(row.dataset.id === activeId));
  });
}

/* ---------- tabs DOM ---------- */
function renderTabs() {
  const bar = document.getElementById('tabbar');
  bar.innerHTML = '';
  if (openTabs.length === 0) { bar.innerHTML = '<p class="tab-placeholder">No open editors</p>'; return; }
  openTabs.forEach((id) => {
    const f = fileById(id);
    const meta = EXT_META[f.ext];
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(id === activeId));
    tab.tabIndex = 0;
    tab.innerHTML = `<span class="tree-icon" style="color:${meta.color}">${meta.glyph}</span><span>${f.name}</span><span class="tab-close" data-id="${id}" aria-label="Close ${f.name}" role="button" tabindex="0">×</span>`;
    tab.addEventListener('click', (e) => { if (e.target.closest('.tab-close')) return; setActive(id); });
    const closeBtn = tab.querySelector('.tab-close');
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeTab(id); });
    closeBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); closeTab(id); } });
    bar.appendChild(tab);
  });
}

/* ---------- editor pane ---------- */
function renderEditor() {
  const pane = document.getElementById('editor-pane');
  if (!activeId) { pane.innerHTML = WELCOME_HTML; playWelcomeTyping(); return; }
  pane.innerHTML = renderFileHTML(activeId);
  const toggleBtn = pane.querySelector('.md-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const id = toggleBtn.dataset.id;
      mdMode[id] = mdMode[id] === 'source' ? 'preview' : 'source';
      renderEditor();
      persist();
    });
  }
  pane.querySelectorAll('.chip-link, .chip-nav').forEach((btn) => {
    btn.addEventListener('click', () => openFile(btn.dataset.open));
  });
  pane.querySelectorAll('.graph-row[data-open], .timeline-item[data-open]').forEach((row) => {
    row.addEventListener('click', () => openFile(row.dataset.open));
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFile(row.dataset.open); } });
  });
  updateMinimap();
}
function updateStatusBar() {
  const sb = document.getElementById('sb-filetype');
  if (!activeId) { sb.textContent = 'Plain Text'; return; }
  const labels = { md: 'Markdown', yaml: 'YAML', json: 'JSON', log: 'Log', sh: 'Shell Script', git: 'Git Graph' };
  sb.textContent = labels[fileById(activeId).ext];
}

/* ---------- routing & persistence ---------- */
const hashFor = (id) => `#${fileById(id).path}`;
const idForHash = (hash) => { const p = decodeURIComponent(hash.replace(/^#/, '')); return FILES.find((f) => f.path === p)?.id || null; };
function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify({ openTabs, activeId, mdMode })); } catch (e) {} }
function loadPersisted() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; } }

function setActive(id) {
  activeId = id;
  if (!openTabs.includes(id)) openTabs.push(id);
  renderTabs();
  renderEditor();
  syncTreeSelection();
  updateStatusBar();
  const h = hashFor(id);
  if (location.hash !== h) history.pushState(null, '', h);
  persist();
  if (window.innerWidth <= 768) closeMobileOverlay();
}
function openFile(id) { setActive(id); }
function closeTab(id) {
  openTabs = openTabs.filter((x) => x !== id);
  if (activeId === id) {
    activeId = openTabs[openTabs.length - 1] || null;
    history.pushState(null, '', activeId ? hashFor(activeId) : location.pathname + location.search);
  }
  renderTabs();
  renderEditor();
  syncTreeSelection();
  updateStatusBar();
  persist();
}
function cycleTab(dir) {
  if (openTabs.length < 2) return;
  const idx = openTabs.indexOf(activeId);
  setActive(openTabs[(idx + dir + openTabs.length) % openTabs.length]);
}

/* ---------- mobile overlay ---------- */
function closeMobileOverlay() {
  document.getElementById('sidebar').classList.remove('open');
  document.querySelector('.activitybar').classList.remove('open');
}

/* ---------- terminal panel plumbing (owned here; terminal.js owns what's inside) ---------- */
const TERM_KEY = 'ide.term.v1';
function termPersist(open, height) {
  try { localStorage.setItem(TERM_KEY, JSON.stringify({ open, height })); } catch (e) {}
}
function termLoad() {
  try { return JSON.parse(localStorage.getItem(TERM_KEY) || 'null'); } catch (e) { return null; }
}
function setupTerminalPanel() {
  const panel = document.getElementById('term-panel');
  const termBtn = document.getElementById('act-terminal');
  const closeBtn = document.getElementById('term-close');
  const maxBtn = document.getElementById('term-maximize');
  const resizer = document.getElementById('term-resizer');
  let lastHeight = '35%';
  let maximized = false;

  function openPanel() {
    panel.hidden = false;
    panel.style.setProperty('--term-height', lastHeight);
    termBtn.setAttribute('aria-pressed', 'true');
    termPersist(true, lastHeight);
    document.getElementById('term-input').focus();
  }
  function closePanel() {
    panel.hidden = true;
    termBtn.setAttribute('aria-pressed', 'false');
    termPersist(false, lastHeight);
  }
  function toggle() { panel.hidden ? openPanel() : closePanel(); }
  function toggleMaximize() {
    maximized = !maximized;
    maxBtn.setAttribute('aria-pressed', String(maximized));
    panel.style.setProperty('--term-height', maximized ? '90%' : lastHeight);
  }

  termBtn.addEventListener('click', toggle);
  closeBtn.addEventListener('click', closePanel);
  maxBtn.addEventListener('click', toggleMaximize);

  let dragging = false, startY = 0, startPx = 0;
  resizer.addEventListener('pointerdown', (e) => {
    dragging = true; startY = e.clientY; startPx = panel.getBoundingClientRect().height;
    resizer.setPointerCapture(e.pointerId);
  });
  resizer.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const colHeight = panel.parentElement.getBoundingClientRect().height;
    const delta = startY - e.clientY;
    const px = Math.min(colHeight * 0.8, Math.max(120, startPx + delta));
    const pct = `${(px / colHeight) * 100}%`;
    lastHeight = pct;
    if (!maximized) panel.style.setProperty('--term-height', pct);
  });
  resizer.addEventListener('pointerup', () => { if (dragging) { dragging = false; termPersist(!panel.hidden, lastHeight); } });
  resizer.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const colHeight = panel.parentElement.getBoundingClientRect().height;
    const currentPx = panel.getBoundingClientRect().height;
    const delta = e.key === 'ArrowUp' ? 24 : -24;
    const px = Math.min(colHeight * 0.8, Math.max(120, currentPx + delta));
    lastHeight = `${(px / colHeight) * 100}%`;
    if (!maximized) panel.style.setProperty('--term-height', lastHeight);
    termPersist(!panel.hidden, lastHeight);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.code === 'Backquote')) { e.preventDefault(); toggle(); }
  });

  const saved = termLoad();
  if (saved && saved.height) lastHeight = saved.height;
  if (saved && saved.open) openPanel(); else panel.hidden = true;

  initTerminal({ openFile, ensureOpen: openPanel, closeIfMobile: closePanel, openShortcuts: () => shortcutsApi && shortcutsApi.open() });
}

/* ---------- theme menu (settings gear + status bar) ---------- */
function setupThemeMenu() {
  const gearBtn = document.getElementById('act-settings');
  const sbBtn = document.getElementById('sb-theme');
  const menu = document.getElementById('theme-menu');
  const items = Array.from(menu.querySelectorAll('.theme-menu-item'));
  let lastFocused = null;

  function syncChecks() {
    const current = getCurrentTheme();
    items.forEach((it) => it.setAttribute('aria-checked', String(it.dataset.themeId === current)));
    sbBtn.textContent = THEMES.find((t) => t.id === current)?.label || 'Monokai';
  }
  function openMenu() {
    lastFocused = document.activeElement;
    menu.hidden = false;
    gearBtn.setAttribute('aria-expanded', 'true');
    const current = getCurrentTheme();
    const activeItem = items.find((it) => it.dataset.themeId === current) || items[0];
    activeItem.focus();
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    gearBtn.setAttribute('aria-expanded', 'false');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
  function toggleMenu() { menu.hidden ? openMenu() : closeMenu(); }

  gearBtn.addEventListener('click', toggleMenu);
  sbBtn.addEventListener('click', toggleMenu);

  items.forEach((it, i) => {
    it.addEventListener('click', () => { applyTheme(it.dataset.themeId); closeMenu(); });
    it.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); applyTheme(it.dataset.themeId); closeMenu(); }
    });
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== gearBtn && e.target !== sbBtn) closeMenu();
  });
  onThemeChange(syncChecks);
  syncChecks();
}

/* ---------- shortcuts overlay ---------- */
function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}
let shortcutsApi = null;
function setupShortcutsOverlay() {
  const backdrop = document.getElementById('shortcuts-backdrop');
  const closeBtn = document.getElementById('shortcuts-close');
  let lastFocused = null;
  function open() {
    if (!backdrop.hidden) return;
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    closeBtn.focus();
  }
  function close() {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', (e) => {
    if (!backdrop.hidden && e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === '?' && !isTypingTarget(document.activeElement) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); open();
    }
  });
  shortcutsApi = { open, close };
}

/* ---------- minimap (decorative, ≥1200px, .code views only) ---------- */
function updateMinimap() {
  const minimap = document.getElementById('minimap');
  const pane = document.getElementById('editor-pane');
  const rows = pane.querySelectorAll('.code .ln-row');
  if (!rows.length) { minimap.classList.add('empty'); minimap.innerHTML = '<div class="minimap-viewport" id="minimap-viewport"></div>'; return; }
  minimap.classList.remove('empty');
  const maxLen = Math.max(1, ...Array.from(rows).map((r) => Number(r.dataset.len) || 0));
  const bars = Array.from(rows).map((r) => {
    const pct = Math.min(100, ((Number(r.dataset.len) || 0) / maxLen) * 100);
    return `<div class="minimap-bar" style="width:${pct}%; background:${r.dataset.tint}"></div>`;
  }).join('');
  minimap.innerHTML = bars + '<div class="minimap-viewport" id="minimap-viewport"></div>';
  syncMinimapViewport();
}
function syncMinimapViewport() {
  const minimap = document.getElementById('minimap');
  const viewport = document.getElementById('minimap-viewport');
  const pane = document.getElementById('editor-pane');
  if (!viewport || minimap.classList.contains('empty') || pane.scrollHeight <= pane.clientHeight) {
    if (viewport) viewport.style.display = 'none';
    return;
  }
  viewport.style.display = 'block';
  const ratio = minimap.clientHeight / pane.scrollHeight;
  viewport.style.top = `${pane.scrollTop * ratio}px`;
  viewport.style.height = `${pane.clientHeight * ratio}px`;
}
function scrollToMinimapClick(e) {
  const minimap = document.getElementById('minimap');
  const pane = document.getElementById('editor-pane');
  if (minimap.classList.contains('empty')) return;
  const rect = minimap.getBoundingClientRect();
  const frac = (e.clientY - rect.top) / rect.height;
  pane.scrollTop = frac * pane.scrollHeight - pane.clientHeight / 2;
}

/* ---------- init ---------- */
function init() {
  WELCOME_HTML = document.getElementById('welcome-view').outerHTML;
  buildTree();
  setupTerminalPanel();
  setupThemeMenu();
  onLiveDataChange(() => {
    if (activeId === 'profiles' || (activeId && projects.some((p) => p.id === activeId))) renderEditor();
  });
  // Non-blocking, post-render: page is fully usable before this resolves.
  setTimeout(() => { refreshLiveData().catch(() => {}); }, 300);
  const palette = initPalette({ openFile, runInTerminal });
  document.getElementById('palette-trigger').addEventListener('click', () => palette.toggle());
  setupShortcutsOverlay();
  document.getElementById('editor-pane').addEventListener('scroll', syncMinimapViewport);
  document.getElementById('minimap').addEventListener('click', scrollToMinimapClick);
  onThemeChange(updateMinimap);
  window.addEventListener('resize', syncMinimapViewport);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
      e.preventDefault();
      palette.toggle();
    }
  });

  const explorerBtn = document.getElementById('act-explorer');
  explorerBtn.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.toggle('open');
      document.querySelector('.activitybar').classList.add('open');
      return;
    }
    const collapsed = document.getElementById('sidebar').classList.toggle('collapsed');
    explorerBtn.setAttribute('aria-pressed', String(!collapsed));
  });
  document.getElementById('hamburger').addEventListener('click', () => {
    document.querySelector('.activitybar').classList.toggle('open');
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('act-settings').addEventListener('click', () => {
    // Theme switching lands in a later phase.
  });
  document.getElementById('act-call').addEventListener('click', () => {
    const number = '+91 6393783010';
    navigator.clipboard?.writeText(number).then(() => {
      const toast = document.getElementById('call-toast');
      toast.textContent = `Copied ${number} — paste it into your phone to call.`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2600);
    }).catch(() => {});
  });

  const hashId = idForHash(location.hash);
  if (hashId) {
    openTabs = [hashId];
    setActive(hashId);
  } else {
    const saved = loadPersisted();
    if (saved && Array.isArray(saved.openTabs) && saved.openTabs.length) {
      openTabs = saved.openTabs.filter((id) => fileById(id));
      Object.assign(mdMode, saved.mdMode || {});
      const restoreActive = saved.activeId && openTabs.includes(saved.activeId) ? saved.activeId : openTabs[openTabs.length - 1];
      setActive(restoreActive);
    } else {
      setActive('about');
    }
  }

  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    if (e.key.toLowerCase() === 'w' && activeId) { e.preventDefault(); closeTab(activeId); }
    else if (e.key === 'Tab' && e.altKey) { e.preventDefault(); cycleTab(e.shiftKey ? -1 : 1); }
  });
  window.addEventListener('popstate', () => {
    const id = idForHash(location.hash);
    if (id && id !== activeId) setActive(id);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
