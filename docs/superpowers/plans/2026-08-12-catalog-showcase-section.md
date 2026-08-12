# Catalog Showcase Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new section between "Solutions" and "Process" showing 3 enriched beat cards (cover gradient, waveform with simulated play/pause, per-license pricing, CTA) for a selected style, reusing the same 3 style categories and catalog data already built for the Hero widget.

**Architecture:** A new pure-logic-first file (`assets/js/catalog-showcase.js`) holds a playback-progress calculation (`activeBarCount`) and constants, unit-tested with Node's built-in test runner — mirroring the pattern already used for `catalog-demo.js`. The section's 3 card "slots" are permanent DOM elements (never destroyed/recreated) that `renderShowcase` updates in place on style-chip clicks, and whose play buttons drive a single shared, exclusive playback timer. No build step, no framework, no network requests, no new npm dependencies.

**Tech Stack:** Vanilla JavaScript (ES5-safe, no bundler), `node:test` + `node:assert/strict` for the pure-logic unit tests (zero npm dependencies).

## Global Constraints

- No real audio — the beatmaker's catalog has no public preview files yet. Play/pause is a simulated bar-sweep animation, no `<audio>` element, no sound.
- Pricing shown on every card is the same universal grid used elsewhere on the page: MP3 40€ · WAV 70€ · Stems 150€ · Exclu à négocier. No per-track pricing.
- No new catalog data — reuse `window.BeatReplyCatalogDemo.getStyleData(styleKey)` from `assets/js/catalog-demo.js` (already built, already tested). Do not modify `catalog-demo.js`.
- No cover photos — cover art is a CSS gradient per style category (3 distinct gradients), reusing only the existing `--primary`/`--secondary` hex values already used elsewhere in `index.html` (`#00D9FF`, `#8B5CF6`). No new colors, no stock photography.
- The new section's style chips and playback state are independent of the Hero's — no shared DOM, no cross-section synchronization.
- Default selected style on load: `westcoast` (same as the Hero, exposed as `window.BeatReplyCatalogDemo.DEFAULT_STYLE`).
- "Je la veux" on every card links to the exact same `mailto:hello@beatreply.io?subject=Je%20veux%20mon%20essai%20gratuit%20BeatReply` used by the page's existing final CTA — no new destination.
- Under `prefers-reduced-motion: reduce`, clicking play must not produce a gradual, incremental sweep — it must jump directly to a fully-active state, hold briefly, then reset, with no intermediate animated frames.
- Section placed between the existing "Solutions" section's closing divider and the "Process" section's opening comment in `index.html`.

---

## File Structure

- Create: `assets/js/catalog-showcase.js` — pure playback-progress constants/function (Task 1), then card-rendering and playback DOM wiring (Task 2). Exposes `window.BeatReplyCatalogShowcase = { activeBarCount, WAVEFORM_HEIGHTS, PLAYBACK_DURATION_MS, initCatalogShowcase }` in the browser, `module.exports` under Node (same UMD-style guard pattern as `catalog-demo.js`).
- Create: `tests/catalog-showcase.test.js` — Node built-in test runner, covers `activeBarCount` at 0%, mid-progress, full duration, and the `WAVEFORM_HEIGHTS`/`PLAYBACK_DURATION_MS` constants.
- Modify: `index.html` — new `<style>` rules for the 3 cover gradients (near the existing `.accent-gradient` rule), new `<section>` markup between Solutions and Process, and a new `<script src="assets/js/catalog-showcase.js">` tag plus one guarded init call in the existing inline `<script>` block.

---

### Task 1: Playback-progress logic with tested pure function

**Files:**
- Create: `assets/js/catalog-showcase.js`
- Test: `tests/catalog-showcase.test.js`

