# Section "Comment ça marche" — Refonte du texte

## Contexte

En comparant la landing page à un concurrent (dmforme.com, "How it works"), une relecture du texte actuel de la section Process ([index.html:604-630](../../../index.html#L604)) a révélé trois écarts entre ce qui est écrit et ce que le produit fait réellement aujourd'hui :

1. **Étape 1** promet Instagram, WhatsApp et "ton site" comme canaux connectables — seul Instagram est développé (`app/api/instagram/*` dans `beatreply-dashboard`). Le texte multi-canal date de la création initiale de la landing, avant que le périmètre ne se limite à Instagram.
2. **Étape 2** affirme que l'IA "s'entraîne... sur ta façon de parler pour sonner exactement comme toi" — le bot a aujourd'hui un ton unique et fixe, codé en dur dans `buildSystemPrompt` (`beatreply-dashboard/lib/ai/respond.ts`). La personnalisation par beatmaker existe comme idée (mockup ChatGPT de Lucas : presets Chill/Pro/Énergique/Mon propre style + curseurs longueur/langage + toggles), mais rien n'est construit.
3. **Étape 3** affirme que l'IA "relance en continu" — aucune fonctionnalité de relance/follow-up automatique dans le code (vérifié par recherche dans `beatreply-dashboard/app` et `lib`). La relance automatique est listée comme feature Premium future dans le modèle de pricing de Lucas, pas construite.

Décision de Corentin sur le traitement de ces deux idées non construites : la **personnalisation du bot n'est pas une fonctionnalité secondaire ni "premium"** — c'est une idée centrale du produit, qui va être construite directement (pas un "peut-être un jour"). La **relance automatique**, elle, reste correctement positionnée comme une évolution future liée à l'offre payante — mais sans nommer "Premium" publiquement puisque le modèle de tarification (Standard/Premium) n'est pas encore verrouillé (voir mémoire `beatreply-pricing-model`).

## Objectif

Corriger le texte des 3 étapes pour qu'il reste fidèle à ce qui existe aujourd'hui, tout en gardant visible la vision produit sur la personnalisation du bot (promue en sujet central de l'étape 2) et sur la relance automatique (gardée en mention secondaire à venir, étape 3).

## Périmètre

**Inclus :**
- Réécriture du texte des 3 cartes existantes dans `index.html` (titres + paragraphes), structure HTML/CSS inchangée (toujours 3 colonnes, numéro + titre + paragraphe)
- Ajout d'une ligne secondaire "✨ Bientôt : ..." sous le paragraphe de l'étape 3 uniquement (relance automatique)
- Retrait de toute mention WhatsApp/site dans l'étape 1

**Explicitement hors scope (décidé pendant le brainstorming) :**
- Pas de visuel/mockup/capture d'écran par étape — reporté (palette de marque en cours de réflexion, voir mémoire `beatreply-brand-color-pivot` ; dashboard pas encore assez rempli en données réelles pour de vraies captures pertinentes)
- Pas de changement de palette de couleurs (reste cyan/violet actuel — le pivot noir/orange-doré évoqué par Lucas n'est pas encore acté)
- Pas de refonte du vrai flow d'onboarding fonctionnel (connexion Instagram réelle, prérequis Page Facebook) — c'est un chantier produit séparé, cette section reste au niveau marketing/conceptuel
- Le mot "Premium" n'apparaît pas publiquement (tarification non verrouillée)

## Contenu final

**01 — Connecte ton compte**
> Connecte ton Instagram à BeatReply en quelques clics. Ton IA prend le relais sur tes DM, direct.

**02 — Une IA qui te ressemble**
> Chill, pro, énergique, ou à ta sauce — configure la personnalité de ton bot pour qu'il sonne comme toi. Il recommande tes prods et répond sur tes tarifs, à ta manière.

**03 — Elle vend, tu crées**
> Elle répond et qualifie chaque acheteur, 24h/7j, pendant que tu restes en studio.
> ✨ *Bientôt : les relances automatiques pour ne perdre aucune vente.*

## Composants visuels

- Titres et paragraphes principaux : mêmes classes Tailwind existantes (`text-h4 font-semibold`, `text-body-sm text-text-muted`), aucun changement de structure.
- Ligne "✨ Bientôt" (étape 3 uniquement) : nouvel élément `<p>` sous le paragraphe existant, taille plus petite (`text-caption`), couleur `text-primary` (dégradé/accent déjà utilisé ailleurs pour les mentions "à venir"-like, ex. essai gratuit dans le CTA final) pour la distinguer visuellement du texte descriptif principal sans introduire de nouvelle couleur.

## Suite

Les visuels par étape (captures réelles ou mockups) restent un sujet ouvert, à reprendre soit après la session Lucas (quand le dashboard aura de vraies conversations à montrer), soit après que le pivot de palette noir/orange-doré soit tranché — pour éviter de construire un visuel à refaire deux fois. Voir mémoire `beatreply-auth-design-debt` et `beatreply-brand-color-pivot`.

Le sujet "liquid glass" et les animations (mentionnés par Lucas) restent un brainstorming séparé, non traité ici.
