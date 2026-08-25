// files.js — the single canonical file registry.
//
// This list used to be declared independently in ide-shell.js, terminal.js and palette.js,
// and it drifted: the palette was missing profiles.md and experience/history.git, so
// Ctrl/Cmd+K could not reach the two most distinctive pages on the site. One source now.
//
// Leaf module by design: it imports file-contents.js (itself a leaf) and nothing else,
// so every consumer can import it without creating a cycle.

import { experience, projects, posts } from './file-contents.js';

const featured = projects.filter((p) => p.featured);
// Draft posts stay out of the tree entirely — an unfinished outline on a live
// hiring portfolio is worse than no post at all.
const published = posts.filter((p) => p.status === 'published');

export const FILES = [
  { id: 'readme', name: 'README.md', ext: 'md', path: 'README.md' },
  { id: 'about', name: 'about.md', ext: 'md', path: 'about.md' },
  { id: 'history', name: 'history.git', ext: 'git', path: 'experience/history.git' },
  ...experience.map((e) => ({ id: e.id, name: `${e.id}.yaml`, ext: 'yaml', path: `experience/${e.id}.yaml` })),
  ...featured.map((p) => ({ id: p.id, name: `${p.id}.md`, ext: 'md', path: `projects/${p.id}.md` })),
  { id: 'sentinel-sim', name: 'sentinel-engine.sim', ext: 'sim', path: 'projects/sentinel-engine.sim' },
  { id: 'also-built', name: 'also-built.md', ext: 'md', path: 'projects/also-built.md' },
  ...published.map((p) => ({ id: p.id, name: `${p.id}.md`, ext: 'md', path: `posts/${p.id}.md` })),
  { id: 'skills', name: 'skills.json', ext: 'json', path: 'skills.json' },
  { id: 'profiles', name: 'profiles.md', ext: 'md', path: 'profiles.md' },
  { id: 'achievements', name: 'achievements.log', ext: 'log', path: 'achievements.log' },
  { id: 'interview', name: 'interview.md', ext: 'md', path: 'interview.md' },
  { id: 'contact', name: 'contact.sh', ext: 'sh', path: 'contact.sh' },
];

export const TREE = [
  { kind: 'file', id: 'readme' },
  { kind: 'file', id: 'about' },
  { kind: 'folder', name: 'experience', children: ['history', ...experience.map((e) => e.id)] },
  // sentinel-engine.sim sits directly under its project so the two read as a pair.
  { kind: 'folder', name: 'projects', children: ['sentinel-engine', 'sentinel-sim', ...featured.filter((p) => p.id !== 'sentinel-engine').map((p) => p.id), 'also-built'] },
  // Folder is omitted entirely while every post is a draft.
  ...(published.length ? [{ kind: 'folder', name: 'posts', children: published.map((p) => p.id) }] : []),
  { kind: 'file', id: 'skills' },
  { kind: 'file', id: 'profiles' },
  { kind: 'file', id: 'achievements' },
  { kind: 'file', id: 'interview' },
  { kind: 'file', id: 'contact' },
];

export const EXT_META = {
  md: { glyph: 'M', color: 'var(--blue)' },
  yaml: { glyph: 'Y', color: 'var(--purple)' },
  json: { glyph: '{}', color: 'var(--yellow)' },
  log: { glyph: '≡', color: 'var(--glyph-dim)' },
  sh: { glyph: '$', color: 'var(--green)' },
  git: { glyph: '⎇', color: 'var(--orange)' },
  sim: { glyph: '▶', color: 'var(--pink)' },
};

export const extOf = (name) => String(name).split('.').pop();
export const glyphFor = (ext) => (EXT_META[ext] || { glyph: '·' }).glyph;
export const fileById = (id) => FILES.find((f) => f.id === id);
export const fileByPathOrName = (arg) => {
  const clean = String(arg).replace(/^\.\//, '').replace(/\/$/, '');
  return FILES.find((f) => f.path === clean || f.name === clean || f.id === clean);
};

// Directory prefixes that `ls` and tab-completion offer.
export const DIRS = ['experience/', 'projects/', 'posts/'];

// Root listing for bare `ls`: top-level files plus folder names, derived not hardcoded.
export const rootListing = () => [
  ...TREE.filter((n) => n.kind === 'folder').map((n) => `${n.name}/`),
  ...TREE.filter((n) => n.kind === 'file').map((n) => fileById(n.id).name),
];
