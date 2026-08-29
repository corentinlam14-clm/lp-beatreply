# Process Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static 3-step "Comment ça marche" section with an animated 5-step carousel: a continuously-animated audio-waveform background, liquid-glass cards (same technique on every card, performance-tiered refresh), and circular hover/arrow navigation.

**Architecture:** Pure math (waveform envelope/roughness, circular carousel tiering) lives in testable functions inside a new `assets/js/process-carousel.js`, following the existing `catalog-demo.js`/`catalog-showcase.js` pattern (IIFE, `var`, dual `module.exports`/`window.BeatReplyProcessCarousel` export). DOM rendering (SVG waveform, `LiquidGlass` mounting, navigation) builds on top of those pure functions and is verified manually via `/run`, matching how this codebase already tests its other two JS modules (pure logic unit-tested, DOM wiring checked live).

**Tech Stack:** Vanilla JS (ES5-style, no build step), `liquid-glass-js` via CDN `<script>` tag (`window.LiquidGlass`), Node's built-in `node:test` runner for unit tests, no framework migration.

## Global Constraints

- No React/Next.js, no npm build step, no new dependencies beyond the `liquid-glass-js` CDN script tag — `lp-beatreply` stays a single static `index.html`.
- Brand palette only: `#FF9D42` (primary/orange), `#C97B24` (secondary/bronze), plus the existing `--primary-rgb`/`--secondary-rgb` CSS variables already defined in `index.html`.
- Copy in French, tutoiement, matching the voice in `CLAUDE.md` (direct, no jargon, 2-3 lines max per description).
- Respect `prefers-reduced-motion: reduce` and keep the existing reduced-motion `@media` block's pattern (disable continuous animation, keep opacity-only transitions).
- Test runner: `node --test tests/*.test.js` (no test framework dependency — confirmed working against the existing suite before writing this plan).
- **The 5-step copy below is a first draft written for this plan, not yet reviewed word-by-word with Corentin — flag it in the task 1 review, don't treat it as pre-approved.**

---

### Task 1: Process section HTML — 5-step carousel markup

**Files:**
- Modify: `index.html:618-643` (replace the entire `<section id="process">` block)
- Modify: `index.html` near line 706 (add the `liquid-glass-js` CDN script tag and the new `process-carousel.js` include, after `catalog-showcase.js`)

**Interfaces:**
- Produces: the DOM structure `process-carousel.js` (tasks 4-6) queries — `#process-carousel`, `.process-waveform` (SVG with `<defs>` containing `#process-bar-grad` and `#process-glow-blur`, and three empty `<g>` groups `.process-bars-glow` / `.process-bars-crisp` / `.process-bars-peaks`), `[data-process-slot]` (5 of them, each with a `.process-card-caption` child), `[data-process-prev]`, `[data-process-next]`.

- [ ] **Step 1: Replace the Process section markup**

Replace `index.html:618-643` (the current static 3-step grid) with:

```html
<section id="process-carousel" class="section-padding py-16 lg:py-24">
  <div class="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-prose mx-auto mb-16 scroll-reveal">
      <span class="text-caption uppercase text-primary mb-4 inline-block">Comment ça marche</span>
      <h2 class="text-[2rem] sm:text-h2 font-semibold mb-4">5 étapes pour automatiser complètement tes ventes</h2>
      <p class="text-body-lg text-text-secondary">Pas besoin d'être un expert tech. Lance ton IA en 10 minutes.</p>
    </div>

    <div class="process-carousel-wrap scroll-reveal">
      <svg class="process-waveform" aria-hidden="true">
        <defs>
          <linearGradient id="process-bar-grad" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="340">
            <stop offset="0%" stop-color="#FFF3DD"/>
            <stop offset="35%" stop-color="#FFD9A0"/>
            <stop offset="70%" stop-color="#FF9D42"/>
            <stop offset="100%" stop-color="#C97B24"/>
          </linearGradient>
          <filter id="process-glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2"/>
          </filter>
        </defs>
        <g class="process-bars-glow" filter="url(#process-glow-blur)" opacity="0.5"></g>
        <g class="process-bars-crisp"></g>
        <g class="process-bars-peaks"></g>
      </svg>

      <div class="process-aura process-aura-1"></div>
      <div class="process-aura process-aura-2"></div>

      <button type="button" class="process-nav-arrow process-nav-prev" data-process-prev aria-label="Étape précédente">‹</button>
      <button type="button" class="process-nav-arrow process-nav-next" data-process-next aria-label="Étape suivante">›</button>

      <div class="process-cards-row">
        <div class="process-card-slot" data-process-slot data-step="1">
          <div class="process-card-caption">
            <span class="process-step-num">ÉTAPE 1</span>
            <span class="process-step-icon"></span>
            <h3 class="process-step-title">Connecte ton Instagram</h3>
            <p class="process-step-desc">Connecte ton compte en quelques clics. Ton IA prend le relais sur tes DM, direct.</p>
          </div>
        </div>
        <div class="process-card-slot" data-process-slot data-step="2">
          <div class="process-card-caption">
            <span class="process-step-num">ÉTAPE 2</span>
            <span class="process-step-icon"></span>
            <h3 class="process-step-title">Ajoute ton catalogue</h3>
            <p class="process-step-desc">Balance tes beats, tes prix, tes licences. L'IA a tout ce qu'il faut pour vendre à ta place.</p>
          </div>
        </div>
        <div class="process-card-slot" data-process-slot data-step="3">
          <div class="process-card-caption">
            <span class="process-step-num">ÉTAPE 3</span>
            <span class="process-step-icon"></span>
            <h3 class="process-step-title">Tarifs &amp; licences</h3>
            <p class="process-step-desc">Standard, exclusif, sur-mesure — configure tes règles une fois, l'IA les applique à chaque DM.</p>
          </div>
        </div>
        <div class="process-card-slot" data-process-slot data-step="4">
          <div class="process-card-caption">
            <span class="process-step-num">ÉTAPE 4</span>
            <span class="process-step-icon"></span>
            <h3 class="process-step-title">Personnalise ton agent</h3>
            <p class="process-step-desc">Chill, pro, énergique, ou à ta sauce — configure la personnalité de ton bot pour qu'il sonne comme toi.</p>
          </div>
        </div>
        <div class="process-card-slot" data-process-slot data-step="5">
          <div class="process-card-caption">
            <span class="process-step-num">ÉTAPE 5</span>
            <span class="process-step-icon"></span>
            <h3 class="process-step-title">C'est prêt !</h3>
            <p class="process-step-desc">Ton IA répond, qualifie et vend, 24h/7j, pendant que tu restes en studio.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

Note: the section `id` changes from `process` to `process-carousel`. Update the two nav links that reference `#process` (`index.html:285` and `index.html:301`) to `#process-carousel`.

- [ ] **Step 2: Add the liquid-glass-js CDN script and the new module include**

In `index.html`, right after the existing `<script src="assets/js/catalog-showcase.js"></script>` line (currently line 706), add:

```html
<script src="https://cdn.jsdelivr.net/npm/liquid-glass-js@0.1.0/dist/liquid-glass.umd.min.js"></script>
<script src="assets/js/process-carousel.js"></script>
```

- [ ] **Step 3: Open the page and confirm the static (no-JS-behavior-yet) layout**

