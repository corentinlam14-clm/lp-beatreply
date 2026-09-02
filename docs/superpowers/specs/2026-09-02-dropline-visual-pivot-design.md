# Dropline Visual Pivot (Landing Page) — Design Spec

**Date:** 2026-09-02
**Status:** approved (brainstorm), ready for implementation plan
**Supersedes:** [`2026-08-31-ambient-background-material-design.md`](2026-08-31-ambient-background-material-design.md) (orange/gold, full-page canvas field, navbar-only). That spec's Tasks 1–3 were implemented on branch/worktree `worktree-ambient-background` (commits `4e66892`, `933b7dd`, `350a955`, `2bf419a`) — nothing merged to `main`. This spec reuses that worktree and its material-token *structure*, but replaces the palette, the background renderer, and expands the scope beyond the navbar.
**Related:** [`2026-08-24-brand-color-pivot-design.md`](2026-08-24-brand-color-pivot-design.md) (orange/gold pivot — now superseded by this doc; its Tailwind-v4-alpha-modifier lesson still applies, see §7).

## Goal

Re-skin the BeatReply landing page in the **"Dropline" visual language**: electric-blue/magenta/cyan on near-black, Unbounded + IBM Plex fonts, a glass-material system extended to buttons and cards, an animated SVG "waveform aurora" behind the hero and final CTA, native scroll-driven reveals, floating stat pills, and a new genre marquee.

This is a **reskin, not a redesign**: every section, every piece of copy, every feature (style picker, chat demo, CTA links, nav structure) stays exactly as it is. Only the visual treatment of existing elements changes, plus one new decorative element (the marquee). Dashboard (`beatreply-dashboard`) is explicitly **out of scope** — a separate future chantier once this one ships and is visually approved.

The fabricated `#testimonials` section was already removed independently (commit `0234ce2` on `main`, unrelated to this pivot) — not addressed further here.

## In scope

