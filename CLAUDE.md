# CLAUDE.md - Rules of Engagement

## Roles (strict separation)

**Claude (planning & verification agent) - this is you if you're reading this file in a chat/CLI session.**
- Plans phases and writes detailed implementation prompts for the implementing agent.
- Reviews and verifies code after each phase: reads the diff, checks it against the phase prompt, runs syntax checks (`node --check`), and reports issues.
- NEVER implements features directly. Do not write or edit `index.html`, `ide-shell.js`, `terminal.js`, `file-contents.js`, `styles.css`, `palette.js`, `theme.js`, or any feature code - even if asked to "move on to the next phase." Producing the prompt IS moving on to the next phase.
- May update this file and planning/verification docs only.

**Design agent (implementer).**
- Implements phases from the approved prompt, incrementally, pausing for review between increments as the prompt specifies.
- Does not change scope, architecture, or file structure beyond what the prompt says without flagging it first.
- Must NOT delete or overwrite CLAUDE.md when syncing - if your sync would remove it, restore it.

If an instruction seems to require Claude to implement, stop and confirm with Saurabh - the default answer is: write the prompt, verify the result, don't build.

## Project

A portfolio website styled as a VS Code-like IDE (Monokai, Dracula, Solarized Dark, GitHub Light). Vanilla HTML/CSS/JS ES modules, **no build step, no frameworks, no runtime transpilation** - deployed as static files on GitHub Pages.

Current structure:
- `index.html` - IDE shell markup (title bar, activity bar, sidebar, tab bar, status bar, terminal panel, command palette, theme menu)
- `ide-shell.js` - shell behavior: file tree, tabs, per-filetype renderers, hash routing, persistence, terminal panel plumbing, palette wiring, theme menu wiring
- `terminal.js` - everything inside the terminal panel: exported command REGISTRY (incl. real `theme` command), input loop, history, completion, easter eggs, `runInTerminal()` for the palette
- `palette.js` - Ctrl/Cmd+K command palette: fuzzy matcher, file + command providers (incl. 4 theme entries), recents
- `theme.js` - shared theme registry + apply/persist logic (`THEMES`, `applyTheme`, `getCurrentTheme`, `onThemeChange`); no dependency on the other three modules, so all can import it
- `livedata.js` - dependency-free live-data source registry (Codeforces, best-effort LeetCode, public-repo GitHub metadata), localStorage cache/TTL/rate-limit cooldown
- `file-contents.js` - single source of truth for ALL content
- `styles.css` - all styling; every theme color is a CSS custom property in `:root`, with `html[data-theme="…"]` override blocks for the other 3 themes

## Hard constraints (verify every phase against these)

1. Vanilla JS only. No frameworks, no build step, no runtime Babel/React. Static files must work on GitHub Pages as-is.
2. All content lives in `file-contents.js`. Zero duplicated content strings in feature modules.
3. All colors via CSS custom properties (`--*` in `:root`), with theme overrides only via `html[data-theme]` blocks - no selector churn elsewhere.
4. Real text content in the initial DOM where SEO matters; semantic HTML + ARIA roles.
5. Mobile (<768px) degrades gracefully - readability beats the IDE metaphor on small screens.
6. Heavy libraries rejected by default (e.g. no xterm.js); tiny hand-rolled solutions preferred.

## Phase status

