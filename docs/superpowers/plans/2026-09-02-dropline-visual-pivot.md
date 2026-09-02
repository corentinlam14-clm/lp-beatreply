# Dropline Visual Pivot (Landing Page) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin `lp-beatreply`'s landing page (`index.html`) into the "Dropline" visual language — blue/magenta/cyan palette, Unbounded/IBM Plex fonts, an SVG/CSS waveform aurora, an extended glass-material system (navbar + buttons + cards), native scroll-driven reveals, floating stat pills, and a genre marquee — without changing any section, copy, or feature.

**Architecture:** Single `index.html`, no build step, no framework, no new runtime dependency. All motion is pure CSS (`@keyframes`, `animation-timeline: view()`) — nothing in this pivot reads `scrollY` or runs per-frame JS. The canvas-based ambient-background renderer from the superseded plan is removed, not recolored.

**Tech Stack:** Vanilla HTML/CSS/JS, Tailwind CSS via Play CDN, Google Fonts, Playwright (`sdd/browser-checks/`) for browser verification, Node's built-in `node --test` for the two existing pure-logic test files.

**Spec:** [`docs/superpowers/specs/2026-09-02-dropline-visual-pivot-design.md`](../specs/2026-09-02-dropline-visual-pivot-design.md)

## Global Constraints

- Landing page only (`lp-beatreply`). `beatreply-dashboard` is out of scope — a separate future chantier.
- No JavaScript animation loop, no `scrollY` read, no `position:fixed`/`position:absolute` node repositioned via a scroll handler — this is the hard lesson from the abandoned Process carousel and must hold for every task in this plan.
- No new CDN library, no build step. Fonts via Google Fonts `<link>`, everything else hand-written CSS/SVG in `index.html`.
- `node --test` (currently 12 tests in `tests/catalog-demo.test.js` + `tests/catalog-showcase.test.js`) must stay green after every task.
- Respect `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more` for every new animated/glass element — same three media features the existing navbar work already handles.
- **Anchor every edit by the exact code snippet shown in that step, not by the line number alone.** Line numbers given are accurate as of the start of the task that uses them, but earlier tasks in this plan shift later line numbers — the snippet is the ground truth; use it to locate the edit (e.g. via the Edit tool's exact-string match) even if the line number has drifted by a few lines.
- Work happens on worktree `worktree-ambient-background` (branch of the same name, currently at commit `2bf419a`). Task 1 syncs it with `main`.

---

## Task 1: Sync the worktree with `main`; retire the canvas ambient-background renderer

The worktree diverged from `main` before two things landed there: the fabricated-testimonials removal (`0234ce2`) and this plan's own spec (`8876bf1`). It also still carries the superseded plan's canvas-based renderer (`assets/js/ambient-bg.js`, wired into `index.html`), which this pivot replaces with a scoped SVG/CSS aurora (Task 4) — the canvas module is deleted outright, not recolored.

**Files:**
- Modify: `index.html` (merge result, then canvas removal)
- Delete: `assets/js/ambient-bg.js`, `tests/ambient-bg.test.js`
- Delete: `sdd/browser-checks/ambient-bg.mjs` (superseded checks — replaced by a fresh file this task creates)
- Create: `sdd/browser-checks/dropline-pivot.mjs` (new shared Playwright harness, extended by every later task)
- Commit (historical record, no code change): the 5 files already staged in this worktree from the superseded plan's Tasks 1–3 (`sdd/browser-checks/ambient-bg.mjs`, `sdd/browser-checks/node_modules`, `sdd/task-1-report.md`, `sdd/task-2-report.md`, `sdd/task-3-report.md`)

**Interfaces:**
- Produces: a clean `worktree-ambient-background` branch, in sync with `main`, with no canvas/`#ambient-bg` code anywhere, and `sdd/browser-checks/dropline-pivot.mjs` — a runnable Playwright script (`node sdd/browser-checks/dropline-pivot.mjs` against a local server) that every later task appends checks to. Its shape (the `ok()` helper, the `results` array, the pass/fail summary + `process.exit`) is what Tasks 2–8 rely on.

- [ ] **Step 1: Preserve the existing (uncommitted) SDD reports as history**

The worktree currently has 5 files staged but never committed, left over from the superseded plan's approved Tasks 1–3:

Run: `git -C .claude/worktrees/ambient-background status --short`
Expected:
```
A  sdd/browser-checks/ambient-bg.mjs
A  sdd/browser-checks/node_modules
A  sdd/task-1-report.md
A  sdd/task-2-report.md
A  sdd/task-3-report.md
```

Commit them as-is, from inside the worktree:

```bash
cd .claude/worktrees/ambient-background
git commit -m "Preserve Task 1-3 SDD reports from the superseded ambient-background plan (historical record, no code change)"
```

- [ ] **Step 2: Merge `main` into the worktree branch**

Still inside the worktree:

```bash
git merge main
```

Expected: `Auto-merging index.html` then `Merge made by the 'ort' strategy.` — no conflicts (verified during planning: main only touched the nav-links/testimonials-section region of `index.html`, the worktree only touched the `<style>` block and early `<body>`; the two do not overlap).

If a conflict is reported instead, stop and report it rather than guessing a resolution — it means the file changed since this plan was written.

- [ ] **Step 3: Verify the merge result**

```bash
grep -c testimonials index.html   # expect 0
grep -c mat-structural index.html # expect 23 (unchanged from before the merge)
```

- [ ] **Step 4: Delete the canvas renderer module and its unit tests**

```bash
git rm assets/js/ambient-bg.js tests/ambient-bg.test.js
```

- [ ] **Step 5: Remove the canvas element, its CSS, and its script wiring from `index.html`**

Remove the `<canvas>` element (currently the first child of `<body>`):

```html
<canvas id="ambient-bg" aria-hidden="true"></canvas>
```

Remove its CSS block and the two rules that existed only to work around it (the z-index lift for `#main-content`/`footer`, and the grain z-index override — both become dead weight once there is no fixed canvas underneath):

```css
  /* ===== Ambient background (phase 1) ===== */
  #ambient-bg {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    display: block;
    background: #0a0a0a; /* shown before JS runs and when canvas is unsupported */
  }
  /* Lift the page's content above the fixed canvas WITHOUT changing layout.
     #navbar (sticky, z-50) and .skip-link (absolute, z-100) already sit above a
     z-index:0 element, so they are deliberately not listed here. */
  #main-content,
  body > footer {
    position: relative;
    z-index: 1;
  }
  /* Keep the existing film grain riding on top of the new canvas. */
  .texture-grain::before {
    z-index: 1;
  }
```

Remove the script include and its init call:

```html
<script src="assets/js/ambient-bg.js"></script>
```

```js
  // Ambient background
  if (window.BeatReplyAmbientBg) {
    window.BeatReplyAmbientBg.start();
  }
```

- [ ] **Step 6: Run the unit test suite**

```bash
node --test
```

Expected: `12 passing` (back down from the worktree's temporary higher count, now that `ambient-bg.test.js` is gone) — matches `main`'s count exactly.

- [ ] **Step 7: Retire the old browser-check script, create the new shared harness**

```bash
git rm sdd/browser-checks/ambient-bg.mjs
```

Create `sdd/browser-checks/dropline-pivot.mjs` — this becomes the one shared check file every later task appends to, reusing the exact harness shape of the file just removed (same imports, same `ok()` helper, same server/port convention, same pass/fail summary):

```js
import { chromium } from 'playwright';

const URL = process.env.TARGET_URL || 'http://localhost:8130/index.html';
const results = [];
const ok = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail: String(detail) });

const b = await chromium.launch();

// ---- Task 1: no canvas renderer left behind -----------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const hasCanvas = await p.evaluate(() => !!document.getElementById('ambient-bg'));
  ok('#ambient-bg canvas is gone', !hasCanvas);
  ok('no console / page errors on load', errs.length === 0, errs.join(' | ') || 'clean');
  await p.close();
}

await b.close();
const wI = Math.max(...results.map(r => r.name.length));
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(wI)}  ${r.detail}`);
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
```

The `sdd/browser-checks/node_modules` symlink (→ a Playwright-containing npx cache dir) already exists in this worktree from the superseded plan and is reused as-is — do not recreate it. Verify it still resolves:

```bash
node -e "import('playwright').then(() => console.log('playwright OK')).catch(e => console.error('BROKEN:', e.message))" --input-type=module
```

If it prints `BROKEN`, the npx cache directory it points to was cleared since it was created. Recreate it: `npx --yes playwright@latest --version` (this repopulates an npx cache with Playwright installed), find the new cache dir under `~/.npm/_npx/`, then `ln -sfn <that dir>/node_modules sdd/browser-checks/node_modules`.

- [ ] **Step 8: Run the new check and serve the page to confirm it passes**

```bash
python3 -m http.server 8130 --directory /Users/corentin/Documents/Projects/lp-beatreply/.claude/worktrees/ambient-background &
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `2/2 checks pass`, exit code 0. Kill the background server afterward (`kill %1` or find/kill the `http.server` PID).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Sync worktree with main; retire the canvas ambient-bg renderer

Merges in the testimonials removal and this pivot's design spec.
Deletes the superseded plan's canvas-based background module
(assets/js/ambient-bg.js + its unit tests + its Playwright checks) —
this pivot's aurora (Task 4) is pure SVG/CSS, no JS renderer needed.
Establishes sdd/browser-checks/dropline-pivot.mjs as the shared
verification harness for the rest of this plan."
```

---

## Task 2: Palette, Tailwind tokens, and fonts

**Files:**
- Modify: `index.html` (Tailwind `colors` config, `:root` custom properties, Google Fonts `<link>`, `fontFamily` config, `html`/`body` base rules)
- Modify: `sdd/browser-checks/dropline-pivot.mjs` (append palette + font checks)

**Interfaces:**
- Consumes: nothing from Task 1 beyond a clean, merged `index.html`.
- Produces: `--primary-rgb`/`--secondary-rgb`/`--cyan-rgb` CSS custom properties holding the new palette (consumed by every later task's CSS — `--primary`, `--primary-hover`, `--primary-muted`, `--secondary`, `--secondary-hover`, `--secondary-muted`, `--accent*`, `--cyan`, plus the new `--hairline`/`--glass-bg`/`--glass-border` tokens Task 3 recolors the material system with). Tailwind's `bg-primary`, `text-secondary`, etc. utility classes keep working unchanged — only the colors they resolve to change.

- [ ] **Step 1: Write the failing checks**

Append to `sdd/browser-checks/dropline-pivot.mjs`, right before the `await b.close();` line:

```js
// ---- Task 2: palette + fonts ---------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const palette = await p.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const h1 = document.querySelector('h1');
    const body = document.body;
    return {
      htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      primaryRgb: root.getPropertyValue('--primary-rgb').trim(),
      secondaryRgb: root.getPropertyValue('--secondary-rgb').trim(),
      cyanRgb: root.getPropertyValue('--cyan-rgb').trim(),
      h1Font: h1 && getComputedStyle(h1).fontFamily,
      bodyFont: getComputedStyle(body).fontFamily,
    };
  });
  ok('html background is the Dropline near-black', palette.htmlBg === 'rgb(10, 10, 15)', palette.htmlBg);
  ok('--primary-rgb is the Dropline blue', palette.primaryRgb === '61 107 255', palette.primaryRgb);
  ok('--secondary-rgb is the Dropline magenta', palette.secondaryRgb === '255 46 154', palette.secondaryRgb);
  ok('--cyan-rgb is defined (Dropline pale cyan)', palette.cyanRgb === '142 217 255', palette.cyanRgb);
  ok('h1 uses Unbounded', palette.h1Font && palette.h1Font.includes('Unbounded'), palette.h1Font);
  ok('body uses IBM Plex Sans', palette.bodyFont && palette.bodyFont.includes('IBM Plex Sans'), palette.bodyFont);
  await p.close();
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
python3 -m http.server 8130 --directory /Users/corentin/Documents/Projects/lp-beatreply/.claude/worktrees/ambient-background &
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: the 6 new checks FAIL (palette/fonts unchanged so far), the 2 Task 1 checks still PASS.

