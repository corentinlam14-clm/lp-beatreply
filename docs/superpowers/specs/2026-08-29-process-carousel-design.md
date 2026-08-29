# Process carousel — design spec

**Date:** 2026-08-29
**Status:** Approved by Corentin via brainstorming session, pending final written review
**Related:** `docs/superpowers/specs/2026-08-24-brand-color-pivot-design.md` (palette this design reuses)

## 1. Goal

Replace the static "Comment ça marche" / Process section (5 phone-shaped step cards, currently static per the 2026-08-24 mockup) with an animated, interactive carousel that matches Lucas's reference: cards rotate on interaction, ghost neighbors imply depth, and a "magic" animated background sits behind everything — reinterpreted here as a waveform, since it fits BeatReply's beatmaking identity far better than generic particle effects.

## 2. Scope

**In scope:** the Process section's 5-step carousel only — background treatment, card glass treatment, layout, rotation interaction.

**Explicitly out of scope** (separate, unscoped chantiers — do not fold into this work):
- Site-wide liquid-glass treatment on other sections of the landing page
- Hover/click particle-burst micro-interactions elsewhere on the site
- The Hero section's animated 3D background object
- The animated logo (`liquid-logo`) — blocked on a real logo asset from Lucas/Claude Design

## 3. Tech stack

No React/Next.js migration. `lp-beatreply` is a single static `index.html` (Tailwind via CDN `<script>`, no build step, no `package.json`), and stays that way.

- **`liquid-glass-js`** (real refraction via SVG `feDisplacementMap`, not a plain blur) — loaded via `<script src="https://cdn.jsdelivr.net/npm/liquid-glass-js@0.1.0/dist/liquid-glass.umd.min.js">`. No install step. Exposes `window.LiquidGlass`.
- No Three.js / React Three Fiber needed for this chantier (no 3D object in the Process section). If the Hero 3D chantier starts later, use vanilla Three.js directly, not React Three Fiber.
- No `liquid-logo` (deferred, see scope).

## 4. Background: animated waveform + light halos

Shared background canvas spans the full carousel width, sits behind all 5 cards.

**Waveform:**
- SVG-based bars (`<line>` elements, not `<canvas>`) — chosen so the DOM state is inspectable/cloneable, which the liquid-glass refraction relies on.
- ~200–260 bars, clustered amplitude (several "bursts" of activity with quiet valleys between them, not a uniform sine wave) — mimics a real audio amplitude envelope rather than a generic oscillation.
- Two rendered layers per bar: a wider, blurred "glow" copy behind (`feGaussianBlur` filter) and a thin crisp copy in front — gives the halo/bloom look from the reference image.
- Color: vertical gradient, cream-white at the top (tallest peaks) → orange → bronze at the base (`#FFF3DD` → `#FF9D42` → `#C97B24`, matching the existing brand palette from the 2026-08-24 color pivot). **Must use `gradientUnits="userSpaceOnUse"` with explicit coordinates** — the default `objectBoundingBox` renders invisible on vertical `<line>` shapes (real bug hit during the mockup).
- Small bright accent dots at the tallest peaks.
- Reflection below the waveform, fading out (`-webkit-box-reflect`; Safari/Chrome only — acceptable degradation, Firefox just shows no reflection).

**Motion — critical requirement:** continuous, driven by `requestAnimationFrame`, **not tied to page scroll**. It should look like a track is playing regardless of whether the visitor scrolls. All bar heights are read from a single function of one shared moving parameter (`envelope(x) × roughness(x)`, both evaluated at the same `x = barPosition + time·speed`) — every bar's irregularity must ride on that one shared value, not on independent per-bar randomness. (A first version gave each bar its own random phase and looked chaotic/disordered instead of one coherent moving wave — this is the fix for that.) A slow, shared "breathing" amplitude pulse (all bars together, not per-bar) is fine for extra life.

**Halos:** 2 large blurred radial gradients (orange `#FF9D42`, bronze `#C97B24`), slow independent drift animation, kept at low opacity (~15–20%) so they add ambience without competing with the waveform's own detail.

## 5. Cards: liquid-glass on all 5, one performance tier

All 5 process-step cards use the **same** `LiquidGlass` technique (same library, same visual quality) — no fallback to plain CSS blur for any card. Visual hierarchy (active vs. neighbor) comes from **opacity and size only**, not from swapping technique:

| Tier | Cards | Size | Opacity | Refresh |
|---|---|---|---|---|
| Active | center card | largest (~190×220) | 1.0 | continuous, ~90ms interval |
| Near ghost | immediate left/right neighbors | medium (~150×190) | ~0.72 | once at mount + on resize only |
| Far ghost | outer 2 cards | smallest (~130×170) | ~0.4 | once at mount + on resize only |

**Why only the active card refreshes continuously:** mounting 5 simultaneously-live-refreshing lenses caused visible stutter (confirmed empirically — the per-lens pixel-refraction recompute is the dominant cost). Limiting continuous refresh to the one card the visitor is actually focused on removed most of the jank while keeping identical visual technique everywhere. A small residual choppiness remained after this fix, most likely `backdrop-filter`'s own per-frame browser compositing cost rather than anything left to optimize in JS — **re-profile with real devtools once this is built into the actual page** (the brainstorming mockup sandbox carries its own overhead that the production page won't have); don't assume the sandbox's residual stutter will reproduce 1:1.

Each card's glass surface hosts its own step content (icon/number + title), same as the original static mockup — this design doesn't change the copy or icons, only how the cards are rendered and how they move.

## 6. Carousel structure & navigation

5 steps, unchanged from Lucas's original mockup: **1. Connecter Instagram, 2. Ajouter ton catalogue, 3. Tarifs & licences, 4. Personnaliser ton agent, 5. C'est prêt !**

- Circular/infinite loop — no dead end at step 1 or step 5.
- Rotate via hover and via left/right arrow controls (both, per Lucas's original spec).
- Enter/exit motion should follow the same path in both directions (a card advancing right should retreat left the same way, not via a different path) — general spatial-consistency principle, not yet reduced to exact values.

**Not decided yet — implementation-phase detail, not a brainstorming decision:** exact spring/easing parameters for the rotation transition itself. Default to a critically-damped spring (no overshoot) for the base rotation, matching this project's general motion approach; reserve any bounce/overshoot only if the interaction itself carries momentum (e.g., a fast drag/flick, if that's added later) — resolve exact values during planning/implementation, not here.

## 7. Accessibility (baseline — added during spec write-up, not separately discussed with Corentin; flag for review)

- Respect `prefers-reduced-motion: reduce`: replace the continuous waveform scroll and card rotation spring with a static or minimally cross-fading equivalent — no continuous motion for visitors who've asked for less.
- Respect `prefers-reduced-transparency: reduce`: raise the glass cards' background opacity / reduce blur reliance so content stays legible without relying on translucency.
- Keep hover-triggered rotation also reachable via the arrow buttons for keyboard/non-hover users (already planned — arrows are part of the base spec, not an accessibility add-on).

## 8. Open items for the implementation plan

- Exact bar count / refresh-interval tuning for real-world performance (profile on the actual page).
- Exact spring/easing values for card rotation (section 6).
- Whether the residual `backdrop-filter` compositing cost needs a further mitigation once measured on the real page.