**Interfaces:**
- Produces: `activeBarCount(elapsedMs: number) -> number` — returns how many of the 12 waveform bars should show as "played" for a given elapsed time. Returns `0` at `elapsedMs <= 0`, `WAVEFORM_HEIGHTS.length` (12) at `elapsedMs >= PLAYBACK_DURATION_MS`, and `Math.floor((elapsedMs / PLAYBACK_DURATION_MS) * WAVEFORM_HEIGHTS.length)` in between.
- Produces: `WAVEFORM_HEIGHTS: number[]` — 12 fixed bar-height percentages, `[40, 65, 45, 80, 55, 90, 60, 40, 75, 50, 65, 45]`, shared by every card (decorative, not derived from real audio).
- Produces: `PLAYBACK_DURATION_MS: number` — `8000`.
- Exposed globally in the browser as `window.BeatReplyCatalogShowcase = { activeBarCount, WAVEFORM_HEIGHTS, PLAYBACK_DURATION_MS }` (Task 2 adds `initCatalogShowcase` to this same object).

- [ ] **Step 1: Write the failing test file**

Create `tests/catalog-showcase.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  activeBarCount,
  WAVEFORM_HEIGHTS,
  PLAYBACK_DURATION_MS
} = require('../assets/js/catalog-showcase.js');

test('WAVEFORM_HEIGHTS has exactly 12 bars', () => {
  assert.equal(WAVEFORM_HEIGHTS.length, 12);
});

test('PLAYBACK_DURATION_MS is 8000', () => {
  assert.equal(PLAYBACK_DURATION_MS, 8000);
});

test('activeBarCount is 0 at the very start', () => {
  assert.equal(activeBarCount(0), 0);
});

test('activeBarCount is 12 (all bars) once duration is reached', () => {
  assert.equal(activeBarCount(8000), 12);
});

test('activeBarCount is 12 (all bars) past the duration', () => {
  assert.equal(activeBarCount(9000), 12);
});

test('activeBarCount is 6 at exactly half the duration', () => {
  assert.equal(activeBarCount(4000), 6);
});

test('activeBarCount rounds down for a non-exact fraction', () => {
  assert.equal(activeBarCount(1000), 1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/catalog-showcase.test.js`
Expected: FAIL — `Cannot find module '../assets/js/catalog-showcase.js'`

- [ ] **Step 3: Create the playback-progress module**

Create `assets/js/catalog-showcase.js`:

```js
(function (root) {
  'use strict';

  var WAVEFORM_HEIGHTS = [40, 65, 45, 80, 55, 90, 60, 40, 75, 50, 65, 45];
  var PLAYBACK_DURATION_MS = 8000;

  function activeBarCount(elapsedMs) {
    if (elapsedMs <= 0) {
      return 0;
    }
    if (elapsedMs >= PLAYBACK_DURATION_MS) {
      return WAVEFORM_HEIGHTS.length;
    }
    return Math.floor((elapsedMs / PLAYBACK_DURATION_MS) * WAVEFORM_HEIGHTS.length);
  }

  var api = {
    activeBarCount: activeBarCount,
    WAVEFORM_HEIGHTS: WAVEFORM_HEIGHTS,
    PLAYBACK_DURATION_MS: PLAYBACK_DURATION_MS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyCatalogShowcase = api;
  }
})(typeof window !== 'undefined' ? window : this);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/catalog-showcase.test.js`
Expected: PASS — `# pass 7`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add assets/js/catalog-showcase.js tests/catalog-showcase.test.js
git commit -m "$(cat <<'EOF'
Add catalog showcase playback-progress module with tested logic

Pure activeBarCount() function driving the simulated waveform sweep
for the new catalog showcase section, covered by node:test. No DOM
code yet — that's added in the next task alongside the section markup.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Section markup, cover gradients, and playback DOM wiring

**Files:**
- Modify: `index.html` (new `<style>` rules, new `<section>` markup, new `<script>` tag + init call)
- Modify: `assets/js/catalog-showcase.js` (add `renderShowcase`, `initCatalogShowcase`, and playback helpers)

**Interfaces:**
- Consumes: `window.BeatReplyCatalogDemo.getStyleData(styleKey)` and `window.BeatReplyCatalogDemo.DEFAULT_STYLE` from `catalog-demo.js` (already loaded earlier in the page).
- Consumes: `activeBarCount`, `WAVEFORM_HEIGHTS`, `PLAYBACK_DURATION_MS` from Task 1, already in this same file.
- Produces: `window.BeatReplyCatalogShowcase.initCatalogShowcase(doc)` — finds `#catalog-showcase`, wires the 3 style-chip buttons and the 3 cards' play buttons, and renders the default style. Returns nothing; if `#catalog-showcase` isn't found, or `window.BeatReplyCatalogDemo` isn't present, it returns without throwing.

