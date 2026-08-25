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
      // 403 + exhausted budget is GitHub's shape; 429 is the standard one (the community
      // LeetCode wrapper returns it). Without cooling down on 429 we re-hit a host that has
      // already told us to stop, on every single page load.
      const ghExhausted = res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0';
      if (ghExhausted || res.status === 429) {
        let until = Number(res.headers.get('x-ratelimit-reset'));
        if (!until) {
          // Retry-After is either delta-seconds or an HTTP date.
          const ra = res.headers.get('retry-after');
          const secs = Number(ra);
          if (ra && Number.isFinite(secs)) until = Math.floor(Date.now() / 1000) + secs;
          else if (ra) { const d = Date.parse(ra); if (!Number.isNaN(d)) until = Math.floor(d / 1000); }
        }
        if (src.host) setCooldown(src.host, until);
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
    // Best-effort community endpoint — no official LeetCode API exists, and LeetCode's own
    // GraphQL endpoint (leetcode.com/graphql) has no CORS allowance for third-party origins,
    // so it cannot be called from a static site. This wrapper does send
    // access-control-allow-origin: *. Any failure (CORS, 404, shape change, Render free-tier
    // cold start exceeding FETCH_TIMEOUT_MS) silently falls through to the static value —
    // never a hard dependency. `rating` is deliberately the max across contest history, not
    // the live `contestRating`, so it stays consistent with the static "Max rating" label in
    // file-contents.js instead of contradicting it after a rating dip.
    registerSource({
      id: 'leetcode',
      url: `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(handle)}/contest`,
      ttl: SIX_HOURS,
      host: 'alfa-leetcode-api.onrender.com',
      parse: (json) => {
        if (!json || typeof json.contestRating !== 'number') return null;
        const history = Array.isArray(json.contestParticipation) ? json.contestParticipation : [];
        const maxRating = history.reduce(
          (max, c) => (typeof c.rating === 'number' && c.rating > max ? c.rating : max),
          json.contestRating
        );
        return {
          rating: maxRating,
          currentRating: json.contestRating,
          ranking: typeof json.contestGlobalRanking === 'number' ? json.contestGlobalRanking : null,
          attended: typeof json.contestAttend === 'number' ? json.contestAttend : null,
          totalSolved: null,
        };
      },
      fallback: null,
    });
  }
}

// Only the featured projects are registered. Unauthenticated GitHub allows 60 requests per
// hour per IP; registering all six meant 12 calls on every cold load, so a handful of visitors
// behind one office NAT exhausted the budget and everyone after them saw static data only.
projects.filter((p) => p.featured).forEach((p) => {
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
