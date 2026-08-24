# BeatReply - Design System

## Palette de Couleurs

```css
:root {
  /* Primary */
  --primary-rgb: 255 157 66;
  --primary: rgb(var(--primary-rgb));
  --primary-hover: #F58B29;
  --primary-muted: rgb(var(--primary-rgb) / 0.1);

  /* Secondary */
  --secondary-rgb: 201 123 36;
  --secondary: rgb(var(--secondary-rgb));
  --secondary-hover: #B36A1C;

  /* Accent & Glow */
  --accent: rgb(var(--primary-rgb));
  --accent-hover: #F58B29;
  --accent-muted: rgb(var(--primary-rgb) / 0.15);

  /* Backgrounds */
  --background: #0a0a0a;
  --surface: rgba(255, 255, 255, 0.03);
  --surface-elevated: rgba(255, 255, 255, 0.06);

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.85);
  --text-muted: rgba(255, 255, 255, 0.6);
  --text-ghost: rgba(255, 255, 255, 0.5); /* corrigé le 06/08/2026 : 0.4 ne passait pas 4.5:1 (WCAG AA) sur --background, ~3.5:1. 0.5 donne ~5.6:1. */

  /* Borders */
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-subtle: rgba(255, 255, 255, 0.05);

  /* Status */
  --success: #10B981;
  --error: #EF4444;
  --warning: #F59E0B;
}
```

## Typographie Premium

**Font Families:**
```css
--font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Échelle Typographique:**

Desktop:
```css
.text-display {
  font-size: 4.5rem; /* 72px */
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.text-h1 {
  font-size: 3.5rem; /* 56px */
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.text-h2 {
  font-size: 2.5rem; /* 40px */
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.text-h3 {
  font-size: 1.875rem; /* 30px */
  font-weight: 600;
  line-height: 1.3;
}

.text-h4 {
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
  line-height: 1.4;
}

.text-body-lg {
  font-size: 1.125rem; /* 18px */
  line-height: 1.6;
  font-weight: 400;
}

.text-body {
  font-size: 1rem; /* 16px */
  line-height: 1.6;
  font-weight: 400;
}

.text-body-sm {
  font-size: 0.875rem; /* 14px */
  line-height: 1.5;
  font-weight: 400;
}

.text-caption {
  font-size: 0.75rem; /* 12px */
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
```

Mobile:
```css
@media (max-width: 639px) {
  .text-display { font-size: 3rem; }
  .text-h1 { font-size: 2.5rem; }
  .text-h2 { font-size: 2rem; }
  .text-h3 { font-size: 1.5rem; }
}
```

**Styles Spéciaux:**
```css
.gradient-text {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-glow {
  text-shadow: 0 0 20px rgb(var(--primary-rgb) / 0.4);
}
```

## Spacing & Layout

**Tokens:**
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

**Section Padding:**
```css
.section-padding {
  padding-top: var(--space-24); /* 96px */
  padding-bottom: var(--space-24);
}

@media (min-width: 1024px) {
  .section-padding {
    padding-top: var(--space-32); /* 128px */
    padding-bottom: var(--space-32);
  }
}

@media (max-width: 639px) {
  .section-padding {
    padding-top: var(--space-16); /* 64px */
    padding-bottom: var(--space-16);
  }
}
```

**Max-widths:**
```css
--max-width-prose: 680px;
--max-width-content: 1080px;
--max-width-wide: 1280px;
--max-width-full: 100%;
```

**Grid:**
```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

@media (max-width: 639px) {
  .grid-container {
    gap: var(--space-4);
  }
}
```

## Ombres Multicouches

```css
.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.shadow-sm {
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.16);
}

.shadow-md {
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.08),
    0 12px 20px rgba(0, 0, 0, 0.06);
}

.shadow-lg {
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.12),
    0 20px 40px rgba(0, 0, 0, 0.08);
}

.shadow-glow {
  box-shadow: 
    0 0 30px rgb(var(--primary-rgb) / 0.15),
    0 0 60px rgb(var(--primary-rgb) / 0.08);
}
```

## Border Radius Tokens

```css
--radius-none: 0;
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

## Gradients Nommés

```css
.hero-gradient {
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgb(var(--primary-rgb) / 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgb(var(--secondary-rgb) / 0.1), transparent),
    linear-gradient(180deg, var(--background) 0%, rgba(0, 0, 0, 0.95) 100%);
}

.accent-gradient {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
}

.surface-gradient {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.03)
  );
}

.glow-gradient {
  background: radial-gradient(
    circle at 50% 50%,
    rgb(var(--primary-rgb) / 0.15) 0%,
    rgb(var(--primary-rgb) / 0.05) 50%,
    transparent 100%
  );
}

.text-gradient {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.border-gradient {
  background: conic-gradient(
    from 0deg at 50% 50%,
    var(--primary),
    var(--secondary),
    var(--primary)
  );
}
```

## Effets Visuels Avancés

**Glassmorphism:**
```css
.glass-surface {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

**Grain/Noise:**
```css
.texture-grain {
  position: relative;
}

.texture-grain::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
}
```

**Glow Orbs:**
```css
.glow-orb-1 {
  position: absolute;
  top: 10%;
  right: 15%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgb(var(--primary-rgb) / 0.15), transparent);
  filter: blur(40px);
  border-radius: 50%;
  z-index: -1;
}

