# Task 3 report — Material token system + navbar application + fallbacks

## Status: DONE

Commit: `350a955` — "Apply the structural material to the navbar + define material tokens"
(only `index.html`; 1 file changed, 99 insertions, 0 deletions — pure addition).

---

## 1. CSS added (sections + placement)

All CSS was inserted into the single `<style>` block in `index.html`, **immediately after the
Task 2 `#ambient-bg` block** (i.e. right after `.texture-grain::before { z-index: 1; }`) and
**immediately before `</style>`**. Nothing else in the file was touched — no change to the
`<header id="navbar" ...>` Tailwind class list, no HTML edits.

Order within the insert (exactly as the brief specifies): tokens → helper classes → navbar
overrides → vibrancy → the two `@media` blocks.

### a. Material token system — `:root` (Step 1)
Three weights, 8 custom properties each:
- `--mat-structural-*` (bg `rgba(12,12,14,0.55)`, tint `rgba(255,190,130,0.06)`, blur `24px`,
  sat `160%`, border `rgba(255,255,255,0.06)`, edge `rgba(255,255,255,0.34)`,
  shadow `0 8px 28px rgba(0,0,0,0.45)`, inner `inset 0 1px 0 rgba(255,255,255,0.22)`)
- `--mat-card-*` (blur `16px`, sat `150%`, …)
- `--mat-interactive-*` (bg `rgba(255,255,255,0.06)`, blur `10px`, sat `140%`, …)

### b. Helper classes (Step 1)
`.mat-structural`, `.mat-card`, `.mat-interactive` — each composes its tokens into
`background` (double `linear-gradient(tint,tint)` over `bg`), `backdrop-filter` +
`-webkit-backdrop-filter` (`blur() saturate()`), `border` with a brighter `border-top-color`,
and a two-part `box-shadow` (drop + inner highlight).
**`.mat-card` and `.mat-interactive` are defined but referenced nowhere** — deliberate
deferred-phase deliverables (verified: `grep -nE 'class="[^"]*\bmat-(structural|card|interactive)\b'`
returns nothing).

### c. Navbar overrides (Step 2)
- `#navbar` — structural `background`, `backdrop-filter` (+ `-webkit-`), `border-bottom: 0`
  (kills the Tailwind `border-b`), `border-top: 1px solid var(--mat-structural-edge)`,
  structural `box-shadow`.
- `#navbar.navbar-scrolled` — deeper drop shadow only
  (`0 10px 34px rgba(0,0,0,0.55), var(--mat-structural-inner)`).
- `#nav-mobile` — structural `background`.

Specificity: `#navbar` id selector = (0,1,0,0), beats the Tailwind utilities
`bg-background/80` / `backdrop-blur-2xl` / `border-b` = (0,0,1,0). The Tailwind Play CDN
config (`index.html` head) does **not** set `important: true`, so utilities carry no
`!important` and the id selector wins regardless of the CDN's injected-`<style>` load order.
Confirmed live (see checks).

### d. Vibrancy (Step 2)
`#navbar nav a, #nav-mobile a:not(.btn-primary)` → `color: rgba(255,255,255,0.82)`,
`font-weight: 500`, `letter-spacing: 0.01em`; `:hover` → `#ffffff`.
The `#navbar nav a` selector = (0,1,0,2), beats the `.text-text-secondary`
(`rgba(255,255,255,0.85)`) utility. `#nav-mobile a:not(.btn-primary)` correctly skips the
"Essai gratuit" CTA (which is `.btn-primary`).

### e. Accessibility fallbacks (Step 3)
- `@media (prefers-reduced-transparency: reduce)` → `#navbar, #nav-mobile` get
  `background: rgba(10,10,10,0.94)` and `backdrop-filter: none` (+ `-webkit-`).
- `@media (prefers-contrast: more)` → `#navbar` gets `background: rgba(8,8,8,0.97)`,
  `border-top-color: rgba(255,255,255,0.5)`, `backdrop-filter: none` (+ `-webkit-`).

---

## 2. Check-script edit

`sdd/browser-checks/ambient-bg.mjs` — inserted the brief's Step 4 block **verbatim**,
immediately before the single final `await b.close();` (now at line 172). Two new IIFE
blocks:
1. **navbar material** — opens a 1280×900 page, reads `#navbar` computed style + first
   `#navbar nav a`. Asserts: blur backdrop-filter present, `borderBottomWidth === '0px'`,
   link colour matches `~rgba(255,255,255,0.82)`. Then scrolls to y=220, screenshots the
   viewport, and (if `pngjs` resolves) computes the WCAG contrast ratio of the link's text
   colour vs the rendered pixel 6px to its left; degrades to a non-failing
   "verify manually in Task 4" when `pngjs` is absent.
