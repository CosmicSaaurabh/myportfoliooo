// livedata.js — dependency-free, like theme.js. Decorates static content with live API data;
// static in file-contents.js always wins on any failure. No secrets, no auth, no retry-loops.

import { codingProfiles, projects } from './file-contents.js';

const CACHE_KEY = 'ide.livedata.v1';
const COOLDOWN_KEY = 'ide.livedata.cooldown.v1';
const FETCH_TIMEOUT_MS = 5000;

const listeners = [];
function notify(id, value) { listeners.forEach((fn) => fn(id, value)); }
export function onLiveDataChange(fn) { listeners.push(fn); }

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) { return {}; }
}
function writeCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
}
function readCooldown() {
  try { return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}'); } catch (e) { return {}; }
}
function writeCooldown(obj) {
  try { localStorage.setItem(COOLDOWN_KEY, JSON.stringify(obj)); } catch (e) {}
}
function isCoolingDown(host) {
  const cd = readCooldown();
  const until = cd[host];
  return typeof until === 'number' && Date.now() < until;
}
function setCooldown(host, resetEpochSeconds) {
  const cd = readCooldown();
  cd[host] = resetEpochSeconds ? resetEpochSeconds * 1000 : Date.now() + 60 * 60 * 1000;
  writeCooldown(cd);
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

/* ---------- registry: adding a source = adding a descriptor, no new plumbing ---------- */
// Each descriptor: { id, url, ttl (ms), parse(json) => value, fallback, host (for rate-limit cooldown) }
const SOURCES = {};
export function registerSource(descriptor) { SOURCES[descriptor.id] = descriptor; }

/* ---------- synchronous read: cached-or-static, never blocks render ---------- */
export function get(id) {
  const src = SOURCES[id];
  if (!src) return undefined;
  const cache = readCache();
  const entry = cache[id];
  if (entry) return { value: entry.value, live: true, updatedAt: entry.ts, stale: Date.now() - entry.ts > src.ttl };
  return { value: src.fallback, live: false, updatedAt: null, stale: false };
}

/* ---------- async refresh: fetch fresh values respecting TTL + rate-limit cooldown ---------- */
export async function refresh(opts = {}) {
  const { force = false, only = null } = opts;
  const cache = readCache();
  const results = {};
  const ids = only || Object.keys(SOURCES);

  await Promise.all(ids.map(async (id) => {
    const src = SOURCES[id];
    if (!src) { results[id] = 'failed'; return; }
    const entry = cache[id];
    const fresh = entry && Date.now() - entry.ts < src.ttl;
    if (fresh && !force) { results[id] = 'cached'; return; }
    if (src.host && isCoolingDown(src.host)) { results[id] = 'rate-limited'; return; }

    try {
      const res = await fetchWithTimeout(src.url);
      if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
        const reset = Number(res.headers.get('x-ratelimit-reset'));
        if (src.host) setCooldown(src.host, reset);
        results[id] = 'rate-limited';
        return;
      }
      if (!res.ok) { results[id] = entry ? 'cached' : 'failed'; return; }
      const json = await res.json();
      const value = src.parse(json);
      if (value === undefined || value === null) { results[id] = entry ? 'cached' : 'failed'; return; }
      cache[id] = { value, ts: Date.now() };
      results[id] = 'updated';
      notify(id, { value, live: true, updatedAt: cache[id].ts, stale: false });
    } catch (e) {
      console.debug(`livedata: ${id} fetch failed`, e);
      results[id] = entry ? 'cached' : 'failed';
    }
  }));

  writeCache(cache);
  return results;
}

/* ---------- default sources ---------- */
const SIX_HOURS = 6 * 60 * 60 * 1000;

function ownerRepoFromUrl(url) {
  const m = String(url || '').match(/github\.com\/([^/]+)\/([^/]+)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null;
}

const cfProfile = codingProfiles.find((p) => p.name === 'Codeforces');
if (cfProfile) {
  const handleMatch = cfProfile.url.match(/profile\/([^/]+)/);
  const handle = handleMatch ? handleMatch[1] : null;
  if (handle) {
    registerSource({
      id: 'codeforces',
      url: `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      ttl: SIX_HOURS,
      host: 'codeforces.com',
      parse: (json) => {
        if (json.status !== 'OK' || !json.result || !json.result[0]) return null;
        const u = json.result[0];
        return { rating: u.rating, maxRating: u.maxRating, rank: u.rank, maxRank: u.maxRank };
      },
      fallback: null,
    });
  }
}

const lcProfile = codingProfiles.find((p) => p.name === 'LeetCode');
if (lcProfile) {
  const handleMatch = lcProfile.url.match(/leetcode\.com\/([^/]+)/);
  const handle = handleMatch ? handleMatch[1] : null;
  if (handle) {
    // Best-effort community endpoint — no official LeetCode API exists. Any failure (CORS,
    // 404, shape change) silently falls through to the static value; never a hard dependency.
    registerSource({
      id: 'leetcode',
      url: `https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(handle)}`,
      ttl: SIX_HOURS,
      host: 'leetcode-stats-api.herokuapp.com',
      parse: (json) => {
        if (!json || json.status === 'error') return null;
        if (typeof json.ranking !== 'number' && typeof json.rating !== 'number') return null;
        return { rating: json.rating ?? null, ranking: json.ranking ?? null, totalSolved: json.totalSolved ?? null };
      },
      fallback: null,
    });
  }
}

projects.forEach((p) => {
  if (p.repoStatus !== 'public' || !p.github) return;
  const or = ownerRepoFromUrl(p.github);
  if (!or) return;
  registerSource({
    id: `github-repo-${p.id}`,
    url: `https://api.github.com/repos/${or.owner}/${or.repo}`,
    ttl: SIX_HOURS,
    host: 'api.github.com',
    parse: (json) => (json && json.pushed_at ? { pushedAt: json.pushed_at } : null),
    fallback: null,
  });
  registerSource({
    id: `github-langs-${p.id}`,
    url: `https://api.github.com/repos/${or.owner}/${or.repo}/languages`,
    ttl: SIX_HOURS,
    host: 'api.github.com',
    parse: (json) => (json && typeof json === 'object' && Object.keys(json).length ? json : null),
    fallback: null,
  });
});
