# PLAN.md — Portfolio Roadmap

Maintained by the planning/verification agent. Implementation happens via approved phase prompts only (see CLAUDE.md for roles, constraints, and per-phase verification records).

## Delivered

| Phase | What shipped |
|---|---|
| 1 | IDE shell — activity bar, file tree, tabbed editor with per-filetype renderers, title/status bars, hash routing, localStorage persistence, mobile collapse |
| 2 | Integrated terminal — resizable panel, command registry, history, tab completion, easter eggs (sudo hire-me, vim trap, rm -rf, konami matrix) |
| 3 | Command palette — Ctrl/Cmd+K, fuzzy matcher, file mode + `>` command mode over the shared REGISTRY, recents, full a11y |
| 4 | Theme switcher — Monokai/Dracula/Solarized Dark/GitHub Light, all AA-checked; gear menu + `theme` command + palette + live status bar; FOUC guard |
| 5 | Live data — `livedata.js` descriptor sources, 6h TTL cache, rate-limit cooldown, static-always-wins fallback; `profiles` + `refresh` commands |
| 5.1 | Repo-view content honesty — fabricated "Issues (closed)" replaced with "Engineering Decisions"; real issues link for public repos |
| 6 | Career as `git log --graph` — `experience/history.git`, branch/merge graph, `git log`/`--oneline`/`branch` commands, mobile timeline |
| 7 | Polish — welcome typing animation, `?` shortcuts overlay, decorative minimap (≥1200px), print stylesheet, welcome-view dedupe, Ctrl+Alt+Tab rebind |

Open issue from Phase 7 is tracked at the top of CLAUDE.md.

---

## Next up — Tier 1: ship readiness (do before sharing the URL anywhere)

These are the only things genuinely blocking a public link.

- **Favicon + Open Graph/Twitter meta tags + preview image.** Today the link previews as a bare URL — no title, image, or description. Highest-impact item on this list the moment the URL goes on a résumé or LinkedIn.
- **`404.html`** for GitHub Pages (hash routing mostly avoids it, but direct-path typos land nowhere).
- **Font loading.** Google Fonts currently load render-blocking; self-host or preload.
- **Lighthouse pass** — record performance / a11y / SEO scores in CLAUDE.md.
- **Content debt** (Saurabh's calls, listed in CLAUDE.md): the "Sauraabh" spelling across title/welcome/content/résumé filename; verify the six `repoStatus` values from a non-rate-limited IP; keep the résumé PDF in `assets/` current.

## Tier 2 — differentiators (highest return on effort after Tier 1)

The IDE shell is now the strongest part of the site; content is the bottleneck.

- **`posts/` folder with 2–3 technical write-ups.** Raw material already exists in the Sentinel Engine design docs (why `SKIP LOCKED` beats advisory locks; how fencing tokens make a zombie worker's late writes harmless). A portfolio that *argues* about distributed systems beats one that lists them — and these are reusable in interviews and on LinkedIn.
- **Embedded interactive systems demo** — a small Raft leader-election or lease-expiry visualization. Likely the most memorable thing on the site for an engineer reviewer, and doubles as proof the mechanism is understood.
- **Live build-progress panel for Sentinel Engine.** `livedata.js` already exists; the repo has 15 open issues and a phased task breakdown. Turns "unfinished project" into "visibly active project" — honest and more compelling than a static claim.

## Tier 3 — IDE features with real utility

- **Global content search (Ctrl+Shift+F)** across all files. The one genuine functional gap: the palette jumps to files but can't find "Raft" or "Kafka" *inside* them, which is exactly how a recruiter skims.
- Breadcrumbs above the editor; split view. Would look right, change little.

## Polish backlog (bundle into any phase)

- `shortcuts` overlay exists; keep it in sync if bindings change.
- Print stylesheet exists; re-test after any card/class rename.

## Explicitly rejected (so nobody re-proposes them)

- Frameworks/build steps (React, bundlers) — vanilla is a hard constraint.
- xterm.js or other heavy terminal libs.
- Analytics/trackers.
- Sound effects on the easter eggs.
- Stars/forks/watchers anywhere in the UI — they're 0 on personal projects and actively harm the impression.
