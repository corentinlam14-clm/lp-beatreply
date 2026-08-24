# Pivot couleur noir + orange/doré — Design

## Contexte

Lucas (le beatmaker partenaire) souhaite que l'identité visuelle de BeatReply passe du cyan/violet néon actuel à un noir + orange/doré. Cette décision était déjà notée en mémoire (`beatreply-brand-color-pivot`) sans être scopée ni implémentée.

Lucas a ensuite envoyé un concept de logo généré (symbole infini ∞, dégradé orange chaud → doré sur fond noir, métaphore de la "boucle d'échange" question/réponse). Ce logo introduit deux sujets distincts :
1. Une direction couleur concrète (orange chaud → doré), utilisée ici comme référence pour choisir les codes hex.
2. Un asset logo réel + un wordmark "Beat Reply" en deux mots (vs "BeatReply" actuel) — **explicitement hors scope**, chantier séparé, en attendant le vrai fichier (SVG) plutôt qu'une capture d'écran compressée.

Le fond est déjà quasi noir (`#0a0a0a`) des deux côtés du projet (landing + dashboard) — le changement porte uniquement sur les couleurs d'accent cyan/violet.

## Objectif

Remplacer la palette cyan/violet par orange/doré sur la landing page (`lp-beatreply`), en refactorant au passage les couleurs dupliquées en dur vers des variables CSS — pour que le prochain ajustement de teinte (ex: une fois le vrai fichier logo de Lucas disponible) soit un changement de 2 lignes plutôt qu'un nouveau sweep complet du fichier.

## Périmètre

