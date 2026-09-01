# Ambient Background + Navbar Material — Design Spec

**Date:** 2026-08-31
**Status:** approved (brainstorm), ready for implementation plan
**Supersedes:** the abandoned Process-section liquid-glass carousel (branch `worktree-process-carousel`, never merged — killed for scroll-lag jank + mobile unusability). Production keeps the existing static 3-step Process grid.

## Goal

Give the whole landing page a warm ambient atmosphere that matches BeatReply's black + orange/gold signature: **one full-page, softly-animated "light field" behind everything**, plus a small, well-defined **material (frosted-glass) system** whose first and only application this phase is the sticky navbar.

This is **phase 1 of two**. Phase 1 = the ambience layer + the material tokens + navbar. A later "relooking" phase applies the material tokens to content sections and may add further background layers. Nothing structural, no copy changes, no layout changes in phase 1.

## The core constraint (why the carousel died)

The carousel drove a scrolling visual with a JS `scroll` handler repositioning `position:fixed` DOM nodes. The handler runs after paint, so the visual trailed the page by a frame+ on every scroll (~0.5 s catch-up) and stuttered. **Phase 1's background must never do that:** it is one continuously-painted layer whose motion is a function of elapsed time only, with zero coupling to scroll position. Reference feel: dmforme.com (one full-screen `<canvas>` 2D painting a slow blurred colored-light field).

## In scope

1. Animated ambient background `<canvas>`, site-wide, behind all content.
2. CSS material token system — 3 weights (`structural`, `card`, `interactive`) defined in `:root`.
3. Apply the `structural` material to `#navbar` (replacing its current `bg-background/80 backdrop-blur-2xl`), including vibrancy on its text and a soft scroll-edge separation.
4. Accessibility fallbacks: `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast`, and no-canvas degradation.
5. A Playwright verification script following the `sdd/browser-checks/` pattern.

## Out of scope (phase 2 "relooking", not now)

- Applying `--mat-card` / `--mat-interactive` to any section.
- Glass panels on Hero, Process, or any other section.
- A second background layer (god-rays, aurora ribbons) over the light field.
- True per-frame adaptive tinting (sampling canvas pixels behind a panel).
- Any layout, structure, copy, font, or spacing change.
- Cleaning up the abandoned carousel branch (tag `carousel-abandoned` + delete) — a separate housekeeping task, tracked in memory, not part of this plan.

## Global constraints

- Single static `index.html` + one new `assets/js/ambient-bg.js`. No build step, no framework, no new runtime dependency (no CDN lib).
- Brand palette only: base `#060608`/`#0a0a0a`, orange `#FF9D42`, bronze `#C97B24`, plus the gold highlight `#FFC978` and a dark-amber `#7a430f` used only inside the light field. The existing `--primary-rgb` / `--secondary-rgb` CSS vars stay as-is.
- Vanilla ES5-ish JS matching the house style of `assets/js/catalog-demo.js` etc. (IIFE, `var`, feature-detect before use).
- Respect `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more`.
- Must not regress any existing section (Hero, Solutions, Catalog showcase, Testimonials, CTA) — no `.ambient-*` / material CSS may affect anything outside `#ambient-bg` and `#navbar` this phase.
- Target: 60 fps, < ~2% desktop CPU for the background, zero scroll jank (structurally guaranteed — the background does not read scroll).

---

## 1. Ambient background canvas

### 1.1 DOM & layering

- Add, as the **first child of `<body>`**:
  ```html
  <canvas id="ambient-bg" aria-hidden="true"></canvas>
  ```
- CSS:
  ```css
  #ambient-bg {
    position: fixed; inset: 0; width: 100%; height: 100%;
    z-index: 0; pointer-events: none; display: block;
    background: #0a0a0a; /* shown before/without JS, and under prefers-reduced-transparency */
  }
  ```
- The page's existing top-level content must sit above it, without touching layout. Use a single rule:
  ```css
  body > *:not(#ambient-bg) { position: relative; z-index: 1; }
  ```
  This lifts every existing top-level element (skip-link, `#navbar`, `#main-content`, any section/divider/footer after it) above the canvas in one line, no enumeration, no wrapper. `position: relative` with no offsets is layout-neutral. Verify nothing already at `<body>` top level depends on a lower/auto z-index that this reorders — the navbar is `z-50` (unaffected, still highest), `.process-*` z-indexes live inside `#main-content` and are untouched, `#nav-mobile` is inside `#navbar`.
- `#ambient-bg` has no `id` collision and is `aria-hidden`, not focusable, `pointer-events:none` → invisible to AT and to hit-testing.

