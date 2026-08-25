# PLAN.md - Portfolio Roadmap

Maintained by the planning/verification agent.
Implementation happens via approved phase prompts only (see CLAUDE.md for roles, constraints, and per-phase verification records).

## Delivered

| Phase | What shipped |
|---|---|
| 1 | IDE shell - activity bar, file tree, tabbed editor with per-filetype renderers, title/status bars, hash routing, localStorage persistence, mobile collapse |
| 2 | Integrated terminal - resizable panel, command registry, history, tab completion, easter eggs (sudo hire-me, vim trap, rm -rf, konami matrix) |
| 3 | Command palette - Ctrl/Cmd+K, fuzzy matcher, file mode + `>` command mode over the shared REGISTRY, recents, full a11y |
| 4 | Theme switcher - Monokai/Dracula/Solarized Dark/GitHub Light, all AA-checked; gear menu + `theme` command + palette + live status bar; FOUC guard |
| 5 | Live data - `livedata.js` descriptor sources, 6h TTL cache, rate-limit cooldown, static-always-wins fallback; `profiles` + `refresh` commands |
| 5.1 | Repo-view content honesty - fabricated "Issues (closed)" replaced with "Engineering Decisions"; real issues link for public repos |
| 6 | Career as `git log --graph` - `experience/history.git`, branch/merge graph, `git log`/`--oneline`/`branch` commands, mobile timeline |
| 7 | Polish - welcome typing animation, `?` shortcuts overlay, decorative minimap (≥1200px), print stylesheet, welcome-view dedupe, Ctrl+Alt+Tab rebind |
| 5.2 | LeetCode live rating fix - source switched to `alfa-leetcode-api.onrender.com`; `rating` derived as max across contest history |
| 5.3 | Codeforces max/current rank mislabel fix - now uses `maxRank` |
| 5.4 | LeetCode Knight contest badge on the profile card |
| - | Favicon - `favicon.svg` (SM monogram) + `favicon.ico` fallback |
| - | **Upgrade program below, delivered 2026-08-25** |
| 8 | Ship-blockers - mobile sidebar overlap (P0), fabricated CI badges removed, three drifting file registries collapsed into `files.js`, spelling corrected to Saurabh, OG/Twitter/JSON-LD/canonical + 1200x630 preview image, `404.html`/`robots.txt`/`sitemap.xml`/`.nojekyll`, self-hosted variable fonts, GitHub API fan-out cut from 12 calls to 4 |
| 9 | Plain view - one-click flat résumé page, `?view=plain` shareable, `ide.view.v1` persistence, one-time mobile hint |
| 10 | Landing `README.md` + first-visit guided tour (4 steps desktop / 2 mobile, focus-trapped, reduced-motion aware) |
| 11 | `projects/sentinel-engine.sim` - interactive durable-queue failure simulation. Three failure modes (kill / partition / stall), lease heartbeat, task-owned leases, reaper, fencing tokens. All three verified end-to-end to converge on a fenced write with duplicates at zero |
| 12 | Content search - Ctrl/Cmd+Shift+F across every file with line context and highlighting |
| 13 | `posts/` infrastructure + three drafted outlines (ship as `status: "draft"`, invisible until published) |
| 14 | Flavour - `interview.md`, visible `hire` command, `sim`/`interview`/`posts`/`plain`/`npm`/`git blame`/`git diff HEAD~1`, breadcrumbs, split view (Ctrl/Cmd+\\), help derived from the registry |

---

# Upgrade program (delivered 2026-08-25) - "make a hiring manager want to talk to me"

## Context

The IDE shell is finished and genuinely good.
A live walkthrough of the deployed site confirms the strongest surfaces are `experience/history.git` (career as a commit graph) and the project repo views (badges, metric tiles, ASCII architecture, Engineering Decisions cards).
Those already clear the bar for an engineering reviewer.

Three things are holding the site back, and none of them are the shell.

**It is broken on mobile.**
The closed sidebar overlaps the editor, so every line of text loses its first ~4 characters.
Recruiters open links on phones. This is a P0.