**Inclus :**
- `index.html` (`lp-beatreply`) uniquement — 25 occurrences des couleurs actuelles recensées (config Tailwind, CSS custom, favicon SVG inline)
- `design.md` — mise à jour du bloc `:root` documenté pour matcher les nouvelles valeurs
- `/Users/corentin/CLAUDE.md` — section "Guidelines Images" (palette d'ambiance) mise à jour pour refléter noir + orange/doré au lieu de cyan/violet

**Explicitement hors scope :**
- Le dashboard (`beatreply-dashboard`) — même palette actuellement (`--color-primary`/`--color-secondary` dans `globals.css`), mais chantier séparé décidé par Corentin (moins risqué de commencer par la landing, pas de risque de casser l'app que Lucas utilise activement)
- Le nouveau logo (asset SVG/PNG + wordmark "Beat Reply" à deux mots vs "BeatReply" à un mot) — Corentin veut le vrai fichier de Lucas avant d'y toucher
- "Liquid glass" et animations mentionnés par Lucas — brainstorming séparé, non traité ici

## Palette finale

| Token | Ancienne valeur | Nouvelle valeur |
|---|---|---|
| `--primary` / `--accent` | `#00D9FF` | `#FF9D42` |
| `--primary-hover` / `--accent-hover` | `#00C4E6` | `#F58B29` |
| `--primary-muted` / `--accent-muted` | `rgba(0, 217, 255, 0.1)` / `rgba(0, 217, 255, 0.15)` | `rgba(255, 157, 66, 0.1)` / `rgba(255, 157, 66, 0.15)` |
| `--secondary` | `#8B5CF6` | `#C97B24` |
| `--secondary-hover` | `#7C3AED` | `#B36A1C` |
| `--primary-rgb` (nouveau) | — | `255, 157, 66` |
| `--secondary-rgb` (nouveau) | — | `201, 123, 36` |

Valeurs orange/doré estimées à l'œil sur la capture du logo de Lucas (pas de fichier source exact) — à raffiner plus tard si besoin, une fois ce chantier de refactor en place, ce sera un changement de 2 lignes.

Toutes les autres couleurs (`background`, `surface`, `text-*`, `border-*`, `success`, `error`, `warning`) restent inchangées — elles ne font pas partie du pivot cyan/violet → orange/doré.

## Architecture

**Nouveau bloc `:root` dans `<style>`** (avant les autres règles), reprenant les noms déjà documentés dans `design.md` :

```css
:root {
  --primary: #FF9D42;
  --primary-hover: #F58B29;
  --primary-muted: rgba(255, 157, 66, 0.1);
  --primary-rgb: 255, 157, 66;
  --secondary: #C97B24;
  --secondary-hover: #B36A1C;
  --secondary-rgb: 201, 123, 36;
  --accent: #FF9D42;
  --accent-hover: #F58B29;
  --accent-muted: rgba(255, 157, 66, 0.15);
}
```

**`tailwind.config`** référence ces variables au lieu de hex en dur :

```js
primary: 'var(--primary)',
'primary-hover': 'var(--primary-hover)',
'primary-muted': 'var(--primary-muted)',
secondary: 'var(--secondary)',
'secondary-hover': 'var(--secondary-hover)',
accent: 'var(--accent)',
'accent-hover': 'var(--accent-hover)',
'accent-muted': 'var(--accent-muted)',
```

Les classes Tailwind générées (`text-primary`, `bg-primary`, `border-primary`, `btn-primary`, etc.) héritent automatiquement — Tailwind v3 (CDN/Play build utilisé ici) accepte des valeurs `var(...)` dans la config `theme.extend.colors` sans problème, c'est un pattern courant pour du theming runtime.

**Le reste du CSS custom** (`.gradient-text`, `.hero-gradient`, `.accent-gradient`, `.showcase-cover-*`, `.glow-orb-1/2`, `.section-divider`, `.btn-primary`, `.btn-glow-loop`, `.btn-secondary:hover`, `:focus-visible`, `.card:hover`, `boxShadow.glow`) : chaque `#00D9FF`/`#8B5CF6`/`#00C4E6` devient `var(--primary)`/`var(--secondary)`/`var(--primary-hover)`, et chaque `rgba(0, 217, 255, X)` / `rgba(139, 92, 246, X)` devient `rgba(var(--primary-rgb), X)` / `rgba(var(--secondary-rgb), X)` — l'opacité (X) ne change pas, seule la base couleur change.

**Exception obligatoire — favicon** (`index.html:10`, SVG encodé en data-URI dans `<link rel="icon">`) : un attribut `fill` de SVG dans une data-URI ne peut pas lire une variable CSS (le SVG est hors du DOM stylable). Le hex `%2300D9FF` (encodage URL de `#00D9FF`) est remplacé en dur par `%23FF9D42` (`#FF9D42`).

## Fichiers touchés

- `index.html` — bloc `:root` ajouté, `tailwind.config.colors` mis à jour, ~20 occurrences CSS remplacées par des `var(...)`, favicon mis à jour en dur (seule exception hex)
- `design.md:8-19` — valeurs `--primary`/`--primary-hover`/`--primary-muted`/`--secondary`/`--secondary-hover`/`--accent`/`--accent-hover`/`--accent-muted` mises à jour ; `--primary-rgb`/`--secondary-rgb` ajoutées au même bloc (nouveauté introduite par ce chantier, absente du doc actuel) ; commentaire de contraste équivalent à celui de `design.md:406` ajouté pour documenter le calcul de la section Accessibilité ci-dessous
- `/Users/corentin/CLAUDE.md` — section "Guidelines Images" : `"Tons sombres avec éclats néon cyan, violet profond"` devient `"Tons sombres avec éclats orange chaud, doré profond"` (remplacement exact, même structure de phrase)

## Accessibilité

`design.md:406` documente une correction de contraste explicite : texte blanc sur `--accent` ne passait pas 4.5:1 (WCAG AA), corrigé pour utiliser `--background` (`#0a0a0a`) comme couleur de texte sur fond accent (ratio ~11:1 avec l'ancien cyan `#00D9FF`).

**Revérifié avec les nouvelles valeurs** (calcul WCAG relative luminance) : `#0a0a0a` sur `#FF9D42` donne un ratio de contraste **~9.6:1** — passe largement WCAG AA (4.5:1) et frôle AAA (7:1). Le pattern actuel (`btn-primary` avec `color: var(--background)` sur fond `var(--primary)`) reste donc correct tel quel, aucun ajustement nécessaire. Pour référence, blanc sur `#FF9D42` donnerait seulement ~2.1:1 (échec) — confirme qu'il ne faut pas repasser le texte des boutons en blanc, garder `var(--background)`.

## Suite

Une fois ce refactor en place, l'ajustement futur des teintes exactes (si Lucas fournit le fichier logo réel avec des valeurs précises) se limite à modifier les 7 valeurs du bloc `:root` — voir mémoire `beatreply-brand-color-pivot`.

Le dashboard (`beatreply-dashboard`), le logo/wordmark, et le "liquid glass"/animations restent des chantiers séparés, non planifiés ici.
