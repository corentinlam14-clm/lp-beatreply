# Hero Catalog Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static Hero DM mockup on the BeatReply landing page into an interactive demo that shows 3 real beats (title, BPM, key) from a partner beatmaker's actual catalog when a visitor clicks one of 3 style chips (R&B/Swag, West Coast, Trap).

**Architecture:** A small vanilla-JS module (`assets/js/catalog-demo.js`) holds the catalog data and a pure lookup function (`getStyleData`), plus a DOM-wiring function (`initCatalogDemo`) that attaches click handlers to the style chips already present in the Hero markup and updates the client message, track cards, counter, and license line in place. No build step, no framework, no network requests — matches the rest of the site (single static `index.html`, plain `<script>` tags).

**Tech Stack:** Vanilla JavaScript (ES5-safe, no bundler), `node:test` + `node:assert/strict` for the data-layer unit tests (zero npm dependencies — Node 18+ ships both built in).

## Global Constraints

- No audio playback — untitled.stream is not a public listening platform (per spec).
- No per-track pricing — only the universal license grid applies: MP3 40€ · WAV 70€ · Stems 150€ · Exclu sur demande (from the beatmaker's active n8n DM-auto-reply workflow).
- No producer name displayed anywhere in markup, data, or code comments — attribution is anonymous for now.
- No collaborator/featuring names in track titles.
- Default selected style on page load: `westcoast` (21 tracks, the largest category).
- Reuses existing design tokens only: `.badge`, `.glass-surface`, `--primary`, `--primary-muted`, `accent-gradient`, `text-caption`, `text-body-sm`, focus-visible pattern already defined in `design.md` — no new CSS files, no new color values.
- Content swap on chip click must not add new animation (per spec, this keeps `prefers-reduced-motion` unaffected — no new media query needed).
- Style chip buttons must use `aria-pressed` reflecting selection state; the AI response container must have `aria-live="polite"`.

---

## File Structure

- Create: `assets/js/catalog-demo.js` — catalog data (3 styles × 3 tracks, counts, client messages) + `getStyleData(styleKey)` pure lookup + `initCatalogDemo(doc)` DOM wiring. Exposed as `window.BeatReplyCatalogDemo` in the browser, as `module.exports` under Node (UMD-style guard) so it's unit-testable without a browser.
- Create: `tests/catalog-demo.test.js` — Node built-in test runner, covers `getStyleData` for all 3 styles + the unknown-key error case + the default style constant.
- Modify: `index.html:331-357` — replace the static Hero mockup chat block with the chip row + dynamic client-message/AI-response markup, and add a `<script src="assets/js/catalog-demo.js"></script>` tag plus one init call in the existing inline `<script>` block at the bottom of the file.

---

### Task 1: Catalog data module with tested lookup function

**Files:**
- Create: `assets/js/catalog-demo.js`
- Test: `tests/catalog-demo.test.js`

**Interfaces:**
- Produces: `getStyleData(styleKey: string) -> { label: string, totalCount: number, clientMessage: string, tracks: Array<{ title: string, bpm: number, key: string }> }`, throws `Error` for unknown `styleKey`.
- Produces: `DEFAULT_STYLE: string` constant, value `'westcoast'`.
- Exposed globally in the browser as `window.BeatReplyCatalogDemo = { getStyleData, DEFAULT_STYLE, initCatalogDemo }` (the `initCatalogDemo` member is added in Task 2, but the export object is created in this task so Task 2 only needs to add one property to it).

- [ ] **Step 1: Write the failing test file**

Create `tests/catalog-demo.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { getStyleData, DEFAULT_STYLE } = require('../assets/js/catalog-demo.js');

test('getStyleData returns West Coast data with 21 total tracks and 3 sample tracks', () => {
  const data = getStyleData('westcoast');
  assert.equal(data.label, 'West Coast');
  assert.equal(data.totalCount, 21);
  assert.equal(data.tracks.length, 3);
  assert.deepEqual(
    data.tracks.map((t) => t.title),
    ['Hood', 'San Andreas', 'Cali']
  );
});

test('getStyleData returns R&B/Swag data with 18 total tracks', () => {
  const data = getStyleData('rnbswag');
  assert.equal(data.label, 'R&B/Swag');
  assert.equal(data.totalCount, 18);
  assert.equal(data.tracks.length, 3);
});

test('getStyleData returns Trap data with 11 total tracks', () => {
  const data = getStyleData('trap');
  assert.equal(data.label, 'Trap');
  assert.equal(data.totalCount, 11);
  assert.equal(data.tracks.length, 3);
});

test('getStyleData throws on an unknown style key', () => {
  assert.throws(() => getStyleData('lofi'), /Unknown style key: lofi/);
});

test('DEFAULT_STYLE is westcoast', () => {
  assert.equal(DEFAULT_STYLE, 'westcoast');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/catalog-demo.test.js`
Expected: FAIL — `Cannot find module '../assets/js/catalog-demo.js'`

- [ ] **Step 3: Create the catalog data module**

Create `assets/js/catalog-demo.js`:

```js
(function (root) {
  'use strict';

  var CATALOG_DATA = {
    rnbswag: {
      label: 'R&B/Swag',
      totalCount: 18,
      clientMessage: "Salut, t'as un truc R&B/Swag stylé ?",
      tracks: [
        { title: 'Swaggy', bpm: 98, key: 'A Min' },
        { title: 'Real Love', bpm: 122, key: 'F# Min' },
        { title: 'Snake', bpm: 93, key: 'C# Min' }
      ]
    },
    westcoast: {
      label: 'West Coast',
      totalCount: 21,
      clientMessage: "Yo t'as un type beat West Coast, tempo genre 100 ?",
      tracks: [
        { title: 'Hood', bpm: 98, key: 'F Min' },
        { title: 'San Andreas', bpm: 99, key: 'G Min' },
        { title: 'Cali', bpm: 103, key: 'D# Min' }
      ]
    },
    trap: {
      label: 'Trap',
      totalCount: 11,
      clientMessage: "T'as de la trap qui tape fort ?",
      tracks: [
        { title: 'TrapHouse', bpm: 139, key: 'C Min' },
        { title: 'Jungle', bpm: 127, key: 'D# Min' },
        { title: 'RockMySoul', bpm: 120, key: 'D# Min' }
      ]
    }
  };

  var DEFAULT_STYLE = 'westcoast';

  function getStyleData(styleKey) {
    var data = CATALOG_DATA[styleKey];
    if (!data) {
      throw new Error('Unknown style key: ' + styleKey);
    }
    return data;
  }

  var api = {
    getStyleData: getStyleData,
    DEFAULT_STYLE: DEFAULT_STYLE
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyCatalogDemo = api;
  }
})(typeof window !== 'undefined' ? window : this);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/catalog-demo.test.js`
Expected: PASS — `# pass 5`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add assets/js/catalog-demo.js tests/catalog-demo.test.js
git commit -m "$(cat <<'EOF'
Add catalog data module with tested style lookup

Holds the 3 style categories (R&B/Swag, West Coast, Trap) with real
track counts and sample tracks from the beatmaker's catalog, behind a
pure getStyleData() lookup covered by node:test.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Wire the interactive demo into the Hero markup

**Files:**
- Modify: `index.html:331-357`
- Modify: `index.html` (inline `<script>` block starting at line 575, plus one new `<script src>` tag added right before it)

**Interfaces:**
- Consumes: `window.BeatReplyCatalogDemo.getStyleData(styleKey)`, `.DEFAULT_STYLE` from Task 1.
- Produces: `window.BeatReplyCatalogDemo.initCatalogDemo(doc)` — reads style chip buttons matching `[data-style]` inside `#hero-demo`, attaches click listeners, and on click/init renders the selected style's client message, track cards, counter, and toggles `aria-pressed` on the chips. `doc` defaults to `document` when omitted (mirrors the module guard pattern from Task 1, keeps the function callable from a future test file without a real `document`, though no such test is written in this task — browser verification covers it, per Step 5).

- [ ] **Step 1: Replace the static Hero mockup markup**

In `index.html`, replace lines 331-357 (the current `<div class="relative max-w-4xl mx-auto image-treatment ...">` block) with:

```html
    <div class="relative max-w-4xl mx-auto image-treatment rounded-lg overflow-hidden border border-border-primary shadow-lg">
      <div class="glass-surface p-6 sm:p-10 text-left" id="hero-demo">
        <div class="flex items-center gap-2 mb-6">
          <span class="w-3 h-3 rounded-full bg-error/60"></span>
          <span class="w-3 h-3 rounded-full bg-warning/60"></span>
          <span class="w-3 h-3 rounded-full bg-success/60"></span>
          <span class="ml-4 text-caption text-text-ghost">BeatReply — Instagram DM</span>
        </div>

        <div class="flex flex-wrap gap-2 mb-6" role="group" aria-label="Choisir un style de beat">
          <button type="button" class="badge" data-style="rnbswag" aria-pressed="false">R&amp;B/Swag</button>
          <button type="button" class="badge" data-style="westcoast" aria-pressed="false">West Coast</button>
          <button type="button" class="badge" data-style="trap" aria-pressed="false">Trap</button>
        </div>

        <div class="space-y-4" aria-live="polite">
          <div class="flex justify-start">
            <div class="rounded-lg rounded-tl-none bg-surface-elevated px-4 py-3 max-w-sm text-body-sm text-text-secondary" data-demo-client-message></div>
          </div>
          <div class="flex justify-end">
            <div class="rounded-lg rounded-tr-none accent-gradient px-4 py-3 max-w-sm text-body-sm text-background font-medium">
              <p class="mb-3">Yes j'ai exactement ce qu'il te faut 🔥</p>
              <div class="space-y-2 mb-3" data-demo-track-cards></div>
              <p class="text-caption mb-2" data-demo-count></p>
              <div class="border-t border-background/20 pt-2 text-caption">
                MP3 40&nbsp;€ · WAV 70&nbsp;€ · Stems 150&nbsp;€ · Exclu sur demande
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Add the script tag and init call**

In `index.html`, find the existing inline `<script>` tag (currently at line 575, right after the FOOTER close):

```html
<script>
  // Navbar scroll state
```

Replace it with:

```html
<script src="assets/js/catalog-demo.js"></script>
<script>
  // Interactive catalog demo
  window.BeatReplyCatalogDemo.initCatalogDemo();

  // Navbar scroll state
```

- [ ] **Step 3: Implement `initCatalogDemo` in the data module**

In `assets/js/catalog-demo.js`, add the DOM-wiring function. Insert this above the `var api = { ... }` line, and add `initCatalogDemo: initCatalogDemo` to the `api` object:

```js
  function renderStyle(doc, root, styleKey) {
    var data = getStyleData(styleKey);

    var chips = root.querySelectorAll('[data-style]');
    for (var i = 0; i < chips.length; i++) {
      var isActive = chips[i].getAttribute('data-style') === styleKey;
      chips[i].setAttribute('aria-pressed', String(isActive));
      chips[i].classList.toggle('accent-gradient', isActive);
      chips[i].classList.toggle('text-background', isActive);
    }

    var clientMessageEl = root.querySelector('[data-demo-client-message]');
    clientMessageEl.textContent = data.clientMessage;

    var cardsEl = root.querySelector('[data-demo-track-cards]');
    cardsEl.textContent = '';
    for (var j = 0; j < data.tracks.length; j++) {
      var track = data.tracks[j];
      var card = doc.createElement('div');
      card.className = 'rounded-md bg-background/10 px-3 py-2';

      var titleEl = doc.createElement('p');
      titleEl.className = 'text-body-sm font-semibold';
      titleEl.textContent = track.title;

      var metaEl = doc.createElement('p');
      metaEl.className = 'text-caption text-background/70';
      metaEl.textContent = track.bpm + ' BPM · ' + track.key;

      card.appendChild(titleEl);
      card.appendChild(metaEl);
      cardsEl.appendChild(card);
    }

    var countEl = root.querySelector('[data-demo-count]');
    countEl.textContent = data.totalCount + ' prods disponibles en ' + data.label;
  }

  function initCatalogDemo(doc) {
    doc = doc || document;
    var root = doc.getElementById('hero-demo');
    if (!root) {
      return;
    }

    var chips = root.querySelectorAll('[data-style]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function (event) {
        renderStyle(doc, root, event.currentTarget.getAttribute('data-style'));
      });
    }

    renderStyle(doc, root, DEFAULT_STYLE);
  }
