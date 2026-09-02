# Task 2 Report: Wire the ambient canvas into the page + live background checks

## Status: DONE

## What changed

### `index.html` — 4 edits, verbatim per brief (32 insertions, 0 deletions elsewhere)

1. **Canvas element** — inserted `<canvas id="ambient-bg" aria-hidden="true"></canvas>` as the
   **first element child of `<body>`**, immediately after the `<body class="...">` open tag and
   before `<a href="#main-content" class="skip-link">`.

2. **Background CSS** — added the `/* ===== Ambient background (phase 1) ===== */` block
   immediately before `</style>` (after the `@media (prefers-reduced-motion: reduce)` block):
   - `#ambient-bg { position: fixed; inset: 0; width/height: 100%; z-index: 0; pointer-events: none; display: block; background: #0a0a0a; }`
   - content-lift rule: `#main-content, body > footer { position: relative; z-index: 1; }`
   - `.texture-grain::before { z-index: 1; }`

3. **Script include** — added `<script src="assets/js/ambient-bg.js"></script>` on the line after
   `<script src="assets/js/catalog-showcase.js"></script>` and before the final inline `<script>`.

4. **Init call** — added into the final inline `<script>`, right after the
   `// Catalog showcase section` init block:
   ```js
   // Ambient background
   if (window.BeatReplyAmbientBg) {
     window.BeatReplyAmbientBg.start();
   }
   ```

Nothing else in `index.html` was touched (`git diff` confirms only the 4 hunks above).

### `sdd/browser-checks/ambient-bg.mjs` — created (NOT committed; `sdd/` is untracked)

Playwright check script exactly as specified in the brief's Step 6. Harness set up with the
robust fallback from the task notes:
`ln -sfn ~/.npm/_npx/e41f203b7505f1fb/node_modules node_modules` inside `sdd/browser-checks/`,
then `import('playwright')` → `playwright OK`. Chromium already present in
`~/Library/Caches/ms-playwright`, found automatically.

## Playwright check output (full)

Server: `python3 -m http.server 8130` from the worktree root (backgrounded, killed after).

```
PASS  #ambient-bg exists, first body child                                  {"first":true,"pos":"fixed","z":"0","pe":"none","aria":"true","w":1280,"h":900,"mainZ":"1"}
PASS  #ambient-bg is fixed / z-index 0 / pointer-events none / aria-hidden  {"first":true,"pos":"fixed","z":"0","pe":"none","aria":"true","w":1280,"h":900,"mainZ":"1"}
PASS  #ambient-bg backing store sized (> 0)                                 1280x900
PASS  #main-content lifted to z-index 1                                     1
PASS  field animates with no interaction (pixel changes over 700ms)         74,48,23,255 -> 79,52,25,255
PASS  canvas rect stays at 0,0 after scrolling to page bottom               {"top":0,"left":0}
PASS  no console / page errors in normal mode                               clean
PASS  rAF scheduling stops while the tab is hidden                          0 rAF calls after hide
PASS  reduced-motion: field is frozen (identical pixel 700ms apart)         67,45,23,255 -> 67,45,23,255

9/9 checks pass
EXIT=0
```

No failures — no fixes were needed.

## `node --test tests/*.test.js` (full suite, no regression)

```
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

19 tests, 0 fail. This task added no tests; existing `ambient-bg` field-math tests and the
catalog/style tests all still pass.

## Files changed / committed

- **Committed** — `index.html` (32 insertions). Commit `933b7dd` "Render the ambient background
  canvas behind the page".
- `git add index.html assets/js/ambient-bg.js` was run as the brief's Step 9 specifies;
  `assets/js/ambient-bg.js` is unchanged from Task 1 so it staged nothing — expected, per the
  task instructions.
- **Not committed** — `sdd/` (untracked; contains the brief, this report, and
  `browser-checks/ambient-bg.mjs` + its `node_modules` symlink). `git status` after the commit
  shows only `?? sdd/`.
- `tests/*` unchanged.

## Self-review findings

- **Canvas is the FIRST body child** — `document.body.firstElementChild === cv` → `true`
  (check 1, and re-confirmed the source order in the diff).
- **Page still scrolls, no horizontal scrollbar** — extra hit-test run:
  `documentElement.scrollWidth - clientWidth === 0` (no horizontal overflow),
  `scrollHeight > clientHeight === true` (vertical scroll intact). The canvas uses
  `position: fixed; width/height: 100%` which resolves against the viewport, so it cannot
  create overflow.
- **Content is visibly above the canvas** — `elementFromPoint` at the hero centre returns a
  content `DIV`, and a hit-test on the hero `<h1>` centre returns the `H1` — never
  `#ambient-bg`. `pointer-events: none` on the canvas + `z-index: 1` on `#main-content`/footer.
  Check confirms `#main-content` computed `z-index` is `1`.
- **Only intended parts of `index.html` touched** — `git diff` = exactly 4 hunks matching the
  4 brief steps; no reformatting or incidental edits.
- **Check-script output is clean** — 9/9, exit 0, "no console / page errors in normal mode"
  reports `clean` (the `cdn.tailwindcss.com` message is a `console.warn`, not caught by the
  `type === 'error'` filter, and is pre-existing).
- **`sdd/` not committed** — verified staged set is `index.html` only before committing.
- Temp verification scripts created during self-review were deleted; port 8130 freed; both
  background HTTP servers killed.

## Concerns

- **None blocking.** Minor note: the brief's Step 9 parenthetical says "`sdd/` is gitignored";
  in this worktree `sdd/` is actually just **untracked** (not in `.gitignore`). Outcome is the
  same — the check script is not committed — because Step 9 stages only the two named files.
  Anyone later running `git add -A` in this worktree would pick up `sdd/`; that is outside this
  task's scope.
- The commit message uses the brief's exact subject line plus the standard
  `Co-Authored-By: Claude Sonnet 5` trailer (consistent with the two planning commits on this
  branch; Task 1's commit omitted it).
