// theme.js — shared theme registry + apply/persist logic. No dependencies on ide-shell.js,
// terminal.js, or palette.js, so all three can import it without any circular-import risk.

export const THEMES = [
  { id: 'monokai', label: 'Monokai' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'solarized-dark', label: 'Solarized Dark' },
  { id: 'github-light', label: 'GitHub Light' },
];
const THEME_KEY = 'ide.theme.v1';
const THEME_COLORS = {
  monokai: '#272822', dracula: '#282a36', 'solarized-dark': '#002b36', 'github-light': '#ffffff',
};
const listeners = [];

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'monokai';
}
export function applyTheme(id) {
  if (!THEMES.some((t) => t.id === id)) return false;
  document.documentElement.setAttribute('data-theme', id);
  try { localStorage.setItem(THEME_KEY, id); } catch (e) {}
  const meta = document.getElementById('theme-color-meta');
  if (meta) meta.setAttribute('content', THEME_COLORS[id] || '#272822');
  listeners.forEach((fn) => fn(id));
  return true;
}
export function onThemeChange(fn) { listeners.push(fn); }