**It serves one audience.**
An engineering manager is delighted; an HR screener sees a file tree and prose with no obvious résumé or contact and bounces.
Both audiences have to be served, and the decision taken is a plain-view toggle rather than compromising the IDE.

**It asserts depth instead of demonstrating it.**
The content claims "zero duplicate execution" and "<2s leader failover".
An interactive simulation that lets a reviewer *kill a worker and watch the invariant hold* is the single most memorable thing this site could contain, and it doubles as interview rehearsal.

Confirmed decisions driving this plan: plain-view toggle (not IDE-only), Sentinel durable-queue simulation first, Saurabh writes the posts and agents scaffold them, and the spelling is corrected to **Saurabh** everywhere.

## Sequencing (as executed)

Phases 8 and 9 are the ones that change hiring outcomes.
Phase 11 is the one people remember.
Do not start Phase 11 before Phase 8 ships - a broken mobile layout undoes everything downstream.

---

## Phase 8 - Ship-blockers

Nothing below is optional before the URL goes on a résumé or LinkedIn.

### 8.1 Mobile sidebar overlap (P0, one-line fix)

`styles.css:352` - `.sidebar{position:fixed; left:52px; width:240px; transform:translateX(-100%)}`.
`translateX(-100%)` moves it 240px, so from `left:52px` it lands at x −188 to **+52**, painting its right 52px on top of the editor column.
Verified live at 390px: `.sidebar` rect is `{left:-188, right:52}` while `.editor-col` starts at 0.

Fix the closed state to `transform: translateX(calc(-100% - 52px))`, leaving `.sidebar.open{transform:translateX(0)}` alone.
The activity bar is already correct (`left:0`), so only this one declaration changes.

Verification: at 390px on a fresh load, `document.querySelector('.sidebar').getBoundingClientRect().right <= 0`, and the `about.md` H1 reads "Saurabh Mishra" with no clipped glyph.
Re-check with the sidebar opened and closed via the hamburger, in all four themes.

### 8.2 Remove the fabricated CI badges

`ide-shell.js:380` hardcodes `build: passing` and `coverage: tested` on **every** project regardless of reality.
No CI exists in any of these repos.
This is the same class of fabricated-GitHub-signal problem Phase 5.1 was created to fix, and it is worse - a reviewer who clicks through to an empty Actions tab discounts every other claim on the page.

Delete both badges.
The repo view already surfaces two signals that are real and live: `updated Nd ago` from `pushedAt` and the language-breakdown bar.
Those stay.

If a real badge is wanted later, the honest route is to add a genuine GitHub Actions workflow to `sentinel-engine` and link its real badge - a separate task in that repo, not this one.

### 8.3 Collapse the three drifting file registries

The same file list is declared independently in three modules and has already drifted:

- `ide-shell.js:13` - 16 files, complete
- `terminal.js:18` - 16 files, complete
- `palette.js:14` - **14 files, missing `profiles.md` and `experience/history.git`**

So Ctrl/Cmd+K cannot find the git-graph career view or the coding profiles - arguably the two most distinctive pages on the site.
`palette.js`'s `EXT_GLYPH` also has no `git` key, so adding the entry naively would render `undefined`.
Separately, `terminal.js`'s bare `ls` hardcodes its root listing and omits `profiles.md`, contradicting its own `FILES` array.

Extract the canonical `FILES` / `TREE` derivation and the `EXT_GLYPH` map into a new leaf module (`files.js`) that imports only `file-contents.js`, then import it from all three consumers.
`file-contents.js` is already a leaf, so this keeps the dependency graph acyclic.
This is the one structural change in Phase 8 and it prevents the whole class of bug rather than patching one instance.

### 8.4 Spelling - "Sauraabh" → "Saurabh"

15 occurrences across `index.html` (title, description, titlebar, welcome H2, résumé href), `file-contents.js` (about H1, résumé link, `resumeHref`), `terminal.js` (`whoami`, `help`, `sudo hire-me`), `README.md`, and the asset filename `assets/Sauraabh_Mishra_Resume.pdf` → `assets/Saurabh_Mishra_Resume.pdf`.

