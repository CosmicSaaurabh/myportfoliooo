// plainview.js — a single scrollable résumé page for visitors the IDE does not serve.
//
// An engineering manager enjoys the IDE. A recruiter opening the link on a phone sees a
// file tree and prose with no obvious résumé or contact, and leaves. Rather than compromise
// the IDE for that audience, this is a second, flat rendering of the same content.
//
// Everything is derived from file-contents.js — there are no duplicated content strings.
// State lives in ide.view.v1 and is mirrored into ?view=plain so the flat page is directly
// shareable (a query param is orthogonal to the existing hash routing).

import { about, experience, projects, skills, achievements, contact, resumeHref, codingProfiles, readme, posts } from './file-contents.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const VIEW_KEY = 'ide.view.v1';
const HINT_KEY = 'ide.view-hint.v1';

const DEPTH_ORDER = { expert: 0, proficient: 1, working: 2 };
const GROUP_LABELS = {
  languages: 'Languages',
  backend: 'Backend & Architecture',
  cloud_devops: 'Cloud & DevOps',
  databases: 'Databases',
  specializations: 'Observability & Specializations',
};

function heroHTML() {
  const tiles = readme.metrics.map((m) => `<div class="pv-metric"><span class="pv-metric-n">${esc(m.value)}</span><span class="pv-metric-l">${esc(m.label)}</span></div>`).join('');
  return `<header class="pv-hero">
    <p class="pv-eyebrow">${esc(readme.now)} · ${esc(readme.prev)} · ${esc(readme.years)}</p>
    <h1 class="pv-name">${esc(readme.name)}</h1>
    <p class="pv-role">${esc(readme.title)}</p>
    <p class="pv-pitch">${esc(readme.pitch)}</p>
    <div class="pv-cta">
      <a class="cta cta-primary" href="${esc(resumeHref)}" download>Download résumé (PDF)</a>
      <a class="cta" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>
      <a class="cta" href="${esc(contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
      <a class="cta" href="${esc(contact.github)}" target="_blank" rel="noopener">GitHub</a>
    </div>
    <div class="pv-metrics">${tiles}</div>
  </header>`;
}

function experienceHTML() {
  const rows = experience.map((e) => `<article class="pv-role-item">
      <div class="pv-role-head">
        <h3>${esc(e.role)} · ${esc(e.company)}</h3>
        <span class="pv-period">${esc(e.period)}${e.location ? ` · ${esc(e.location)}` : ''}</span>
      </div>
      ${e.tag ? `<span class="pv-tag">${esc(e.tag)}</span>` : ''}
      <ul class="pv-bullets">${e.highlights.map((h) => `<li>${esc(h.body)}</li>`).join('')}</ul>
    </article>`).join('');
  return `<section class="pv-section"><h2>Experience</h2>${rows}</section>`;
}

function projectsHTML() {
  const featured = projects.filter((p) => p.featured).map((p) => `<article class="pv-project">
      <div class="pv-role-head">
        <h3>${esc(p.title)}</h3>
        <span class="pv-period">${esc(p.language.name)}</span>
      </div>
      <p class="pv-sub">${esc(p.summary)}</p>
      <p class="pv-metric-row">${p.metrics.map((m) => `<span class="pv-inline-metric"><strong>${esc(m.value)}</strong> ${esc(m.label)}</span>`).join('')}</p>
      <p class="pv-stack">${p.tags.map((t) => `<span class="stack-pill">${esc(t)}</span>`).join('')}</p>
      <a class="ab-link" href="${esc(p.github)}" target="_blank" rel="noopener">View on GitHub →</a>
    </article>`).join('');
  const rest = projects.filter((p) => !p.featured);
  const also = rest.length
    ? `<p class="pv-also"><strong>Also built:</strong> ${rest.map((p) => `<a href="${esc(p.github)}" target="_blank" rel="noopener">${esc(p.title)}</a>`).join(' · ')}</p>`
    : '';
  return `<section class="pv-section"><h2>Projects</h2>${featured}${also}</section>`;
}

function skillsHTML() {
  const groups = Object.entries(skills).map(([key, items]) => {
    const sorted = [...items].sort((a, b) => DEPTH_ORDER[a.depth] - DEPTH_ORDER[b.depth]);
    return `<div class="pv-skill-group">
      <h3>${esc(GROUP_LABELS[key] || key)}</h3>
      <p>${sorted.map((s) => `<span class="pv-skill d-${esc(s.depth)}">${esc(s.name)}</span>`).join('')}</p>
    </div>`;
  }).join('');
  return `<section class="pv-section"><h2>Skills</h2>
    <p class="pv-legend"><span class="pv-skill d-expert">Expert</span><span class="pv-skill d-proficient">Proficient</span><span class="pv-skill d-working">Working</span></p>
    ${groups}</section>`;
}