- [ ] **Step 1: Add the 3 cover-gradient CSS rules**

In `index.html`, find this line (currently line 110):

```css
  .accent-gradient { background: linear-gradient(135deg, #00D9FF, #00C4E6); }
```

Add these 3 rules immediately after it:

```css
  .showcase-cover-rnbswag { background: linear-gradient(135deg, #8B5CF6, #00D9FF); }
  .showcase-cover-westcoast { background: linear-gradient(135deg, #00D9FF, #8B5CF6); }
  .showcase-cover-trap { background: linear-gradient(160deg, #00D9FF 0%, #8B5CF6 55%, #0a0a0a 100%); }
```

- [ ] **Step 2: Insert the new section markup**

In `index.html`, find this exact block (currently lines 487-491, right after the Solutions section closes):

```html
  </div>
</section>

<div class="section-divider max-w-wide mx-auto"></div>

<!-- PROCESS -->
```

Replace it with (inserting the new section and its own divider before the existing one, so the surrounding structure is otherwise untouched):

```html
  </div>
</section>

<div class="section-divider max-w-wide mx-auto"></div>

<!-- CATALOG SHOWCASE -->
<section id="catalog-showcase" class="section-padding py-16 lg:py-24">
  <div class="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-prose mx-auto mb-16 scroll-reveal">
      <span class="text-caption uppercase text-primary mb-4 inline-block">Le catalogue</span>
      <h2 class="text-[2rem] sm:text-h2 font-semibold mb-4">Ce que voit ton client après sa demande</h2>
      <p class="text-body-lg text-text-secondary">BeatReply cherche dans ton vrai catalogue et propose direct les bons beats.</p>
    </div>

    <div class="flex flex-wrap justify-center gap-2 mb-10" role="group" aria-label="Choisir un style de beat">
      <button type="button" class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-caption uppercase bg-primary-muted text-primary border border-primary/20" data-showcase-style="rnbswag" aria-pressed="false">R&amp;B/Swag</button>
      <button type="button" class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-caption uppercase border accent-gradient text-background" data-showcase-style="westcoast" aria-pressed="true">West Coast</button>
      <button type="button" class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-caption uppercase bg-primary-muted text-primary border border-primary/20" data-showcase-style="trap" aria-pressed="false">Trap</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="glass-surface rounded-lg border border-border-primary p-5 scroll-reveal" data-showcase-card>
        <div class="showcase-cover-westcoast relative rounded-md aspect-square mb-4" data-showcase-cover>
          <span class="absolute top-2 left-2 text-caption font-bold text-background bg-background/20 rounded px-2 py-0.5">01</span>
        </div>
        <p class="text-body-sm font-semibold" data-showcase-title>Hood</p>
        <p class="text-caption text-text-ghost mb-3" data-showcase-meta>West Coast · 98 BPM · F Min</p>
        <div class="flex items-center gap-3 mb-3">
          <button type="button" class="w-8 h-8 flex-shrink-0 rounded-full accent-gradient flex items-center justify-center" data-showcase-play aria-label="Écouter un extrait de Hood">
            <svg class="w-3 h-3 text-background" data-showcase-icon-play viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            <svg class="w-3 h-3 text-background hidden" data-showcase-icon-pause viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          </button>
          <div class="flex-1 h-8 flex items-end gap-1">
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 40%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 65%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 45%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 80%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 55%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 90%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 60%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 40%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 75%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 50%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 65%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 45%"></span>
          </div>
        </div>
        <p class="text-caption text-text-muted mb-4">MP3 40&nbsp;€ · WAV 70&nbsp;€ · Stems 150&nbsp;€ · Exclu à négocier</p>
        <a href="mailto:hello@beatreply.io?subject=Je%20veux%20mon%20essai%20gratuit%20BeatReply" class="btn-secondary rounded-md px-4 py-2 text-body-sm font-semibold w-full text-center inline-block">Je la veux</a>
      </div>
      <div class="glass-surface rounded-lg border border-border-primary p-5 scroll-reveal" data-showcase-card>
        <div class="showcase-cover-westcoast relative rounded-md aspect-square mb-4" data-showcase-cover>
          <span class="absolute top-2 left-2 text-caption font-bold text-background bg-background/20 rounded px-2 py-0.5">02</span>
        </div>
        <p class="text-body-sm font-semibold" data-showcase-title>San Andreas</p>
        <p class="text-caption text-text-ghost mb-3" data-showcase-meta>West Coast · 99 BPM · G Min</p>
        <div class="flex items-center gap-3 mb-3">
          <button type="button" class="w-8 h-8 flex-shrink-0 rounded-full accent-gradient flex items-center justify-center" data-showcase-play aria-label="Écouter un extrait de San Andreas">
            <svg class="w-3 h-3 text-background" data-showcase-icon-play viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            <svg class="w-3 h-3 text-background hidden" data-showcase-icon-pause viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          </button>
          <div class="flex-1 h-8 flex items-end gap-1">
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 40%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 65%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 45%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 80%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 55%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 90%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 60%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 40%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 75%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 50%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 65%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 45%"></span>
          </div>
        </div>
        <p class="text-caption text-text-muted mb-4">MP3 40&nbsp;€ · WAV 70&nbsp;€ · Stems 150&nbsp;€ · Exclu à négocier</p>
        <a href="mailto:hello@beatreply.io?subject=Je%20veux%20mon%20essai%20gratuit%20BeatReply" class="btn-secondary rounded-md px-4 py-2 text-body-sm font-semibold w-full text-center inline-block">Je la veux</a>
      </div>
      <div class="glass-surface rounded-lg border border-border-primary p-5 scroll-reveal" data-showcase-card>
        <div class="showcase-cover-westcoast relative rounded-md aspect-square mb-4" data-showcase-cover>
          <span class="absolute top-2 left-2 text-caption font-bold text-background bg-background/20 rounded px-2 py-0.5">03</span>
        </div>
        <p class="text-body-sm font-semibold" data-showcase-title>Cali</p>
        <p class="text-caption text-text-ghost mb-3" data-showcase-meta>West Coast · 103 BPM · D# Min</p>
        <div class="flex items-center gap-3 mb-3">
          <button type="button" class="w-8 h-8 flex-shrink-0 rounded-full accent-gradient flex items-center justify-center" data-showcase-play aria-label="Écouter un extrait de Cali">
            <svg class="w-3 h-3 text-background" data-showcase-icon-play viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            <svg class="w-3 h-3 text-background hidden" data-showcase-icon-pause viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          </button>
          <div class="flex-1 h-8 flex items-end gap-1">
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 40%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 65%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 45%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 80%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 55%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 90%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 60%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 40%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 75%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 50%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 65%"></span>
            <span class="w-1.5 rounded-full bg-primary/25" data-showcase-bar style="height: 45%"></span>
          </div>
        </div>
        <p class="text-caption text-text-muted mb-4">MP3 40&nbsp;€ · WAV 70&nbsp;€ · Stems 150&nbsp;€ · Exclu à négocier</p>
        <a href="mailto:hello@beatreply.io?subject=Je%20veux%20mon%20essai%20gratuit%20BeatReply" class="btn-secondary rounded-md px-4 py-2 text-body-sm font-semibold w-full text-center inline-block">Je la veux</a>
      </div>
    </div>
  </div>
</section>

<div class="section-divider max-w-wide mx-auto"></div>

<!-- PROCESS -->
```

