# Section catalogue enrichie — Design

## Contexte

Après avoir partagé la landing page ([index.html](../../../index.html)) avec le beatmaker partenaire, celui-ci a développé l'idée avec ChatGPT et proposé une maquette : un panneau "3 prods sélectionnées pour toi" avec pochette, waveform + bouton play, prix par licence affichés sur chaque carte, et bouton d'achat par prod. L'objectif est de rendre la démo du produit plus concrète que le mockup DM compact actuel du Hero ([index.html:340-361](../../../index.html#L340)).

Un point technique bloquant a été résolu pendant le brainstorming : le catalogue réel (untitled.stream) n'expose aucun fichier audio public — impossible de brancher un vrai lecteur derrière le bouton play pour l'instant. La lecture reste donc simulée (animation, pas de son) jusqu'à ce que le beatmaker fournisse des extraits publics.

## Objectif

Ajouter une nouvelle section, entre "Solutions" et "Process", montrant 3 cartes beats enrichies (pochette, waveform, prix par licence, CTA) pour un style sélectionné parmi les 3 déjà existants (R&B/Swag, West Coast, Trap), sans dupliquer le mockup DM déjà présent dans le Hero.

## Périmètre

**Inclus :**
- Nouvelle section entre "Solutions" et "Process", avec ses propres pastilles de style (R&B/Swag, West Coast, Trap), indépendantes de celles du Hero
- 3 cartes beats enrichies par style : pochette dégradée, badge numéro, titre, style, BPM/tonalité, waveform + bouton play (animation simulée, pas de son), grille de licences réelle, bouton "Je la veux"
- Réutilisation de la couche de données existante (`getStyleData()` dans `assets/js/catalog-demo.js`), aucune nouvelle donnée catalogue

**Explicitement hors scope (décidé pendant le brainstorming) :**
- Pas de vraie lecture audio (pas de fichiers publics disponibles pour l'instant — voir "Suite")
- Pas de mockup DM dupliqué dans cette section (déjà présent dans le Hero)
- Pas de vraies pochettes photo par prod (pas de source disponible, et les stock photos génériques sont déconseillées par les guidelines de marque — voir [CLAUDE.md](../../../CLAUDE.md) section Guidelines Images)
- Pas de nouveau tunnel d'achat par beat (le bouton "Je la veux" pointe vers le CTA essai gratuit existant, à adapter plus tard)
- Pas de synchronisation d'état entre les pastilles du Hero et celles de cette nouvelle section

## Données

Aucune nouvelle donnée. Réutilise telles quelles les 3 styles déjà en place dans `assets/js/catalog-demo.js` (`getStyleData('rnbswag' | 'westcoast' | 'trap')` → `{ label, totalCount, clientMessage, tracks }`).

Grille de licences affichée sur chaque carte (identique pour toutes, universelle — pas de prix par piste) :
- MP3 : 40 €
- WAV : 70 €
- Stems : 150 €
- Exclusivité : à négocier

## Architecture fichiers

- `assets/js/catalog-demo.js` — **inchangé**. Reste la couche données partagée (`getStyleData`, `DEFAULT_STYLE`) et le widget compact du Hero (`initCatalogDemo`, `renderStyle`).
- `assets/js/catalog-showcase.js` — **nouveau fichier**. Contient le rendu de cette nouvelle section (cartes enrichies) et la logique de lecture simulée (play/pause, progression, exclusivité une-seule-lecture-à-la-fois). Consomme `window.BeatReplyCatalogDemo.getStyleData` sans dupliquer les données.
- `index.html` — nouvelle section HTML entre "Solutions" et "Process", chargement du nouveau script.

Cette séparation évite de faire grossir `catalog-demo.js` avec une deuxième responsabilité (rendu riche + animation) distincte du widget compact qu'il gère déjà.

## Composants visuels

- **Pastilles de style** : même pattern que le Hero (classes Tailwind utilitaires existantes, pas de nouvelle CSS), état indépendant de celles du Hero.
- **Pochette** : dégradé diagonal réutilisant uniquement `--primary`/`--secondary` déjà définis dans `design.md`, un angle/composition distinct par style pour les différencier visuellement — pas de nouvelle couleur, pas de photo.
- **Badge numéro** (01/02/03) en overlay sur la pochette.
- **Titre + style + BPM/tonalité**, même hiérarchie typographique que le reste du site (`text-body-sm font-semibold` / `text-caption`).
- **Waveform + play** : barres statiques (SVG ou divs), icône play/pause togglée au clic. Une barre de progression traverse la waveform sur une durée fixe de 8 secondes puis revient à zéro automatiquement en fin de course. Cliquer play sur une carte met en pause toute autre carte actuellement "en lecture" (une seule à la fois).
- **Grille de licences** : les 4 valeurs listées ci-dessus, affichées sous forme de texte compact sur chaque carte (pas de bouton par licence).
- **Bouton "Je la veux"** : même `href="mailto:hello@beatreply.io?subject=..."` que le CTA principal existant ([index.html:555](../../../index.html#L555)).

## Interaction & état

- Sélection de style par défaut : `westcoast` (cohérent avec le Hero).
- Clic sur une pastille de style → swap des 3 cartes (contenu identique à celui déjà géré par `getStyleData`), pas d'animation sur ce swap (même règle que le Hero).
- Clic sur play d'une carte → démarre l'animation de progression simulée sur cette carte, met en pause toute autre carte en cours de lecture. Clic sur pause (ou changement de style en cours de lecture) → arrête l'animation et remet la barre à zéro. Fin de progression → retour automatique au même état pause/zéro.

## Accessibilité

- Boutons play/pause : `<button>` avec `aria-label` explicite ("Écouter un extrait de {titre}" / "Mettre en pause {titre}"), état reflété (`aria-pressed` ou changement d'icône + label).
- Focus visible : réutilise le pattern déjà en place (`button:focus-visible`).
- **Nouvelle animation** (contrairement au swap de contenu des pastilles, celle-ci est une vraie animation ajoutée) : sous `prefers-reduced-motion: reduce`, le changement d'état play/pause reste instantané — pas de transition animée sur la barre de progression, seulement un changement d'état visuel immédiat (pattern déjà documenté dans `design.md` section Accessibilité Motion).

## Responsive

- Pastilles : wrap sur mobile, même comportement que le Hero.
- Cartes : grille 3 colonnes en desktop, empilées verticalement en mobile (réutilise les tokens responsive existants, pas de nouveau breakpoint).

## Suite

Quand le beatmaker fournira des extraits audio publics (MP3 20-30s hébergés de façon accessible), le modèle de donnée d'une piste pourra accueillir un champ optionnel `previewUrl` : si présent, le bouton play lira l'extrait réel via un élément `<audio>` au lieu de l'animation simulée. Ce champ n'est pas ajouté maintenant (YAGNI) — seulement documenté ici comme point d'extension prévu.

Le sujet "liquid glass" (mentionné dans une spec précédente) reste un brainstorming séparé, non traité ici.