2. **reduced transparency (CSSOM)** — walks `document.styleSheets` for `MEDIA_RULE`s whose
   condition matches `prefers-reduced-transparency: reduce` / `prefers-contrast: more` and
   whose `cssText` contains `#navbar`.

Structure verified: 4 page blocks, one `await b.close();` after all of them, then the
existing results printer untouched.

---

## 3. Playwright check output (full)

Server: `python3 -m http.server 8130` from the worktree root (backgrounded, killed after).
Command: `node sdd/browser-checks/ambient-bg.mjs`

```
PASS  #ambient-bg exists, first body child                                  {"first":true,"pos":"fixed","z":"0","pe":"none","aria":"true","w":1280,"h":900,"mainZ":"1"}
PASS  #ambient-bg is fixed / z-index 0 / pointer-events none / aria-hidden  {"first":true,"pos":"fixed","z":"0","pe":"none","aria":"true","w":1280,"h":900,"mainZ":"1"}
PASS  #ambient-bg backing store sized (> 0)                                 1280x900
PASS  #main-content lifted to z-index 1                                     1
PASS  field animates with no interaction (pixel changes over 700ms)         73,48,23,255 -> 78,52,25,255
PASS  canvas rect stays at 0,0 after scrolling to page bottom               {"top":0,"left":0}
PASS  no console / page errors in normal mode                               clean
PASS  rAF scheduling stops while the tab is hidden                          0 rAF calls after hide
PASS  reduced-motion: field is frozen (identical pixel 700ms apart)         67,45,23,255 -> 67,45,23,255
PASS  navbar has a blur backdrop-filter                                     blur(24px) saturate(1.6)
PASS  navbar bottom border removed                                          0px
PASS  nav link colour is bright (~rgba(255,255,255,0.82))                   rgba(255, 255, 255, 0.82)
PASS  nav link text contrast >= 4.5:1 over the material                     pngjs unavailable — verify manually in Task 4
PASS  a @media (prefers-reduced-transparency: reduce) rule targets #navbar
PASS  a @media (prefers-contrast: more) rule targets #navbar

15/15 checks pass
EXIT 0
```

