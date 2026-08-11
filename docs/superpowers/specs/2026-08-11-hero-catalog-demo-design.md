# Démo catalogue interactive dans le Hero — Design

## Contexte

La landing page BeatReply ([index.html](../../../index.html)) vend actuellement une promesse générique ("l'IA qui vend tes beats") sans preuve concrète que le produit s'appuie sur un vrai catalogue de prods structuré. Une conversation ChatGPT partagée par l'ami beatmaker de l'utilisateur confirme ce point : les stats et témoignages actuels ("+180%", "3x plus de ventes") sont fictifs et devraient être remplacés, à terme, par des preuves concrètes du fonctionnement du produit.

Ce beatmaker a un vrai catalogue (50 prods, hébergé sur untitled.stream, un outil privé de travail) et un workflow n8n actif de réponse automatique aux DM Instagram, qui répond déjà en prod avec une grille de licences réelle.

## Objectif

Enrichir le mockup DM du Hero existant ([index.html:331-357](../../../index.html#L331)) pour qu'il illustre, avec de vraies données de catalogue, comment l'IA comprend une demande de style et propose les bons beats — sans backend ni IA réelle, purement en JS front-end sur des données statiques.

## Périmètre

**Inclus :**
- 3 pastilles de style cliquables (R&B/Swag, West Coast, Trap) au-dessus/dans le mockup DM
- Au clic : changement du message "client" + de la réponse IA (3 vrais beats du catalogue : titre, BPM, tonalité) + compteur réel de prods disponibles pour ce style + ligne de licences
- Design cohérent avec le design system existant ([design.md](../../../design.md)) : `.badge`, `.glass-surface`, tokens de couleur/espacement

**Explicitement hors scope (décidé pendant le brainstorming) :**
- Pas d'écoute audio (untitled.stream n'est pas une plateforme d'écoute publique — les liens nécessitent une connexion)
- Pas de prix par beat (seule une grille de licences universelle existe, pas de tarif individuel par prod)
- Pas de nom de producteur affiché (attribution anonyme pour l'instant — son accord explicite pour être associé publiquement au produit n'a pas été obtenu)
- Pas de section catalogue séparée listant les 50 prods (scope limité à l'enrichissement du Hero)
- Pas d'effet "liquid glass" (sujet de brainstorming séparé, à traiter après cette livraison)

## Données

Source : capture d'écran du catalogue untitled.stream du beatmaker (50 tracks au total). Les noms de collaborateurs/featurings sont retirés des titres affichés par souci de confidentialité des tiers.

Grille de licences réelle (extraite du workflow n8n de réponse automatique aux DM Instagram du beatmaker, déjà actif en production) :
- MP3 : 40 €
- WAV : 70 €
- Stems : 150 €
- Exclusivité : à négocier

| Style | Total réel | 3 exemples affichés (titre · BPM · tonalité) |
|---|---|---|
| R&B/Swag | 18 | Swaggy · 98 BPM · A Min — Real Love · 122 BPM · F# Min — Snake · 93 BPM · C# Min |
| West Coast | 21 | Hood · 98 BPM · F Min — San Andreas · 99 BPM · G Min — Cali · 103 BPM · D# Min |
| Trap | 11 | TrapHouse · 139 BPM · C Min — Jungle · 127 BPM · D# Min — RockMySoul · 120 BPM · D# Min |

Message "client" par style :
- R&B/Swag : "Salut, t'as un truc R&B/Swag stylé ?"
- West Coast : "Yo t'as un type beat West Coast, tempo genre 100 ?"
- Trap : "T'as de la trap qui tape fort ?"

## Composants visuels

- **Pastilles de style** : pattern `.badge` existant (pill, fond `--primary-muted`). État actif : `accent-gradient` plein, `aria-pressed="true"`.
- **Mini-cartes beats** dans la bulle IA : titre en `text-body-sm font-semibold`, BPM + tonalité en dessous en `text-caption text-text-ghost`. Conteneur reprend le glassmorphism de la bulle existante (`bg-surface-elevated`).
- **Ligne licences** : `text-caption`, séparée par `border-t border-border-subtle` sous les 3 cartes.
- **Compteur** : ex. "18 prods disponibles en R&B/Swag", `text-caption text-primary`.

## Interaction & état

- État par défaut au chargement : West Coast pré-sélectionné (c'est le style le plus fourni du catalogue, 21 prods).
- Clic sur une pastille → swap immédiat du contenu (message client, cartes beats, compteur). Pas d'animation ajoutée : simple remplacement de contenu, donc aucun impact sur `prefers-reduced-motion`.
- Implémentation en JS vanilla, données stockées en objet JS statique (pas de fetch, pas de dépendance externe).

## Accessibilité

- Pastilles = `<button>` avec `aria-pressed` reflétant l'état actif.
- Focus visible : réutilise le pattern déjà en place (`a:focus-visible, button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }`).
- Le changement de contenu doit être annoncé de façon minimale aux lecteurs d'écran (ex. `aria-live="polite"` sur le conteneur de la bulle IA) pour signaler la mise à jour sans être intrusif.

## Responsive

- Mobile : pastilles de style passent en wrap (flex-wrap), cartes beats s'empilent verticalement dans la bulle au lieu d'être côte à côte.
- Pas de nouveau breakpoint : réutilise les tokens existants (`sm:`, `lg:`) du design system.

## Suite

Après validation et implémentation de cette fonctionnalité, ouvrir un brainstorming séparé pour l'ajout d'un effet "liquid glass" (portée : où l'appliquer — cartes, nav, boutons — et niveau d'intensité).
