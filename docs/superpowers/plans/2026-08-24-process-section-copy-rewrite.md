# Process Section Copy Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the 3 step titles/paragraphs in the landing page's "Comment ça marche" (Process) section so the copy matches what BeatReply actually does today, and add one secondary "coming soon" line under step 3.

**Architecture:** Pure static-content edit to `index.html`. No JavaScript, no new components, no CSS changes — reuses Tailwind utility classes already defined and used elsewhere in the same file (`text-primary`, `text-caption`, `text-body-sm`, `text-text-muted`). No test framework covers static copy in this repo (the existing `tests/` suite only covers the interactive catalog-demo/catalog-showcase JS widgets) — verification here is grep-based content assertions plus a manual visual check, not unit tests.

**Tech Stack:** Static HTML + Tailwind CDN config (no build step for this file).

## Global Constraints

- Source of truth for the approved copy: `docs/superpowers/specs/2026-08-24-process-section-copy-design.md` — copy the three paragraphs and the "✨ Bientôt" line verbatim, do not paraphrase.
- Do not mention "Premium" anywhere in the visible copy (pricing tiers not locked yet — see spec's Contexte section).
- Do not change the section's HTML structure (still 3 columns, `id="process"`, same wrapper divs/classes) — only text content inside `<h3>`/`<p>` tags changes, plus one new `<p>` element for step 3's badge line.
- The "✨ Bientôt" line only appears under step 3 — steps 1 and 2 get no such line.

---

### Task 1: Rewrite the 3 Process step cards in index.html

**Files:**
- Modify: `index.html:615-626`
- Test: none (static content repo has no test coverage for this section) — verified via `grep` + manual browser check in this task's own steps

**Interfaces:**
- Consumes: nothing (leaf content change, no other file depends on this section's exact wording)
- Produces: nothing consumed by later tasks — this is the only task in this plan

- [ ] **Step 1: Confirm current content matches expectations before editing**

Run:
```bash
grep -n "Instagram, WhatsApp ou ton site\|s'entraîne sur tes beats\|relance en continu" /Users/corentin/Documents/Projects/lp-beatreply/index.html
```

Expected output (3 matching lines, confirms nothing has drifted since the spec was written):
```
616:        <p class="text-body-sm text-text-muted">Instagram, WhatsApp ou ton site — connecte BeatReply à tes canaux en quelques clics.</p>
621:        <p class="text-body-sm text-text-muted">Elle s'entraîne sur tes beats, tes prix et ta façon de parler pour sonner exactement comme toi.</p>
626:        <p class="text-body-sm text-text-muted">Ton IA répond, qualifie et relance en continu, pendant que tu restes concentré sur ta musique.</p>
```

If the output differs, stop and re-read the current state of `index.html:604-630` before proceeding — someone else may have already edited this section.

- [ ] **Step 2: Replace step 1's paragraph**

In `index.html`, find this exact line (currently line 616):
```html
        <p class="text-body-sm text-text-muted">Instagram, WhatsApp ou ton site — connecte BeatReply à tes canaux en quelques clics.</p>
```

Replace it with:
```html
        <p class="text-body-sm text-text-muted">Connecte ton Instagram à BeatReply en quelques clics. Ton IA prend le relais sur tes DM, direct.</p>
```

- [ ] **Step 3: Replace step 2's title and paragraph**

Find this exact block (currently lines 619-621):
```html
        <div class="text-h1 font-extrabold gradient-text mb-4">02</div>
        <h3 class="text-h4 font-semibold mb-3">L'IA apprend ton style</h3>
        <p class="text-body-sm text-text-muted">Elle s'entraîne sur tes beats, tes prix et ta façon de parler pour sonner exactement comme toi.</p>
```

Replace it with:
```html
        <div class="text-h1 font-extrabold gradient-text mb-4">02</div>
        <h3 class="text-h4 font-semibold mb-3">Une IA qui te ressemble</h3>
        <p class="text-body-sm text-text-muted">Chill, pro, énergique, ou à ta sauce — configure la personnalité de ton bot pour qu'il sonne comme toi. Il recommande tes prods et répond sur tes tarifs, à ta manière.</p>
```

- [ ] **Step 4: Replace step 3's paragraph and add the "✨ Bientôt" line**

Find this exact line (currently line 626):
```html
        <p class="text-body-sm text-text-muted">Ton IA répond, qualifie et relance en continu, pendant que tu restes concentré sur ta musique.</p>
```

Replace it with these two lines:
```html
        <p class="text-body-sm text-text-muted">Elle répond et qualifie chaque acheteur, 24h/7j, pendant que tu restes en studio.</p>
        <p class="text-caption text-primary mt-2">✨ Bientôt : les relances automatiques pour ne perdre aucune vente.</p>
```

- [ ] **Step 5: Verify the old copy is gone and the new copy is present**

Run:
```bash
grep -n "WhatsApp\|relance en continu\|s'entraîne sur tes beats" /Users/corentin/Documents/Projects/lp-beatreply/index.html
```
Expected: no output (empty — confirms all 3 outdated phrases were removed; also confirms no other section of the page accidentally used the same phrasing).

Run:
```bash
grep -n "Une IA qui te ressemble\|Elle répond et qualifie chaque acheteur\|Bientôt : les relances automatiques" /Users/corentin/Documents/Projects/lp-beatreply/index.html
```
Expected (3 matching lines confirming the new copy landed):
```
620:        <h3 class="text-h4 font-semibold mb-3">Une IA qui te ressemble</h3>
626:        <p class="text-body-sm text-text-muted">Elle répond et qualifie chaque acheteur, 24h/7j, pendant que tu restes en studio.</p>
627:        <p class="text-caption text-primary mt-2">✨ Bientôt : les relances automatiques pour ne perdre aucune vente.</p>
```
(Exact line numbers may shift by ±1 depending on how the edit tool applied the change — that's fine, the content match is what matters.)

- [ ] **Step 6: Manual visual check in a browser**

Open `index.html` directly in a browser (or via a local static server if the project has one configured), scroll to the "Comment ça marche" section (`#process`), and confirm:
- 3 cards still render side-by-side on desktop width, stacked on mobile width (resize the window to check)
- Step 3's "✨ Bientôt" line renders in the cyan accent color (`text-primary` / `#00D9FF`), visibly smaller and secondary to the main paragraph above it, not the same size/weight
- No layout overflow or awkward wrapping from the longer step 2 paragraph

- [ ] **Step 7: Commit**

```bash
cd /Users/corentin/Documents/Projects/lp-beatreply
git add index.html
git commit -m "$(cat <<'EOF'
Rewrite Process section copy to match actual product capabilities

Removes WhatsApp/site channel claims (Instagram-only today), reframes
bot personality as a core product idea instead of an implied-live
feature, and moves the "relance automatique" claim to an explicit
upcoming-feature line instead of stating it as current behavior.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