Do **not** touch the GitHub handle `CosmicSaaurabh` or any `github.com/...` URL - those are real addresses.

While in this area, fix a related correctness bug: `ide-shell.js:406` renders the repo owner as a hardcoded `sauraabh /`, but the real owners are `CosmicSaaurabh` and, for the e-commerce project, `Softogram`.
Derive the owner from `p.github` using the existing `ownerRepoFromUrl()` helper in `livedata.js`.

`index.html:57` also hardcodes the résumé path instead of using `resumeHref`; set it from JS at init so there is one source.

### 8.5 Social preview, SEO, and crawlability

The single highest-leverage item here is Open Graph.
Today the link previews as a bare URL in LinkedIn, Slack, WhatsApp, and email - which is exactly where a recruiter will paste it.

- `assets/og-image.png` at 1200×630, hand-authored to mirror the site: Monokai surface, name, "Backend Engineer - Distributed Systems", three metrics, and the git-graph motif. Author as SVG, convert once, commit the PNG.
- Full `og:` and `twitter:card` tag set, plus `<link rel="canonical">`.
- JSON-LD `Person` schema (name, jobTitle, worksFor, alumniOf, sameAs → GitHub/LinkedIn/LeetCode).
- `404.html`, `robots.txt`, `sitemap.xml`, and `.nojekyll` (the last one is a latent GitHub Pages trap, not currently biting).

**Crawlability tension, and how it is resolved.**
The entire site is client-rendered; a crawler that does not run JS sees the title, the description, and the literal string `Tree loads in increment 2 …`.
Hard constraint 2 says all content lives in `file-contents.js`, so the fix cannot be "paste the résumé into index.html".

Resolution: Phase 9's plain view carries a **condensed** static block in `index.html` - hero, role titles with companies and dates, and the skills keyword list, roughly 15 lines.
That is what SEO actually needs; the full plain view stays JS-rendered from `file-contents.js`.
This is a deliberate, documented exception to hard constraint 2 covering summary-level content only, and it must be recorded in CLAUDE.md so a later agent does not "fix" it.

### 8.6 Font loading

`index.html:13` loads a render-blocking Google Fonts stylesheet for 8 weights, and preconnects to `fonts.googleapis.com` but not `fonts.gstatic.com` - so the preconnect does roughly nothing.

Self-host four woff2 files (JetBrains Mono 400/600, Inter 400/600) under `assets/fonts/` with `font-display: swap`.
This removes a third-party runtime dependency entirely, which is the more robust and maintainable answer than patching the preconnect.
Confirm the four weights cover every `font-weight` used in `styles.css` before dropping the other four.

### 8.7 Small correctness and content fixes

Bundle these into Phase 8; each is a few lines.

- `achievements` renders in array order, and the array is not chronological (2026-03, 2023-11, 2021-10, 2021-06, 2022-05, 2026-07, 2026-08). Sort by `ts` descending in the renderer.
- `terminal.js:139` `whoami` hardcodes "previously 3+ years at Couchbase" - derive from `experience` so it cannot drift.
- `ide-shell.js` `#act-call` hardcodes `+91 6393783010` instead of reading `contact.phone`.
- Dead print selector `.issue-resolution` at `styles.css:506` (renamed to `.decision-resolution` in Phase 5.1), so green resolution blocks keep their tint when printed. `.tag-outline` in the same list is also dead.
- Dead duplicate settings click handler at `ide-shell.js:870` (`// Theme switching lands in a later phase.`) - the real one is bound in `setupThemeMenu()`.
- CLAUDE.md is stale: it records the LeetCode `statValue` as corrected to `1876`, but `file-contents.js` says `2091`. The file is newer and correct; re-sync the doc.

### 8.8 Live-data robustness

Not blocking, but it makes the site look broken to some visitors and belongs with the other ship work.