Run: `/run` (or open `index.html` directly in a browser)
Expected: 5 evenly-sized cards show in the Process section with the copy above; no waveform animation yet (that's task 4) and no rotation yet (task 6) — this step only confirms the markup doesn't break the page and the nav links still scroll to the right section.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Replace static Process section with 5-step carousel markup"
```

---

### Task 2: Carousel CSS (glass cards, waveform container, auras, reduced motion)

**Files:**
- Modify: `index.html` inline `<style>` block (currently `index.html:90-270`) — append new rules before the closing `</style>` tag, and extend the existing `@media (prefers-reduced-motion: reduce)` block (currently `index.html:246-269`).

**Interfaces:**
- Consumes: the class names from Task 1's markup.
- Produces: `.process-card-slot` default sizing (150×190, the "near" tier) as the no-JS baseline; `.process-card-caption` styled as a plain glassmorphism card (this is what's visible before `process-carousel.js` mounts real `LiquidGlass` lenses on top in Task 5/6).

- [ ] **Step 1: Add the carousel styles**

Insert before `index.html`'s closing `</style>` tag:

```css
  .process-carousel-wrap {
    position: relative;
    height: 22rem;
    border-radius: 1.5rem;
    overflow: hidden;
    background: #000;
  }

  .process-waveform {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    -webkit-box-reflect: below 0px linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0.5) 75%);
  }

  .process-aura {
    position: absolute;
    width: 21rem; height: 21rem;
    border-radius: 50%;
    filter: blur(70px);
    pointer-events: none;
  }
  .process-aura-1 { background: var(--primary); top: -5rem; left: 10%; opacity: 0.18; animation: process-drift-1 12s ease-in-out infinite; }
  .process-aura-2 { background: var(--secondary); bottom: -6rem; right: 15%; opacity: 0.15; animation: process-drift-2 14s ease-in-out infinite; }
  @keyframes process-drift-1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,20px) scale(1.15); } }
  @keyframes process-drift-2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-25px) scale(1.1); } }

  .process-nav-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 2.5rem; height: 2.5rem; border-radius: 50%;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    color: #fff; font-size: 1rem;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 20;
    transition: background 0.2s ease;
  }
  .process-nav-arrow:hover { background: rgb(var(--primary-rgb) / 0.25); }
  .process-nav-prev { left: 1rem; }
  .process-nav-next { right: 1rem; }

  .process-cards-row {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    gap: 0.875rem;
  }

  .process-card-slot {
    flex-shrink: 0;
    position: relative;
    width: 150px; height: 190px;
    transition: width 350ms ease, height 350ms ease, opacity 350ms ease;
  }

  .process-card-caption {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 0 0.75rem;
    color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    border-radius: 1.375rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
  }

  .process-step-num { font-size: 0.625rem; letter-spacing: 0.05em; color: rgba(255,255,255,0.6); margin-bottom: 0.25rem; }
  .process-step-icon { width: 1.375rem; height: 1.375rem; border-radius: 50%; margin: 0.25rem auto 0.5rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); }
  .process-step-title { font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.25rem; }
  .process-step-desc { font-size: 0.6875rem; color: rgba(255,255,255,0.75); line-height: 1.35; }
```

- [ ] **Step 2: Extend the reduced-motion block**

In the existing `@media (prefers-reduced-motion: reduce) { ... }` block (`index.html:246-269`), add these two rules alongside the existing ones (inside the same block, next to `.gradient-text-loop`'s `animation: none !important;` group):

```css
    .process-aura {
      animation: none !important;
    }
    .process-card-slot {
      transition: opacity 0.2s ease !important;
    }
