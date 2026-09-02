# Task 1 Report: Ambient field module + unit tests

## What was implemented

Created two new files to support the animated light field background for the BeatReply landing page:

1. **`assets/js/ambient-bg.js`** — Standalone JavaScript module providing:
   - Pure geometry and colour helpers for animated light blobs
   - 4 warm-colour blobs (#FF9D42, #C97B24, #FFC978, #7A430F) with independent drift patterns
   - Calculation functions: `blobCenter()`, `blobRadius()`, `alphaHex()`
   - Rendering function: `paintField()` (radial gradient overlays with 'lighter' compositing)
   - Browser lifecycle: `start()` (requestAnimationFrame-driven animation with DPR scaling, visibility awareness, prefers-reduced-motion support)
   - Exports via dual `module.exports` / `window.BeatReplyAmbientBg` pattern (matches existing codebase pattern)

2. **`tests/ambient-bg.test.js`** — 7 unit tests using Node.js built-in test runner:
   - BLOBS structure validation (4 blobs, 6-digit hex hues)
   - blobCenter drift bounds verification (never wanders beyond DRIFT from base)
   - blobCenter purity (deterministic: same inputs → same output)
   - blobRadius scaling logic (uses max(w,h), scales with blob.r)
   - alphaHex clamping and formatting (0..255 range, 2-digit lowercase hex)
   - paintField rendering sequence (clears to base, switches to lighter, draws 4 gradients, resets compositing)
   - start() null-safety (returns null when #ambient-bg canvas missing)

## TDD Evidence

### RED phase (Step 2)
Command:
```bash
node --test tests/ambient-bg.test.js
```

Expected failure (module not found):
```
Error: Cannot find module '../assets/js/ambient-bg.js'
Require stack:
  - /Users/corentin/Documents/Projects/lp-beatreply/.claude/worktrees/ambient-background/tests/ambient-bg.test.js
```
Status: ✔ Failed as expected

### GREEN phase (Step 4)
Command:
```bash
node --test tests/ambient-bg.test.js
```

Output:
```
✔ BLOBS: 4 blobs, each fully shaped with a 6-digit hex hue (1.282458ms)
✔ blobCenter never wanders more than DRIFT from the blob base, at any time (2.143167ms)
✔ blobCenter is pure: same inputs -> same output (1.098041ms)
✔ blobRadius uses max(w,h) and scales with blob.r (0.100667ms)
✔ alphaHex: clamped, two-digit, lowercase (0.103666ms)
✔ paintField: clears to base, switches to lighter, draws 4 three-stop gradients, resets compositing (0.306042ms)
✔ start() no-ops (returns null) when there is no #ambient-bg canvas (0.138666ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
```
Status: ✔ All 7 tests pass

## Full-suite result (Step 5)
Command:
```bash
node --test tests/*.test.js
```

Summary:
```
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 126.774542
```

Output includes 7 new ambient-bg tests plus 12 existing tests (catalog-demo, catalog-showcase). All passing, pristine output with no warnings or noise.

## Files changed

1. **Created:** `assets/js/ambient-bg.js` (145 lines)
   - Pure math section (blobCenter, blobRadius, alphaHex, paintField)
   - Browser lifecycle section (start with fit, frame loop, play/pause, event listeners)
   - Exports section (IIFE + dual export pattern)

2. **Created:** `tests/ambient-bg.test.js` (77 lines)
   - 7 test cases using Node.js `test` module
   - All assertions using `assert/strict`
   - Mock canvas context for paintField testing

## Commit

```
Commit: 4e66892
Message: "Add ambient-bg field math module + unit tests"
Files: 2 (236 insertions)
```

## Self-review findings

**Completeness:**
- ✔ Exact faithful transcription of brief code (all 145 lines of module, all 77 lines of tests)
- ✔ All 7 test cases present and passing
- ✔ Full suite (19 tests) passing
- ✔ Commit created with exact message from brief
- ✔ No extraneous files or changes

**Quality:**
- ✔ Tests verify real behaviour, not mocks
  - DRIFT bounds checked across 648 time samples (240 seconds @ 0.37s intervals)
  - blobRadius verified against actual RADIUS_FACTOR (0.672)
  - paintField verified against actual rendering sequence (op changes, 4 gradients, 3 stops each)
  - alphaHex verified with edge cases (0, 10, 51, 255, 300, -5)
- ✔ Module is pure (no side effects in math functions)
- ✔ All constants correctly transcribed (DRIFT=0.12, RADIUS_FACTOR=0.672, PEAK_ALPHA=0x33=51, MID_ALPHA=0x13=19)
- ✔ Blob hues are valid 6-digit hex (#FF9D42, #C97B24, #FFC978, #7A430F)
- ✔ IIFE pattern matches existing codebase (catalog-demo.js, catalog-showcase.js)

**Test hygiene:**
- ✔ No mocking of real functions (paintField gets a mock ctx to trace calls)
- ✔ No hardcoded magic numbers duplicating production code
- ✔ Epsilon tolerance (1e-6) on floating-point bounds checks
- ✔ All assertions are meaningful (structure validation, bounds, purity, rendering sequence)

**YAGNI compliance:**
- ✔ No decorators, logging, or debug utilities added
- ✔ No extra test utilities created
- ✔ No comments beyond brief's code (production comments preserved)
- ✔ No index.html integration (deferred to Task 2, per task description)

## Concerns

None. All tests pass, full suite clean, commit successful, code faithful to brief.