No failures — no fix required. The 3 pre-existing background checks + 6 other Task 2 checks
still pass (no regression). The contrast check took the sanctioned degraded path:
`pngjs` is not present in the Playwright npx cache dir the `node_modules` symlink points to
(`~/.npm/_npx/e41f203b7505f1fb/node_modules` — no `pngjs`; it exists only in an unrelated
`~/.npm/_npx/4c960816c1d4a16a` dir). The check's `await import('pngjs').catch(() => ({ PNG: null }))`
falls back to `PNG: null`, `ratio` stays `null`, and `ok()` passes with the
"verify manually in Task 4" detail — exactly as the brief anticipates ("pngjs ships as a
Playwright dependency, so it is usually present"; here it is not).

Note: Chromium serialises the computed `backdrop-filter` as `blur(24px) saturate(1.6)`
(percentage → number); the `/blur/` test matches, so the assertion is unaffected.

---

## 4. Unit suite (no regression)

Command: `node --test tests/*.test.js`

```
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

19/19 pass. No test files were changed by this task.

---

## 5. Files changed / committed

| File | State |
|---|---|
| `index.html` | **committed** in `350a955` (99 insertions, `<style>` block only) |
| `sdd/browser-checks/ambient-bg.mjs` | modified, **not committed** (`sdd/` is untracked by design) |
| `sdd/task-3-report.md` | this file, not committed |

`git status --porcelain` after commit: only `?? sdd/`.

---

## 6. Self-review findings

- **`#navbar` computed `backdrop-filter` is a real blur, not `none`** — live check reports
  `blur(24px) saturate(1.6)`. No ancestor `filter` / `transform` / `contain` / `perspective`
  exists on `<html>`, `<body>`, or `.texture-grain` (only `position: relative`), so the
  blur also renders, not just computes.
- **`border-bottom-width` is `0px`** — live check confirms. `#navbar { border-bottom: 0 }`
  beats the `border-b` utility on specificity. `.navbar-scrolled` (line 230) only sets
  `border-bottom-color !important`, never width, so it stays `0px` when scrolled too.
- **Nav links compute to `rgba(255, 255, 255, 0.82)`** — live check reports exactly that.
- **`.mat-card` / `.mat-interactive` defined, referenced nowhere** — grep confirms no
  `class="… mat-card …"` / `mat-interactive` / `mat-structural` in the markup.
- **CSS order** — tokens → helpers → navbar overrides → vibrancy → `@media` blocks, placed
  right after the `#ambient-bg` block and right before `</style>`. Verified in `git diff`.
- **Nothing else touched** — diff is 99 pure insertions; `assets/js/`, `tests/`, and all
  HTML outside `<style>` are untouched. The `<header id="navbar">` class list is unchanged.
- **Check-script edit** — clean insertion; single `await b.close();` remains, after all four
  page blocks; the results printer is unchanged.

---

## 7. Concerns

1. **Contrast check is not actually executing the pixel math** — `pngjs` is unavailable via
   the symlinked `node_modules`, so `nav link text contrast >= 4.5:1` passes vacuously with
   "verify manually in Task 4". Task 4 must eyeball (or wire up `pngjs`) to confirm the
   `rgba(255,255,255,0.82)` nav text clears 4.5:1 over the structural material where a warm
   field hot-spot sits under the bar. Per the brief this is acceptable for Task 3, but it is
   a genuine open verification item.
2. **Scrolled navbar background** — when `.navbar-scrolled` is active, its
   `background: rgba(10,10,10,0.95) !important` (line 230) overrides the structural
   `#navbar` background (the brief's `#navbar.navbar-scrolled` rule only changes
   `box-shadow`). So the frosted material is visible only at scroll ≈ top; past 20px it
   reverts to the near-opaque solid. This matches the brief's code exactly and appears
   intentional, but Task 4's tuning pass should confirm it reads well against the mockup.
3. `backdrop-filter` percentage serialisation (`saturate(160%)` → `saturate(1.6)`) is
   cosmetic only and does not affect any assertion; noted for awareness.

---

## Fix 1 — navbar glass in scrolled state

Follow-up commit amending `350a955`. Review decision by the project owner: the navbar
renders the **structural frosted-glass material at every scroll position** — glass at the
top AND when scrolled; the only scroll difference is a deeper drop shadow. The a11y
fallbacks stay opaque as before. (This resolves concern #2 above.)

### The bug

The pre-existing `.navbar-scrolled { background: rgba(10, 10, 10, 0.95) !important; … }`
(≈ line 230) is toggled onto `#navbar` by the scroll handler (≈ line 836) once
`window.scrollY > 20`. Specificity `(0,0,1,0)` + `!important` beat the new
`#navbar { background: …structural }` rule `(0,1,0,0)`, no important — so once scrolled the
navbar reverted to opaque black and the frosted material disappeared. The Task-3
`#navbar.navbar-scrolled` rule only set `box-shadow`, so it did not rescue the surface.

### What changed (`index.html`, same `<style>` insertion zone from `350a955`)

1. **`#navbar.navbar-scrolled`** now re-asserts the structural background with `!important`
   (`(0,1,1,0)` + important beats `(0,0,1,0)` + important), keeping the deeper scroll shadow:
   ```css
   #navbar.navbar-scrolled {
     background: linear-gradient(var(--mat-structural-tint), var(--mat-structural-tint)), var(--mat-structural-bg) !important;
     box-shadow: 0 10px 34px rgba(0, 0, 0, 0.55), var(--mat-structural-inner);
   }
   ```
2. **Second-order collision closed at the same time.** Because that rule now also outranks
   the two `@media` fallback `#navbar` rules `(0,1,0,0)`, no important) while scrolled, both
   `@media` blocks were widened so their `#navbar` rule also covers `#navbar.navbar-scrolled`
   with `!important`. Equal specificity + both important ⇒ later source order wins, and the
   `@media` blocks sit physically after the base rule, so they win whenever their query
   matches:
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
   `#nav-mobile` was **not** given `backdrop-filter` / border / shadow — it stays
   background-only, by design, to avoid stacking blur on the parent `#navbar`'s blur.

### Check-script edit (`sdd/browser-checks/ambient-bg.mjs`, uncommitted)

In the "navbar material" block, after the existing contrast probe, a new assertion scrolls
to `y=500` (so `.navbar-scrolled` is active) and asserts `#navbar`'s computed
`background-color` is still `rgba(12, 12, 14, 0.55)` (translucent, NOT `rgba(10, 10, 10, 0.95)`)
and its `background-image` still carries the `linear-gradient(rgba(255, 190, 130, …))` tint.
All prior assertions kept.

### Verify — step 1: unit suite (regression guard, no JS/tests changed)

`node --test tests/*.test.js`

```
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### Verify — step 2: browser checks

Server: `python3 -m http.server 8132` from the worktree root (backgrounded, killed after).
`TARGET_URL=http://localhost:8132/index.html node sdd/browser-checks/ambient-bg.mjs` (run
from `sdd/browser-checks/`):