- [ ] **Step 3: Add the script tag and init call**

In `index.html`, find the existing inline `<script>` block's catalog-demo guard (added in a previous task):

```html
<script src="assets/js/catalog-demo.js"></script>
<script>
```

Replace it with (adding the new script tag right after the existing one):

```html
<script src="assets/js/catalog-demo.js"></script>
<script src="assets/js/catalog-showcase.js"></script>
<script>
```

Then find the end of that same inline `<script>` block, where the previous task added:

```js
  // Interactive catalog demo
  if (window.BeatReplyCatalogDemo) {
    window.BeatReplyCatalogDemo.initCatalogDemo();
  }
</script>
```

Replace it with:

```js
  // Interactive catalog demo
  if (window.BeatReplyCatalogDemo) {
    window.BeatReplyCatalogDemo.initCatalogDemo();
  }

  // Catalog showcase section
  if (window.BeatReplyCatalogShowcase) {
    window.BeatReplyCatalogShowcase.initCatalogShowcase();
  }
</script>
```

- [ ] **Step 4: Implement the DOM wiring in the showcase module**

In `assets/js/catalog-showcase.js`, insert this above the `var api = { ... }` line:

```js
  var playbackState = { cardIndex: -1, elapsedMs: 0, timerId: null };
  var REDUCED_MOTION_HOLD_MS = 1500;

  function setPlayIcon(card, isPlaying) {
    var playIcon = card.querySelector('[data-showcase-icon-play]');
    var pauseIcon = card.querySelector('[data-showcase-icon-pause]');
    playIcon.classList.toggle('hidden', isPlaying);
    pauseIcon.classList.toggle('hidden', !isPlaying);

    var button = card.querySelector('[data-showcase-play]');
    var title = card.querySelector('[data-showcase-title]').textContent;
    button.setAttribute('aria-label', (isPlaying ? 'Mettre en pause ' : 'Écouter un extrait de ') + title);
  }

  function setCardProgress(card, elapsedMs) {
    var bars = card.querySelectorAll('[data-showcase-bar]');
    var active = activeBarCount(elapsedMs);
    for (var i = 0; i < bars.length; i++) {
      bars[i].classList.toggle('bg-primary', i < active);
      bars[i].classList.toggle('bg-primary/25', i >= active);
    }
  }

  function stopPlayback(cards) {
    if (playbackState.timerId !== null) {
      clearInterval(playbackState.timerId);
      playbackState.timerId = null;
    }
    if (playbackState.cardIndex !== -1) {
      setCardProgress(cards[playbackState.cardIndex], 0);
      setPlayIcon(cards[playbackState.cardIndex], false);
    }
    playbackState.cardIndex = -1;
    playbackState.elapsedMs = 0;
  }

  function startPlayback(cards, index) {
    stopPlayback(cards);
    playbackState.cardIndex = index;
    playbackState.elapsedMs = 0;
    setPlayIcon(cards[index], true);

    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCardProgress(cards[index], PLAYBACK_DURATION_MS);
      playbackState.timerId = setInterval(function () {
        stopPlayback(cards);
      }, REDUCED_MOTION_HOLD_MS);
      return;
    }

    playbackState.timerId = setInterval(function () {
      playbackState.elapsedMs += 100;
      setCardProgress(cards[index], playbackState.elapsedMs);
      if (playbackState.elapsedMs >= PLAYBACK_DURATION_MS) {
        stopPlayback(cards);
      }
    }, 100);
  }

  function renderShowcase(doc, root, cards, styleKey) {
    stopPlayback(cards);

    var data = window.BeatReplyCatalogDemo.getStyleData(styleKey);

    var chips = root.querySelectorAll('[data-showcase-style]');
    for (var i = 0; i < chips.length; i++) {
      var isActive = chips[i].getAttribute('data-showcase-style') === styleKey;
      chips[i].setAttribute('aria-pressed', String(isActive));
      chips[i].classList.toggle('accent-gradient', isActive);
      chips[i].classList.toggle('text-background', isActive);
      chips[i].classList.toggle('bg-primary-muted', !isActive);
      chips[i].classList.toggle('text-primary', !isActive);
      chips[i].classList.toggle('border-primary/20', !isActive);
    }

    for (var j = 0; j < cards.length; j++) {
      var track = data.tracks[j];
      var card = cards[j];

      var cover = card.querySelector('[data-showcase-cover]');
      cover.classList.remove('showcase-cover-rnbswag', 'showcase-cover-westcoast', 'showcase-cover-trap');
      cover.classList.add('showcase-cover-' + styleKey);

      card.querySelector('[data-showcase-title]').textContent = track.title;
      card.querySelector('[data-showcase-meta]').textContent = data.label + ' · ' + track.bpm + ' BPM · ' + track.key;

      setPlayIcon(card, false);
      setCardProgress(card, 0);
    }
  }

  function initCatalogShowcase(doc) {
    doc = doc || document;
    if (!window.BeatReplyCatalogDemo) {
      return;
    }
    var root = doc.getElementById('catalog-showcase');
    if (!root) {
      return;
    }

    var cards = root.querySelectorAll('[data-showcase-card]');

    var chips = root.querySelectorAll('[data-showcase-style]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function (event) {
        renderShowcase(doc, root, cards, event.currentTarget.getAttribute('data-showcase-style'));
      });
    }

    for (var j = 0; j < cards.length; j++) {
      (function (index) {
        var playButton = cards[index].querySelector('[data-showcase-play]');
        playButton.addEventListener('click', function () {
          if (playbackState.cardIndex === index) {
            stopPlayback(cards);
          } else {
            startPlayback(cards, index);
          }
        });
      })(j);
    }

    renderShowcase(doc, root, cards, window.BeatReplyCatalogDemo.DEFAULT_STYLE);
  }
```