A cold load registers 14 sources and fans out **12 unauthenticated calls to `api.github.com`**, which allows 60 per hour per IP.
Two or three visitors from the same office or campus NAT will exhaust it, and everyone after them sees only static data.
Reduce the GitHub fan-out to the two flagship projects (`sentinel-engine`, `redis-from-scratch`) and fetch the rest lazily when their tab is actually opened.

`alfa-leetcode-api.onrender.com` is a community wrapper on Render's free tier; cold starts routinely exceed the existing 5s `AbortController` timeout, so the LeetCode live line will often silently fall back.
Static-always-wins already handles this correctly - no code change needed, just do not treat an occasional miss as a bug.

---

## Phase 9 - Plain view (dual audience)

The decision taken: keep the IDE as the default, add a one-click plain view that flattens everything into a single scrollable résumé page.

**Architecture.**
New module `plainview.js`, importing `file-contents.js` and the new `files.js` only.
State persisted under a new key `ide.view.v1` and reflected in the URL as `?view=plain` so it is directly shareable - a query param is orthogonal to the existing hash routing, so `?view=plain#projects/sentinel-engine.md` stays coherent.

**Toggle placement.**
An always-visible, *labelled* control in the title bar - an unlabelled icon will not be found by the audience it exists for.
Reads `Plain view` in IDE mode and `</> IDE view` in plain mode.
On first visit under 768px, additionally show a one-time dismissible hint bar pointing at it.

**Content, in order.**
Hero (name, title, current + ex company, years) · four metric tiles · CTA row (Résumé PDF, Email, LinkedIn, GitHub) · Experience with the `highlights[].body` prose · top three projects with real metrics and links · skills grouped by depth · achievements · contact.
All derived from `file-contents.js` - no duplicated content strings, except the documented condensed SEO block from 8.5.

**Constraints.**
Reuses the existing CSS custom properties, so all four themes work with no new color values.
Must print cleanly - extend the existing print stylesheet rather than adding a second one.
This view is also the no-JS and crawler fallback, so its static portion must be real markup in `index.html`, not injected.

---

## Phase 10 - Landing view and guided tour

**Landing.**
The current welcome view is the weakest surface on the site: a name, a one-line title, and three keyboard shortcuts.
It tells a first-time visitor nothing about why to stay.

Replace it with a real `README.md` file in the tree, opened by default, containing: hero, a **"Start here - three things worth your time"** block linking to `experience/history.git`, `projects/sentinel-engine.md`, and `projects/sentinel-engine.sim`, the metric tiles, the CTA row, and a short "how to drive this site" note for the palette and terminal.

Note the existing welcome-view dedupe technique from Phase 7 Task 0 (canonical markup in `index.html`, captured via `outerHTML` at init) - follow the same pattern so the landing content is not duplicated.