- [ ] **Step 3: Replace the Google Fonts `<link>`**

Find:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

Replace with:

```html
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800;900&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Update the Tailwind `colors` config**

Find (inside the `tailwind.config` script block):

```js
        colors: {
          primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
          'primary-hover': 'var(--primary-hover)',
          'primary-muted': 'var(--primary-muted)',
          secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
          'secondary-hover': 'var(--secondary-hover)',
          accent: 'rgb(var(--primary-rgb) / <alpha-value>)',
          'accent-hover': 'var(--accent-hover)',
          'accent-muted': 'var(--accent-muted)',
          background: '#0a0a0a',
          surface: 'rgba(255, 255, 255, 0.03)',
          'surface-elevated': 'rgba(255, 255, 255, 0.06)',
          'text-primary': '#ffffff',
          'text-secondary': 'rgba(255, 255, 255, 0.85)',
          'text-muted': 'rgba(255, 255, 255, 0.6)',
          'text-ghost': 'rgba(255, 255, 255, 0.5)',
          'border-primary': 'rgba(255, 255, 255, 0.1)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
        },
```

Replace with:

```js
        colors: {
          primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
          'primary-hover': 'var(--primary-hover)',
          'primary-muted': 'var(--primary-muted)',
          secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
          'secondary-hover': 'var(--secondary-hover)',
          cyan: 'rgb(var(--cyan-rgb) / <alpha-value>)',
          accent: 'rgb(var(--primary-rgb) / <alpha-value>)',
          'accent-hover': 'var(--accent-hover)',
          'accent-muted': 'var(--accent-muted)',
          background: '#0A0A0F',
          surface: '#121218',
          'surface-elevated': '#191922',
          'text-primary': '#F4F3F7',
          'text-secondary': 'rgba(244, 243, 247, 0.85)',
          'text-muted': '#8D8B9B',
          'text-ghost': 'rgba(244, 243, 247, 0.5)',
          'border-primary': 'rgba(244, 243, 247, 0.10)',
          'border-subtle': 'rgba(244, 243, 247, 0.06)',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
        },