- **Phase 1 - IDE shell**: ✅ implemented, verified.
- **Phase 2 - integrated terminal**: ✅ implemented, verified.
- **Phase 3 - command palette**: ✅ implemented, verified.
- **Phase 4 - theme switcher**: ✅ implemented, pending final verification. 4 themes (Monokai default, Dracula, Solarized Dark, GitHub Light) wired into settings gear menu, `theme` terminal command, palette `>theme` entries, and status bar; FOUC guard respects `localStorage` then `prefers-color-scheme`; `ide.theme.v1` persistence; ~150ms transition under `prefers-reduced-motion: no-preference`.
- **Phase 5 - live data** (GitHub/coding-profile APIs): ✅ implemented, verified 2026-07-28. `livedata.js` descriptor-based source registry, cached-or-static synchronous `get()`, 6h TTL, 403/x-ratelimit-reset cooldown with no retry loop, 5s AbortController timeout, stale-then-static fallback. `profiles` + `refresh` commands (async return handled via thenable detection). No stars/forks/watchers surfaced. GitHub Light `--comment` fix landed (#656d76). Outstanding: `repoStatus` values were set without running the link check - Saurabh to verify from a non-rate-limited IP.
- **Phase 5.1 - repo view content honesty**: ✅ implemented. Fabricated closed-GitHub-issue styling removed from the project repo view: `.issue-*` classes renamed to `.decision-*`, "Issues (closed)" heading → "Engineering Decisions", fake `#N` issue numbers and the purple GitHub closed-issue icon removed (neutral dot glyph + plain checkmark instead), dead `.issue-context` rule deleted. Card layout/label chips/green resolution border unchanged. Added a real, static "Track progress on GitHub →" link to `{repo}/issues` for `repoStatus === 'public'` projects only - no live issue count fetched. Reconciles the sentinel-engine contradiction (15 open issues vs. a page implying closed ones) without new data fetches.
- **Phase 6 - git-log experience view**: ✅ implemented. `experience/history.git` renders career history as a `git log --graph`-style commit graph: `highlights` restructured to `{type, scope, subject, body}` (subjects reviewed/approved before build; `body` = original text verbatim, YAML view visually unchanged). Desktop graph uses a 2-column box-drawing gutter, per-role branch colors from `--pink/--blue/--purple/--orange/--green`, deterministic 7-hex commit hashes (dimmed, non-linking), Capslock rendered as an unmerged `HEAD` branch. Rows are focusable/Enter-activatable, opening the role's `.yaml` tab. `git log` / `git log --oneline` / `git branch` / bare `git` added to the terminal registry (surfacing in the palette automatically) with tab completion. Mobile (<768px) collapses to a single-rule vertical timeline, same click targets, no horizontal scroll.
- **Phase 7 - polish backlog** (welcome typing, `?` shortcuts overlay, minimap, print stylesheet): ✅ implemented. Task 0 deduped the welcome view to one source (`index.html` canonical, captured via `outerHTML` at init); Ctrl/Cmd+Tab rebound to Ctrl/Cmd+Alt+Tab (kept working, misleading old hint removed). Typing animation uses a color-transparent-real-element + decorative aria-hidden overlay technique - real text is never emptied/appended, stays fully in the DOM/AT tree throughout; ~45ms/char ±10ms jitter, title then subtitle, once per session (`ide.welcome-typed.v1`), instant final state under `prefers-reduced-motion: reduce`. `?` overlay reuses palette's backdrop/dialog styling and focus-trap pattern, guarded against text-input focus and modifier keys; also a `shortcuts` REGISTRY command (auto-surfaces in palette). Minimap: absolutely-positioned overlay on `.editor-col` (≥1200px, `.code` views only - prose views render nothing), per-line proportional bars tinted from each line's first `tok-*` class, redrawn only on file/theme change, viewport rect synced on scroll; **click-to-scroll only, no drag** (per the prompt's stated fallback allowance). Print stylesheet: chrome/overlays/minimap hidden, forced light palette overrides regardless of active theme, line-number gutters hidden, `max-height`/`overflow` constraints removed so content paginates, `a[href^="http"]::after` expands URLs.

## Phases 8-14 (delivered 2026-08-25) - see PLAN.md for the full record

Implemented in one session at Saurabh's explicit instruction, which overrides the role separation
above for that work. The default remains: plan and verify, do not build.

New modules, all leaves or near-leaves so the graph stays acyclic:
`files.js` (canonical FILES/TREE/EXT_META - imports only file-contents.js),
`sim-queue.js`, `search.js`, `plainview.js`, `tour.js`.

New persistence keys: `ide.view.v1`, `ide.view-hint.v1`, `ide.tour.v1`.

`sim-queue.js` sizes off its **container**, not the viewport (`container-type: inline-size` plus
`@container (max-width: 620px)`), because it now also renders inside a split pane. Its worker rows
are flex-wrap, not a fixed grid: the old `grid-template-columns: 44px 84px minmax(0,1fr) 84px`
collapsed the task/fence column to 0px in any container under ~620px, hiding the fence token that
is the whole point of the demo. Do not reintroduce fixed column widths there.

`sim-queue.js` invariant, do not regress it: the lease lives on the **task**, not the worker.
An earlier draft keyed the reaper off each worker's lease, so a dead worker kept re-reaping a task
another worker legitimately owned - 95 spurious requeues and the fence check never fired. The store
is the authority on ownership; a failed worker's opinion does not count.
New shortcuts: Ctrl/Cmd+Shift+F (content search) and Ctrl/Cmd+\\ (split editor).
Ctrl/Cmd+K now excludes Shift so it does not collide with search.

Default landing file is `readme`, not `about`. `setActive()` coerces an unknown id to `readme`,
and the persisted-state restore falls back to it: filtering saved tabs can empty the list when a
file no longer exists (a post unpublished, a file renamed), and `openTabs[-1]` is `undefined`,
which used to throw on `fileById`. Keep both guards.

**Deliberate, documented exception to hard constraint 2:** `index.html` carries a `<noscript>`
condensed résumé. The whole site is client-rendered, so a crawler that does not run JS previously
saw only "Tree loads in increment 2 …". This is a genuine no-JS fallback, not hidden text, and it
restates summary-level content only. Do not "fix" it by deleting it; keep it in sync by hand when
roles change.

**Posts ship as drafts.** `posts[].status` is `"draft"` for all three; `files.js` filters them out
of the tree entirely. An outline visible on a live hiring portfolio is worse than no post. Flip to
`"published"` once the prose is written.

## Phase 7 - open issue (RESOLVED 2026-08-25)

Fixed. The `@media print` background-stripping rule targeted `.issue-resolution`, a class that no longer existed - it was renamed to `.decision-resolution` during the Engineering Decisions honesty fix. Result: the green resolution blocks on project pages keep their tinted background when printed. Fix: replace `.issue-resolution` with `.decision-resolution` in that selector list. (`.tag-outline` in the same list is also dead - harmless, remove if convenient.)

## Phase 5.2 - LeetCode live rating fix (resolved)

Fixed one defect in `livedata.js`: the `'leetcode'` source pointed at `leetcode-stats-api.herokuapp.com`, which never returns a `rating` field (only solved-problem counts), so the live rating line has been silently dead since Phase 5 shipped - every fetch parsed to `null` and fell through to the static value. Direct calls to LeetCode's own `leetcode.com/graphql` endpoint were confirmed not viable (no CORS allowance for third-party origins, verified by curl). Switched to the community-run `alfa-leetcode-api.onrender.com/{handle}/contest` (verified `access-control-allow-origin: *`, tested against the real handle). `rating` is deliberately computed as the max across `contestParticipation[].rating`, not the live `contestRating` field, so it can't show a number below the static "Max rating" label after a rating dip - same class of self-contradiction Phase 5.1 fixed elsewhere. `host`/cooldown key updated to match. No changes to `ide-shell.js` or `terminal.js` - the `'leetcode'` id and consumed shape (`rating`, `totalSolved`) were kept compatible; `totalSolved` is now explicitly `null` (endpoint doesn't provide it), which the existing ternary in `ide-shell.js` already renders as "don't show."

Follow-up content updates in `file-contents.js` (same session, static values were stale against the now-live number): `codingProfiles` LeetCode `statValue` corrected from `"1813"` to `"1876"` (real current max rating, confirmed via the live source above - the old figure predates recent contests) so the static and live numbers agree instead of contradicting each other; `achievements` gained one entry for the LeetCode Knight contest badge (top ~5% of ranked users, confirmed via the same API's `contestBadges`/`contestTopPercentage` fields). Also added the actual Knight badge icon (hotlinked from `leetcode.com/static/images/badges/knight.png`, discovered via LeetCode's GraphQL `badge { icon }` field, no hotlink protection - verified by curl) next to the LeetCode name on the profile card; `codingProfiles` entries can now optionally carry a `badge: { name, icon }` field, rendered generically in `profileCard()` in `ide-shell.js`, plus one new `.profile-badge-icon` rule in `styles.css`.

**Separate, pre-existing defect found and fixed while in this area (not introduced by the above):** in `ide-shell.js`'s `profileCard()`, the Codeforces live line paired `maxRating` with `d.value.rank` - but `rank` is the title for the *current* rating, not the max, so a card could show e.g. "(max 1527, newbie)" when 1527 is actually "specialist" and "newbie" belongs to the current (lower) rating. Fixed to pair `maxRating` with `d.value.maxRank` (already returned by the `'codeforces'` source's `parse()`, just never consumed). Same class of current-vs-max mislabeling as the LeetCode fix above, just in the other live source. No changes to `livedata.js` for this one - the correct field already existed, only the render was wrong.

## Phase 6 defect (resolved)

Fixed two defects in the git-log graph view (`ide-shell.js`):
1. Mobile row activation was dead: `renderEditor()`'s handler selector only matched `.graph-row[data-open]`, but `renderGraphRowMobile()` emits `.timeline-item` rows - below 768px, tapping/Enter on a timeline row did nothing. Widened the selector to `.graph-row[data-open], .timeline-item[data-open]`.
2. `.graph-row-branch` connector rows sat inside a `role="list"` container as non-`listitem` children (an a11y violation). Added `role="presentation"` to those rows in `renderGraphRow()`.
No other changes; no content changes in `file-contents.js`.

## Verification checklist (run after each phase)

1. `node --check` on every JS module; confirm no circular imports.
2. Diff review against the phase prompt: every requirement present, nothing out of scope.
3. Hard constraints 1–6 above all hold.
4. State/persistence keys don't collide (`ide.state.v1`, `ide.term.v1`, `ide.term.history.v1`, `ide.palette.v1`, `ide.theme.v1`).
5. Keyboard shortcuts don't fight the browser or each other.
6. Mobile behavior implemented, not just untouched.
7. Report findings as: blocking issues / non-blocking issues / content debt.

## Content decisions (settled - do NOT flag these)

- `swe.saurabh.mishra@gmail.com` is Saurabh's canonical portfolio email. It is correct everywhere it appears. Do not suggest changing it.

## Repo-link health (verifier-authored - DO NOT DELETE ON SYNC. Re-checked 2026-07-28)

**Correction (2026-07-28):** an earlier entry here claimed `redis-from-scratch` and `CtRlbudget` returned 404. That was WRONG - the verification agent had exhausted the unauthenticated GitHub rate limit (60/hr/IP), and every subsequent empty response was a 403, not a 404. `redis-from-scratch` is confirmed public by Saurabh. Lesson for any agent checking repo health: call `https://api.github.com/rate_limit` FIRST and confirm `remaining > 0`, or the results are meaningless.

| repo | API result |
|---|---|
| `CosmicSaaurabh/sentinel-engine` | **PUBLIC** (verified pre-rate-limit) - `language: null`, `description: null`, 0 stars, docs-only (23KB), **15 OPEN issues** |
| `CosmicSaaurabh/redis-from-scratch` | **PUBLIC** (confirmed by Saurabh) |
| all others | unverified - run the one-liner below from a non-exhausted IP |

```
for r in CosmicSaaurabh/sentinel-engine CosmicSaaurabh/redis-from-scratch CosmicSaaurabh/splitwise-app CosmicSaaurabh/WediscussCp CosmicSaaurabh/CtRlbudget Softogram/mvc-ecomm-net; do printf "%-40s %s\n" "$r" "$(curl -s -o /dev/null -w '%{http_code}' https://api.github.com/repos/$r)"; done
```

200 = public → `repoStatus: "public"`. 404 = private/renamed → `repoStatus: "private"` or `"none"`.

**Resolved 2026-07-28 (Phase 5.1):** the fabricated "Issues (closed)" styling is gone - see Phase status above. sentinel-engine's 15 open issues are no longer contradicted by the page; the section now links out to them as real, static GitHub links.

## Known content debt (Saurabh fixes these; agents should flag, not fix)

- ~~"Sauraabh" spelling~~ - **RESOLVED 2026-08-25: it is a typo. Correct spelling is "Saurabh" everywhere.** Fixed in Phase 8.4 across title, welcome view, `about.md`, `terminal.js` strings, README, and the résumé asset filename. The GitHub handle `CosmicSaaurabh` and all `github.com/...` URLs are real addresses and must NOT be changed.
- Résumé PDF in `assets/` must match the latest résumé version.
- Ctrl/Cmd+Tab is reserved by browsers and won't reach the page in most of them - welcome hint overpromises; consider Ctrl+Alt+Tab or accept it silently failing.

## Resolved in Phase 4

- Task 0 debt: `runInTerminal` history-order fix, busy/vim-guard on `runInTerminal`, matrix-rain theme-aware positioning fix, palette recents dedupe.
- New tokens `--badge-bg/--badge-text/--backdrop/--shadow`; all 4 prior hardcoded-color offenders route through them.
- FOUC-guard inline script in `<head>` (localStorage → `prefers-color-scheme` fallback) sets `data-theme` before paint; Monokai is pixel-identical to before (root default, zero selector churn).
- Dracula and Solarized Dark token blocks added (Solarized Dark's `--comment` deliberately brightened past canonical base01 for AA on body text).
- GitHub Light token block added with a contrast pass (`--yellow` a dark amber, not pale; `--comment` darkened past GitHub's own dark-mode gray).
- All four entry points wired: settings gear opens an anchored `role="menu"` of `menuitemradio` items (arrow-key nav, Esc, click-outside, focus return); `theme`/`theme <name>` terminal command lists/switches/validates with tab completion; palette's `>` mode includes 4 static `theme: <Name>` entries routed through `runInTerminal`; status bar label is now live and clickable (opens the same menu). `theme.js` is the shared, dependency-free module all three import.
- `ide.theme.v1` persistence; explicit choice always wins over `prefers-color-scheme` afterward; `<meta name="theme-color">` updates on switch.

## Resolved in Phase 3 Task 0 (carried forward)

- `ls <file>` on a valid file lists it instead of erroring.
- Consecutive duplicate history entries are deduped on push.
- Ctrl/Cmd+` also accepts `e.code === 'Backquote'`.
- `open <file>` on mobile closes the fullscreen terminal panel after success.
- `rm -rf /` timed sequence guarded by a busy flag.
- Vim trap preventDefaults Tab.
- Bare/other `rm` prints a permission-denied joke instead of "command not found".
- `REGISTRY` is module-level and exported from `terminal.js`; handlers take `(args, ctx)`.
- Sync process instructed to preserve CLAUDE.md/PLAN.md at their exact paths every increment.
