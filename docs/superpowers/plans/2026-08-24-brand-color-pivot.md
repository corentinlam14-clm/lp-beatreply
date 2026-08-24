# Brand Color Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace BeatReply's cyan/purple accent palette with orange/gold across the landing page, refactoring the currently-hardcoded hex values into CSS custom properties so future tweaks are a small, localized change instead of a file-wide search-and-replace.

**Architecture:** Pure CSS/config edit to a single static HTML file (`index.html`) plus two documentation files (`design.md`, `CLAUDE.md`) kept in sync with it. No JavaScript, no build step, no new components. `index.html`'s embedded Tailwind config (CDN/Play build, v3-style `theme.extend.colors`) will reference `var(--primary)` etc. instead of literal hex, backed by a new `:root` block in the existing `<style>` tag.

**Tech Stack:** Static HTML + Tailwind CDN config, plain CSS custom properties (no preprocessor, no build step for this file).

## Global Constraints

- Exact new values (from the approved spec, copy verbatim): `--primary: #FF9D42`, `--primary-hover: #F58B29`, `--primary-muted: rgba(255, 157, 66, 0.1)`, `--primary-rgb: 255, 157, 66`, `--secondary: #C97B24`, `--secondary-hover: #B36A1C`, `--secondary-rgb: 201, 123, 36`, `--accent: #FF9D42`, `--accent-hover: #F58B29`, `--accent-muted: rgba(255, 157, 66, 0.15)`.
- Every existing opacity value in a given `rgba(...)` call stays exactly as it was — only the color base changes (e.g. `rgba(0, 217, 255, 0.3)` → `rgba(var(--primary-rgb), 0.3)`, the `0.3` does not change).
- Scope is `lp-beatreply` only — do not touch `beatreply-dashboard`.
- Do not touch the logo, the "BeatReply"/"Beat Reply" wordmark, or add any liquid-glass/animation effects — out of scope per the spec.
- The favicon (`index.html:10`, SVG data-URI) cannot reference a CSS variable — its hex must be replaced literally.
- No other color tokens (`background`, `surface`, `text-*`, `border-*`, `success`, `error`, `warning`) change.

---

### Task 1: Refactor index.html to CSS custom properties with the new palette