### 1.2 Rendering

New file `assets/js/ambient-bg.js`, loaded with `<script defer src="assets/js/ambient-bg.js"></script>` alongside the other `assets/js/*` includes.

- IIFE, no exports needed (pure side-effect module) — but expose the render function on `window.BeatReplyAmbientBg` for testability (mirrors the other modules' dual pattern), plus the pure helper(s) so they can be unit-tested with `node --test` like the carousel's math was.
- **Feature gate:** if `!canvas.getContext` or `!window.requestAnimationFrame`, do nothing — the CSS `background:#0a0a0a` stands.
- **Backing store:** size to `clientWidth/Height * min(devicePixelRatio, 1.5)`; `ctx.setTransform(dpr,0,0,dpr,0,0)`. Re-fit on `resize` (debounced to an rAF).
- **The field:** 4 blobs, each `{ hue, bx, by, sx, sy, phase, r }`:

  | hue | base x | base y | speed x | speed y | phase | radius k |
  |---|---|---|---|---|---|---|
  | `#FF9D42` | 0.30 | 0.55 | 0.10 | 0.07 | 0 | 0.95 |
  | `#C97B24` | 0.72 | 0.32 | 0.07 | 0.12 | 2 | 1.15 |
  | `#FFC978` | 0.52 | 0.78 | 0.14 | 0.05 | 4 | 0.70 |
  | `#7a430f` | 0.16 | 0.18 | 0.05 | 0.09 | 1 | 1.25 |

  Per frame at time `t` seconds:
  - clear to `#060608` (`globalCompositeOperation='source-over'`)
  - `globalCompositeOperation='lighter'`
  - for each blob: `x = (bx + 0.12*sin(t*sx*2π + phase)) * w`, `y = (by + 0.12*cos(t*sy*2π + phase)) * h`, `radius = max(w,h) * 0.6 * r * 1.12`
  - radial gradient `x,y,0 → x,y,radius`: stop 0 = `hue` @ alpha `0x33` (~0.20), stop 0.42 = `hue` @ `~0x13`, stop 1 = `hue` @ `00`
  - fill the viewport rect
  - reset `globalCompositeOperation='source-over'`

  These alpha values are the **"intermediate" intensity** chosen in brainstorming (canvas mockup, card 2 of 3). Exact bytes are tuning knobs; the plan should keep them in named constants at the top of the file and the reviewer should eyeball the result against the approved mockup.

- **Motion:** `t` derived from `performance.now()` at loop start (`(now - start) / 1000`), never from `scrollY`. Each blob's per-axis period is 1/`sx` … 1/`sy` seconds → roughly 8–20 s per axis, and because the axis speeds are mutually incommensurate the composite pattern has no obvious pulse over any comfortable viewing window. Apple's caution against full-viewport oscillation near ~0.2 Hz is addressed by three things together: the motion is well below that frequency, the alpha is low enough that the drift is barely perceptible, and `prefers-reduced-motion` freezes it entirely.
- **Loop lifecycle:**
  - Run via `requestAnimationFrame`.
  - `document.addEventListener('visibilitychange')` → cancel the rAF when `document.hidden`, restart (re-basing `start` so it doesn't jump) when visible.
  - On `prefers-reduced-motion: reduce` (checked via `matchMedia`, and listen for changes): render exactly **one** frame at `t=0` then never schedule another. Also re-evaluate if the media query flips at runtime.

### 1.3 Accessibility / fallbacks for the background

- `prefers-reduced-motion: reduce` → single static frame (above).
- `prefers-reduced-transparency: reduce` → the canvas is decorative; keep it, but see §3.3 for the navbar. (No change to the canvas itself — it is opaque paint, not translucency.)
- No canvas / no rAF → `#0a0a0a` flat (CSS default on the element).
- `prefers-contrast: more` → no special handling needed for the canvas; the navbar handles its own (§3.3). Optionally dim the field by rendering at ~0.6× alpha — plan may include this as a small `@media (prefers-contrast: more)` JS branch or skip it; not required.

---

## 2. Material token system (CSS)

Add to the `:root` block in `index.html`'s `<style>`. **All three weights are defined now; only `structural` is consumed this phase.**

```css
:root {
  /* Structural material — heaviest. Nav bars, future sidebars. */
  --mat-structural-bg:      rgba(12, 12, 14, 0.55);
  --mat-structural-tint:    rgba(255, 190, 130, 0.06);   /* warm veil = faux adaptive tint */
  --mat-structural-blur:    24px;
  --mat-structural-sat:     160%;
  --mat-structural-border:  rgba(255, 255, 255, 0.06);
  --mat-structural-edge:    rgba(255, 255, 255, 0.34);   /* lensing: bright top arête */
  --mat-structural-shadow:  0 8px 28px rgba(0, 0, 0, 0.45);
  --mat-structural-inner:   inset 0 1px 0 rgba(255, 255, 255, 0.22);

  /* Card material — medium. Content panels. DEFINED, NOT APPLIED in phase 1. */
  --mat-card-bg:      rgba(14, 14, 16, 0.5);
  --mat-card-tint:    rgba(255, 190, 130, 0.04);
  --mat-card-blur:    16px;
  --mat-card-sat:     150%;
  --mat-card-border:  rgba(255, 255, 255, 0.05);
  --mat-card-edge:    rgba(255, 255, 255, 0.22);
  --mat-card-shadow:  0 6px 20px rgba(0, 0, 0, 0.35);
  --mat-card-inner:   inset 0 1px 0 rgba(255, 255, 255, 0.12);

  /* Interactive material — lightest. Buttons/toggles. DEFINED, NOT APPLIED in phase 1. */
  --mat-interactive-bg:      rgba(255, 255, 255, 0.06);
  --mat-interactive-tint:    rgba(255, 200, 140, 0.05);
  --mat-interactive-blur:    10px;
  --mat-interactive-sat:     140%;
  --mat-interactive-border:  rgba(255, 255, 255, 0.14);
  --mat-interactive-edge:    rgba(255, 255, 255, 0.4);
  --mat-interactive-shadow:  0 2px 10px rgba(0, 0, 0, 0.3);
  --mat-interactive-inner:   inset 0 1px 0 rgba(255, 255, 255, 0.18);
}
```

**Principles baked into the tokens (from Apple "materials" guidance):**

- **Translucency** = `backdrop-filter: blur() saturate()` + a semi-transparent background, content scrolls under. Never an opaque strip.
- **Adaptive tinting (faux)** = the `-tint` warm veil, layered over the `-bg`, makes the glass read as catching the field's warmth. True per-frame sampling is out of scope (§ Out of scope) — noted as a possible phase-2 enhancement.
- **Lensing (faux)** = the `-edge` bright top border + the `-inner` inset highlight = light catching the material's top arête. No real refraction / displacement (that is what the carousel used and it cost too much).
- **Vibrancy** = a usage rule, not a token: text on a material uses higher contrast + slightly heavier weight + a small tracking bump; color fills go on a solid layer, never the translucent one (see §3.2).
- **Weight → hierarchy:** `structural` blur/opacity/shadow > `card` > `interactive`. Never stack a lighter material on a heavier one at low contrast.

A helper class `.mat-structural` should apply the full recipe:

```css
.mat-structural {
  background: linear-gradient(var(--mat-structural-tint), var(--mat-structural-tint)), var(--mat-structural-bg);
  -webkit-backdrop-filter: blur(var(--mat-structural-blur)) saturate(var(--mat-structural-sat));
  backdrop-filter:         blur(var(--mat-structural-blur)) saturate(var(--mat-structural-sat));
  border: 1px solid var(--mat-structural-border);
  border-top-color: var(--mat-structural-edge);
  box-shadow: var(--mat-structural-shadow), var(--mat-structural-inner);
}
```

(Analogous `.mat-card` / `.mat-interactive` classes are written now but referenced nowhere this phase.)

---

## 3. Navbar application

### 3.1 Swap the surface

`#navbar` currently: `class="navbar sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border-subtle"`.

- **Do not edit the Tailwind class list.** Override in the `<style>` block instead (lower-risk, keeps the markup diff to `index.html`'s `<style>` + the canvas element). Target `#navbar` in CSS and set the full `structural` recipe there, explicitly overriding the Tailwind utilities: `background`, `-webkit-backdrop-filter` / `backdrop-filter`, `border`, `border-top-color`, `border-bottom: none` (kills the `border-b`), `box-shadow`. Tailwind utility specificity is a single class (0,0,1,0); an `#navbar` id selector (0,1,0,0) wins cleanly.
- The navbar stays full-bleed (`sticky top-0`, not a floating pill) — this phase does not restyle its geometry.
- `#nav-mobile` (the mobile dropdown, currently `bg-background/95`) gets the same `structural` background treatment so the open menu matches, but **no** extra blur stacking — it's part of the same surface.

### 3.2 Vibrancy on navbar content

- Nav links (`Fonctionnalités`, `Process`, `Témoignages`) and any muted text: `color: rgba(255,255,255,0.82)` (up from the current `text-text-secondary`), `font-weight` one step up (e.g. 500), `letter-spacing: 0.01em`. Hover → `rgba(255,255,255,1)`. Keep the existing `transition-colors`.
- The `Essai gratuit` button keeps its solid `btn-primary` gradient fill unchanged — color lives on a solid layer, not on the glass.
- The `BeatReply` wordmark + logo mark: unchanged.

### 3.3 Scroll-edge & fallbacks

- **Scroll edge:** the page already toggles `.navbar-scrolled` on `#navbar` past 20px scroll (existing JS at ~`index.html:863`). This phase: `#navbar.navbar-scrolled` deepens the shadow slightly (e.g. `box-shadow: 0 10px 34px rgba(0,0,0,0.55), var(--mat-structural-inner)`). The separation is the shadow — the `border-bottom` was already killed in §3.1.
- `@media (prefers-reduced-transparency: reduce)`:
  ```css
  #navbar, #nav-mobile { background: rgba(10,10,10,0.94); backdrop-filter: none; -webkit-backdrop-filter: none; }
  ```
  Keep `border-top-color` edge + `box-shadow` for shape.
- `@media (prefers-contrast: more)`:
  ```css
  #navbar { background: rgba(8,8,8,0.97); border-color: rgba(255,255,255,0.5); backdrop-filter: none; }
  ```
- The existing `@media (prefers-reduced-motion: reduce)` block is untouched by the navbar changes (navbar has no motion); the background's reduced-motion handling is in JS (§1.2).

### 3.4 Contrast requirement

Nav link text (`rgba(255,255,255,0.82)`) over the worst-case background — a bright `#FFC978` blob at full local intensity showing through the `structural` material — must still measure ≥ 4.5:1. The material's `-bg` at 0.55 opacity over `#FFC978` yields roughly `#3a352c`-ish; white-82% on that is well above 4.5:1. The plan's verification step measures this on the live page, not by hand-calc.

---

## 4. Verification

New `assets/js/ambient-bg.test.js` (Node built-in `node --test`, matches the repo's existing test setup) for the **pure** bits only:
- the blob position function is a pure function of `(t, w, h, blob)` and is periodic / bounded (x,y stay within `[-0.12, 1.12] * dimension`);
- alpha/ý constants are within expected ranges;
- feature-gate returns early when `getContext` is absent (inject a fake canvas).

New `sdd/browser-checks/ambient-bg.mjs` (Playwright, same harness pattern as the carousel's — serve with `python3 -m http.server`, drive the npx-cached Chromium):
1. Canvas exists, `position:fixed`, `z-index:0`, `pointer-events:none`, `aria-hidden`.
2. **Animates without interaction:** sample one pixel via a 2nd offscreen read (`ctx.getImageData` from the page) at t and t+700ms → differs.
3. **Decoupled from scroll:** scroll the whole page top→bottom; assert the canvas's `getBoundingClientRect()` stays `{top:0,left:0}` and a pixel sample taken mid-scroll vs post-scroll differs only by animation, not by a jump; **no console errors**.
4. **Reduced motion:** `emulateMedia({ reducedMotion: 'reduce' })` → two pixel samples 700 ms apart are **identical**.
5. **Navbar material:** `#navbar` computed style has a non-`none` `backdrop-filter`; nav link color ≈ `rgba(255,255,255,0.82)`; measure contrast of a nav link against the composited pixel behind it ≥ 4.5:1 (sample the rendered pixel with the page scrolled so a bright blob sits behind the navbar).
6. **Reduced transparency:** `emulateMedia({ /* forced-colors or a manual class toggle */ })` or a manual `@media` assertion → navbar `backdrop-filter:none` and near-opaque bg.
7. **No regression:** all existing sections (`#solutions`, `#catalog-showcase`, `#process-carousel`, `#testimonials`, `#cta-final`, Hero) still render with height > 40px; no element outside `#navbar`/`#ambient-bg` gained a `.mat-*` class; page has no horizontal scroll at 390 / 768 / 1440.
8. **Tab-hidden pause:** dispatch `visibilitychange` with `document.hidden` faked → rAF stops being scheduled (spy on `requestAnimationFrame` call count going flat).

`node --test` must stay green (existing 30 tests + new ones).

---

## 5. Open questions

None blocking. Tuning knobs the reviewer/Corentin eyeball against the approved companion mockup:
- Exact blob alpha bytes (`0x33` peak) — "intermediate" was chosen; final value is a visual call on the real page.
- Whether to also dim the field ~0.6× under `prefers-contrast: more` (nice-to-have, plan may include or drop).