```

- [ ] **Step 3: Add a `prefers-reduced-transparency` rule**

The design spec (section 7) also requires falling back to a more solid, less blurred surface for visitors who've asked for less transparency. Add this new block right after the `@media (prefers-reduced-motion: reduce)` block:

```css
  @media (prefers-reduced-transparency: reduce) {
    .process-card-caption {
      background: rgba(10, 10, 10, 0.92);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    .process-nav-arrow {
      background: rgba(20, 20, 20, 0.92);
      backdrop-filter: none;
    }
  }
```

Note: this only covers the no-JS/CSS-only fallback card (`.process-card-caption`). The real `LiquidGlass`-mounted surfaces (Task 5) always use `backdrop-filter` internally — there's no reduced-transparency hook in the library itself, so this rule's practical effect is on the arrow buttons and on the brief moment before `process-carousel.js` finishes mounting.

- [ ] **Step 4: Visually confirm the no-JS baseline**

Run: `/run`
Expected: the Process section shows a black rounded panel, 5 evenly-sized frosted cards centered in a row with the right copy, two arrow buttons at the edges, no console errors. No waveform bars yet (SVG groups are empty until Task 4) and no size/opacity variation between cards yet (that's Task 5/6) — this step only confirms the CSS renders cleanly.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Add carousel CSS for the Process section (glass cards, waveform container, auras)"
```

---

### Task 3: Pure carousel math — waveform + circular tiering (TDD)

**Files:**
- Create: `assets/js/process-carousel.js`
- Test: `tests/process-carousel.test.js`

**Interfaces:**
- Produces (used by Tasks 4-6): `envelopeAt(x)`, `roughnessAt(x)`, `globalPulse(t)`, `computeBarAmplitude(x, maxAmp, pulse)`, `wrapIndex(index, length)`, `circularOffset(index, activeIndex, length)`, `tierForOffset(offset)`, `STEP_COUNT` (constant `5`).

- [ ] **Step 1: Write the failing tests**

Create `tests/process-carousel.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  envelopeAt,
  roughnessAt,
  globalPulse,
  computeBarAmplitude,
  wrapIndex,
  circularOffset,
  tierForOffset,
  STEP_COUNT
} = require('../assets/js/process-carousel.js');

test('STEP_COUNT is 5', () => {
  assert.equal(STEP_COUNT, 5);
});

test('envelopeAt returns a value between 0 and 1', () => {
  for (let x = 0; x < 1; x += 0.05) {
    const v = envelopeAt(x);
    assert.ok(v >= 0 && v <= 1, `envelopeAt(${x}) = ${v} out of range`);
  }
});

test('envelopeAt is near its max at a cluster center (x=0.92, the tallest cluster)', () => {
  assert.ok(envelopeAt(0.92) > 0.9);
});

test('envelopeAt is near zero in a quiet valley (x=0.10, between the first two small clusters)', () => {
  assert.ok(envelopeAt(0.10) < 0.2);
});

test('envelopeAt wraps around past x=1 the same as x mod 1', () => {
  assert.equal(envelopeAt(1.92), envelopeAt(0.92));
  assert.equal(envelopeAt(2.5), envelopeAt(0.5));
});

test('roughnessAt never goes below its floor of 0.25', () => {
  for (let x = 0; x < 5; x += 0.037) {
    assert.ok(roughnessAt(x) >= 0.25);
  }
});

test('globalPulse stays within [0.88, 1.0]', () => {
  for (let t = 0; t < 10000; t += 137) {
    const p = globalPulse(t);
    assert.ok(p >= 0.88 && p <= 1.0, `globalPulse(${t}) = ${p} out of range`);
  }
});

test('computeBarAmplitude is at least the 3px floor even when envelope is 0', () => {
  // x=0.10 is a near-silent valley; amplitude should be small but never below the floor
  const amp = computeBarAmplitude(0.10, 100, 1);
  assert.ok(amp >= 3);
});

test('computeBarAmplitude grows with a larger maxAmp', () => {
  const small = computeBarAmplitude(0.92, 50, 1);
  const large = computeBarAmplitude(0.92, 200, 1);
  assert.ok(large > small);
});

test('wrapIndex normalizes an in-range index unchanged', () => {
  assert.equal(wrapIndex(2, 5), 2);
});

test('wrapIndex wraps a negative index to the end', () => {
  assert.equal(wrapIndex(-1, 5), 4);
});

test('wrapIndex wraps an over-range index back to the start', () => {
  assert.equal(wrapIndex(5, 5), 0);
  assert.equal(wrapIndex(7, 5), 2);
});

test('circularOffset is 0 for the active index itself', () => {
  assert.equal(circularOffset(2, 2, 5), 0);
});

test('circularOffset gives the short signed path forward and backward', () => {
  assert.equal(circularOffset(3, 2, 5), 1);
  assert.equal(circularOffset(1, 2, 5), -1);
});

test('circularOffset picks the shorter wraparound path (5-card ring)', () => {
  // active=0, index=4 -> going backward 1 step is shorter than forward 4 steps
  assert.equal(circularOffset(4, 0, 5), -1);
  // active=4, index=0 -> forward 1 step is shorter than backward 4 steps
  assert.equal(circularOffset(0, 4, 5), 1);
});

test('tierForOffset returns the active tier at offset 0', () => {
  const tier = tierForOffset(0);
  assert.equal(tier.opacity, 1);
  assert.equal(tier.live, true);
});

test('tierForOffset returns the same near tier for +1 and -1', () => {
  assert.deepEqual(tierForOffset(1), tierForOffset(-1));
  assert.equal(tierForOffset(1).opacity, 0.72);
  assert.equal(tierForOffset(1).live, false);
});

test('tierForOffset returns the same far tier for +2 and -2', () => {
  assert.deepEqual(tierForOffset(2), tierForOffset(-2));
  assert.equal(tierForOffset(2).opacity, 0.4);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/process-carousel.test.js`
Expected: FAIL — `Cannot find module '../assets/js/process-carousel.js'` (the file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `assets/js/process-carousel.js`:

```js
(function (root) {
  'use strict';

  // ---- Waveform math (pure, testable) ----

  var CLUSTERS = [
    { c: 0.06, w: 0.020, p: 0.10 }, { c: 0.14, w: 0.018, p: 0.16 },
    { c: 0.20, w: 0.015, p: 0.10 }, { c: 0.26, w: 0.028, p: 0.55 },
    { c: 0.32, w: 0.020, p: 0.28 }, { c: 0.38, w: 0.022, p: 0.38 },
    { c: 0.44, w: 0.018, p: 0.20 }, { c: 0.50, w: 0.026, p: 0.60 },
    { c: 0.56, w: 0.018, p: 0.26 }, { c: 0.62, w: 0.030, p: 0.90 },
    { c: 0.68, w: 0.020, p: 0.30 }, { c: 0.74, w: 0.026, p: 0.55 },
    { c: 0.80, w: 0.022, p: 0.38 }, { c: 0.86, w: 0.028, p: 0.70 },
    { c: 0.92, w: 0.022, p: 1.00 }
  ];

  function envelopeAt(x) {
    var frac = ((x % 1) + 1) % 1;
    var v = 0;
    for (var i = 0; i < CLUSTERS.length; i++) {
      var cl = CLUSTERS[i];
      var d = (frac - cl.c) / cl.w;
      v += cl.p * Math.exp(-d * d * 4);
    }
    return Math.min(1, v);
  }

  function roughnessAt(x) {
    var r = 0.55 +
      0.22 * Math.sin(x * 340) +
      0.14 * Math.sin(x * 730 + 1.3) +
      0.09 * Math.sin(x * 1250 + 2.7);
    return Math.max(0.25, r);
  }

  function globalPulse(t) {
    return 0.94 + 0.06 * Math.sin(t * 0.0012);
  }

  function computeBarAmplitude(x, maxAmp, pulse) {
    return 3 + envelopeAt(x) * roughnessAt(x) * maxAmp * pulse;
  }

  // ---- Carousel tiering math (pure, testable) ----

  var STEP_COUNT = 5;

  function wrapIndex(index, length) {
    return ((index % length) + length) % length;
  }

  // Signed shortest-path offset of `index` from `activeIndex` on a circular
  // track of `length` slots (e.g. length 5 -> offsets range roughly -2..2).
  function circularOffset(index, activeIndex, length) {
    var raw = wrapIndex(index - activeIndex, length);
    if (raw > length / 2) {
      raw -= length;
    }
    return raw;
  }

  var TIERS = {
    0: { width: 190, height: 220, opacity: 1,    live: true  },
    1: { width: 150, height: 190, opacity: 0.72, live: false },
    2: { width: 130, height: 170, opacity: 0.4,  live: false }
  };

  function tierForOffset(offset) {
    var key = Math.abs(offset);
    return TIERS[key] || TIERS[2];
  }

  // ---- exports ----

  var api = {
    envelopeAt: envelopeAt,
    roughnessAt: roughnessAt,
    globalPulse: globalPulse,
    computeBarAmplitude: computeBarAmplitude,
    wrapIndex: wrapIndex,
    circularOffset: circularOffset,
    tierForOffset: tierForOffset,
    STEP_COUNT: STEP_COUNT
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyProcessCarousel = api;
  }
})(typeof window !== 'undefined' ? window : this);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/process-carousel.test.js`
Expected: all tests PASS (18 tests).

- [ ] **Step 5: Commit**

```bash
git add assets/js/process-carousel.js tests/process-carousel.test.js
git commit -m "Add pure waveform and carousel-tiering math for the Process carousel"
```

---

### Task 4: Waveform background rendering

**Files:**
- Modify: `assets/js/process-carousel.js` (add `buildWaveformBackground`, insert before the `var api = {...}` block from Task 3)

**Interfaces:**
- Consumes: `envelopeAt`, `roughnessAt`, `globalPulse`, `computeBarAmplitude` (Task 3, same file, same closure — no import needed).
- Produces: `buildWaveformBackground(svgEl)` → `{ render(t) }`, added to the exported `api` object as `buildWaveformBackground`.

- [ ] **Step 1: Add the waveform builder**

In `assets/js/process-carousel.js`, insert this block right before the `// ---- exports ----` comment added in Task 3:

```js
  // ---- Waveform DOM rendering ----

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var BAR_COUNT = 200;
  var SCROLL_SPEED = 0.00003;
  var PEAK_THRESHOLD = 0.72;

  function buildWaveformBackground(svgEl) {
    var glowGroup = svgEl.querySelector('.process-bars-glow');
    var crispGroup = svgEl.querySelector('.process-bars-crisp');
    var peaksGroup = svgEl.querySelector('.process-bars-peaks');

    var glow = [], crisp = [], peaks = [];
    for (var i = 0; i < BAR_COUNT; i++) {
      var lg = document.createElementNS(SVG_NS, 'line');
      lg.setAttribute('stroke', 'url(#process-bar-grad)');
      lg.setAttribute('stroke-width', '3.5');
      lg.setAttribute('stroke-linecap', 'round');
      glowGroup.appendChild(lg);
      glow.push(lg);

      var lc = document.createElementNS(SVG_NS, 'line');
      lc.setAttribute('stroke', 'url(#process-bar-grad)');
      lc.setAttribute('stroke-width', '1.4');
      lc.setAttribute('stroke-linecap', 'round');
      crispGroup.appendChild(lc);
      crisp.push(lc);

      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '1.8');
      dot.setAttribute('fill', '#FFF8EC');
      dot.setAttribute('opacity', '0');
      peaksGroup.appendChild(dot);
      peaks.push(dot);
    }

    function render(t) {
      var w = svgEl.clientWidth || 600;
      var h = svgEl.clientHeight || 340;
      var baseline = h * 0.60;
      var maxAmp = h * 0.46;
      var shift = t * SCROLL_SPEED;
      var pulse = globalPulse(t);

      for (var i = 0; i < BAR_COUNT; i++) {
        var frac = i / BAR_COUNT;
        var x = frac + shift;
        var amp = computeBarAmplitude(x, maxAmp, pulse);
        var px = (w / (BAR_COUNT + 1)) * (i + 1);
        var y1 = baseline - amp;
        var y2 = baseline + amp * 0.12;

        glow[i].setAttribute('x1', px); glow[i].setAttribute('y1', y1);
        glow[i].setAttribute('x2', px); glow[i].setAttribute('y2', y2);
        crisp[i].setAttribute('x1', px); crisp[i].setAttribute('y1', y1);
        crisp[i].setAttribute('x2', px); crisp[i].setAttribute('y2', y2);

        if (amp > maxAmp * PEAK_THRESHOLD) {
          peaks[i].setAttribute('cx', px);
          peaks[i].setAttribute('cy', y1);
          peaks[i].setAttribute('opacity', '0.9');
        } else {
          peaks[i].setAttribute('opacity', '0');
        }
      }
    }

    render(0);
    return { render: render };
  }
```

Then add `buildWaveformBackground: buildWaveformBackground,` to the `api` object (alongside `tierForOffset`, etc.).

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

Run: `node --test tests/*.test.js`
Expected: all tests still PASS (this task adds no new pure-logic tests — `buildWaveformBackground` does DOM work, verified manually in the next step, matching how `renderShowcase`/`initCatalogShowcase` in the existing codebase aren't unit tested either).

- [ ] **Step 3: Manually verify the waveform renders**

Run: `/run`
Expected: the Process section's black panel now shows ~200 animated gold/orange bars in clustered bursts with a soft glow and a reflection underneath, continuously moving left even without scrolling the page. No console errors. (Cards still show as plain frosted boxes — glass mounting is Task 5.)

- [ ] **Step 4: Commit**

```bash
git add assets/js/process-carousel.js
git commit -m "Render the animated waveform background for the Process carousel"
```

---

### Task 5: Liquid-glass card mounting (tiered refresh)

**Files:**
- Modify: `assets/js/process-carousel.js` (add `mountCardGlass`, insert after `buildWaveformBackground`)

**Interfaces:**
- Consumes: `tierForOffset` (Task 3), `window.LiquidGlass` (loaded via the CDN script from Task 1).
- Produces: `mountCardGlass(slotEl, backgroundEl, tier, LiquidGlassCtor)` → `{ glass, reposition(), destroy() }`, added to `api` as `mountCardGlass`.

- [ ] **Step 1: Add the glass-mounting function**

In `assets/js/process-carousel.js`, insert after the `buildWaveformBackground` function (still before `// ---- exports ----`):

```js
  // ---- Liquid-glass card mounting ----

  function mountCardGlass(slotEl, backgroundEl, tier, LiquidGlassCtor) {
    var rect = slotEl.getBoundingClientRect();
    var glass = new LiquidGlassCtor({
      background: backgroundEl,
      x: rect.left, y: rect.top,
      width: tier.width, height: tier.height, radius: 22,
      scale: 46, chroma: 0.13, blur: 1, glow: 0.15, tint: 0,
      draggable: false
    });
    glass.glassEl.style.opacity = String(tier.opacity);
    glass.lensEl.style.opacity = String(tier.opacity);
    glass.glassEl.style.display = 'flex';
    glass.glassEl.style.flexDirection = 'column';
    glass.glassEl.style.alignItems = 'center';
    glass.glassEl.style.justifyContent = 'center';

    // Move the slot's existing caption content into the glass surface
    // (moved, not cloned, so there's one source of truth for the copy).
    var caption = slotEl.querySelector('.process-card-caption');
    if (caption) {
      glass.glassEl.appendChild(caption);
    }

    function reposition() {
      var r = slotEl.getBoundingClientRect();
      glass.moveTo(r.left, r.top);
    }

    var refreshTimer = null;
    if (tier.live) {
      refreshTimer = setInterval(function () {
        reposition();
        glass.refresh();
      }, 90);
    }
    var onResize = function () {
      reposition();
      glass.refresh();
    };
    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', onResize);

    return {
      glass: glass,
      reposition: reposition,
      destroy: function () {
        if (refreshTimer) { clearInterval(refreshTimer); }
        window.removeEventListener('scroll', reposition);
        window.removeEventListener('resize', onResize);
        if (caption && caption.parentNode === glass.glassEl) {
          slotEl.appendChild(caption); // return content to the DOM before teardown
        }
        glass.destroy();
      }
    };
  }
```

Then add `mountCardGlass: mountCardGlass,` to the `api` object.

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

Run: `node --test tests/*.test.js`
Expected: all tests still PASS.

- [ ] **Step 3: Manually verify (temporary wiring)**

This function isn't called from anywhere yet (that's Task 6). Skip live verification here — Task 6's manual check covers this function once it's wired up, so a partial manual test now would just be discarded.

- [ ] **Step 4: Commit**

```bash
git add assets/js/process-carousel.js
git commit -m "Add liquid-glass card mounting with tiered refresh for the Process carousel"
```

---

### Task 6: Navigation, reduced-motion guard, and init wiring

**Files:**
- Modify: `assets/js/process-carousel.js` (add `prefersReducedMotion`, `initProcessCarousel`)
- Modify: `index.html:707-743` (the closing inline `<script>` block — add the init call, following the existing `if (window.BeatReplyCatalogDemo) { ... }` pattern)

**Interfaces:**
- Consumes: `wrapIndex`, `circularOffset`, `tierForOffset`, `STEP_COUNT`, `buildWaveformBackground`, `mountCardGlass` (all from this file, Tasks 3-5), `window.LiquidGlass`.
- Produces: `initProcessCarousel(doc)`, added to `api` as `initProcessCarousel` — the only function `index.html` calls directly.

- [ ] **Step 1: Add the reduced-motion guard and the init function**

In `assets/js/process-carousel.js`, insert after `mountCardGlass` (still before `// ---- exports ----`):

```js
  // ---- Navigation + init ----

  function prefersReducedMotion() {
    return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function initProcessCarousel(doc) {
    doc = doc || document;
    var section = doc.getElementById('process-carousel');
    if (!section) { return; }

    var svgEl = section.querySelector('.process-waveform');
    var slots = Array.prototype.slice.call(section.querySelectorAll('[data-process-slot]'));
    var prevBtn = section.querySelector('[data-process-prev]');
    var nextBtn = section.querySelector('[data-process-next]');
    var reduced = prefersReducedMotion();

    var activeIndex = 2; // "Tarifs & licences" starts centered
    var mountedCards = [];

    function layoutSlots() {
      slots.forEach(function (slot, i) {
        var offset = circularOffset(i, activeIndex, STEP_COUNT);
        slot.style.order = String(offset + STEP_COUNT);
      });
    }

    function mountAllGlass() {
      if (!root.LiquidGlass) { return; }
      mountedCards.forEach(function (m) { m.destroy(); });
      mountedCards = slots.map(function (slot, i) {
        var offset = circularOffset(i, activeIndex, STEP_COUNT);
        var tier = tierForOffset(offset);
        if (reduced) { tier = Object.assign({}, tier, { live: false }); }
        return mountCardGlass(slot, section, tier, root.LiquidGlass);
      });
    }

    function goTo(newIndex) {
      activeIndex = wrapIndex(newIndex, STEP_COUNT);
      layoutSlots();
      mountAllGlass();
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () { goTo(activeIndex - 1); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () { goTo(activeIndex + 1); });
    }
    slots.forEach(function (slot, i) {
      slot.addEventListener('mouseenter', function () { goTo(i); });
    });

    layoutSlots();
    mountAllGlass();

    if (svgEl && !reduced) {
      var waveform = buildWaveformBackground(svgEl);
      (function loop(t) {
        waveform.render(t);
        root.requestAnimationFrame(loop);
      })(0);
    } else if (svgEl) {
      buildWaveformBackground(svgEl); // renders one static frame, no rAF loop
    }
  }
```

Then add `initProcessCarousel: initProcessCarousel,` to the `api` object.

- [ ] **Step 2: Wire the init call in `index.html`**

In the closing inline `<script>` block (`index.html:707-743`), add this right after the existing `Catalog showcase section` block:

```js
  // Process carousel
  if (window.BeatReplyProcessCarousel) {
    window.BeatReplyProcessCarousel.initProcessCarousel();
  }
```

- [ ] **Step 3: Run the full test suite**

Run: `node --test tests/*.test.js`
Expected: all tests PASS.

- [ ] **Step 4: Manually verify the full interaction**

Run: `/run`
Expected:
- The Process section shows the animated waveform, 5 cards with real liquid-glass refraction visible on all of them (check via the browser's dev tools that 5 `.lqg-glass` elements exist), the center card ("Tarifs & licences") larger and fully opaque, neighbors progressively smaller/fainter.
- Hovering a neighboring card brings it to the center; clicking the arrows advances/retreats by one step; navigating past step 5 wraps back to step 1 (and vice versa from step 1 going backward) — no dead end.
- In devtools, toggle "Emulate CSS prefers-reduced-motion: reduce" — the waveform should freeze on one static frame and the cards should stop continuously refreshing (no more visible flicker/jank from the active card).

- [ ] **Step 5: Commit**

```bash
git add assets/js/process-carousel.js index.html
git commit -m "Wire up Process carousel navigation, glass mounting, and reduced-motion handling"
```

---

### Task 7: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite one more time**

Run: `node --test tests/*.test.js`
Expected: all tests PASS (12 pre-existing + 18 new = 30 tests).

- [ ] **Step 2: Full manual walkthrough on the real page**

Run: `/run`
Expected: repeat Task 6 Step 4's checklist end-to-end, plus: confirm the rest of the page (Hero, Solutions, Testimonials, CTA) still renders correctly (no CSS leakage from the new `.process-*` classes), confirm no console errors/warnings anywhere on the page, confirm the `#process-carousel` nav links (desktop + mobile menu) scroll to the right section.

- [ ] **Step 3: Commit if any fixups were needed during verification**

```bash
git add -A
git commit -m "Fix issues found during Process carousel final verification"
```

(Skip this step if verification passed clean with no changes.)
