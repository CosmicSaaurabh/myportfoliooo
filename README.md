# Saurabh Mishra - IDE Portfolio

A personal portfolio styled as a VS Code-like IDE.
Browse experience, projects, skills, and contact details by opening files, running terminal commands, or using the command palette.
No frameworks, no build step - just static HTML, CSS, and vanilla JS (works on GitHub Pages as-is).

**Live site:** [cosmicsaaurabh.github.io/myportfoliooo](https://cosmicsaaurabh.github.io/myportfoliooo/)  
**Repo:** [github.com/CosmicSaaurabh/myportfoliooo](https://github.com/CosmicSaaurabh/myportfoliooo)

---

## Quick start

```bash
git clone https://github.com/CosmicSaaurabh/myportfoliooo.git
cd myportfoliooo
# any static server, or open index.html directly
npx serve .
# or: python3 -m http.server 8000
```

Then open the printed URL in your browser.

---

## How to navigate

The site mirrors an editor.
Use the sidebar, tabs, terminal, and palette the same way you would in VS Code.

### Two ways to read it

The site opens as an IDE. **Plain view** (top-right, or the `plain` command, or `?view=plain`)
flattens everything into one scrollable résumé page with the PDF and contact details up top.
The choice is remembered, and `?view=plain` is directly shareable.

### Explorer (sidebar)

Click files in the left tree to open them as editor tabs.

| Path | What you get |
|------|----------------|
| `README.md` | Landing page - hero, metrics, résumé/contact CTAs, and three things worth your time |
| `about.md` | Bio, education, facts, résumé download |
| `experience/history.git` | Career as a `git log --graph` commit timeline |
| `experience/<role>.yaml` | Per-role detail (Capslock, Couchbase, …) |
| `projects/sentinel-engine.sim` | **Interactive** durable-queue failure simulation - kill a worker, watch fencing tokens hold the invariant |
| `projects/<name>.md` | Project write-ups with engineering decisions |
| `projects/also-built.md` | Smaller projects, kept short |
| `skills.json` | Skills by depth and where they were used |
| `profiles.md` | Coding profiles (Codeforces / LeetCode can show live data) |
| `achievements.log` | Highlights and milestones, newest first |
| `interview.md` | Questions I can go deep on, with answers |
| `contact.sh` | Email, LinkedIn, GitHub, phone |

Tips:

- On the git-graph view, press **Enter** / **Space** on a commit row to open that role’s `.yaml` tab.
- On wide screens (≥1200px), a minimap appears for code-style views - click it to jump.
- On mobile, the IDE chrome simplifies so content stays readable.

### Tabs & chrome

- Open multiple files; switch with the tab bar.
- Close a tab with the × or **Ctrl/Cmd+W**.
- Status bar shows the active theme (click it to switch).
- Gear icon also opens the theme menu.

### Command palette

Press **Ctrl/Cmd+K**.

- Type a file name to jump and open it.
- Prefix with `>` to run terminal commands (same registry as the integrated terminal).

### Keyboard shortcuts

Press **`?`** anywhere (when not typing in an input) for the full overlay, or run `shortcuts` in the terminal.

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Command palette (jump to a file) |
| `Ctrl/Cmd + Shift + F` | Search **inside** every file |
| `Ctrl/Cmd + \`` | Toggle terminal |
| `Ctrl/Cmd + W` | Close active tab |
| `Ctrl/Cmd + Alt + Tab` | Cycle open tabs |
| `?` | Shortcuts help |
| `Esc` | Close palette / menu / overlay |

**In the terminal:** ↑/↓ history · Tab completion · Ctrl+L clear · Ctrl+C cancel line.

---

## Terminal commands

Open the terminal with **Ctrl/Cmd+\`** (or the terminal icon in the activity bar).
Type `help` for the built-in list.

### Core

| Command | What you get |
|---------|----------------|
| `help` | Grouped list of all commands |
| `clear` | Clears terminal output |
| `history` | Past commands from this session |
| `echo <text>` | Prints arguments back |
| `pwd` | Prints `~/portfolio` |
| `date` | Current date/time |

### Navigation

| Command | What you get |
|---------|----------------|
| `ls` | Top-level files and folders |
| `ls projects/` | Files under that folder |
| `cat <file>` | Raw content of a portfolio file |
| `open <file>` | Opens the file as an editor tab |

Examples: `open about.md`, `cat contact.sh`, `ls experience/`.

### Portfolio content

| Command | What you get |
|---------|----------------|
| `whoami` | Short intro (role, focus, current company) |
| `experience` | Timeline of roles and companies |
| `projects` | One line per project (id, tags, subtitle) |
| `skills` | Skills as a table (name, depth, used at) |
| `profiles` | Coding-profile ratings (`live` vs `static`) |
| `resume` | Triggers résumé PDF download |
| `contact` | Email, LinkedIn, GitHub, phone |
| `github` | Opens GitHub profile in a new tab |
| `refresh` | Force-refreshes live profile/repo data |
| `shortcuts` | Opens the keyboard shortcuts overlay |
| `sim` | Opens the durable-queue failure simulation |
| `interview` | Opens `interview.md` |
| `posts` | Lists published technical write-ups |
| `plain` | Switches to the plain résumé view |
| `npm run interview` | Yes, really |

### Themes

| Command | What you get |
|---------|----------------|
| `theme` | Lists themes; marks the active one |
| `theme monokai` | Switches theme |
| `theme dracula` | |
| `theme solarized-dark` | |
| `theme github-light` | |

Theme also switches from the settings gear, status bar, or palette (`>theme …`).

### Git-style career view

| Command | What you get |
|---------|----------------|
| `git log` | Career history as a commit graph |
| `git log --oneline` | Same history, one line per commit |
| `git branch` | Roles listed as branches (`*` = current) |
| `git blame` | Who is responsible for all this |

---

## Contact

Prefer the `contact` command or `contact.sh` inside the site.
Same details here:

| | |
|--|--|
| **Email** | [swe.saurabh.mishra@gmail.com](mailto:swe.saurabh.mishra@gmail.com) |
| **LinkedIn** | [linkedin.com/in/2bsaurabh](https://www.linkedin.com/in/2bsaurabh/) |
| **GitHub** | [github.com/CosmicSaaurabh](https://github.com/CosmicSaaurabh) |
| **Phone** | +91 6393783010 |
| **Résumé** | [`assets/Saurabh_Mishra_Resume.pdf`](assets/Saurabh_Mishra_Resume.pdf) |

Open to backend / distributed-systems roles.
Reach out by email or LinkedIn.

---

## Stack

- Vanilla HTML / CSS / ES modules (no bundler, no React)
- Themes via CSS custom properties (`Monokai`, `Dracula`, `Solarized Dark`, `GitHub Light`)
- Self-hosted variable fonts (no third-party font CDN at runtime)
- Optional live enrichment for GitHub / Codeforces / LeetCode with cache + static fallback
- Deployable as static files on GitHub Pages

### Project layout

```
index.html          IDE shell markup + SEO/OG tags + no-JS résumé fallback
404.html            GitHub Pages not-found page
styles.css          Themes + layout + print
ide-shell.js        Tabs, tree, renderers, routing
files.js            Canonical file registry + tree (shared by shell/terminal/palette)
terminal.js         Integrated terminal + command registry
palette.js          Ctrl/Cmd+K command palette
search.js           Ctrl/Cmd+Shift+F content search
sim-queue.js        Durable-queue failure simulation
plainview.js        Flat résumé view
tour.js             First-visit guided tour
theme.js            Shared theme apply / persist
livedata.js         Live data sources + cache
file-contents.js    All portfolio content (single source of truth)
assets/             Résumé PDF, OG preview image, self-hosted fonts
```

---

## License

Personal portfolio.
Content and branding are © Saurabh Mishra.
Feel free to fork the IDE shell idea for your own site - please don’t copy the résumé or bio verbatim.