Update the `api` object at the bottom of the file to:

```js
  var api = {
    activeBarCount: activeBarCount,
    WAVEFORM_HEIGHTS: WAVEFORM_HEIGHTS,
    PLAYBACK_DURATION_MS: PLAYBACK_DURATION_MS,
    initCatalogShowcase: initCatalogShowcase
  };
```

- [ ] **Step 5: Run the Task 1 tests to confirm nothing broke**

Run: `node --test tests/catalog-showcase.test.js`
Expected: PASS — `# pass 7`, `# fail 0` (the new functions are additive and don't change `activeBarCount`, `WAVEFORM_HEIGHTS`, or `PLAYBACK_DURATION_MS`)

Also run the existing Hero widget's tests to confirm this task didn't touch `catalog-demo.js`:

Run: `node --test tests/catalog-demo.test.js`
Expected: PASS — `# pass 5`, `# fail 0`

- [ ] **Step 6: Manually verify in the browser**

Run: `python3 -m http.server 8000` from `/Users/corentin/Documents/Projects/lp-beatreply`, then open `http://localhost:8000/index.html`.

Check, in order:
1. Scrolling down, a new section titled "Ce que voit ton client après sa demande" appears between "Solutions" and "Process".
2. On load, the "West Coast" chip is highlighted (accent-gradient), the 3 cards show Hood (98 BPM · F Min), San Andreas (99 BPM · G Min), Cali (103 BPM · D# Min), each with a cyan-to-violet cover gradient, the same license line (MP3 40 € · WAV 70 € · Stems 150 € · Exclu à négocier), and a "Je la veux" link.
3. Click "R&B/Swag" — chip highlight moves, cards change to Swaggy (98 BPM · A Min), Real Love (122 BPM · F# Min), Snake (93 BPM · C# Min), meta lines start with "R&B/Swag ·", cover gradient changes to violet-to-cyan.
4. Click "Trap" — cards change to TrapHouse (139 BPM · C Min), Jungle (127 BPM · D# Min), RockMySoul (120 BPM · D# Min), cover gradient changes to the darker trap treatment.
5. Click the play button on the first card — its icon switches to pause, and over the next few seconds the waveform bars light up left to right; after 8 seconds it automatically resets to the play icon with all bars back to the dim state.
6. While the first card is playing, click play on the second card — the first card immediately resets (icon back to play, bars dim) and the second card starts playing instead. Only one card plays at a time.
7. Click play on a card, then click its own button again before it finishes — it stops immediately (icon back to play, bars dim at whatever position they'd reached).
8. Switch style (e.g. click "Trap") while a card is playing — the playback stops (no lingering timer, no bars stuck lit on the old track).
9. Resize the browser to a narrow (mobile) width — the 3 style chips wrap onto a new line, the 3 cards stack in a single column instead of 3 columns, no horizontal scrollbar caused by this section.
10. Tab through the page with the keyboard — each style chip and each play button shows the existing cyan focus outline, and pressing Enter/Space on a focused button triggers the same action as a click.
11. In Chrome DevTools, open the Rendering tab and set "Emulate CSS media feature prefers-reduced-motion" to "reduce", then reload and click a play button — the waveform jumps immediately to fully lit (no left-to-right sweep), holds for about 1.5 seconds, then resets to the play icon with bars dim again.

Expected: all 11 checks pass. If any fails, fix the corresponding markup/JS from Steps 1-4 before continuing.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/js/catalog-showcase.js
git commit -m "$(cat <<'EOF'
Add catalog showcase section with simulated play/pause

New section between Solutions and Process: 3 enriched beat cards per
style (cover gradient, waveform, real license pricing, CTA), driven by
the same style chips and catalog data as the Hero widget. Play/pause is
a simulated bar-sweep animation (no real audio yet, no public preview
files exist), with proper exclusivity (one card plays at a time) and a
prefers-reduced-motion fallback that skips the incremental sweep.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- New section between Solutions and Process, own style chips, independent from Hero → Task 2, Step 2 markup + Step 4 `initCatalogShowcase`/`renderShowcase`.
- 3 enriched cards per style (cover, badge, title, BPM/tonalité, waveform+play, real license grid, CTA) → Task 2, Step 2 markup, all fields present per card.
- Reuses `getStyleData()`, no new catalog data → Task 2, Step 4 `renderShowcase` calls `window.BeatReplyCatalogDemo.getStyleData(styleKey)` directly, no data duplicated in this file.
- Cover gradients reuse existing `--primary`/`--secondary` hex values, no new colors, no photos → Task 2, Step 1 CSS rules use `#00D9FF`/`#8B5CF6`/`#0a0a0a`, all already present elsewhere in `index.html`.
- Simulated play/pause, no real audio, exclusivity (one card at a time), auto-reset at end → Task 2, Step 4 `startPlayback`/`stopPlayback`.
- `prefers-reduced-motion` instant-jump-then-reset behavior → Task 2, Step 4 `startPlayback`'s `prefersReducedMotion` branch; verified in Step 6 check 11.
- Default style `westcoast`, consistent with Hero → Task 2, Step 4 `initCatalogShowcase` passes `window.BeatReplyCatalogDemo.DEFAULT_STYLE`, and Step 2's static markup pre-renders the matching West Coast content so there's no empty-content flash before JS runs (same fix pattern already established for the Hero widget).
- "Je la veux" links to the same CTA as the rest of the page → Task 2, Step 2, `href="mailto:hello@beatreply.io?subject=Je%20veux%20mon%20essai%20gratuit%20BeatReply"` copied verbatim from `index.html:555`.
- No new npm dependencies, zero-dependency Node built-ins for tests → Task 1, `node:test`/`node:assert/strict` only.

**Placeholder scan:** no TBD/TODO, no "add appropriate handling" phrasing, every step has complete code or an exact command with expected output. The 3 card blocks in Task 2 Step 2 are written out in full (not "repeat the block above") since a future reader may jump directly to that step.

**Type consistency:** `getStyleData` return shape (`label`, `totalCount`, `clientMessage`, `tracks: {title, bpm, key}[]`) matches exactly how Task 2's `renderShowcase` reads it (`data.label`, `data.tracks[j].title/bpm/key`) — same shape already established and tested by `catalog-demo.js`. `activeBarCount`/`WAVEFORM_HEIGHTS`/`PLAYBACK_DURATION_MS` names and signatures are identical between Task 1's implementation, Task 1's tests, and Task 2's `setCardProgress`/`startPlayback` usage. The 3 style keys (`rnbswag`, `westcoast`, `trap`) used in `data-showcase-style` attributes, `showcase-cover-*` class names, and `CATALOG_DATA` keys (from the existing `catalog-demo.js`) all match exactly.