**Tour.**
Four steps, spotlight overlay, reusing the palette's existing backdrop, dialog, and focus-trap pattern rather than inventing a second one.
Steps: file tree → command palette (Ctrl/Cmd+K) → terminal (Ctrl/Cmd+`) → the `.sim` file.
Once per visitor (`ide.tour.v1`), always skippable, instant-complete under `prefers-reduced-motion`, and a two-step variant below 768px where a four-step spotlight would be cramped.

Without this, most visitors never discover the terminal or the palette at all - which is most of the work that has already been shipped.

---

## Phase 11 - `projects/sentinel-engine.sim` (the centerpiece)

An interactive durable-queue failure simulation.
It proves the "zero duplicate execution" claim instead of asserting it, and it is the exact scenario an engineering manager will probe in an interview.

**Model.**
Tasks `t1..tN` in a queue with states `pending | leased | done | failed`.
A task that burns `MAX_ATTEMPTS` (3) leases is dead-lettered rather than retried forever, and a
late write to a dead-lettered task is ignored rather than double-executed. The dead-letter counter
tile only renders once the count is non-zero, so the default view stays on the four numbers that
tell the main story.
Workers `W1..W4`, each optionally holding a lease `{taskId, expiresAt, fenceToken}`.
A monotonic fence counter per task.
A reaper that scans for expired leases, requeues, and **increments the fence token**.

**Controls.**
`Kill worker` · `Partition worker` (keeps running, writes are dropped, then it reconnects and attempts a late write) · `Stall worker` · `Add load` · `Pause` · `Reset` · speed slider.

Shipped note: the plan's "Slow worker" became **Stall worker** - a worker frozen mid-task with no
heartbeat, i.e. a long GC pause. Merely slow is uninteresting (a healthy worker keeps heartbeating,
so nothing happens). Stalled is the real-world cause of the zombie-write race and produces the
clearest log of the three:

```
W1 STALLED on t8 (GC pause) - no heartbeat while frozen
reaper: lease on t8 expired -> requeued (held by W1)
W1 resumed after stall, still believes it owns t8
W1 write REJECTED - fence 1 < current 2
```

Screen-reader announcements are throttled to one failure-path event per 3 simulated seconds via a
separate `role="status"` region; the visual log itself is `aria-live="off"` because it adds roughly
two rows a second and would otherwise flood.

**The payoff.**
A persistent `duplicate executions: 0` counter, and an event-log line reading `W3 write rejected: fence 4 < current 5`.
That single line is the whole point of the feature.

**Implementation constraints.**
DOM and CSS, not canvas - so it is accessible, themable through the existing custom properties, and survives the print stylesheet.
Lease bars as CSS width transitions (140ms linear, gated behind `prefers-reduced-motion:
no-preference`) so the 10fps redraw reads as a continuous drain and each heartbeat renewal reads
as a pulse rather than a jump.
Event log as `role="log" aria-live="polite"`, throttled so it does not flood a screen reader.
Controls are real `<button>`s.
Under `prefers-reduced-motion: reduce`, replace auto-run with an explicit `Step` button.
Pause on `visibilitychange` and whenever the `.sim` tab is not the active tab, so it never burns battery in a background tab.
Below 768px, stack workers vertically and cap the pool at 3.
Target 300–400 lines in a new `sim-queue.js`; no library, no build step.

**Wiring.**
New `.sim` filetype with its own tree glyph, a "Run the failure simulation →" button inside `renderRepoPreview` for sentinel-engine, and a `sim` command in the terminal REGISTRY - which surfaces it in the palette automatically.

A Raft leader-election visualizer for `distributed-kv-store` is the natural follow-on phase once this pattern exists, but is explicitly out of scope here.

---

## Phase 12 - Global content search (Ctrl/Cmd+Shift+F)

The one genuine functional gap.
The palette jumps to files but cannot find "Raft", "Kafka", or "SKIP LOCKED" *inside* them - which is exactly how a technical screener skims a portfolio.

New activity-bar icon plus the shortcut, searching across all file content with grouped results, line context, `<mark>` highlighting, and Enter-to-open.
Substring and word matching with context, not the palette's `fuzzyMatch` - fuzzy subsequence matching is right for filenames and wrong for prose.
Reuse the palette's backdrop, dialog, and focus-trap pattern.

---

## Phase 13 - `posts/` scaffold

Decision taken: agents build the infrastructure and outlines, Saurabh writes the prose.

**Infrastructure.**
A `posts` export in `file-contents.js` shaped `{id, title, date, readingMinutes, summary, markdown}`, a `posts/` tree folder, and reuse of the existing markdown renderer and source toggle - no new renderer needed.
Surface the posts in the plain view and in the Phase 10 landing block.
No RSS.

**Outlines to hand over.**
1. *Why `SELECT FOR UPDATE SKIP LOCKED` beats advisory locks for a task queue* - the contention model, what breaks under advisory locks at 50 workers, and why the Postgres answer was chosen over Redis or Kafka.
2. *Fencing tokens make a zombie worker harmless* - lease expiry alone is not enough, the late-write race, and how the monotonic token closes it. Pairs directly with the Phase 11 simulation.
3. *Zone-aware replica routing in the Couchbase SDK* - real production work, and the strongest "enterprises run this" story available.

These are reusable in interviews and on LinkedIn, which is most of their value.

---

## Phase 14 - Flavour backlog

Bundle opportunistically; none of it is load-bearing.

- `interview.md` - an "Ask me about" file with five topics and two-line answers. Pre-loads the reviewer's question list and reads as self-aware rather than boastful.
- A visible hire-me path. **Shipped** as a `hire` command in the content group (so it surfaces in `help` and the palette), alongside the README's CTA row. `sudo hire-me` survives as the easter egg.
- `git blame`, `git diff HEAD~1`, `npm run interview` as terminal commands. **All shipped.** `git diff HEAD~1` diffs the two most recent roles as a unified diff.
- Breadcrumbs above the editor; split view. **Both shipped.** Breadcrumbs track the focused pane.
  Ctrl/Cmd+\\ splits into two panes; the secondary pane is a viewport rather than a second tab strip,
  so opening a file while it is focused retargets it in place. Split collapses below 1000px and
  hides the minimap, which maps a single pane and would otherwise be ambiguous.

---

## Content debt for Saurabh (agents flag, do not fix)

- **Project quality gradient.** `splitwise`, `wediscusscp`, and `ctrlbudget` carry placeholder "metrics" that are labels, not numbers (`Solo`, `Django`, `Threaded`), and the stat-strip renderer gives them the same visual weight as Sentinel Engine's `<500ms p99`. A reviewer judges by the weakest displayed project. Either give them real numbers or demote them to a compact "Also built" list - this is one of the highest-impact content moves available.
- **`cloud_devops` has only 2 skill entries** and looks visibly thin next to the other four groups. No CI/CD, Terraform, or IaC anywhere on the site.
- **Phone number is in plain text** in `contact.sh`, the `contact` command, and a `tel:` link - fully scrapeable. Recruiters rarely cold-call; spam bots do. Consider removing it.
- **Early-2022 timeline overlap** - InstaAstro (Feb–Jun), Shiksha Sopan (Apr–May), and Orange Health (Jun–Aug) run concurrently. Plausible for an intern plus a volunteer role, but check how it reads in the git graph.
- **Volunteering is duplicated** - the Shiksha Sopan entry exists both inside `about.md` and as `experience/shiksha-sopan.yaml`.
- Résumé PDF in `assets/` must match the latest version, and gets renamed in 8.4.
- Ctrl/Cmd+Tab is reserved by browsers; already rebound to Ctrl+Alt+Tab, keep the `?` overlay in sync.

## Repo-link health

Unchanged from the 2026-07-28 check.
Call `https://api.github.com/rate_limit` and confirm `remaining > 0` **before** running any repo-status check, or the results are meaningless - an earlier agent reported false 404s after exhausting the 60/hr unauthenticated limit.

## Verification checklist (run after each phase)

1. `node --check` on every JS module; confirm no circular imports (`files.js` and `theme.js` must stay leaves).
2. Diff review against the phase prompt: every requirement present, nothing out of scope.
3. Hard constraints 1–6 hold, including the documented 8.5 exception.
4. Persistence keys do not collide: `ide.state.v1`, `ide.term.v1`, `ide.term.history.v1`, `ide.palette.v1`, `ide.theme.v1`, `ide.livedata.v1`, `ide.livedata.cooldown.v1`, plus new `ide.view.v1` and `ide.tour.v1`.
5. Keyboard shortcuts do not fight the browser or each other - Ctrl/Cmd+Shift+F is free, but re-check Ctrl/Cmd+W, which currently has no `isTypingTarget` guard.
6. **Mobile tested at 390px on a fresh load, not just untouched** - the Phase 8.1 bug shipped because mobile was only reasoned about.
7. All four themes, plus print, plus `prefers-reduced-motion: reduce`.
8. Report findings as: blocking issues / non-blocking issues / content debt.

## Explicitly rejected (so nobody re-proposes them)

- Frameworks and build steps (React, bundlers) - vanilla is a hard constraint.
- xterm.js or other heavy terminal libraries.
- Analytics and trackers.
- Sound effects on the easter eggs.
- Stars, forks, and watcher counts anywhere in the UI - they are 0 on personal projects and actively harm the impression.
- Fabricated CI, coverage, or status badges (see 8.2).