```

- [ ] **Step 5: Update `fontFamily` — swap `sans`, add `display` and `mono`**

Find:

```js
        fontFamily: {
          sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        },
```

Replace with:

```js
        fontFamily: {
          sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
          display: ['Unbounded', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
          mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        },
```

- [ ] **Step 6: Update the `:root` custom properties**

Find:

```css
  :root {
    --primary-rgb: 255 157 66;
    --primary: rgb(var(--primary-rgb));
    --primary-hover: #F58B29;
    --primary-muted: rgb(var(--primary-rgb) / 0.1);
    --secondary-rgb: 201 123 36;
    --secondary: rgb(var(--secondary-rgb));
    --secondary-hover: #B36A1C;
    --accent: rgb(var(--primary-rgb));
    --accent-hover: #F58B29;
    --accent-muted: rgb(var(--primary-rgb) / 0.15);
  }
```

Replace with:

```css
  :root {
    --primary-rgb: 61 107 255;
    --primary: rgb(var(--primary-rgb));
    --primary-hover: #6689FF;
    --primary-hover-rgb: 102 137 255; /* same color as a triplet, so Task 5 can carry alpha on it */
    --primary-muted: rgb(var(--primary-rgb) / 0.12);
    --secondary-rgb: 255 46 154;
    --secondary: rgb(var(--secondary-rgb));
    --secondary-hover: #FF5CB1;
    --secondary-muted: rgb(var(--secondary-rgb) / 0.12);
    --cyan-rgb: 142 217 255;
    --cyan: rgb(var(--cyan-rgb));
    --accent: var(--primary);
    --accent-hover: var(--primary-hover);
    --accent-muted: var(--primary-muted);
    --hairline: rgba(244, 243, 247, 0.10);
    --glass-bg: rgba(255, 255, 255, 0.055);
    --glass-border: rgba(255, 255, 255, 0.14);
  }
```

- [ ] **Step 7: Update the `html`/`body` base rules**

Find:

```css
  html { background: #0a0a0a; scroll-behavior: smooth; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
```

Replace with:

```css
  html { background: #0A0A0F; scroll-behavior: smooth; }
  body { font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
```

- [ ] **Step 8: Apply Unbounded to headings/display numbers, IBM Plex Mono to the hero-demo's technical labels**

Add this new rule directly after the `html`/`body` rule from Step 7:

```css
  h1, h2, h3, h4,
  .gradient-text-loop.counter {
    font-family: 'Unbounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  #hero-demo [data-demo-track-cards] .text-caption,
  #hero-demo .border-t.border-background\/20 {
    font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  }
```

- [ ] **Step 9: Run the check again to confirm it passes**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `8/8 checks pass`.

- [ ] **Step 10: Run unit tests (regression) and commit**

```bash
node --test
git add -A
git commit -m "Pivot palette to Dropline (blue/magenta/cyan) and swap fonts to Unbounded/IBM Plex

Recolors the Tailwind config + :root custom properties; every
existing bg-primary/text-secondary/etc. utility class keeps working
unchanged, only the resolved color changes. Adds a new cyan token
and the glass tokens (--hairline/--glass-bg/--glass-border) Task 3
recolors the material system with."
```

---

## Task 3: Recolor the material-token system and the navbar

**Files:**
- Modify: `index.html` (the `--mat-structural/card/interactive` custom properties and their `-tint` values only — structure untouched)
- Modify: `sdd/browser-checks/dropline-pivot.mjs`

**Interfaces:**
- Consumes: `--glass-bg`, `--glass-border`, `--hairline` from Task 2.
- Produces: recolored `--mat-structural-*`/`--mat-card-*`/`--mat-interactive-*` tokens and `.mat-structural`/`.mat-card`/`.mat-interactive` helper classes, consumed by Task 5 (buttons/cards).

- [ ] **Step 1: Write the failing check**

Append before `await b.close();`:

```js
// ---- Task 3: material tokens recolored -----------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  const tint = await p.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--mat-structural-tint').trim()
  );
  ok('material tint is cool blue-violet, not warm orange', tint === 'rgba(90, 110, 255, 0.06)', tint);
  await p.close();
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: this 1 new check FAILS, the 8 earlier checks still PASS.

- [ ] **Step 3: Recolor the three `-tint` values**

Find (inside the `/* ===== Material token system ===== */` block):

```css
    --mat-structural-tint:   rgba(255, 190, 130, 0.06); /* warm veil = faux adaptive tint */
```

Replace with:

```css
    --mat-structural-tint:   rgba(90, 110, 255, 0.06); /* cool blue-violet veil = faux adaptive tint */
```

Find:

```css
    --mat-card-tint:   rgba(255, 190, 130, 0.04);
```

Replace with:

```css
    --mat-card-tint:   rgba(90, 110, 255, 0.04);
```

Find:

```css
    --mat-interactive-tint:   rgba(255, 200, 140, 0.05);
```

Replace with:

```css
    --mat-interactive-tint:   rgba(90, 110, 255, 0.05);
```

- [ ] **Step 4: Recolor `-bg`/`-border`/`-edge` to the Dropline glass tokens**

Find:

```css
    --mat-structural-bg:     rgba(12, 12, 14, 0.55);
```

Replace with:

```css
    --mat-structural-bg:     var(--glass-bg);
```

Find:

```css
    --mat-structural-border: rgba(255, 255, 255, 0.06);
    --mat-structural-edge:   rgba(255, 255, 255, 0.34); /* lensing: bright top arête */
```

Replace with:

```css
    --mat-structural-border: var(--hairline);
    --mat-structural-edge:   var(--glass-border); /* lensing: bright top arête */
```

Find:

```css
    --mat-card-bg:     rgba(14, 14, 16, 0.5);
```

Replace with:

```css
    --mat-card-bg:     var(--glass-bg);
```

Find:

```css
    --mat-card-border: rgba(255, 255, 255, 0.05);
    --mat-card-edge:   rgba(255, 255, 255, 0.22);
```

Replace with:

```css
    --mat-card-border: var(--hairline);
    --mat-card-edge:   var(--glass-border);
```

Find:

```css
    --mat-interactive-bg:     rgba(255, 255, 255, 0.06);
```

Replace with:

```css
    --mat-interactive-bg:     var(--glass-bg);
```

Find:

```css
    --mat-interactive-border: rgba(255, 255, 255, 0.14);
    --mat-interactive-edge:   rgba(255, 255, 255, 0.4);
```

Replace with:

```css
    --mat-interactive-border: var(--glass-border);
    --mat-interactive-edge:   var(--glass-border);
```

- [ ] **Step 5: Run the check again, run unit tests, commit**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `9/9 checks pass`.

```bash
node --test
git add -A
git commit -m "Recolor the material-token system from warm orange to Dropline blue-violet

Structure untouched (still 3 weights x 8 properties, same
.mat-structural/.mat-card/.mat-interactive helper classes) — only
the -tint/-bg/-border/-edge values change, now sourced from the
--glass-bg/--glass-border/--hairline tokens added in Task 2. The
navbar (already consuming --mat-structural-*) picks up the new
color automatically, no navbar-specific edit needed."
```

---

## Task 4: Aurora waveform (hero + CTA final)

**Files:**
- Modify: `index.html` (new `.wave-field` CSS component; replace `.glow-orb-1`/`.glow-orb-2` markup in the hero and `#cta-final` sections; simplify `.hero-gradient`)
- Modify: `sdd/browser-checks/dropline-pivot.mjs`

**Interfaces:**
- Consumes: nothing new from earlier tasks (uses the `--primary`/`--secondary`/`--cyan` RGB values from Task 2 only as reference colors, hardcoded as hex in the SVG gradient — SVG `<stop>` doesn't read CSS custom properties reliably across browsers, so the hex values are inlined).
- Produces: the `.wave-field`/`.wave-loop` component, reused identically in both sections. No later task depends on it.

- [ ] **Step 1: Write the failing check**

Append before `await b.close();`:

```js
// ---- Task 4: aurora waveform ---------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const count = await p.evaluate(() => document.querySelectorAll('.wave-field').length);
  ok('exactly 2 .wave-field instances (hero + cta-final)', count === 2, count);

  const noOrbs = await p.evaluate(() =>
    document.querySelectorAll('.glow-orb-1, .glow-orb-2').length === 0
  );
  ok('old glow-orb divs are gone', noOrbs);

  // animates without interaction: sample a .wave-loop's transform twice, 1s apart
  const getTransform = () => p.evaluate(() => {
    const el = document.querySelector('.wave-loop-a');
    return getComputedStyle(el).transform;
  });
  const t1 = await getTransform();
  await p.waitForTimeout(1000);
  const t2 = await getTransform();
  ok('.wave-loop-a animates with no interaction', t1 !== t2, `${t1} -> ${t2}`);

  // no scroll coupling: scroll to bottom, confirm no console error and the field is still animating
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(200);
  const stillThere = await p.evaluate(() => document.querySelectorAll('.wave-field').length === 2);
  ok('both .wave-field instances survive a full-page scroll', stillThere);

  await p.close();
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: the 4 new checks FAIL (no `.wave-field` exists yet), the 9 earlier checks still PASS.

- [ ] **Step 3: Add the `.wave-field` CSS component**

Add this new block directly after the `.glow-orb-1`/`.glow-orb-2` rules:

```css
  .wave-field {
    position: absolute; inset: 0; overflow: hidden;
    filter: blur(58px) saturate(150%);
    opacity: 0.55;
    pointer-events: none;
    z-index: 0;
  }
  .wave-loop { position: absolute; inset: -20% -10%; width: 120%; }
  .wave-loop-a { animation: waveDrift 34s linear infinite; }
  .wave-loop-b { animation: waveDrift 48s linear infinite reverse; }
  @keyframes waveDrift {
    from { transform: translateX(0); }
    to   { transform: translateX(-400px); }
  }
```

- [ ] **Step 4: Simplify `.hero-gradient` to a flat dark base**

The aurora now carries all the color; `.hero-gradient` becomes just the section's dark base layer.

Find:

```css
  .hero-gradient {
    background:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgb(var(--primary-rgb) / 0.15), transparent),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgb(var(--secondary-rgb) / 0.1), transparent),
      linear-gradient(180deg, #0a0a0a 0%, rgba(0, 0, 0, 0.95) 100%);
  }
```

Replace with:

```css
  .hero-gradient {
    background: linear-gradient(180deg, #0A0A0F 0%, #000000 100%);
  }
```

- [ ] **Step 5: Replace the glow-orb divs in the hero section**

Find:

```html
  <div class="glow-orb-1"></div>
  <div class="glow-orb-2"></div>
```

(the first occurrence, inside `<section class="relative hero-gradient overflow-hidden">`, right after its opening tag)

Replace with:

```html
  <div class="wave-field" aria-hidden="true">
    <svg class="wave-loop wave-loop-a" viewBox="0 0 1600 500" preserveAspectRatio="none">
      <defs>
        <linearGradient id="auroraGradHero" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stop-color="#FF2E9A"/>
          <stop offset="50%" stop-color="#3D6BFF"/>
          <stop offset="100%" stop-color="#8ED9FF"/>
        </linearGradient>
      </defs>
      <path d="M0,250 C50,190 150,190 200,250 C250,310 350,310 400,250 C450,190 550,190 600,250 C650,310 750,310 800,250 C850,190 950,190 1000,250 C1050,310 1150,310 1200,250 C1250,190 1350,190 1400,250 C1450,310 1550,310 1600,250 L1600,500 L0,500 Z" fill="url(#auroraGradHero)"/>
    </svg>
    <svg class="wave-loop wave-loop-b" viewBox="0 0 1600 500" preserveAspectRatio="none">
      <path d="M0,320 C50,270 150,270 200,320 C250,370 350,370 400,320 C450,270 550,270 600,320 C650,370 750,370 800,320 C850,270 950,270 1000,320 C1050,370 1150,370 1200,320 C1250,270 1350,270 1400,320 C1450,370 1550,370 1600,320 L1600,0 L0,0 Z" fill="url(#auroraGradHero)" opacity="0.6"/>
    </svg>
  </div>
```

- [ ] **Step 6: Replace the glow-orb divs in `#cta-final`**

Find (the second occurrence, inside `<section id="cta-final" class="relative hero-gradient overflow-hidden">`):

```html
  <div class="glow-orb-1"></div>
  <div class="glow-orb-2"></div>
```

Replace with the same `.wave-field` markup as Step 5, but with unique gradient IDs (SVG `id`s must be unique per document):

```html
  <div class="wave-field" aria-hidden="true">
    <svg class="wave-loop wave-loop-a" viewBox="0 0 1600 500" preserveAspectRatio="none">
      <defs>
        <linearGradient id="auroraGradCta" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stop-color="#FF2E9A"/>
          <stop offset="50%" stop-color="#3D6BFF"/>
          <stop offset="100%" stop-color="#8ED9FF"/>
        </linearGradient>
      </defs>
      <path d="M0,250 C50,190 150,190 200,250 C250,310 350,310 400,250 C450,190 550,190 600,250 C650,310 750,310 800,250 C850,190 950,190 1000,250 C1050,310 1150,310 1200,250 C1250,190 1350,190 1400,250 C1450,310 1550,310 1600,250 L1600,500 L0,500 Z" fill="url(#auroraGradCta)"/>
    </svg>
    <svg class="wave-loop wave-loop-b" viewBox="0 0 1600 500" preserveAspectRatio="none">
      <path d="M0,320 C50,270 150,270 200,320 C250,370 350,370 400,320 C450,270 550,270 600,320 C650,370 750,370 800,320 C850,270 950,270 1000,320 C1050,370 1150,370 1200,320 C1250,270 1350,270 1400,320 C1450,370 1550,370 1600,320 L1600,0 L0,0 Z" fill="url(#auroraGradCta)" opacity="0.6"/>
    </svg>
  </div>
```

- [ ] **Step 7: Add the `prefers-reduced-motion` fallback**

Inside the existing `@media (prefers-reduced-motion: reduce) { ... }` block, add `.wave-loop-a` and `.wave-loop-b` to the `animation: none !important;` selector list:

Find:

```css
    .loading-pulse,
    .card,
    .hover-lift,
    .image-treatment,
    .btn-primary,
    .btn-secondary,
    .gradient-text-loop {
      animation: none !important;
      transition: opacity 0.2s ease !important;
    }
```

Replace with:

```css
    .loading-pulse,
    .card,
    .hover-lift,
    .image-treatment,
    .btn-primary,
    .btn-secondary,
    .gradient-text-loop,
    .wave-loop-a,
    .wave-loop-b {
      animation: none !important;
      transition: opacity 0.2s ease !important;
    }
```

- [ ] **Step 8: Run the check again**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `13/13 checks pass`.

- [ ] **Step 9: Visual check, unit tests, commit**

Open `http://localhost:8130/index.html` in a real browser (or take a Playwright screenshot) and eyeball the hero and CTA-final sections — confirm the aurora reads as a soft blurred ribbon, not a hard-edged shape, and that no visible seam appears during a ~5s watch of the loop. This is a visual tuning call per the spec's open questions (§9) — if the ribbon looks wrong (too thin, too sharp, wrong opacity), adjust `opacity`/`filter: blur()` on `.wave-field` before committing; the path coordinates themselves don't need to be pixel-perfect since the heavy blur erases fine detail.

```bash
node --test
git add -A
git commit -m "Replace static glow-orbs with an animated SVG waveform aurora

New .wave-field component (2 blurred, independently-looping SVG
ribbons, magenta->blue->cyan gradient), scoped to the hero and
#cta-final sections only — pure CSS @keyframes, no JS, no scroll
coupling. .hero-gradient simplified to a flat dark base since the
aurora now carries the section's color."
```

---

## Task 5: Glass buttons and cards, specular sweep

**Files:**
- Modify: `index.html` (`.btn-primary`, `.btn-secondary`, `.glass-surface`)
- Modify: `sdd/browser-checks/dropline-pivot.mjs`

**Interfaces:**
- Consumes: `.mat-interactive`/`.mat-card` recipes and their custom properties from Task 3.
- Produces: `.btn-primary`/`.btn-secondary` with a `backdrop-filter` + specular sweep; `.glass-surface` aliased to the `card` weight. No later task depends on new names — `.glass-surface`, `.btn-primary`, `.btn-secondary` keep their existing names, only their CSS body changes.

- [ ] **Step 1: Write the failing check**

Append before `await b.close();`:

```js
// ---- Task 5: glass buttons + cards ---------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const styles = await p.evaluate(() => {
    const btn = document.querySelector('.btn-primary');
    const card = document.querySelector('.glass-surface');
    return {
      btnBackdrop: btn && getComputedStyle(btn).backdropFilter,
      cardBackdrop: card && getComputedStyle(card).backdropFilter,
    };
  });
  ok('.btn-primary has a backdrop-filter', styles.btnBackdrop && styles.btnBackdrop !== 'none', styles.btnBackdrop);
  ok('.glass-surface has a backdrop-filter (card weight)', styles.cardBackdrop && styles.cardBackdrop !== 'none', styles.cardBackdrop);

  const sweepExists = await p.evaluate(() => {
    for (const ss of document.styleSheets) {
      let cr; try { cr = ss.cssRules; } catch (e) { continue; }
      for (const r of cr) {
        if (r.selectorText && /\.btn-primary::before/.test(r.selectorText)) return true;
      }
    }
    return false;
  });
  ok('a ::before sweep rule targets .btn-primary', sweepExists);
  await p.close();
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: the 3 new checks FAIL, the 13 earlier checks still PASS.

- [ ] **Step 3: Give `.glass-surface` the `card`-weight recipe**

Find:

```css
  .glass-surface {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
```

Replace with:

```css
  .glass-surface {
    background: linear-gradient(var(--mat-card-tint), var(--mat-card-tint)), var(--mat-card-bg);
    -webkit-backdrop-filter: blur(var(--mat-card-blur)) saturate(var(--mat-card-sat));
    backdrop-filter: blur(var(--mat-card-blur)) saturate(var(--mat-card-sat));
    border: 1px solid var(--mat-card-border);
    border-top-color: var(--mat-card-edge);
    box-shadow: var(--mat-card-shadow), var(--mat-card-inner);
  }
```

- [ ] **Step 4: Give `.btn-primary` the `interactive`-weight recipe, keeping its gradient core**

Find:

```css
  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-hover));
    color: #0a0a0a;
    transition: all 0.2s ease;
  }
```

Replace with:

```css
  .btn-primary {
    position: relative;
    overflow: hidden;
    /* Both gradient stops carry alpha (0.85) rather than being fully opaque — otherwise
       the backdrop-filter blur below would have nothing to show through and would be
       purely decorative CSS with no visible effect. 0.85 keeps the blue/magenta identity
       clearly dominant while still letting a faint blur read through, per the spec's
       "gradient visible through the translucency" requirement. */
    background: linear-gradient(var(--mat-interactive-tint), var(--mat-interactive-tint)), linear-gradient(135deg, rgb(var(--primary-rgb) / 0.85), rgb(var(--primary-hover-rgb) / 0.85));
    -webkit-backdrop-filter: blur(var(--mat-interactive-blur)) saturate(var(--mat-interactive-sat));
    backdrop-filter: blur(var(--mat-interactive-blur)) saturate(var(--mat-interactive-sat));
    border: 1px solid var(--mat-interactive-border);
    border-top-color: var(--mat-interactive-edge);
    box-shadow: var(--mat-interactive-shadow), var(--mat-interactive-inner);
    color: #0a0a0a;
    transition: all 0.2s ease;
  }
```

Note: the hero's main CTA (`class="btn-primary btn-glow-loop"`) inherits the new `backdrop-filter`/border/shadow/`::before` sweep from this rule (CSS cascades property-by-property, not whole-rule), but `.btn-primary.btn-glow-loop`'s own higher-specificity `background` (the existing animated rainbow gradient, untouched by this task) still wins over the one just written above — so that one button's blur-through stays imperceptible behind its opaque animated gradient. That's an accepted, deliberate gap: the glow-loop button already has its own strong, pre-existing visual identity, and giving it the same alpha treatment would mean threading alpha through the `gradient-loop` keyframes too, for a marginal, hard-to-perceive gain. Not required by the spec; not a bug.

- [ ] **Step 5: Give `.btn-secondary` the same treatment (lighter — no solid gradient core, just glass)**

Find:

```css
  .btn-secondary {
    background: transparent;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }
```

Replace with:

```css
  .btn-secondary {
    position: relative;
    overflow: hidden;
    background: linear-gradient(var(--mat-interactive-tint), var(--mat-interactive-tint)), var(--mat-interactive-bg);
    -webkit-backdrop-filter: blur(var(--mat-interactive-blur)) saturate(var(--mat-interactive-sat));
    backdrop-filter: blur(var(--mat-interactive-blur)) saturate(var(--mat-interactive-sat));
    color: #ffffff;
    border: 1px solid var(--mat-interactive-border);
    border-top-color: var(--mat-interactive-edge);
    transition: all 0.2s ease;
  }
```

- [ ] **Step 6: Add the specular sweep**

Add this new block directly after the `.btn-secondary:hover` rule:

```css
  .btn-primary::before, .btn-secondary::before {
    content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
    transform: skewX(-20deg);
    transition: left 0.6s ease;
  }
  .btn-primary:hover::before, .btn-secondary:hover::before { left: 130%; }
```

- [ ] **Step 7: Extend the `prefers-reduced-motion` fallback**

Find (the same `.btn-primary:hover, .btn-secondary:hover { transform: none !important; }` rule from the existing reduced-motion block):

```css
    .card:hover,
    .hover-lift:hover,
    .btn-primary:hover,
    .btn-secondary:hover {
      transform: none !important;
    }
```

Replace with:

```css
    .card:hover,
    .hover-lift:hover,
    .btn-primary:hover,
    .btn-secondary:hover {
      transform: none !important;
    }
    .btn-primary::before, .btn-secondary::before {
      transition: none !important;
    }
```

- [ ] **Step 8: Run the check again, unit tests, commit**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `16/16 checks pass`.

```bash
node --test
git add -A
git commit -m "Apply the interactive/card material weights to buttons and cards

.btn-primary keeps its solid blue->hover gradient core (vibrancy:
color stays on a solid layer) with the interactive glass recipe
layered as its surface treatment; .btn-secondary and .glass-surface
become pure glass. Adds a hover-triggered specular sweep to both
button classes, disabled under prefers-reduced-motion."
```

---

## Task 6: Scroll reveals — migrate to `animation-timeline: view()`

**Files:**
- Modify: `index.html` (`.scroll-reveal` CSS; remove the IntersectionObserver script block)
- Modify: `sdd/browser-checks/dropline-pivot.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `.scroll-reveal` driven by `animation-timeline: view()` with a static-visible `@supports not` fallback. No markup changes — every element currently carrying the `scroll-reveal` class keeps it, unchanged.

- [ ] **Step 1: Write the failing check**

Append before `await b.close();`:

```js
// ---- Task 6: scroll-driven reveals ----------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const usesViewTimeline = await p.evaluate(() => {
    const el = document.querySelector('.scroll-reveal');
    return el && getComputedStyle(el).animationTimeline !== 'auto' && getComputedStyle(el).animationTimeline !== 'normal';
  });
  ok('.scroll-reveal uses animation-timeline: view()', usesViewTimeline);

  const noObserverScript = await p.evaluate(() => !window.IntersectionObserver || !document.querySelector('.scroll-reveal.is-visible'));
  // is-visible is only ever added by the old IO script — its absence after a normal
  // page load (no scrolling triggered) indicates the IO script no longer runs.
  ok('no element carries the old IO-driven is-visible class on load', noObserverScript);

  await p.close();
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: the first new check FAILS (still using the old opacity/transition approach), the second may pass or fail depending on scroll position on load — both are re-verified after the change regardless.

- [ ] **Step 3: Replace the `.scroll-reveal` CSS**

Find:

```css
  .scroll-reveal { opacity: 0; transform: translateY(30px); filter: blur(8px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
  .scroll-reveal.is-visible { opacity: 1; transform: translateY(0); filter: blur(0); }
  .scroll-reveal:nth-child(2) { transition-delay: 0.1s; }
  .scroll-reveal:nth-child(3) { transition-delay: 0.2s; }
  .scroll-reveal:nth-child(4) { transition-delay: 0.3s; }
```

Replace with:

```css
  .scroll-reveal {
    animation: revealIn linear forwards;
    animation-timeline: view();
    animation-range: entry 0% cover 30%;
  }
  @keyframes revealIn {
    from { opacity: 0; transform: translateY(30px); filter: blur(8px); }
    to   { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  @supports not (animation-timeline: view()) {
    .scroll-reveal { opacity: 1; transform: none; filter: none; animation: none; }
  }
```

- [ ] **Step 4: Update the reduced-motion fallback**

Find:

```css
    html { scroll-behavior: auto; }
    .scroll-reveal {
      transform: none;
      filter: none;
      transition: opacity 0.3s ease;
    }
```

Replace with:

```css
    html { scroll-behavior: auto; }
    .scroll-reveal {
      animation: none;
      opacity: 1;
      transform: none;
      filter: none;
    }
```

- [ ] **Step 5: Remove the IntersectionObserver script block**

Find:

```js
  // Scroll reveal
  const revealEls = document.querySelectorAll('.scroll-reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => observer.observe(el));

```

Delete it entirely (nothing else in the file reads `.is-visible` or instantiates an `IntersectionObserver` — confirmed by grep before this task started).

- [ ] **Step 6: Run the check again, unit tests, commit**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `18/18 checks pass`.

```bash
node --test
git add -A
git commit -m "Migrate scroll reveals from IntersectionObserver to animation-timeline: view()

Same visual result (fade + rise + blur-out as a section enters
view), now driven natively by the browser's scroll-timeline rather
than a JS observer toggling a class. @supports not(...) falls back
to immediately-visible content, never permanently hidden. Removes
the now-unused IntersectionObserver script block."
```

---

## Task 7: Floating stat pills and the genre marquee

**Files:**
- Modify: `index.html` (hero stat wrapper divs; new marquee markup + CSS, placed after the hero section)
- Modify: `sdd/browser-checks/dropline-pivot.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `.hero-stat` (float animation class on the 3 existing stat wrappers) and `.marquee-band`/`.marquee-track` (new component). No later task depends on these.

- [ ] **Step 1: Write the failing check**

Append before `await b.close();`:

```js
// ---- Task 7: floating stats + marquee -------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const statCount = await p.evaluate(() => document.querySelectorAll('.hero-stat').length);
  ok('all 3 hero stats carry .hero-stat', statCount === 3, statCount);

  const marquee = await p.evaluate(() => {
    const band = document.querySelector('.marquee-band');
    const track = document.querySelector('.marquee-track');
    return {
      hasBand: !!band,
      ariaHidden: band && band.getAttribute('aria-hidden'),
      itemCount: track ? track.querySelectorAll('span').length : 0,
    };
  });
  ok('.marquee-band exists and is aria-hidden', marquee.hasBand && marquee.ariaHidden === 'true', JSON.stringify(marquee));
  ok('.marquee-track content is duplicated for seamless looping (even, >= 16 spans)',
     marquee.itemCount >= 16 && marquee.itemCount % 2 === 0, marquee.itemCount);

  const getTransform = () => p.evaluate(() => getComputedStyle(document.querySelector('.marquee-track')).transform);
  const m1 = await getTransform();
  await p.waitForTimeout(1000);
  const m2 = await getTransform();
  ok('.marquee-track animates with no interaction', m1 !== m2, `${m1} -> ${m2}`);

  await p.close();
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: the 4 new checks FAIL, the 18 earlier checks still PASS.

- [ ] **Step 3: Add `.hero-stat` to the 3 stat wrapper divs**

Find:

```html
    <div class="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mb-16">
      <div>
        <p class="text-h2 font-bold gradient-text-loop counter" style="animation-delay: 0s">3x</p>
        <p class="text-body-sm text-text-muted mt-1">plus de ventes</p>
      </div>
      <div>
        <p class="text-h2 font-bold gradient-text-loop counter" style="animation-delay: 0.7s">90%</p>
        <p class="text-body-sm text-text-muted mt-1">temps économisé</p>
      </div>
      <div>
        <p class="text-h2 font-bold gradient-text-loop counter" style="animation-delay: 1.4s">24/7</p>
        <p class="text-body-sm text-text-muted mt-1">ton IA vend pour toi</p>
      </div>
    </div>
```

Replace with:

```html
    <div class="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mb-16">
      <div class="hero-stat" style="animation-delay: 0s">
        <p class="text-h2 font-bold gradient-text-loop counter" style="animation-delay: 0s">3x</p>
        <p class="text-body-sm text-text-muted mt-1">plus de ventes</p>
      </div>
      <div class="hero-stat" style="animation-delay: 0.5s">
        <p class="text-h2 font-bold gradient-text-loop counter" style="animation-delay: 0.7s">90%</p>
        <p class="text-body-sm text-text-muted mt-1">temps économisé</p>
      </div>
      <div class="hero-stat" style="animation-delay: 1s">
        <p class="text-h2 font-bold gradient-text-loop counter" style="animation-delay: 1.4s">24/7</p>
        <p class="text-body-sm text-text-muted mt-1">ton IA vend pour toi</p>
      </div>
    </div>
```

- [ ] **Step 4: Add the `.hero-stat` float CSS**

Add this new block directly after the `.counter` rule:

```css
  .hero-stat { animation: statFloat 5s ease-in-out infinite; }
  @keyframes statFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
```

- [ ] **Step 5: Add `.hero-stat` to the reduced-motion fallback**

Find (same list as Task 4/5's edits — by this point it reads):

```css
    .loading-pulse,
    .card,
    .hover-lift,
    .image-treatment,
    .btn-primary,
    .btn-secondary,
    .gradient-text-loop,
    .wave-loop-a,
    .wave-loop-b {
      animation: none !important;
      transition: opacity 0.2s ease !important;
    }
```

Replace with:

```css
    .loading-pulse,
    .card,
    .hover-lift,
    .image-treatment,
    .btn-primary,
    .btn-secondary,
    .gradient-text-loop,
    .wave-loop-a,
    .wave-loop-b,
    .hero-stat,
    .marquee-track {
      animation: none !important;
      transition: opacity 0.2s ease !important;
    }
```

- [ ] **Step 6: Add the marquee CSS**

Add this new block directly after the `.hero-stat`/`statFloat` rule from Step 4:

```css
  .marquee-band {
    overflow: hidden; background: #121218;
    border-top: 1px solid var(--hairline);
    mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  }
  .marquee-track {
    display: flex; gap: 3rem; width: max-content;
    padding: 1rem 0; white-space: nowrap;
    font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; letter-spacing: 0.08em;
    text-transform: uppercase; color: #8D8B9B;
    animation: marqueeScroll 24s linear infinite;
  }
  @keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
```

- [ ] **Step 7: Add the marquee markup, directly after the hero `</section>` and before the section divider that precedes "PROBLEM"**

Find:

```html
</section>

<div class="section-divider max-w-wide mx-auto"></div>

<!-- PROBLEM -->
```

Replace with:

```html
</section>

<!-- MARQUEE -->
<div class="marquee-band" aria-hidden="true">
  <div class="marquee-track">
    <span>R&amp;B/Swag</span><span>West Coast</span><span>Trap</span><span>Drill</span>
    <span>Boom Bap</span><span>Afro</span><span>Cloud</span><span>Detroit</span>
    <span>R&amp;B/Swag</span><span>West Coast</span><span>Trap</span><span>Drill</span>
    <span>Boom Bap</span><span>Afro</span><span>Cloud</span><span>Detroit</span>
  </div>
</div>

<div class="section-divider max-w-wide mx-auto"></div>

<!-- PROBLEM -->
```

- [ ] **Step 8: Run the check again, unit tests, commit**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `22/22 checks pass`.

```bash
node --test
git add -A
git commit -m "Add floating drift to the hero stats and a new genre marquee

.hero-stat layers a gentle vertical-drift loop on top of the
existing counter/stagger animation on the 3 hero stats (3x/90%/24-7)
— no new markup, just a class + a wrapper animation-delay. New
.marquee-band under the hero: infinite horizontal loop of beat
styles (the 3 already in the hero-demo style picker + 5 more),
content duplicated once for a seamless loop, aria-hidden since it's
decorative."
```

---

## Task 8: Accessibility fallbacks, contrast verification, full regression pass

**Files:**
- Modify: `index.html` (`prefers-reduced-transparency`/`prefers-contrast` blocks — extend to buttons/cards)
- Modify: `sdd/browser-checks/dropline-pivot.mjs`

**Interfaces:**
- Consumes: everything from Tasks 1–7.
- Produces: nothing new for later tasks — this is the terminal task of the plan.

- [ ] **Step 1: Write the failing checks**

Append before `await b.close();`:

```js
// ---- Task 8: accessibility fallbacks + full regression --------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  // reduced transparency: buttons/cards go opaque, no blur
  const rtRuleTargets = await p.evaluate(() => {
    const found = { btn: false, card: false };
    for (const ss of document.styleSheets) {
      let cr; try { cr = ss.cssRules; } catch (e) { continue; }
      for (const r of cr) {
        if (r.type === CSSRule.MEDIA_RULE && /prefers-reduced-transparency:\s*reduce/.test(r.conditionText || r.media.mediaText)) {
          if (/\.btn-primary/.test(r.cssText)) found.btn = true;
          if (/\.glass-surface/.test(r.cssText)) found.card = true;
        }
      }
    }
    return found;
  });
  ok('prefers-reduced-transparency covers .btn-primary', rtRuleTargets.btn);
  ok('prefers-reduced-transparency covers .glass-surface', rtRuleTargets.card);

  await p.close();
}

// ---- Task 8: reduced motion — everything animated goes static -------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);

  const sample = () => p.evaluate(() => ({
    waveA: getComputedStyle(document.querySelector('.wave-loop-a')).transform,
    marquee: getComputedStyle(document.querySelector('.marquee-track')).transform,
    stat: getComputedStyle(document.querySelector('.hero-stat')).transform,
  }));
  const s1 = await sample();
  await p.waitForTimeout(700);
  const s2 = await sample();
  ok('aurora is static under prefers-reduced-motion', s1.waveA === s2.waveA, `${s1.waveA} / ${s2.waveA}`);
  ok('marquee is static under prefers-reduced-motion', s1.marquee === s2.marquee, `${s1.marquee} / ${s2.marquee}`);
  ok('stat float is static under prefers-reduced-motion', s1.stat === s2.stat, `${s1.stat} / ${s2.stat}`);

  const revealsVisible = await p.evaluate(() =>
    Array.from(document.querySelectorAll('.scroll-reveal')).every(el => getComputedStyle(el).opacity === '1')
  );
  ok('all .scroll-reveal elements are visible under prefers-reduced-motion', revealsVisible);

  await p.close();
}

// ---- Task 8: no-regression sweep over every remaining section -------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const sections = await p.evaluate(() => {
    const ids = ['solutions', 'catalog-showcase', 'process', 'cta-final'];
    return ids.map((id) => {
      const el = document.getElementById(id);
      return { id, height: el ? el.getBoundingClientRect().height : 0 };
    });
  });
  for (const s of sections) {
    ok(`#${s.id} renders with height > 40px`, s.height > 40, s.height);
  }

  for (const width of [390, 768, 1440]) {
    const p2 = await b.newPage({ viewport: { width, height: 900 } });
    await p2.goto(URL, { waitUntil: 'networkidle' });
    const hasHScroll = await p2.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    ok(`no horizontal scroll at ${width}px`, !hasHScroll);
    await p2.close();
  }

  await p.close();
}
```

- [ ] **Step 2: Run to confirm the new fallback checks fail, the regression checks likely already pass**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: the 2 `prefers-reduced-transparency` checks FAIL (not extended yet); the reduced-motion and regression checks should already PASS (Tasks 4-7 already added their own reduced-motion rules) — if any of those unexpectedly fail, that's a real bug from an earlier task, stop and fix it before continuing (per the project's established process: resolve bugs before moving on).

- [ ] **Step 3: Extend the `prefers-reduced-transparency` fallback to buttons and cards**

Find (this block currently only targets the navbar):

```css
  @media (prefers-reduced-transparency: reduce) {
    #navbar,
    #nav-mobile,
    #navbar.navbar-scrolled {
      background: rgba(10, 10, 10, 0.94) !important;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }
```

Replace with:

```css
  @media (prefers-reduced-transparency: reduce) {
    #navbar,
    #nav-mobile,
    #navbar.navbar-scrolled {
      background: rgba(10, 10, 10, 0.94) !important;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
    .btn-primary, .btn-secondary {
      background: rgba(20, 20, 26, 0.98);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
    .btn-primary::before, .btn-secondary::before {
      display: none;
    }
    .glass-surface {
      background: rgba(20, 20, 26, 0.98);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }
```

- [ ] **Step 4: Extend the `prefers-contrast: more` fallback the same way**

Find:

```css
  @media (prefers-contrast: more) {
    #navbar,
    #navbar.navbar-scrolled {
      background: rgba(8, 8, 8, 0.97) !important;
      border-top-color: rgba(255, 255, 255, 0.5);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }
```

Replace with:

```css
  @media (prefers-contrast: more) {
    #navbar,
    #navbar.navbar-scrolled {
      background: rgba(8, 8, 8, 0.97) !important;
      border-top-color: rgba(255, 255, 255, 0.5);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
    .btn-primary, .btn-secondary, .glass-surface {
      border-color: rgba(255, 255, 255, 0.5);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }
```

- [ ] **Step 5: Run the check again**

```bash
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `35/35 checks pass` (22 from Tasks 1–7 + 13 new: 2 reduced-transparency + 4 reduced-motion + 4 section-height regressions + 3 no-horizontal-scroll checks).

- [ ] **Step 6: Worst-case contrast — manual/visual verification**

Scroll the live page so the brightest part of the hero aurora sits directly behind the nav links and behind a `.btn-secondary` label; visually confirm text stays clearly legible. If `pngjs` resolves (`node -e "import('pngjs').then(()=>console.log('OK')).catch(e=>console.error('MISSING'))" --input-type=module`), this can be measured precisely instead of eyeballed — if it prints `MISSING`, the fix used previously on this worktree was symlinking the sibling npx cache dir that actually contains `pngjs`:

```bash
ln -sfn ~/.npm/_npx/4c960816c1d4a16a/node_modules/pngjs ~/.npm/_npx/e41f203b7505f1fb/node_modules/pngjs
```

(adjust the two hashes if they've changed since — find them with `ls ~/.npm/_npx/` and check which one contains a `pngjs` directory). This is optional polish, not a blocker — the visual check is sufficient to close this task.

- [ ] **Step 7: Full final regression sweep**

```bash
node --test
node sdd/browser-checks/dropline-pivot.mjs
```

Expected: `node --test` → `12 passing`. `dropline-pivot.mjs` → `35/35 checks pass`.

Kill the background HTTP server (`kill %1` or find/kill the `http.server` PID) — it's no longer needed once this task is committed.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Extend accessibility fallbacks to buttons and cards; final regression pass

prefers-reduced-transparency and prefers-contrast now cover
.btn-primary/.btn-secondary/.glass-surface the same way they already
covered the navbar. Closes out the Dropline visual pivot: full
node --test + Playwright check suite green (12 unit tests, 35
browser checks covering palette, fonts, material system, aurora,
buttons/cards, reveals, stats/marquee, and every accessibility
fallback)."
```

---

## After this plan ships

Not part of this plan (tracked in memory, [[beatreply-ambiance-background]]):
- Merge `worktree-ambient-background` back to `main` and clean up the worktree — a decision for Corentin once the result is visually approved on the real page, not automatic.
- Rewrite `CLAUDE.md` and the `beatreply-brand-color-pivot` memory with the new Dropline palette (deferred to after this ships, per the spec's scope).
- `beatreply-dashboard` palette pivot — separate future chantier.
- Carousel branch/worktree housekeeping (`carousel-abandoned` tag + delete) — unrelated pending item, still outstanding.
