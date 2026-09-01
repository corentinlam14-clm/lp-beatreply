# Ambient Background + Navbar Material Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single full-page, time-driven animated "light field" behind the whole landing page, plus a 3-weight CSS material token system whose only application this phase is the sticky navbar.

**Architecture:** One `<canvas id="ambient-bg">` fixed behind all content; a vanilla JS module (`assets/js/ambient-bg.js`, same IIFE + dual-export pattern as `catalog-demo.js`) paints 4 warm radial blobs in `lighter` compositing on a `requestAnimationFrame` loop driven by `performance.now()` — never by scroll. Pure geometry/colour helpers are unit-tested with `node --test`; the browser lifecycle (fit, visibility pause, reduced-motion freeze, feature-gate) is verified with a Playwright script following the `sdd/browser-checks/` pattern. The material system is CSS custom properties in `index.html`'s `<style>`; the `structural` weight is applied to `#navbar` / `#nav-mobile` by overriding the Tailwind utility classes from an `#id` selector.

**Tech Stack:** Vanilla ES5-style JS (no build step), Node's built-in `node:test` runner, Tailwind Play CDN (already loaded), Playwright via the npx cache for live checks.

## Global Constraints

- Single static `index.html` + one new `assets/js/ambient-bg.js`. No build step, no framework, **no new runtime dependency** (no CDN library).
- Brand palette only: base `#060608` / `#0a0a0a`; orange `#FF9D42`; bronze `#C97B24`; gold `#FFC978` and dark-amber `#7A430F` used **only inside the light field**. Do not touch the existing `--primary-rgb` / `--secondary-rgb` vars.
- Vanilla JS in the house style of `assets/js/catalog-demo.js`: `(function (root) { 'use strict'; ... })(typeof window !== 'undefined' ? window : this)`, `var`, dual `module.exports` / `window.BeatReply*` export, feature-detect before use.
- Respect `prefers-reduced-motion: reduce`, `prefers-reduced-transparency: reduce`, `prefers-contrast: more`.
- No `.mat-*` class, and no CSS rule added by this plan, may affect any element other than `#ambient-bg`, `#navbar`, `#nav-mobile`, `#main-content`, `body > footer`, and `.texture-grain::before`. Existing sections (Hero, `#solutions`, `#catalog-showcase`, `#process`, `#testimonials`, `#cta-final`) must render unchanged in structure and layout.
- Test runner: `node --test tests/*.test.js` (already used by the repo — 12 tests currently pass; must stay green).
- Target: 60 fps, < ~2 % desktop CPU for the background, zero scroll jank (structurally guaranteed — the field never reads `scrollY`).
- Spec: `docs/superpowers/specs/2026-08-31-ambient-background-material-design.md`.

## File Structure

| File | Responsibility |
|---|---|
| `assets/js/ambient-bg.js` (new) | Pure field math (`blobCenter`, `blobRadius`, `alphaHex`, `paintField`) + browser lifecycle (`start`). Dual export. |
| `tests/ambient-bg.test.js` (new) | `node --test` unit tests for the pure helpers + `start()` early-return. |
| `index.html` (modify) | `<style>`: `#ambient-bg` rules, content z-index lift, `.texture-grain::before` z-index, `:root` material tokens, `.mat-*` helper classes, `#navbar` / `#nav-mobile` overrides, `@media` fallbacks. `<body>`: add `<canvas id="ambient-bg">`. End-of-body: add the `<script src>` include and the `start()` init call. |
| `sdd/browser-checks/ambient-bg.mjs` (new, **not committed**) | Playwright live verification — background behaviour (Task 2) + navbar material (Task 3). |

---

### Task 1: Ambient field module + unit tests

**Files:**
- Create: `assets/js/ambient-bg.js`
- Create: `tests/ambient-bg.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (all on `module.exports` and on `window.BeatReplyAmbientBg`):
  - `BLOBS: Array<{hue:string, bx:number, by:number, sx:number, sy:number, phase:number, r:number}>` — length 4
  - `DRIFT: number` (0.12), `RADIUS_FACTOR: number` (0.672), `PEAK_ALPHA: number` (0x33)
  - `blobCenter(blob, t, w, h) → {x:number, y:number}` — pure; CSS px; `t` in seconds
  - `blobRadius(blob, w, h) → number` — pure; CSS px
  - `alphaHex(n:number) → string` — 2-char lowercase hex, clamped 0..255
  - `paintField(ctx, w, h, t) → void` — draws one frame; expects a 2D-context-like object
  - `start(doc?) → {play, pause, fit} | null` — browser lifecycle; returns `null` outside a browser / when `#ambient-bg` is missing