**Files:**
- Modify: `/Users/corentin/Documents/Projects/lp-beatreply/index.html` (lines 10, 25-88, 90-214 — every occurrence of the old palette)
- Test: none (static content, no test suite covers this file's styling) — verified via `grep` (no old color values remain except as noted) plus a manual visual check in this task's own steps

**Interfaces:**
- Consumes: nothing (first task)
- Produces: the `:root` custom properties `--primary`, `--primary-hover`, `--primary-muted`, `--primary-rgb`, `--secondary`, `--secondary-hover`, `--secondary-rgb`, `--accent`, `--accent-hover`, `--accent-muted` — Task 2 references these same names when updating `design.md`, so keep them identical.

- [ ] **Step 1: Confirm current content matches expectations before editing**

Run:
```bash
grep -c "00D9FF\|8B5CF6\|00C4E6\|217, 255\|139, 92, 246" /Users/corentin/Documents/Projects/lp-beatreply/index.html
```
Expected output: `28` (28 matching lines — confirms nothing has drifted since the plan was written). If the count differs, stop and re-read `index.html` before proceeding.

- [ ] **Step 2: Add the `:root` custom properties block**

In `index.html`, find this exact line (currently line 90):
```html
<style>
  html { background: #0a0a0a; scroll-behavior: smooth; }
```

Replace it with:
```html
<style>
  :root {
    --primary: #FF9D42;
    --primary-hover: #F58B29;
    --primary-muted: rgba(255, 157, 66, 0.1);
    --primary-rgb: 255, 157, 66;
    --secondary: #C97B24;
    --secondary-hover: #B36A1C;
    --secondary-rgb: 201, 123, 36;
    --accent: #FF9D42;
    --accent-hover: #F58B29;
    --accent-muted: rgba(255, 157, 66, 0.15);
  }

  html { background: #0a0a0a; scroll-behavior: smooth; }
```

- [ ] **Step 3: Point the Tailwind config at the new CSS variables**

Find this exact block (currently lines 28-37):
```js
        colors: {
          primary: '#00D9FF',
          'primary-hover': '#00C4E6',
          'primary-muted': 'rgba(0, 217, 255, 0.1)',
          secondary: '#8B5CF6',
          'secondary-hover': '#7C3AED',
          accent: '#00D9FF',
          'accent-hover': '#00C4E6',
          'accent-muted': 'rgba(0, 217, 255, 0.15)',
          background: '#0a0a0a',
```

Replace it with:
```js
        colors: {
          primary: 'var(--primary)',
          'primary-hover': 'var(--primary-hover)',
          'primary-muted': 'var(--primary-muted)',
          secondary: 'var(--secondary)',
          'secondary-hover': 'var(--secondary-hover)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          'accent-muted': 'var(--accent-muted)',
          background: '#0a0a0a',
```

- [ ] **Step 4: Update the `boxShadow.glow` value**

Find this exact line (currently line 83):
```js
          glow: '0 0 30px rgba(0, 217, 255, 0.15), 0 0 60px rgba(0, 217, 255, 0.08)',
```

Replace it with:
```js
          glow: '0 0 30px rgba(var(--primary-rgb), 0.15), 0 0 60px rgba(var(--primary-rgb), 0.08)',
```

- [ ] **Step 5: Update `.gradient-text` and `.text-glow`**

Find this exact block (currently lines 94-101):
```css
  .gradient-text {
    background: linear-gradient(135deg, #00D9FF, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .text-glow { text-shadow: 0 0 20px rgba(0, 217, 255, 0.4); }
```

Replace it with:
```css
  .gradient-text {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .text-glow { text-shadow: 0 0 20px rgba(var(--primary-rgb), 0.4); }
```

- [ ] **Step 6: Update `.hero-gradient` and `.accent-gradient`**

Find this exact block (currently lines 103-110):
```css
  .hero-gradient {
    background:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 217, 255, 0.15), transparent),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(139, 92, 246, 0.1), transparent),
      linear-gradient(180deg, #0a0a0a 0%, rgba(0, 0, 0, 0.95) 100%);
  }

  .accent-gradient { background: linear-gradient(135deg, #00D9FF, #00C4E6); }
```

Replace it with:
```css
  .hero-gradient {
    background:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(var(--primary-rgb), 0.15), transparent),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(var(--secondary-rgb), 0.1), transparent),
      linear-gradient(180deg, #0a0a0a 0%, rgba(0, 0, 0, 0.95) 100%);
  }

  .accent-gradient { background: linear-gradient(135deg, var(--primary), var(--primary-hover)); }
```

- [ ] **Step 7: Update the showcase cover gradients**

Find this exact block (currently lines 112-114):
```css
  .showcase-cover-rnbswag { background: linear-gradient(135deg, #8B5CF6, #00D9FF); }
  .showcase-cover-westcoast { background: linear-gradient(135deg, #00D9FF, #8B5CF6); }
  .showcase-cover-trap { background: linear-gradient(160deg, #00D9FF 0%, #8B5CF6 55%, #0a0a0a 100%); }
```

Replace it with:
```css
  .showcase-cover-rnbswag { background: linear-gradient(135deg, var(--secondary), var(--primary)); }
  .showcase-cover-westcoast { background: linear-gradient(135deg, var(--primary), var(--secondary)); }
  .showcase-cover-trap { background: linear-gradient(160deg, var(--primary) 0%, var(--secondary) 55%, #0a0a0a 100%); }
```

- [ ] **Step 8: Update the glow orbs and section divider**

Find this exact block (currently lines 137-151):
```css
  .glow-orb-1 {
    position: absolute; top: 10%; right: 15%; width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(0, 217, 255, 0.15), transparent);
    filter: blur(40px); border-radius: 50%; z-index: 0; pointer-events: none;
  }
  .glow-orb-2 {
    position: absolute; bottom: 20%; left: 10%; width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent);
    filter: blur(60px); border-radius: 50%; z-index: 0; pointer-events: none;
  }

  .section-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(0, 217, 255, 0.3), transparent);
  }
```

Replace it with:
```css
  .glow-orb-1 {
    position: absolute; top: 10%; right: 15%; width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(var(--primary-rgb), 0.15), transparent);
    filter: blur(40px); border-radius: 50%; z-index: 0; pointer-events: none;
  }
  .glow-orb-2 {
    position: absolute; bottom: 20%; left: 10%; width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(var(--secondary-rgb), 0.1), transparent);
    filter: blur(60px); border-radius: 50%; z-index: 0; pointer-events: none;
  }

  .section-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(var(--primary-rgb), 0.3), transparent);
  }
```

- [ ] **Step 9: Update `.btn-primary` and its glow-loop variant**

Find this exact block (currently lines 153-165):
```css
  .btn-primary {
    background: linear-gradient(135deg, #00D9FF, #00C4E6);
    color: #0a0a0a;
    transition: all 0.2s ease;
  }
  .btn-primary:hover { transform: scale(1.02); box-shadow: 0 0 30px rgba(0, 217, 255, 0.15), 0 0 60px rgba(0, 217, 255, 0.08); }
  .btn-primary:active { transform: scale(0.98); }

  .btn-primary.btn-glow-loop {
    background: linear-gradient(90deg, #00D9FF, #8B5CF6, #00C4E6, #00D9FF);
    background-size: 300% 100%;
    animation: gradient-loop 6s ease-in-out infinite;
  }
```

Replace it with:
```css
  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-hover));
    color: #0a0a0a;
    transition: all 0.2s ease;
  }
  .btn-primary:hover { transform: scale(1.02); box-shadow: 0 0 30px rgba(var(--primary-rgb), 0.15), 0 0 60px rgba(var(--primary-rgb), 0.08); }
  .btn-primary:active { transform: scale(0.98); }

  .btn-primary.btn-glow-loop {
    background: linear-gradient(90deg, var(--primary), var(--secondary), var(--primary-hover), var(--primary));
    background-size: 300% 100%;
    animation: gradient-loop 6s ease-in-out infinite;
  }
```

- [ ] **Step 10: Update `.gradient-text-loop`, `.btn-secondary:hover`, and focus-visible outline**

Find this exact block (currently lines 172-193):
```css
  .gradient-text-loop {
    background: linear-gradient(90deg, #00D9FF, #8B5CF6, #00C4E6, #00D9FF);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradient-loop 6s ease-in-out infinite;
  }

  .btn-secondary {
    background: transparent;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }
  .btn-secondary:hover { border-color: #00D9FF; background: rgba(0, 217, 255, 0.1); transform: scale(1.02); }

  a:focus-visible, button:focus-visible {
    outline: 2px solid #00D9FF;
    outline-offset: 2px;
    border-radius: 4px;
  }
```

Replace it with:
```css
  .gradient-text-loop {
    background: linear-gradient(90deg, var(--primary), var(--secondary), var(--primary-hover), var(--primary));
    background-size: 300% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradient-loop 6s ease-in-out infinite;
  }

  .btn-secondary {
    background: transparent;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }
  .btn-secondary:hover { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.1); transform: scale(1.02); }

  a:focus-visible, button:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
```

- [ ] **Step 11: Update `.skip-link` and `.card:hover`**

Find this exact block (currently lines 195-211):
```css
  .skip-link {
    position: absolute;
    top: -100%;
    left: 1rem;
    z-index: 100;
    background: #00D9FF;
    color: #0a0a0a;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    transition: top 0.2s ease;
  }
  .skip-link:focus { top: 1rem; }

  .card { transition: all 0.3s ease; }
  .card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.12), 0 20px 40px rgba(0, 0, 0, 0.08); border-color: rgba(0, 217, 255, 0.3); }
```

Replace it with:
```css
  .skip-link {
    position: absolute;
    top: -100%;
    left: 1rem;
    z-index: 100;
    background: var(--primary);
    color: #0a0a0a;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    transition: top 0.2s ease;
  }
  .skip-link:focus { top: 1rem; }

  .card { transition: all 0.3s ease; }
  .card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.12), 0 20px 40px rgba(0, 0, 0, 0.08); border-color: rgba(var(--primary-rgb), 0.3); }
```

- [ ] **Step 12: Update the favicon (the one hardcoded exception)**

Find this exact line (currently line 10):
```html
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230a0a0a'/%3E%3Ctext x='16' y='23' font-family='Arial, sans-serif' font-weight='800' font-size='20' fill='%2300D9FF' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E">
```

Replace it with:
```html
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230a0a0a'/%3E%3Ctext x='16' y='23' font-family='Arial, sans-serif' font-weight='800' font-size='20' fill='%23FF9D42' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E">
```

(This is a SVG embedded directly in a data-URI attribute — it cannot read a CSS variable, so this is the one place the new hex is written literally rather than via `var(...)`, exactly as called out in the spec's Architecture section.)

- [ ] **Step 13: Verify no old color values remain**

Run:
```bash
grep -n "00D9FF\|8B5CF6\|00C4E6\|7C3AED\|217, 255\|139, 92, 246" /Users/corentin/Documents/Projects/lp-beatreply/index.html
```
Expected: no output (empty — every old-palette occurrence, including the favicon, has been replaced).

- [ ] **Step 14: Verify the new custom properties and Tailwind config are wired correctly**

Run:
```bash
grep -n "^\s*--primary:\|^\s*--secondary:\|primary: 'var(--primary)'\|glow: '0 0 30px rgba(var" /Users/corentin/Documents/Projects/lp-beatreply/index.html
```
Expected (4 matching lines, confirming the `:root` block and the Tailwind config both reference the new system):
```
        --primary: #FF9D42;
        --secondary: #C97B24;
          primary: 'var(--primary)',
          glow: '0 0 30px rgba(var(--primary-rgb), 0.15), 0 0 60px rgba(var(--primary-rgb), 0.08)',
```
(Exact leading whitespace may differ slightly from this preview — the important part is that all 4 lines match.)

- [ ] **Step 15: Manual visual check in a browser**

Open `index.html` directly in a browser, and check:
- The whole page (nav, hero, buttons, section dividers, glow effects, gradient text, catalog showcase covers, focus rings when tabbing) now renders in orange/gold instead of cyan/purple — no leftover cyan or purple anywhere
- The "Essai gratuit" button (`.btn-primary`) has readable dark text on its orange background (this was verified mathematically in the spec — ~9.6:1 contrast — but confirm visually too)
- Tab through the page and confirm the focus outline (`:focus-visible`) is now orange
- Resize to mobile width — nothing regressed structurally (this task didn't touch layout, only color values, so this should be a quick sanity check, not a full re-test)

- [ ] **Step 16: Commit**

```bash
cd /Users/corentin/Documents/Projects/lp-beatreply
git add index.html
git commit -m "$(cat <<'EOF'
Pivot landing page accent colors from cyan/purple to orange/gold

Refactors the previously-hardcoded hex values into :root CSS custom
properties (--primary, --secondary, plus --primary-rgb/--secondary-rgb
for opacity variants) so future palette tweaks are a small localized
change. Tailwind's config now references these variables instead of
literal hex. The favicon's inline SVG data-URI is the one place that
still needs a literal hex value, since SVG attributes can't read CSS
variables.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Sync design.md and CLAUDE.md with the new palette

**Files:**
- Modify: `/Users/corentin/Documents/Projects/lp-beatreply/design.md:8-19`
- Modify: `/Users/corentin/CLAUDE.md` (the "Guidelines Images" section's "Palette d'ambiance" line)
- Test: none (documentation-only) — verified via `grep`

**Interfaces:**
- Consumes: the exact `:root` custom property names and values from Task 1 (must match `index.html` exactly, or the two documents drift apart again)
- Produces: nothing consumed by a later task — this is the last task in this plan

- [ ] **Step 1: Confirm design.md's current content matches expectations**

Run:
```bash
grep -n "00D9FF\|8B5CF6\|00C4E6\|7C3AED" /Users/corentin/Documents/Projects/lp-beatreply/design.md
```
Expected output (5 matching lines, confirming nothing has drifted):
```
8:  --primary: #00D9FF;
9:  --primary-hover: #00C4E6;
10:  --primary-muted: rgba(0, 217, 255, 0.1);
13:  --secondary: #8B5CF6;
14:  --secondary-hover: #7C3AED;
17:  --accent: #00D9FF;
18:  --accent-hover: #00C4E6;
19:  --accent-muted: rgba(0, 217, 255, 0.15);
```
(If your grep tool prints more or fewer than these 8 lines, stop and re-read `design.md:1-41` before proceeding — the file may have changed since this plan was written.)

- [ ] **Step 2: Update design.md's `:root` block**

Find this exact block (currently `design.md:6-19`):
```css
:root {
  /* Primary */
  --primary: #00D9FF;
  --primary-hover: #00C4E6;
  --primary-muted: rgba(0, 217, 255, 0.1);

  /* Secondary */
  --secondary: #8B5CF6;
  --secondary-hover: #7C3AED;

  /* Accent & Glow */
  --accent: #00D9FF;
  --accent-hover: #00C4E6;
  --accent-muted: rgba(0, 217, 255, 0.15);
```

Replace it with:
```css
:root {
  /* Primary */
  --primary: #FF9D42;
  --primary-hover: #F58B29;
  --primary-muted: rgba(255, 157, 66, 0.1);
  --primary-rgb: 255, 157, 66;

  /* Secondary */
  --secondary: #C97B24;
  --secondary-hover: #B36A1C;
  --secondary-rgb: 201, 123, 36;

  /* Accent & Glow */
  --accent: #FF9D42;
  --accent-hover: #F58B29;
  --accent-muted: rgba(255, 157, 66, 0.15);
```

- [ ] **Step 3: Update design.md's contrast comment to reflect the new palette**

Find this exact line (`design.md:406`):
```css
  color: var(--background); /* corrigé le 06/08/2026 : blanc sur --accent (#00D9FF) ne fait que ~1.75:1, illisible. --background (#0a0a0a) sur --accent fait ~11:1. */
```

Replace it with:
```css
  color: var(--background); /* corrigé le 06/08/2026 : blanc sur --accent (#00D9FF) ne fait que ~1.75:1, illisible. --background (#0a0a0a) sur --accent fait ~11:1. Revérifié le 24/08/2026 après le pivot orange/doré : --background sur --accent (#FF9D42) donne ~9.6:1, blanc sur --accent donnerait ~2.1:1 — le choix de --background comme couleur de texte reste correct. */
```

- [ ] **Step 4: Update CLAUDE.md's palette description**

Find this exact line in `/Users/corentin/CLAUDE.md`:
```
**Palette d'ambiance :** Tons sombres avec éclats néon cyan, violet profond
```

Replace it with:
```
**Palette d'ambiance :** Tons sombres avec éclats orange chaud, doré profond
```

- [ ] **Step 5: Verify no old color values remain in either doc**

Run:
```bash
grep -n "00D9FF\|8B5CF6\|00C4E6\|7C3AED\|cyan, violet profond" /Users/corentin/Documents/Projects/lp-beatreply/design.md /Users/corentin/CLAUDE.md
```
Expected: no output (empty).

Run:
```bash
grep -n "FF9D42\|C97B24\|orange chaud, doré profond" /Users/corentin/Documents/Projects/lp-beatreply/design.md /Users/corentin/CLAUDE.md
```
Expected (4 matching lines confirming the new values landed in both files):
```
/Users/corentin/Documents/Projects/lp-beatreply/design.md:8:  --primary: #FF9D42;
/Users/corentin/Documents/Projects/lp-beatreply/design.md:17:  --accent: #FF9D42;
/Users/corentin/Documents/Projects/lp-beatreply/design.md:13:  --secondary: #C97B24;
/Users/corentin/CLAUDE.md:XX:**Palette d'ambiance :** Tons sombres avec éclats orange chaud, doré profond
```
(Line numbers may vary slightly — the content match is what matters.)

- [ ] **Step 6: Commit design.md**

```bash
cd /Users/corentin/Documents/Projects/lp-beatreply
git add design.md
git commit -m "$(cat <<'EOF'
Sync design.md palette with the orange/gold pivot

Keeps the documented design system in sync with index.html so the
two don't drift — same values, same variable names, contrast
comment updated with the re-verified ratio.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**Note for the implementer:** `/Users/corentin/CLAUDE.md` lives outside the `lp-beatreply` git repository, in `/Users/corentin`, which is **not a git repository** (confirmed: `git -C /Users/corentin rev-parse --is-inside-work-tree` fails with "fatal: not a git repository"). Do not attempt to commit it — leave the edit from Step 4 in place as a plain file change and just note in your report that it was edited but not committed (nothing to commit it to).