.glow-orb-2 {
  position: absolute;
  bottom: 20%;
  left: 10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgb(var(--secondary-rgb) / 0.1), transparent);
  filter: blur(60px);
  border-radius: 50%;
  z-index: -1;
}
```

**Dividers:**
```css
.section-divider {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgb(var(--primary-rgb) / 0.3),
    transparent
  );
  margin: var(--space-20) 0;
}
```

**Image Treatments:**
```css
.image-treatment {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.image-treatment:hover {
  transform: scale(1.02);
}

.image-overlay {
  position: relative;
}

.image-overlay::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgb(var(--primary-rgb) / 0.1),
    rgb(var(--secondary-rgb) / 0.05)
  );
}
```

## Composants Documentés

**Boutons:**
```css
.btn-primary {
  background: var(--accent-gradient);
  color: var(--background); /* corrigé le 06/08/2026 : blanc sur --accent (#00D9FF) ne fait que ~1.75:1, illisible. --background (#0a0a0a) sur --accent fait ~11:1. Revérifié le 24/08/2026 après le pivot orange/doré : --background sur --accent (#FF9D42) donne ~9.6:1, blanc sur --accent donnerait ~2.1:1 — le choix de --background comme couleur de texte reste correct. */
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-glow);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-primary:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Ajouté le 06/08/2026 : le focus-visible doit s'appliquer à tous les éléments interactifs (liens compris),
   pas seulement .btn-primary — sinon la navigation clavier perd son indicateur sur le reste de la page. */
a:focus-visible,
button:focus-visible,
.btn-secondary:focus-visible,
.btn-outline:focus-visible,
.btn-ghost:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--primary);
  background: var(--primary-muted);
  transform: scale(1.02);
}

.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-glow);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--surface);
  color: var(--text-primary);
}
```

**Cards:**
```css
.card {
  background: var(--glass-surface);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  position: relative;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgb(var(--primary-rgb) / 0.3);
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--surface-gradient);
  border-radius: var(--radius-lg);
  z-index: -1;
}
```

**Badges/Pills:**
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-body-sm);
  font-weight: 500;
  background: var(--primary-muted);
  color: var(--primary);
  border: 1px solid rgb(var(--primary-rgb) / 0.2);
}

.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border-color: rgba(16, 185, 129, 0.2);
}
```

**Inputs:**
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-muted);
}

.input::placeholder {
  color: var(--text-muted);
}
```

**Navigation:**
```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  transition: all 0.3s ease;
}

.navbar-scrolled {
  background: rgba(10, 10, 10, 0.95);
  border-bottom-color: var(--border-primary);
  box-shadow: var(--shadow-sm);
}
```

## Animations & Micro-interactions

**Scroll Reveal:**
```css
.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  filter: blur(8px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

.scroll-reveal:nth-child(2) {
  transition-delay: 0.1s;
}

.scroll-reveal:nth-child(3) {
  transition-delay: 0.2s;
}

.scroll-reveal:nth-child(4) {
  transition-delay: 0.3s;
}
```

**Hover Effects:**
```css
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.02);
}

.hover-glow {
  transition: box-shadow 0.2s ease;
}

.hover-glow:hover {
  box-shadow: var(--shadow-glow);
}
```

**Loading States:**
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}
```

**Count Up Animation:**
```css
.counter {
  font-variant-numeric: tabular-nums;
  transition: all 0.3s ease;
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.counter-animate {
  animation: countUp 1s ease-out;
}
```

**Marquee:**
```css
.marquee {
  overflow: hidden;
  white-space: nowrap;
}

.marquee-content {
  display: inline-block;
  animation: marquee 30s linear infinite;
}

.marquee:hover .marquee-content {
  animation-play-state: paused;
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
```

**Page Load:**
```css
.page-enter {
  opacity: 0;
}

.page-enter-active {
  opacity: 1;
  transition: opacity 0.6s ease;
}

.hero-enter {
  opacity: 0;
  transform: translateY(40px);
}

.hero-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Accessibilité Motion

**Ajouté le 06/08/2026** — toute animation (scroll-reveal, pulse, hover lift/glow) doit avoir une alternative
statique ou en fondu instantané sous `prefers-reduced-motion: reduce`. Pattern de référence :

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .scroll-reveal {
    transform: none;
    filter: none;
    transition: opacity 0.3s ease;
  }
  .loading-pulse,
  .card,
  .hover-lift,
  .btn-primary,
  .btn-secondary {
    animation: none !important;
    transition: opacity 0.2s ease !important;
  }
  .card:hover,
  .hover-lift:hover,
  .btn-primary:hover,
  .btn-secondary:hover {
    transform: none !important;
  }
}
```

## Responsive Breakpoints

```css
/* Mobile: 0-639px */
@media (max-width: 639px) {
  .container {
    padding: 0 var(--space-4);
  }
  
  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
  
  .hero-padding {
    padding: var(--space-16) 0;
  }
  
  .nav-burger {
    display: block;
  }
  
  .nav-desktop {
    display: none;
  }
}

/* Tablet: 640-1023px */
@media (min-width: 640px) and (max-width: 1023px) {
  .container {
    padding: 0 var(--space-6);
  }
  
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 0 var(--space-8);
  }
  
  .grid-cols-full {
    grid-template-columns: repeat(12, 1fr);
  }
  
  .nav-burger {
    display: none;
  }
  
  .nav-desktop {
    display: flex;
  }
}
```