```

Update the `api` object at the bottom of the file to:

```js
  var api = {
    getStyleData: getStyleData,
    DEFAULT_STYLE: DEFAULT_STYLE,
    initCatalogDemo: initCatalogDemo
  };
```

- [ ] **Step 4: Run the Task 1 tests to confirm nothing broke**

Run: `node --test tests/catalog-demo.test.js`
Expected: PASS — `# pass 5`, `# fail 0` (the new `renderStyle`/`initCatalogDemo` functions are additive and don't change `getStyleData` or `DEFAULT_STYLE`)

- [ ] **Step 5: Manually verify in the browser**

Run: `python3 -m http.server 8000` from `/Users/corentin/Documents/Projects/lp-beatreply`, then open `http://localhost:8000/index.html`.

Check, in order:
1. On load, the "West Coast" chip has a filled/highlighted background (accent-gradient) and the other two chips don't.
2. The client bubble shows "Yo t'as un type beat West Coast, tempo genre 100 ?".
3. The AI bubble shows 3 track cards: Hood (98 BPM · F Min), San Andreas (99 BPM · G Min), Cali (103 BPM · D# Min).
4. The counter line reads "21 prods disponibles en West Coast".
5. The license line reads "MP3 40 € · WAV 70 € · Stems 150 € · Exclu sur demande".
6. Click "R&B/Swag" — the chip highlight moves to it, the client message changes to "Salut, t'as un truc R&B/Swag stylé ?", the 3 cards change to Swaggy/Real Love/Snake, and the counter changes to "18 prods disponibles en R&B/Swag".
7. Click "Trap" — same check with TrapHouse/Jungle/RockMySoul and "11 prods disponibles en Trap".
8. Resize the browser to a narrow (mobile) width — the 3 chips wrap onto a new line instead of overflowing, and the track cards stay full-width and stacked (no horizontal scrollbar on the page).
9. Tab through the page with the keyboard — each chip shows the existing cyan focus outline (`outline: 2px solid var(--primary)`), and pressing Enter/Space on a focused chip triggers the same update as a click.

Expected: all 9 checks pass. If any fails, fix the corresponding markup/JS from Steps 1-3 before continuing.

- [ ] **Step 6: Commit**

```bash
git add index.html assets/js/catalog-demo.js
git commit -m "$(cat <<'EOF'
Wire interactive style chips into the Hero DM mockup

Clicking R&B/Swag, West Coast, or Trap now swaps the simulated client
message, shows 3 real catalog tracks with BPM/key, and updates the
prod count and license line — replacing the static fake conversation
with a live demo backed by the real catalog data.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- 3 clickable style chips (R&B/Swag, West Coast, Trap) → Task 2, Step 1 markup + Step 3 click wiring.
- Client message + AI response + 3 real tracks + counter change on click → Task 1 data + Task 2 `renderStyle`.
- License line (static, universal) → Task 2, Step 1 markup.
- No audio, no per-track price, no producer name, no collaborator names → enforced by the data in Task 1 (verified against the spec's table) and absent from all markup/code/commit messages.
- Design system reuse (`.badge`, `.glass-surface`, `accent-gradient`, focus-visible) → Task 2, Step 1 markup reuses existing classes; no new CSS added anywhere in this plan.
- Accessibility (`aria-pressed`, `aria-live`, focus-visible, keyboard activation) → Task 2, Step 1 markup + Step 5 checks 6 and 9.
- Responsive (chips wrap, cards stack on mobile) → Task 2, Step 1 uses `flex flex-wrap` and `space-y-2`; verified in Step 5 check 8.
- Default style = West Coast → Task 1 `DEFAULT_STYLE`, used by `initCatalogDemo` in Task 2.
- No new animation / `prefers-reduced-motion` unaffected → Task 2 renders via plain `textContent`/`classList.toggle`, no transition or animation classes added.

**Placeholder scan:** no TBD/TODO, no "add appropriate handling" phrasing, every step has complete code or an exact command with expected output.

**Type consistency:** `getStyleData` return shape (`label`, `totalCount`, `clientMessage`, `tracks: {title, bpm, key}[]`) is identical between Task 1's implementation, Task 1's tests, and Task 2's `renderStyle` usage. The 3 style keys (`rnbswag`, `westcoast`, `trap`) used as `CATALOG_DATA` keys in Task 1 match the `data-style` attributes used in Task 2's markup exactly.