1. Palette swap: Tailwind color tokens + CSS custom properties, landing page only.
2. Font swap: Inter → Unbounded (display) + IBM Plex Sans (body) + IBM Plex Mono (technical labels).
3. New `.wave-field` aurora component: two blurred, looping SVG ribbons, scoped to the hero and `#cta-final` sections only (not full-page, not a canvas, no JS, no `scrollY` coupling).
4. Recolor the material-token system already built in `worktree-ambient-background` (Tasks 1–3: `--mat-structural/card/interactive`) to the new palette, and — new this phase — actually apply `card` to content cards and `interactive` to buttons (previously defined but unused, per the old spec's explicit phase-1/phase-2 split, which this spec now collapses into one).
5. Specular sweep on `.btn-primary`/`.btn-secondary`.
6. Migrate `.scroll-reveal` (IntersectionObserver) to CSS `animation-timeline: view()`, with a static-visible fallback.
7. Floating drift on the 3 hero stat numbers (3x / 90% / 24-7).
8. New genre marquee (content: beat styles), placed directly under the hero.
9. Recolor `.texture-grain`.
10. Accessibility fallbacks: `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast`.
11. Playwright verification script, `sdd/browser-checks/` pattern.

## Out of scope

- `beatreply-dashboard` (separate repo/stack, separate future chantier).
- Any change to Process (stays the static 3-step grid — the carousel is dead, see [[beatreply-process-carousel-idea]]).
- Any change to copy, section order, section count, or interactive behavior (style picker, chat demo logic).
- `CLAUDE.md` and the `beatreply-brand-color-pivot` memory rewrite — deferred to **after** this ships and is visually verified on the real page (matches how the orange/gold pivot sequenced it: color commit before doc-sync commit).
- Housekeeping (`carousel-abandoned` tag/delete, old spec/plan commit fate) — tracked in memory, not part of this plan.

## Global constraints

- Single static `index.html` + existing `assets/js/*` modules. No build step, no framework, no new runtime dependency, no CDN library. The aurora and marquee are pure CSS/SVG — no new JS file needed for them (unlike the superseded spec's canvas module).
- No `scrollY` reads anywhere in this feature. Nothing added by this pivot may reposition a `position:fixed`/`position:absolute` node based on scroll offset — this is the hard lesson from the abandoned carousel (`worktree-process-carousel`) and must hold even though this pivot's constructs (CSS `@keyframes`, `animation-timeline: view()`) are structurally immune to that failure mode by construction.
- Respect `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more` — same three media features the navbar work already handles; extend, don't reinvent.
- Worst-case contrast: verify text-over-glass contrast at the brightest point of the composited background behind it (aurora ribbon at its most saturated pass), not at an average/resting frame.
- `node --test` (currently 12 tests, all pure-logic) must stay green throughout.

---

## 1. Palette & tokens

Replace the `:root` custom properties in `index.html` (currently orange/gold) with the Dropline values. Tailwind's `colors.primary`/`colors.secondary`/etc. config (`index.html:28-49`) is **left structurally untouched** — only the CSS variables it reads from change value. This means every existing `bg-primary`, `text-primary-muted`, `border-secondary/20`, etc. utility class across the whole file keeps working with zero markup edits; only the rendered color changes. `primary` maps to the electric blue (the main recurring accent), `secondary` to magenta (the pop/contrast accent). Cyan is new — added as its own token since nothing currently occupies that slot.

```css
:root {
  /* mapped from Dropline's blue → existing "primary" slot */
  --primary-rgb: 61 107 255;        /* #3D6BFF */
  --primary: rgb(var(--primary-rgb));
  --primary-hover: #6689FF;         /* lightened for hover, same hue */
  --primary-muted: rgb(var(--primary-rgb) / 0.12);

  /* mapped from Dropline's magenta → existing "secondary" slot */
  --secondary-rgb: 255 46 154;      /* #FF2E9A */
  --secondary: rgb(var(--secondary-rgb));
  --secondary-hover: #FF5CB1;
  --secondary-muted: rgb(var(--secondary-rgb) / 0.12);

  /* new: Dropline's pale cyan, third aurora stop + sparing highlight use */
  --cyan-rgb: 142 217 255;          /* #8ED9FF */
  --cyan: rgb(var(--cyan-rgb));

  --accent: var(--primary);
  --accent-hover: var(--primary-hover);
  --accent-muted: var(--primary-muted);

  /* glass tokens (new, feed the material system in §4) */
  --hairline: rgba(244, 243, 247, 0.10);
  --glass-bg: rgba(255, 255, 255, 0.055);
  --glass-border: rgba(255, 255, 255, 0.14);
}
```

Tailwind `extend.colors` (`index.html:28-49`) gains one new entry (`cyan`, mirroring how `primary`/`secondary` are already wired to their `-rgb` vars) and its `background`/`surface`/`surface-elevated`/text-* literals move from orange-adjacent near-black to the Dropline near-black:

| Tailwind key | Old value | New value |
|---|---|---|
| `background` | `#0a0a0a` | `#0A0A0F` |
| `surface` | `rgba(255,255,255,0.03)` | `#121218` (flat, matches Dropline `--surface`) |
| `surface-elevated` | `rgba(255,255,255,0.06)` | `#191922` (flat, matches Dropline `--surface-2`) |
| `text-primary` | `#ffffff` | `#F4F3F7` (Dropline `--ink`) |
| `text-secondary` | `rgba(255,255,255,0.85)` | `rgba(244,243,247,0.85)` |
| `text-muted` | `rgba(255,255,255,0.6)` | `#8D8B9B` (Dropline `--ink-muted`) |
| `text-ghost` | `rgba(255,255,255,0.5)` | `rgba(244,243,247,0.5)` |
| `border-primary` | `rgba(255,255,255,0.1)` | `var(--hairline)` equivalent, `rgba(244,243,247,0.10)` |
| `border-subtle` | `rgba(255,255,255,0.05)` | `rgba(244,243,247,0.06)` |

`success`/`error`/`warning` (used only in the hero-demo's 3 status dots) are left as-is — they're semantic, not brand colors, and changing them isn't part of this pivot.

`html { background: #0a0a0a; }` (`index.html:104`) updates to `#0A0A0F` to match, so there's no flash-of-wrong-color before the stylesheet paints.

---

## 2. Fonts

Replace the single Google Fonts `@import`/`<link>` (`index.html:19-21`, Inter only) with three families:

```html
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800;900&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Assignment:
- **Unbounded** — `h1`–`h4` (Tailwind `fontSize.display/h1/h2/h3/h4`), the 3 hero stat numbers (`.text-h2.gradient-text-loop.counter`), the nav wordmark "BeatReply" and its "B" mark.
- **IBM Plex Sans** — everything else: body copy, buttons, nav links, captions, the `body{font-family}` default. Replaces Inter 1:1 in the Tailwind `fontFamily.sans` array and the `body` rule.
- **IBM Plex Mono** — the hero chat-demo's technical labels only (`98 BPM · F Min`, `MP3 40 € · WAV 70 €...`) — these already read as a "spec sheet" register, mono reinforces that. Nowhere else; don't spread mono into headings or body copy.

Tailwind config gains a `fontFamily.display: ['Unbounded', ...]` and a `fontFamily.mono` override alongside the existing `sans`; the specific elements above get an explicit `font-display`/`font-mono` utility class (or an equivalent `<style>` rule targeting `h1,h2,h3,h4,.gradient-text-loop.counter` — implementer's call, whichever keeps the markup diff smaller).

---

## 3. Aurora waveform (hero + `#cta-final`)

Replaces the current static `.glow-orb-1`/`.glow-orb-2` (`index.html:150-159`) — same DOM slot (first children of the hero/CTA sections), new content. `.hero-gradient` (`index.html:116-121`) keeps its role as the section's flat base layer but drops its orange radial tints — it becomes a plain dark vertical gradient (`linear-gradient(180deg, var(--bg) 0%, #000 100%)`-equivalent using the new tokens); all the color now comes from the aurora sitting on top of it.

### 3.1 Structure

```html
<div class="wave-field" aria-hidden="true">
  <svg class="wave-loop wave-loop-a" viewBox="0 0 1600 500" preserveAspectRatio="none">
    <defs>
      <linearGradient id="auroraGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"  stop-color="#FF2E9A"/>
        <stop offset="50%" stop-color="#3D6BFF"/>
        <stop offset="100%" stop-color="#8ED9FF"/>
      </linearGradient>
    </defs>
    <path d="[see §3.2 for the tiled wave construction]" fill="url(#auroraGrad)"/>
  </svg>
  <svg class="wave-loop wave-loop-b" viewBox="0 0 1600 500" preserveAspectRatio="none">
    <path d="[see §3.2, same construction, independent phase]" fill="url(#auroraGrad)" opacity="0.6"/>
  </svg>
</div>
```

One `.wave-field` per section (hero, `#cta-final`) — two independent instances, not a shared/reused DOM node, so their loop phases don't visually sync.

### 3.2 The loop path — construction recipe

Each `<path d="…">` is a **closed, filled ribbon shape** (not a stroked line): a smooth wave built from repeated cubic-bezier segments across a period of 400 units, repeated 4× across a 1600-unit-wide viewBox (so the pattern already tiles seamlessly within itself), baseline around y=250, amplitude ±60. Concretely, one period:

```
M0,250 C100,190 200,310 400,250
```

repeated (with the `x` values advancing by 400 each time) across the 1600-wide viewBox, then mirrored back along a lower baseline (e.g. y=320, amplitude ±40) and closed (`Z`) to give the shape body/thickness — this is what makes it read as a soft ribbon once blurred, not a thin line. Because the path already tiles at period 400 and the viewBox is a whole multiple (1600 = 4×400), animating the `<svg>` element itself via `transform: translateX(-400px)` (one period) over the animation duration produces a perfectly seamless loop — no visible seam, no snap-back.

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

`#cta-final` reuses the identical `.wave-field` markup/CSS (it's a shared, generic component — just instanced twice), possibly with `opacity` tuned down slightly if the CTA's own background needs the text more legible; that's a visual call made against the real page, not hand-derived here (see §9 open questions).

### 3.3 Why not canvas / why not full-page

Matches the effects-table decision: scoped to 2 sections, not a full-page field. This has two benefits beyond matching the reference: it sidesteps the still-open "intensity looks dominant on plain sections" question from the superseded spec's Task 4 by construction (there is no field on the plain sections), and it removes JavaScript from the critical path entirely — nothing here can jank, because nothing here runs per-frame JS or reads scroll position. `prefers-reduced-motion` is a one-line `animation-play-state: paused` rule.

---

## 4. Material system

### 4.1 Recolor the existing tokens

The `--mat-structural/card/interactive` custom properties already exist in `worktree-ambient-background` (`index.html:296-322` there). Recolor only — same 8-property-per-weight shape, same `.mat-structural`/`.mat-card`/`.mat-interactive` helper classes, same `-tint`/`-blur`/`-sat`/`-border`/`-edge`/`-shadow`/`-inner` structure — just swap the warm-orange `-tint` (`rgba(255,190,130,…)`) for a cool blue-violet tint (`rgba(90, 110, 255, …)` at the same alpha steps: 0.06 / 0.04 / 0.05) and the `-bg`/`-border`/`-edge` values for the `--glass-bg`/`--glass-border`/`--hairline` tokens from §1. The navbar's existing recipe (structural weight, applied at all scroll positions per the earlier navbar-scrolled fix) carries forward unchanged in structure.

### 4.2 New this phase: apply `card` and `interactive`

Previously defined-but-unused (per the superseded spec's explicit phase split). Now applied:

- **`.glass-surface`** (`index.html:133-139`, used on the hero chat-demo card and reused as a base class on Solutions/Catalog/Process content cards via `.card.glass-surface`) — becomes an alias for `.mat-card`, or is redefined in place with the `card`-weight recipe. Whichever the implementer picks, the visual result (blur, tint, border, edge highlight) must match `.mat-card` exactly — one recipe, not two competing ones.
- **`.btn-primary`/`.btn-secondary`** (`index.html:166-200`) — gain the `interactive`-weight glass recipe as their base, replacing the current flat gradient/transparent fills. `.btn-primary` keeps a solid gradient *core* per the vibrancy rule (color on a solid layer, text/icons legible), with the glass edge/blur/shadow layered as the surface treatment around it — concretely: `background` becomes the `.mat-interactive` gradient-over-tint recipe with the existing blue→magenta gradient still visible through the translucency, rather than a fully opaque fill.

### 4.3 Specular sweep

New `::before` on both button classes:

```css
.btn-primary, .btn-secondary { position: relative; overflow: hidden; }
.btn-primary::before, .btn-secondary::before {
  content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
}
.btn-primary:hover::before, .btn-secondary:hover::before { left: 130%; }
```

Hover-triggered (not a constant loop) — cheaper, less visually noisy on a page with several buttons, and consistent with `.btn-primary`'s existing hover-only `box-shadow`/`transform` treatment (`index.html:171`). `prefers-reduced-motion` disables the transition (instant, no sweep).

---

## 5. Motion

### 5.1 Reveals: IntersectionObserver → `animation-timeline: view()`

Replace `.scroll-reveal`'s current opacity/transform/blur transition-on-class-toggle (`index.html:232-236`, driven by the IO script at `index.html:723-734`) with a scroll-driven `@keyframes` + `animation-timeline: view()`:

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

The `@supports not` fallback renders elements **immediately visible**, not frozen at `opacity:0` — a browser without scroll-timeline support must never hide content permanently. The existing per-`nth-child` stagger delays (`index.html:234-236`) don't carry over as-is (scroll-timeline animations don't use `transition-delay`); if staggering across siblings is wanted, it needs `animation-range` offsets per child — this is a nice-to-have the implementer can add if trivial, not a requirement. The IO script (`index.html:723-734`) is removed once no element depends on it; grep for `.scroll-reveal`/`is-visible` usage first to confirm nothing else reads the class.

### 5.2 Floating stat pills

The 3 hero stats (`index.html:333-346`) already have `.counter` + staggered `animation-delay` via `.gradient-text-loop`. Add a second, independent looping animation for vertical drift:

```css
.hero-stat { animation: statFloat 5s ease-in-out infinite; }
@keyframes statFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
```

Applied to each stat's wrapper `<div>` (`index.html:334`, `338`, `342`), each keeping its own `animation-delay` (reuse the existing `0s`/`0.7s`/`1.4s` stagger already on the text, or a fresh offset — implementer's call) so the three drift out of phase.

### 5.3 Marquee — genre band

New element, placed directly under the hero section (before the "problem" section divider), full-bleed, ~56px tall band on `--surface` background with a top `--hairline` border separating it from the hero above:

```html
<div class="marquee-band" aria-hidden="true">
  <div class="marquee-track">
    <span>R&amp;B/Swag</span><span>West Coast</span><span>Trap</span><span>Drill</span>
    <span>Boom Bap</span><span>Afro</span><span>Cloud</span><span>Detroit</span>
    <!-- duplicated once more, identical, for seamless looping -->
    <span>R&amp;B/Swag</span><span>West Coast</span><span>Trap</span><span>Drill</span>
    <span>Boom Bap</span><span>Afro</span><span>Cloud</span><span>Detroit</span>
  </div>
</div>
```

`aria-hidden="true"` — decorative, the same content already exists meaningfully in the hero-demo's style picker.

```css
.marquee-band {
  overflow: hidden; background: #121218; /* Tailwind `surface` value, hardcoded here to match how .hero-gradient etc. already mix literals into this <style> block */
  border-top: 1px solid var(--hairline);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}
.marquee-track {
  display: flex; gap: 3rem; width: max-content;
  padding: 1rem 0; white-space: nowrap;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; letter-spacing: 0.08em;
  text-transform: uppercase; color: #8D8B9B; /* Tailwind `text-muted` value */
  animation: marqueeScroll 24s linear infinite;
}
@keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
```

The duplicated content block + `translateX(-50%)` is the same seamless-loop technique as §3.2. `prefers-reduced-motion` pauses the animation (content is still fully readable, just static).

---

## 6. Grain

`.texture-grain` (`index.html:141-148`) keeps its existing SVG `feTurbulence` overlay unchanged in mechanism — only worth revisiting if the noise reads wrong against the new near-black (`#0A0A0F` vs old `#0a0a0a` is a negligible shift, almost certainly no change needed). No action required unless it looks off on the real page.

---

## 7. Accessibility fallbacks

Extends the pattern already proven on the navbar (superseded spec §3.3, worktree lines ~379-395):

- `prefers-reduced-motion: reduce` → `.wave-loop` animations paused, `.marquee-track` paused, `.btn-*::before` sweep transition removed, `.hero-stat` float removed, `.scroll-reveal` renders via the `@supports not` fallback path (immediately visible) rather than trying to run a reduced version of the timeline animation.
- `prefers-reduced-transparency: reduce` → `.mat-card`/`.mat-interactive` (and structural, already handled) drop `backdrop-filter`, go near-opaque — same pattern as the existing `#navbar`/`#nav-mobile` rule, extended to the new consumers.
- `prefers-contrast: more` → same treatment extended to buttons/cards.
- **Tailwind v3 alpha-modifier lesson (carried from [[beatreply-brand-color-pivot]]):** this repo's Tailwind Play CDN build resolves `<alpha-value>` against the raw `--primary-rgb`/`--secondary-rgb` triplets — any new color token that needs `bg-cyan/50`-style alpha usage must follow the same `r g b` (space-separated, no `rgb()` wrapper) format already used for `--primary-rgb`/`--secondary-rgb`, not a hex string, or the opacity modifier silently no-ops.
- Worst-case contrast check: nav links and button text measured against the composited pixel at the aurora's brightest visible pass, not an average frame (same method already used for the navbar in the superseded spec's verification step).

---

## 8. Verification

Extend `sdd/browser-checks/ambient-bg.mjs` (or a renamed equivalent, e.g. `dropline-pivot.mjs` — implementer's call) with the existing harness pattern (`python3 -m http.server --directory <abs path>`, npx-cached Playwright):

1. Palette: computed `background-color` of `<body>`/`<html>` matches `#0A0A0F` (or its RGB equivalent); a `bg-primary` element resolves to the new blue, not the old orange.
2. Fonts: computed `font-family` of an `h1` includes `Unbounded`; of a `<p>` includes `IBM Plex Sans`.
3. Aurora: `.wave-field` present in hero and `#cta-final`, `position:absolute`, animates without interaction (two snapshots of a `.wave-loop`'s computed `transform` 1s apart differ); canvas/JS ambient-bg module from the superseded spec is confirmed **absent** (no `#ambient-bg` canvas element — this pivot doesn't use one).
4. No scroll coupling: scroll the page top→bottom, assert no element's animation state changes as a *direct function* of scroll position beyond the pre-existing `.scroll-reveal`/`view()` mechanism (which is scroll-driven by design and browser-native, not JS) — no console errors, no layout thrash.
5. Reveals: `@supports (animation-timeline: view())` branch — elements below the fold start hidden and reach `opacity:1` after scrolling into view; `@supports not(...)` (force via a Playwright CSS override if needed to test the fallback path) — elements are visible without any scroll.
6. Buttons/cards: `.btn-primary`, `.btn-secondary`, `.glass-surface`/`.mat-card` consumers all have a non-`none` `backdrop-filter`.
7. Marquee: `.marquee-track` present, animates (transform sampled twice, differs), content includes the beat-style list, `aria-hidden="true"` present.
8. Reduced motion (`emulateMedia({ reducedMotion: 'reduce' })`): wave-loop, marquee, button sweep, stat float all static across two samples 700ms apart; reveals show content immediately.
9. Reduced transparency: buttons/cards/navbar all report `backdrop-filter: none` and a near-opaque background.
10. Contrast: nav links, button text, hero stat labels ≥ 4.5:1 against their worst-case composited background (aurora peak behind them).
11. No regression: every remaining section (`#solutions`, `#catalog-showcase`, `#process`, `#cta-final`, footer) still renders with height > 40px, no horizontal scroll at 390/768/1440px.
12. `node --test` stays green (12 existing tests; this pivot adds no new pure-logic module, so no new unit tests are strictly required, though the implementer may add tests if any new pure helper — e.g. a marquee-content list constant — is factored out).

---

## 9. Open questions

None blocking. Visual tuning calls the reviewer/Corentin should eyeball against the real rendered page, not decide in the abstract:
- `.wave-field` opacity on `#cta-final` — may want slightly lower than the hero's 0.55 if the CTA's own text needs more contrast headroom; not decided here.
- Marquee item list — the 8 genres listed in §5.3 are a reasonable starting set (3 from the existing style-picker + 5 more); final wording/count is a easy tweak, not architecturally significant.
- Whether `.scroll-reveal` staggering (previously via `transition-delay` on `nth-child`) is worth reproducing via per-child `animation-range` offsets, or dropped as an acceptable simplification — implementer's call, cheap to add if trivial during the task, not worth blocking on.

## 10. Execution notes

- Reuse worktree `worktree-ambient-background` (branch `worktree-ambient-background`). Before starting new tasks there, merge/rebase `main` into it to pick up the testimonials removal (`0234ce2`) and any other main-only commits — the worktree currently sits at `2bf419a`, behind `main`'s `0234ce2`.
- The superseded spec's Task 1 (`ambient-bg.js` canvas module + its unit tests) is **not** carried forward as code — this pivot has no canvas. Its file may be deleted as part of the first task here, or left and simply never wired in; implementer/plan's call, but the shipped page must not load or reference it.
- Tasks 2–3 of the superseded spec (canvas wiring, material tokens + navbar) inform this plan's early tasks (recolor + extend) rather than being redone from scratch.