- [ ] **Step 1: Write the failing test file**

Create `tests/ambient-bg.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BLOBS, DRIFT, blobCenter, blobRadius, alphaHex, paintField, start
} = require('../assets/js/ambient-bg.js');

test('BLOBS: 4 blobs, each fully shaped with a 6-digit hex hue', () => {
  assert.equal(BLOBS.length, 4);
  for (const b of BLOBS) {
    for (const k of ['hue', 'bx', 'by', 'sx', 'sy', 'phase', 'r']) {
      assert.ok(k in b, `blob missing ${k}`);
    }
    assert.match(b.hue, /^#[0-9A-Fa-f]{6}$/);
  }
});

test('blobCenter never wanders more than DRIFT from the blob base, at any time', () => {
  const w = 1440, h = 900, eps = 1e-6;
  for (const b of BLOBS) {
    for (let t = 0; t < 240; t += 0.37) {
      const c = blobCenter(b, t, w, h);
      assert.ok(c.x >= (b.bx - DRIFT) * w - eps && c.x <= (b.bx + DRIFT) * w + eps,
        `x out of band for ${b.hue} at t=${t}`);
      assert.ok(c.y >= (b.by - DRIFT) * h - eps && c.y <= (b.by + DRIFT) * h + eps,
        `y out of band for ${b.hue} at t=${t}`);
    }
  }
});

test('blobCenter is pure: same inputs -> same output', () => {
  assert.deepEqual(
    blobCenter(BLOBS[0], 12.5, 800, 600),
    blobCenter(BLOBS[0], 12.5, 800, 600)
  );
});

test('blobRadius uses max(w,h) and scales with blob.r', () => {
  assert.equal(blobRadius(BLOBS[0], 2000, 1000), blobRadius(BLOBS[0], 1000, 2000));
  assert.ok(blobRadius(BLOBS[1], 1000, 1000) > blobRadius(BLOBS[2], 1000, 1000)); // r 1.15 > 0.70
});

test('alphaHex: clamped, two-digit, lowercase', () => {
  assert.equal(alphaHex(0), '00');
  assert.equal(alphaHex(10), '0a');
  assert.equal(alphaHex(0x33), '33');
  assert.equal(alphaHex(255), 'ff');
  assert.equal(alphaHex(300), 'ff');
  assert.equal(alphaHex(-5), '00');
});

test('paintField: clears to base, switches to lighter, draws 4 three-stop gradients, resets compositing', () => {
  const calls = [];
  const grads = [];
  const ctx = {
    _op: null,
    set globalCompositeOperation(v) { this._op = v; calls.push(['op', v]); },
    get globalCompositeOperation() { return this._op; },
    set fillStyle(v) { calls.push(['fill', v]); },
    get fillStyle() { return null; },
    fillRect() { calls.push(['rect']); },
    createRadialGradient() {
      const g = { stops: [], addColorStop(o, c) { this.stops.push([o, c]); } };
      grads.push(g);
      return g;
    }
  };
  paintField(ctx, 800, 600, 3.0);

  assert.deepEqual(calls[0], ['op', 'source-over']);
  assert.deepEqual(calls[1], ['fill', '#060608']);
  assert.ok(calls.some(c => c[0] === 'op' && c[1] === 'lighter'));
  assert.equal(grads.length, 4);
  for (const g of grads) {
    assert.equal(g.stops.length, 3);
    assert.match(g.stops[2][1], /00$/); // outer stop fully transparent
  }
  assert.deepEqual(calls[calls.length - 1], ['op', 'source-over']); // reset at the end
});

test('start() no-ops (returns null) when there is no #ambient-bg canvas', () => {
  assert.equal(start({ getElementById: () => null }), null);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/ambient-bg.test.js`
Expected: FAIL — `Cannot find module '../assets/js/ambient-bg.js'`.

- [ ] **Step 3: Write `assets/js/ambient-bg.js`**

Create `assets/js/ambient-bg.js`:

```js
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Pure field math (unit-tested)
  // ---------------------------------------------------------------------------

  // Four warm light blobs. bx/by = rest position (fraction of viewport),
  // sx/sy = drift speed per axis (cycles per second), phase = start offset,
  // r = size multiplier.
  var BLOBS = [
    { hue: '#FF9D42', bx: 0.30, by: 0.55, sx: 0.10, sy: 0.07, phase: 0, r: 0.95 },
    { hue: '#C97B24', bx: 0.72, by: 0.32, sx: 0.07, sy: 0.12, phase: 2, r: 1.15 },
    { hue: '#FFC978', bx: 0.52, by: 0.78, sx: 0.14, sy: 0.05, phase: 4, r: 0.70 },
    { hue: '#7A430F', bx: 0.16, by: 0.18, sx: 0.05, sy: 0.09, phase: 1, r: 1.25 }
  ];

  var DRIFT = 0.12;          // fraction of the viewport a blob wanders from base
  var RADIUS_FACTOR = 0.672; // radius = RADIUS_FACTOR * max(w, h) * blob.r
  var PEAK_ALPHA = 0x33;     // centre alpha byte  (~0.20) — "intermediate" intensity
  var MID_ALPHA = 0x13;      // 42%-stop alpha byte (~0.075)
  var BG_COLOR = '#060608';
  var TWO_PI = Math.PI * 2;

  function blobCenter(blob, t, w, h) {
    return {
      x: (blob.bx + DRIFT * Math.sin(t * blob.sx * TWO_PI + blob.phase)) * w,
      y: (blob.by + DRIFT * Math.cos(t * blob.sy * TWO_PI + blob.phase)) * h
    };
  }

  function blobRadius(blob, w, h) {
    return Math.max(w, h) * RADIUS_FACTOR * blob.r;
  }

  function alphaHex(n) {
    n = Math.round(n);
    if (n < 0) { n = 0; } else if (n > 255) { n = 255; }
    return (n < 16 ? '0' : '') + n.toString(16);
  }

  // Paint one frame. `ctx` is a 2D context already scaled to DPR; w/h are CSS px.
  function paintField(ctx, w, h, t) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < BLOBS.length; i++) {
      var blob = BLOBS[i];
      var c = blobCenter(blob, t, w, h);
      var radius = blobRadius(blob, w, h);
      var grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
      grad.addColorStop(0, blob.hue + alphaHex(PEAK_ALPHA));
      grad.addColorStop(0.42, blob.hue + alphaHex(MID_ALPHA));
      grad.addColorStop(1, blob.hue + '00');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------------------
  // Browser lifecycle
  // ---------------------------------------------------------------------------

  function start(doc) {
    doc = doc || (typeof document !== 'undefined' ? document : null);
    if (!doc) { return null; }

    var canvas = doc.getElementById('ambient-bg');
    if (!canvas || typeof canvas.getContext !== 'function' || !root.requestAnimationFrame) {
      return null;
    }
    var ctx = canvas.getContext('2d');
    if (!ctx) { return null; }

    var dpr = Math.min(root.devicePixelRatio || 1, 1.5);
    var cssW = 1, cssH = 1;
    var rafId = null;
    var startTime = 0;
    var needsFit = true;

    function fit() {
      cssW = canvas.clientWidth || root.innerWidth || 1;
      cssH = canvas.clientHeight || root.innerHeight || 1;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var reduceMq = typeof root.matchMedia === 'function'
      ? root.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    function motionReduced() { return !!(reduceMq && reduceMq.matches); }

    function frame(now) {
      rafId = null;
      if (needsFit) { fit(); needsFit = false; }
      if (!startTime) { startTime = now; }
      paintField(ctx, cssW, cssH, (now - startTime) / 1000);
      if (!motionReduced()) { rafId = root.requestAnimationFrame(frame); }
    }

    function play() {
      if (rafId === null) {
        startTime = 0; // re-base time so a pause doesn't cause a visible jump
        rafId = root.requestAnimationFrame(frame);
      }
    }
    function pause() {
      if (rafId !== null) { root.cancelAnimationFrame(rafId); rafId = null; }
    }

    fit();
    needsFit = false;

    root.addEventListener('resize', function () { needsFit = true; play(); }, { passive: true });

    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) { pause(); } else if (!motionReduced()) { play(); }
    });

    if (reduceMq) {
      var onMotionChange = function () { pause(); play(); };
      if (reduceMq.addEventListener) { reduceMq.addEventListener('change', onMotionChange); }
      else if (reduceMq.addListener) { reduceMq.addListener(onMotionChange); }
    }

    play(); // paints the first frame; if motion is reduced, frame() will not reschedule
    return { play: play, pause: pause, fit: fit };
  }

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  var api = {
    BLOBS: BLOBS,
    DRIFT: DRIFT,
    RADIUS_FACTOR: RADIUS_FACTOR,
    PEAK_ALPHA: PEAK_ALPHA,
    blobCenter: blobCenter,
    blobRadius: blobRadius,
    alphaHex: alphaHex,
    paintField: paintField,
    start: start
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyAmbientBg = api;
  }
})(typeof window !== 'undefined' ? window : this);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/ambient-bg.test.js`
Expected: PASS — 7/7.

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `node --test tests/*.test.js`
Expected: PASS — 19 tests (12 existing + 7 new), 0 fail.

