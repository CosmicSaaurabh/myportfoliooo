# PLAN.md — Portfolio Roadmap

Maintained by the planning/verification agent. Implementation happens via approved phase prompts only (see CLAUDE.md for roles). Phases 1–2 are done and verified.

## Phase 3 — Command palette (next)

Ctrl/Cmd+K opens a VS Code-style fuzzy-search palette. Two modes like VS Code: plain query = jump to files (opens editor tabs); `>` prefix = run terminal commands (from the shared REGISTRY, echoed into the terminal so there's one history). Keyboard-first: arrows/Enter/Esc, match-highlighting, recent-items ranking.

**Task 0 (prerequisite + debt):** lift `REGISTRY` out of `initTerminal()` to an exported module-level structure, and clear the Phase 2 punch list from CLAUDE.md (ls-file bug, history dedupe, Backquote fallback, mobile open-overlay close, rm busy-guard, vim Tab escape).

## Phase 4 — Theme switcher

Promoted from "polish" to its own phase — it's already stubbed in two places (`theme` command, settings gear) and the CSS-variable architecture makes it cheap. 3–4 real editor themes: Monokai (default), Dracula, Solarized Dark, one light theme (GitHub Light). Wire it into: the settings gear, the `theme <name>` terminal command, and the palette (`>theme`). Persist choice; respect `prefers-color-scheme` for first visit default; status bar shows active theme.

## Phase 5 — Live data (GitHub + coding profiles)

Self-updating instead of hardcoded: GitHub pinned repos + contribution data, Codeforces rating (official public API), LeetCode rating. Render project files' README from their repos once public, so the portfolio tracks the actual code.

**Reality constraints to design around (verifier will check these):**
- Everything client-side static — no server, no secrets. Unauthenticated GitHub API = 60 req/hr/IP: cache responses in localStorage with a TTL (e.g. 6h), and always fall back to the static data in `file-contents.js` when offline/rate-limited/failed. Live data decorates the static content, never replaces it as the source of truth.
- LeetCode has no official public API (community endpoints are scrape-based and break) — treat LeetCode as best-effort with permanent static fallback, or skip it.
- The GitHub contribution graph has no official JSON API — either render from the events API (approximation), embed the SVG image endpoints commonly used for this, or drop the graph and show pinned repos + language stats, which ARE reliable.

## Phase 5.1 — Repo view content honesty (done)

Removed the fabricated closed-GitHub-issue framing from the project repo view (renamed to "Engineering Decisions", stripped fake issue numbers and the GitHub-specific icon). Added a real static "Track progress on GitHub →" link to `{repo}/issues` for public repos only.

## Phase 6 — Experience as git history

Replace/augment the experience view with a rendered `git log --graph`: each role a branch, achievements as conventional commits (`perf(sdk): sustain 10K ops/sec with zero failures`). Data still from `file-contents.js` (add a `commitType` field per highlight rather than parsing). Toggle between git-log view and the existing YAML view — don't delete a working renderer.

## Polish backlog (small items, bundle into any phase)

- ~~Typing animation on the welcome view's title line with blinking block cursor (respect prefers-reduced-motion).~~ — done in Phase 7.
- ~~Decorative minimap strip on wide screens (≥1200px), pure CSS/canvas from the active file's line data.~~ — done in Phase 7.
- ~~Keyboard-shortcuts help: `?` overlay or a `shortcuts` terminal command.~~ — done in Phase 7.
- ~~Print stylesheet: printing any view produces something readable (recruiters do print).~~ — done in Phase 7.
- Favicon + Open Graph/Twitter meta tags + a social preview image (matters the moment this link goes on a résumé).
- 404.html for GitHub Pages (hash routing mostly avoids it, but direct-path typos land somewhere).
- Lighthouse pass: performance + a11y + SEO scores recorded in CLAUDE.md after each phase.

## Phase 7 — Polish backlog (done)

Welcome-view dedupe (Task 0), typing animation (mask/overlay technique, real text always in DOM), `?` shortcuts overlay + `shortcuts` command, decorative click-to-scroll minimap on `.code` views ≥1200px, and a print stylesheet forcing light rendering with chrome hidden. See CLAUDE.md Phase status for the full breakdown.

## Content debt (Saurabh, not agents — from CLAUDE.md)

- Resolve "Sauraabh" spelling everywhere (title, welcome, content, résumé asset filename) — decide and make consistent.
- Keep the résumé PDF in `assets/` current.
- Résumé references portfolio? Add the portfolio URL to the résumé header once Phase 3+ ships.

## Explicitly rejected (so nobody re-proposes them)

- Frameworks/build steps (React, bundlers) — vanilla is a hard constraint.
- xterm.js or other heavy terminal libs.
- Analytics/trackers — keep the site clean.
- Sound effects on the easter eggs.