```
PASS  #ambient-bg exists, first body child                                                                  {"first":true,"pos":"fixed","z":"0","pe":"none","aria":"true","w":1280,"h":900,"mainZ":"1"}
PASS  #ambient-bg is fixed / z-index 0 / pointer-events none / aria-hidden                                  {"first":true,"pos":"fixed","z":"0","pe":"none","aria":"true","w":1280,"h":900,"mainZ":"1"}
PASS  #ambient-bg backing store sized (> 0)                                                                 1280x900
PASS  #main-content lifted to z-index 1                                                                     1
PASS  field animates with no interaction (pixel changes over 700ms)                                         73,48,23,255 -> 78,52,25,255
PASS  canvas rect stays at 0,0 after scrolling to page bottom                                               {"top":0,"left":0}
PASS  no console / page errors in normal mode                                                               clean
PASS  rAF scheduling stops while the tab is hidden                                                          0 rAF calls after hide
PASS  reduced-motion: field is frozen (identical pixel 700ms apart)                                         67,45,23,255 -> 67,45,23,255
PASS  navbar has a blur backdrop-filter                                                                     blur(24px) saturate(1.6)
PASS  navbar bottom border removed                                                                          0px
PASS  nav link colour is bright (~rgba(255,255,255,0.82))                                                   rgba(255, 255, 255, 0.82)
PASS  nav link text contrast >= 4.5:1 over the material                                                     pngjs unavailable — verify manually in Task 4
PASS  scrolled navbar keeps the structural material (translucent + tint gradient, not rgba(10,10,10,0.95))  {"scrolled":true,"bgColor":"rgba(12, 12, 14, 0.55)","bgImage":"linear-gradient(rgba(255, 190, 130, 0.06), rgba(255, 190, 130, 0.06)), none"}
PASS  a @media (prefers-reduced-transparency: reduce) rule targets #navbar
PASS  a @media (prefers-contrast: more) rule targets #navbar

16/16 checks pass
EXIT 0
```

The contrast check still takes the sanctioned degraded path (`pngjs unavailable — verify
manually in Task 4`) — expected, not a failure.

### Verify — step 3: inline Playwright snippet (three modes, after scrolling to y=500)

```
PASS  default @ y=500: .navbar-scrolled active  true
PASS  default @ y=500: backgroundColor is glass rgba(12, 12, 14, 0.55)  rgba(12, 12, 14, 0.55)
PASS  default @ y=500: backdropFilter contains blur  blur(24px) saturate(1.6)
PASS  default @ y=500: tint gradient still present  linear-gradient(rgba(255, 190, 130, 0.06), rgba(255, 190, 130, 0.06)), none
PASS  @media reduced-transparency lists #navbar.navbar-scrolled  @media (prefers-reduced-transparency: reduce) {
  #navbar, #nav-mobile, #navbar.navbar-scrolled { backdrop-filter: none; background: rgba(10, 10, 10, 0.94) !important; }
}
PASS  @media prefers-contrast:more lists #navbar.navbar-scrolled  @media (prefers-contrast: more) {
  #navbar, #navbar.navbar-scrolled { border-top-color: rgba(255, 255, 255, 0.5); backdrop-filter: none; background: rgba(8, 8, 8, 0.97) !important; }
}
PASS  contrast:more @ y=500: scrolled navbar is opaque rgba(8, 8, 8, 0.97)  rgba(8, 8, 8, 0.97)
PASS  contrast:more @ y=500: backdrop-filter is none  none
NOTE  reduced-transparency emulation not honored by this Chromium (matchMedia=false); scrolled bg stayed rgba(12, 12, 14, 0.55). Coverage for this mode is the CSSOM assertion in section 2.
```

Playwright is `1.62.1`. `emulateMedia({ contrast: 'more' })` **is** supported here and was
used — the scrolled navbar correctly resolves to `rgba(8, 8, 8, 0.97)` with
`backdrop-filter: none`. `prefers-reduced-transparency` emulation is **not** honored by this
headless Chromium (`matchMedia` stays `false`), exactly as the brief anticipated; that mode's
coverage is the CSSOM assertion that the `@media (prefers-reduced-transparency: reduce)` rule
now lists `#navbar.navbar-scrolled` (PASS above). The inline snippet lives only in the
scratchpad, not in the repo.

### Commit

`git add index.html` → follow-up commit `2bf419a` — "Keep the navbar's structural material
in the scrolled state" (1 file changed, 8 insertions, 4 deletions). `sdd/` stays uncommitted.