- [ ] **Step 6: Commit**

```bash
git add assets/js/ambient-bg.js tests/ambient-bg.test.js
git commit -m "Add ambient-bg field math module + unit tests"
```

---

### Task 2: Wire the canvas into the page + live background checks

**Files:**
- Modify: `index.html` — `<style>` (add `#ambient-bg` block, content z-index lift, `.texture-grain::before` z-index), `<body>` (add the canvas element), end-of-body scripts (add include + init call)
- Create: `sdd/browser-checks/ambient-bg.mjs` (not committed)

**Interfaces:**
- Consumes: `window.BeatReplyAmbientBg.start` (Task 1).
- Produces: a live `#ambient-bg` canvas; the CSS anchor `#ambient-bg` and the content-lift rule that Task 3's checks assume.

- [ ] **Step 1: Add the canvas element**

In `index.html`, immediately after the `<body ...>` open tag (currently line 272) and before `<a href="#main-content" class="skip-link">`:

```html
<canvas id="ambient-bg" aria-hidden="true"></canvas>
```

- [ ] **Step 2: Add the background CSS**

In `index.html`, inside the `<style>` block, immediately before the closing `</style>` (currently ~line 270), add:

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

- [ ] **Step 3: Add the script include**

In `index.html`, after `<script src="assets/js/catalog-showcase.js"></script>` (currently line 706) and before the following inline `<script>`:

```html
<script src="assets/js/ambient-bg.js"></script>
```

- [ ] **Step 4: Add the init call**

In `index.html`, inside the final inline `<script>` block, after the `Catalog showcase section` init (currently ~line 741), add:

```js
  // Ambient background
  if (window.BeatReplyAmbientBg) {
    window.BeatReplyAmbientBg.start();
  }
```

- [ ] **Step 5: Set up the Playwright harness**

Run:

```bash
mkdir -p sdd/browser-checks
cd sdd/browser-checks
ln -sfn "$(dirname "$(find ~/.npm/_npx -maxdepth 4 -path '*playwright/package.json' 2>/dev/null | head -1)")/.." node_modules 2>/dev/null || \
  ln -sfn ~/.npm/_npx/e41f203b7505f1fb/node_modules node_modules
node -e "import('playwright').then(()=>console.log('playwright OK')).catch(e=>{console.log('NO PLAYWRIGHT:',e.message);process.exit(1)})"
cd ../..
```

Expected: `playwright OK`. If it fails, install once: `npx --yes playwright@1.62.1 install chromium` then retry the symlink line.

- [ ] **Step 6: Write the background check script**

Create `sdd/browser-checks/ambient-bg.mjs`:

```js
import { chromium } from 'playwright';

const URL = process.env.TARGET_URL || 'http://localhost:8130/index.html';
const results = [];
const ok = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail: String(detail) });

const b = await chromium.launch();

// ---- normal mode --------------------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  const meta = await p.evaluate(() => {
    const cv = document.getElementById('ambient-bg');
    const cs = cv && getComputedStyle(cv);
    return cv ? {
      first: document.body.firstElementChild === cv,
      pos: cs.position, z: cs.zIndex, pe: cs.pointerEvents,
      aria: cv.getAttribute('aria-hidden'),
      w: cv.width, h: cv.height,
      mainZ: getComputedStyle(document.getElementById('main-content')).zIndex,
    } : null;
  });
  ok('#ambient-bg exists, first body child', meta && meta.first, JSON.stringify(meta));
  ok('#ambient-bg is fixed / z-index 0 / pointer-events none / aria-hidden',
     meta && meta.pos === 'fixed' && meta.z === '0' && meta.pe === 'none' && meta.aria === 'true',
     JSON.stringify(meta));
  ok('#ambient-bg backing store sized (> 0)', meta && meta.w > 0 && meta.h > 0, `${meta && meta.w}x${meta && meta.h}`);
  ok('#main-content lifted to z-index 1', meta && meta.mainZ === '1', meta && meta.mainZ);

  // animates without any interaction: sample a pixel twice, 700ms apart
  const sample = () => p.evaluate(() => {
    const cv = document.getElementById('ambient-bg');
    const g = cv.getContext('2d');
    const d = g.getImageData(Math.floor(cv.width * 0.5), Math.floor(cv.height * 0.4), 1, 1).data;
    return [d[0], d[1], d[2], d[3]].join(',');
  });
  const s1 = await sample();
  await p.waitForTimeout(700);
  const s2 = await sample();
  ok('field animates with no interaction (pixel changes over 700ms)', s1 !== s2, `${s1} -> ${s2}`);

  // decoupled from scroll: full page scroll, canvas stays put + no jump
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(200);
  const afterScroll = await p.evaluate(() => {
    const r = document.getElementById('ambient-bg').getBoundingClientRect();
    return { top: Math.round(r.top), left: Math.round(r.left) };
  });
  ok('canvas rect stays at 0,0 after scrolling to page bottom',
     afterScroll.top === 0 && afterScroll.left === 0, JSON.stringify(afterScroll));
  ok('no console / page errors in normal mode', errs.length === 0, errs.join(' | ') || 'clean');

  // tab-hidden pause: spy on rAF, hide the tab, confirm scheduling stops
  const rafDelta = await p.evaluate(async () => {
    let n = 0; const real = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => { n++; return real(cb); };
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r => setTimeout(r, 400));
    const paused = n;
    await new Promise(r => setTimeout(r, 400));
    return n - paused; // rAF calls while "hidden"
  });
  ok('rAF scheduling stops while the tab is hidden', rafDelta === 0, `${rafDelta} rAF calls after hide`);
  await p.close();
}

// ---- reduced motion ---------------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const rmSample = () => p.evaluate(() => {
    const cv = document.getElementById('ambient-bg');
    const g = cv.getContext('2d');
    const d = g.getImageData(Math.floor(cv.width * 0.5), Math.floor(cv.height * 0.4), 1, 1).data;
    return [d[0], d[1], d[2], d[3]].join(',');
  });
  const r1 = await rmSample();
  await p.waitForTimeout(700);
  const r2 = await rmSample();
  ok('reduced-motion: field is frozen (identical pixel 700ms apart)', r1 === r2, `${r1} -> ${r2}`);
  await p.close();
}

await b.close();
const wI = Math.max(...results.map(r => r.name.length));
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(wI)}  ${r.detail}`);
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
```

- [ ] **Step 7: Run the background checks**

Run:

```bash
( cd . && python3 -m http.server 8130 >/tmp/ambient-http.log 2>&1 & echo $! > /tmp/ambient-http.pid )
sleep 1
node sdd/browser-checks/ambient-bg.mjs
kill "$(cat /tmp/ambient-http.pid)"
```

Expected: `9/9 checks pass`, exit 0.

- [ ] **Step 8: Run the unit suite again (no regression)**

Run: `node --test tests/*.test.js`
Expected: PASS — 19 tests, 0 fail.

- [ ] **Step 9: Commit**

```bash
git add index.html assets/js/ambient-bg.js
git commit -m "Render the ambient background canvas behind the page"
```

(`sdd/` is gitignored — the check script is not committed.)

---

### Task 3: Material token system + navbar application + fallbacks

**Files:**
- Modify: `index.html` — `<style>` (add `:root` tokens, `.mat-*` helpers, `#navbar` / `#nav-mobile` overrides, vibrancy rules, `@media` fallbacks)
- Modify: `sdd/browser-checks/ambient-bg.mjs` (append navbar checks; not committed)

**Interfaces:**
- Consumes: `#ambient-bg` behind the navbar (Task 2), the existing `.navbar-scrolled` toggle (inline JS at ~`index.html:865`).
- Produces: `.mat-structural` / `.mat-card` / `.mat-interactive` helper classes and the `--mat-*` custom properties (only `structural` is consumed this phase).

- [ ] **Step 1: Add the material tokens + helper classes**

In `index.html`, inside `<style>`, immediately after the `#ambient-bg` block from Task 2, add:

```css
  /* ===== Material token system (phase 1: defined; only `structural` applied) ===== */
  :root {
    --mat-structural-bg:     rgba(12, 12, 14, 0.55);
    --mat-structural-tint:   rgba(255, 190, 130, 0.06); /* warm veil = faux adaptive tint */
    --mat-structural-blur:   24px;
    --mat-structural-sat:    160%;
    --mat-structural-border: rgba(255, 255, 255, 0.06);
    --mat-structural-edge:   rgba(255, 255, 255, 0.34); /* lensing: bright top arête */
    --mat-structural-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
    --mat-structural-inner:  inset 0 1px 0 rgba(255, 255, 255, 0.22);

    --mat-card-bg:     rgba(14, 14, 16, 0.5);
    --mat-card-tint:   rgba(255, 190, 130, 0.04);
    --mat-card-blur:   16px;
    --mat-card-sat:    150%;
    --mat-card-border: rgba(255, 255, 255, 0.05);
    --mat-card-edge:   rgba(255, 255, 255, 0.22);
    --mat-card-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    --mat-card-inner:  inset 0 1px 0 rgba(255, 255, 255, 0.12);

    --mat-interactive-bg:     rgba(255, 255, 255, 0.06);
    --mat-interactive-tint:   rgba(255, 200, 140, 0.05);
    --mat-interactive-blur:   10px;
    --mat-interactive-sat:    140%;
    --mat-interactive-border: rgba(255, 255, 255, 0.14);
    --mat-interactive-edge:   rgba(255, 255, 255, 0.4);
    --mat-interactive-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    --mat-interactive-inner:  inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .mat-structural {
    background: linear-gradient(var(--mat-structural-tint), var(--mat-structural-tint)), var(--mat-structural-bg);
    -webkit-backdrop-filter: blur(var(--mat-structural-blur)) saturate(var(--mat-structural-sat));
    backdrop-filter: blur(var(--mat-structural-blur)) saturate(var(--mat-structural-sat));
    border: 1px solid var(--mat-structural-border);
    border-top-color: var(--mat-structural-edge);
    box-shadow: var(--mat-structural-shadow), var(--mat-structural-inner);
  }
  .mat-card {
    background: linear-gradient(var(--mat-card-tint), var(--mat-card-tint)), var(--mat-card-bg);
    -webkit-backdrop-filter: blur(var(--mat-card-blur)) saturate(var(--mat-card-sat));
    backdrop-filter: blur(var(--mat-card-blur)) saturate(var(--mat-card-sat));
    border: 1px solid var(--mat-card-border);
    border-top-color: var(--mat-card-edge);
    box-shadow: var(--mat-card-shadow), var(--mat-card-inner);
  }
  .mat-interactive {
    background: linear-gradient(var(--mat-interactive-tint), var(--mat-interactive-tint)), var(--mat-interactive-bg);
    -webkit-backdrop-filter: blur(var(--mat-interactive-blur)) saturate(var(--mat-interactive-sat));
    backdrop-filter: blur(var(--mat-interactive-blur)) saturate(var(--mat-interactive-sat));
    border: 1px solid var(--mat-interactive-border);
    border-top-color: var(--mat-interactive-edge);
    box-shadow: var(--mat-interactive-shadow), var(--mat-interactive-inner);
  }
```

- [ ] **Step 2: Apply the structural material to the navbar**

Immediately after the `.mat-interactive` rule, add:

```css
  /* ===== Navbar: structural material (overrides the Tailwind surface utilities;
     an #id selector (0,1,0,0) beats the utility classes (0,0,1,0)) ===== */
  #navbar {
    background: linear-gradient(var(--mat-structural-tint), var(--mat-structural-tint)), var(--mat-structural-bg);
    -webkit-backdrop-filter: blur(var(--mat-structural-blur)) saturate(var(--mat-structural-sat));
    backdrop-filter: blur(var(--mat-structural-blur)) saturate(var(--mat-structural-sat));
    border-bottom: 0;
    border-top: 1px solid var(--mat-structural-edge);
    box-shadow: var(--mat-structural-shadow), var(--mat-structural-inner);
  }
  #navbar.navbar-scrolled {
    box-shadow: 0 10px 34px rgba(0, 0, 0, 0.55), var(--mat-structural-inner);
  }
  #nav-mobile {
    background: linear-gradient(var(--mat-structural-tint), var(--mat-structural-tint)), var(--mat-structural-bg);
  }
  /* Vibrancy: brighter, slightly heavier nav text — never flat grey on glass. */
  #navbar nav a,
  #nav-mobile a:not(.btn-primary) {
    color: rgba(255, 255, 255, 0.82);
    font-weight: 500;
    letter-spacing: 0.01em;
  }
  #navbar nav a:hover,
  #nav-mobile a:not(.btn-primary):hover {
    color: #ffffff;
  }