function educationHTML() {
  // Education lives inside about.markdown; pull the section out rather than restating it.
  const lines = about.markdown.split('\n');
  const start = lines.findIndex((l) => l.trim() === '## Education');
  if (start < 0) return '';
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = lines.length;
  const items = [];
  for (let i = start + 1; i < end; i++) {
    const l = lines[i];
    if (/^### /.test(l)) items.push({ title: l.slice(4), meta: '', points: [] });
    else if (/^- /.test(l) && items.length) items[items.length - 1].points.push(l.slice(2));
    else if (l.trim() && items.length && !items[items.length - 1].meta) items[items.length - 1].meta = l.trim();
  }
  const rows = items.map((it) => `<article class="pv-role-item">
      <div class="pv-role-head"><h3>${esc(it.title)}</h3><span class="pv-period">${esc(it.meta)}</span></div>
      <ul class="pv-bullets">${it.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    </article>`).join('');
  return `<section class="pv-section"><h2>Education</h2>${rows}</section>`;
}

function achievementsHTML() {
  const sorted = [...achievements].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return `<section class="pv-section"><h2>Achievements</h2>
    <ul class="pv-bullets">${sorted.map((a) => `<li><span class="pv-date">${esc(a.ts.slice(0, 7))}</span>${esc(a.text)}</li>`).join('')}</ul>
  </section>`;
}

function profilesHTML() {
  const rows = codingProfiles.map((p) => `<a class="pv-profile" href="${esc(p.url)}" target="_blank" rel="noopener">
      <span class="pv-profile-name">${esc(p.name)}</span>
      <span class="pv-profile-stat">${esc(p.statValue)} <em>${esc(p.statLabel)}</em></span>
    </a>`).join('');
  return `<section class="pv-section"><h2>Competitive programming</h2><div class="pv-profiles">${rows}</div></section>`;
}

function postsHTML() {
  const live = posts.filter((p) => p.status === 'published');
  if (!live.length) return '';
  return `<section class="pv-section"><h2>Writing</h2>
    ${live.map((p) => `<article class="pv-role-item">
      <div class="pv-role-head"><h3>${esc(p.title)}</h3><span class="pv-period">${esc(p.date)} · ${p.readingMinutes} min</span></div>
      <p class="pv-sub">${esc(p.summary)}</p>
    </article>`).join('')}
  </section>`;
}

function buildHTML() {
  return `<div class="pv-page">
    ${heroHTML()}
    ${experienceHTML()}
    ${projectsHTML()}
    ${skillsHTML()}
    ${postsHTML()}
    ${educationHTML()}
    ${achievementsHTML()}
    ${profilesHTML()}
    <footer class="pv-footer">
      <p>Prefer the full version? This site is also a working VS Code-style IDE with an interactive
      distributed-systems simulation, a terminal, and my career rendered as a git commit graph.</p>
      <button type="button" class="cta cta-primary" data-pv-exit>Open the IDE version →</button>
    </footer>
  </div>`;
}

export function initPlainView() {
  const toggle = document.getElementById('view-toggle');
  const ide = document.getElementById('ide');
  if (!toggle || !ide) return {};

  let host = document.getElementById('plain-view');
  if (!host) {
    host = document.createElement('main');
    host.id = 'plain-view';
    host.className = 'plain-view';
    host.hidden = true;
    document.body.appendChild(host);
  }

  const params = new URLSearchParams(location.search);
  let plain = params.get('view') === 'plain'
    || (!params.has('view') && localStorage.getItem(VIEW_KEY) === 'plain');

  function syncUrl() {
    const u = new URL(location.href);
    if (plain) u.searchParams.set('view', 'plain');
    else u.searchParams.delete('view');
    history.replaceState(null, '', u);
  }

  function apply() {
    if (plain && !host.dataset.built) {
      host.innerHTML = buildHTML();
      host.dataset.built = '1';
      host.addEventListener('click', (e) => { if (e.target.closest('[data-pv-exit]')) set(false); });
    }
    ide.hidden = plain;
    host.hidden = !plain;
    document.body.classList.toggle('is-plain', plain);
    toggle.textContent = plain ? '</> IDE view' : 'Plain view';
    toggle.setAttribute('aria-pressed', plain ? 'true' : 'false');
    if (plain) window.scrollTo(0, 0);
  }
  function set(next) {
    plain = next;
    try { localStorage.setItem(VIEW_KEY, plain ? 'plain' : 'ide'); } catch (_) { /* private mode */ }
    syncUrl();
    apply();
  }

  toggle.addEventListener('click', () => set(!plain));
  apply();
  syncUrl();

  // On a phone, the toggle is the single most useful control on the page and the least
  // discoverable. Point at it once, then never again.
  if (!plain && window.innerWidth <= 768) {
    let seen = false;
    try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (_) { seen = true; }
    if (!seen) {
      const hint = document.createElement('div');
      hint.className = 'pv-hint';
      hint.innerHTML = `<span>Reading on a phone? There's a plain résumé view.</span>
        <button type="button" data-pv-go>Switch</button><button type="button" data-pv-dismiss aria-label="Dismiss">×</button>`;
      document.body.appendChild(hint);
      const kill = () => {
        hint.remove();
        try { localStorage.setItem(HINT_KEY, '1'); } catch (_) { /* ignore */ }
      };
      hint.addEventListener('click', (e) => {
        if (e.target.closest('[data-pv-go]')) { kill(); set(true); }
        else if (e.target.closest('[data-pv-dismiss]')) kill();
      });
      setTimeout(() => { if (hint.isConnected) kill(); }, 12000);
    }
  }

  return { isPlain: () => plain, set };
}