```

- [ ] **Step 3: Add the accessibility fallbacks**

Immediately after the vibrancy rules, add:

```css
  @media (prefers-reduced-transparency: reduce) {
    #navbar, #nav-mobile {
      background: rgba(10, 10, 10, 0.94);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }
  @media (prefers-contrast: more) {
    #navbar {
      background: rgba(8, 8, 8, 0.97);
      border-top-color: rgba(255, 255, 255, 0.5);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
  }
```

- [ ] **Step 4: Append navbar checks to the Playwright script**

In `sdd/browser-checks/ambient-bg.mjs`, immediately before the final `await b.close();`, insert:

```js
// ---- navbar material -------------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);

  const nav = await p.evaluate(() => {
    const n = document.getElementById('navbar');
    const cs = getComputedStyle(n);
    const link = document.querySelector('#navbar nav a');
    const lcs = link && getComputedStyle(link);
    return {
      backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
      hasBlur: /blur/.test(cs.backdropFilter || cs.webkitBackdropFilter || ''),
      borderBottom: cs.borderBottomWidth,
      linkColor: lcs && lcs.color,
      linkWeight: lcs && lcs.fontWeight,
    };
  });
  ok('navbar has a blur backdrop-filter', nav.hasBlur, nav.backdrop);
  ok('navbar bottom border removed', nav.borderBottom === '0px', nav.borderBottom);
  ok('nav link colour is bright (~rgba(255,255,255,0.82))',
     /rgba?\(255,\s*255,\s*255,\s*0?\.82/.test((nav.linkColor || '').replace(/\s/g, ' ')),
     nav.linkColor);

  // Contrast: scroll so a bright field hot-spot sits under the navbar, then compare
  // the nav link's computed text colour against the actually-rendered pixel a few
  // px to its left (navbar material composited over the field).
  await p.evaluate(() => window.scrollTo(0, 220)); // move a warm blob under the bar
  await p.waitForTimeout(300);
  const probe = await p.evaluate(() => {
    const link = document.querySelector('#navbar nav a');
    const r = link.getBoundingClientRect();
    const rgb = getComputedStyle(link).color.match(/[\d.]+/g).map(Number);
    return { rgb, x: Math.round(r.left - 6), y: Math.round(r.top + r.height / 2) };
  });
  const full = await p.screenshot(); // viewport PNG, 1 device px == 1 CSS px (no DSF set)
  const { PNG } = await import('pngjs').catch(() => ({ PNG: null }));
  const relLum = (r, g, b) => {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  let ratio = null;
  if (PNG) {
    const img = PNG.sync.read(full);
    const i = (probe.y * img.width + probe.x) * 4;
    const L1 = relLum(probe.rgb[0], probe.rgb[1], probe.rgb[2]);
    const L2 = relLum(img.data[i], img.data[i + 1], img.data[i + 2]);
    ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }
  ok('nav link text contrast >= 4.5:1 over the material',
     ratio === null || ratio >= 4.5,
     ratio === null ? 'pngjs unavailable — verify manually in Task 4' : ratio.toFixed(2) + ':1');
  await p.close();
}

// ---- reduced transparency (CSSOM assertion — emulateMedia may not cover it) --
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  const rules = await p.evaluate(() => {
    const found = { rt: false, pc: false };
    for (const ss of document.styleSheets) {
      let cr; try { cr = ss.cssRules; } catch (e) { continue; }
      for (const r of cr) {
        if (r.type === CSSRule.MEDIA_RULE) {
          const c = r.conditionText || r.media.mediaText;
          if (/prefers-reduced-transparency:\s*reduce/.test(c) && /#navbar/.test(r.cssText)) found.rt = true;
          if (/prefers-contrast:\s*more/.test(c) && /#navbar/.test(r.cssText)) found.pc = true;
        }
      }
    }
    return found;
  });
  ok('a @media (prefers-reduced-transparency: reduce) rule targets #navbar', rules.rt);
  ok('a @media (prefers-contrast: more) rule targets #navbar', rules.pc);
  await p.close();
}
```

If `pngjs` is not resolvable via the symlinked `node_modules`, the contrast check degrades to "check manually" (non-failing) — note it for Task 4's manual eyeball. (`pngjs` ships as a Playwright dependency, so it is usually present.)

- [ ] **Step 5: Run all live checks**

Run:

```bash
( python3 -m http.server 8130 >/tmp/ambient-http.log 2>&1 & echo $! > /tmp/ambient-http.pid )
sleep 1
node sdd/browser-checks/ambient-bg.mjs
kill "$(cat /tmp/ambient-http.pid)"
```

Expected: all checks pass (14–15/15 — the contrast check may read "check manually" if `pngjs` is unavailable), exit 0.

- [ ] **Step 6: Run the unit suite (no regression)**

Run: `node --test tests/*.test.js`
Expected: PASS — 19 tests, 0 fail.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Apply the structural material to the navbar + define material tokens"
```

---

### Task 4: Full verification pass + intensity tuning

**Files:** none (verification + at most a one-line constant tweak in `assets/js/ambient-bg.js`)

- [ ] **Step 1: Full automated pass**

Run:

```bash
node --test tests/*.test.js
( python3 -m http.server 8130 >/tmp/ambient-http.log 2>&1 & echo $! > /tmp/ambient-http.pid ) ; sleep 1
node sdd/browser-checks/ambient-bg.mjs
kill "$(cat /tmp/ambient-http.pid)"
```

Expected: unit `19/19`; browser checks all pass.

- [ ] **Step 2: Visual eyeball against the approved mockup**

Serve the page and screenshot the top of the page at 1440×900 and 390×844:

```bash
( python3 -m http.server 8130 >/tmp/ambient-http.log 2>&1 & echo $! > /tmp/ambient-http.pid ) ; sleep 1
node -e "
import('playwright').then(async ({chromium}) => {
  const b = await chromium.launch();
  for (const [w,h,tag] of [[1440,900,'desktop'],[390,844,'mobile']]) {
    const p = await b.newPage({ viewport: { width:w, height:h }, deviceScaleFactor: 2 });
    await p.goto('http://localhost:8130/index.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: '/tmp/ambient-'+tag+'.png' });
    await p.close();
  }
  await b.close();
});
"
kill "$(cat /tmp/ambient-http.pid)"
```

Open `/tmp/ambient-desktop.png` and `/tmp/ambient-mobile.png`. Check against the brainstorm mockup (`.superpowers/brainstorm/*/content/bg-intensity-navbar.html`, card 2 "Intermédiaire"):
- The field reads as a warm presence, not a pattern; blobs are soft-edged, no banding.
- Navbar text (`Fonctionnalités / Process / Témoignages`) is comfortably legible; the CTA button is unchanged.
- Hero heading is legible over the field.
- Grain texture still faintly visible.
- No horizontal scrollbar at either size.

- [ ] **Step 3: Tune intensity if needed**

If the field is too strong or too weak versus the approved mockup, adjust **only** `PEAK_ALPHA` (and proportionally `MID_ALPHA`) at the top of `assets/js/ambient-bg.js`. `0x33 / 0x13` = the "intermediate" target; step by ~`0x08`. Re-run Step 2. Do not change blob positions, speeds, or count.

- [ ] **Step 4: Regression sweep on the rest of the page**

In the screenshots (scroll through, or add sections to the screenshot loop), confirm Hero, `#solutions`, `#catalog-showcase`, `#process`, `#testimonials`, `#cta-final`, footer all render with their existing layout and the catalog demo / showcase still work (no console errors — already covered by the check script's error listener, but eyeball the interactive bits).

- [ ] **Step 5: Commit (only if Step 3 changed a constant)**

```bash
git add assets/js/ambient-bg.js
git commit -m "Tune ambient field intensity to the approved mockup"
```

If nothing changed, skip.

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §1.1 canvas DOM + `z-index` lift | Task 2 steps 1–2 |
| §1.2 rendering (blobs, `lighter`, rAF, time-driven, visibility pause, reduced-motion single frame) | Task 1 step 3 (`paintField`, `start`), verified Task 2 steps 6–7 |
| §1.2 feature gate | Task 1 step 3 (`start` guard) + test step 1 |
| §1.3 fallbacks (reduced-motion, no-canvas) | Task 1 (`start`), Task 2 (`#ambient-bg { background:#0a0a0a }`), verified Task 2 reduced-motion block |
| §2 material tokens (3 weights) + `.mat-*` helpers | Task 3 step 1 |
| §2 faux adaptive tint / faux lensing | Task 3 step 1 (`--*-tint`, `--*-edge` + `border-top-color`) |
| §3.1 swap navbar surface, override not edit classes, kill `border-b` | Task 3 step 2 |
| §3.2 vibrancy on nav text, CTA untouched | Task 3 step 2 |
| §3.3 scroll-edge shadow, reduced-transparency, reduced-contrast | Task 3 steps 2–3 |
| §3.4 contrast ≥ 4.5:1 | Task 3 step 4 (contrast check) + Task 4 step 2 |
| §4 pure-fn unit tests | Task 1 |
| §4 Playwright checks (animates, scroll-decoupled, reduced-motion, navbar, no regression, tab-hidden pause) | Task 2 step 6 + Task 3 step 4 |
| §5 tuning knobs | Task 4 step 3 |

No spec requirement is left without a task.

**Placeholder scan:** Clean. The one soft spot is the contrast check's dependency on `pngjs` (a Playwright transitive dep, normally resolvable via the symlinked `node_modules`); if absent, that single check reports "verify manually in Task 4" without failing the run, and Task 4 step 2's eyeball covers it. No `TBD`/`TODO`, every code step shows complete code, every command has an expected result.

**Type consistency:** `blobCenter` / `blobRadius` / `alphaHex` / `paintField` / `start` names and signatures match between Task 1's Interfaces block, the test file, the module, and Task 4's tuning note (`PEAK_ALPHA` / `MID_ALPHA`). `#ambient-bg`, `#main-content`, `.navbar-scrolled`, `.mat-structural` spelled consistently across tasks.

**Scope check:** One cohesive subsystem (page atmosphere). Four tasks, each independently reviewable and committable.
