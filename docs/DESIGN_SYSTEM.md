# AcadLens — Design System

> Premium Institutional Intelligence. Academic Analytics. Modern Data Visualization.

---

## 1. Design Philosophy

AcadLens must feel like a tool built for **institutions that take precision seriously**.

It is NOT:
- A generic SaaS dashboard
- An AI-hype product
- A startup landing page

It IS:
- A professional analytics platform for academic governance
- Data-dense but never cluttered
- Trustworthy, legible, and calm under complexity

### Guiding Principles

| Principle | Application |
|---|---|
| **Restrained** | Every visual element earns its place. No decoration for decoration's sake. |
| **Data-first** | Typography and spacing serve data readability, not aesthetics. |
| **Purposeful motion** | Animations communicate state changes, not personality. |
| **Institutional trust** | Colors and type choices signal credibility, not excitement. |
| **Accessible by default** | WCAG 2.1 AA minimum. Color is never the sole indicator of meaning. |

---

## 2. Color Palette

### Design Token Reference (`styles/tokens.css`)

```css
:root {
  /* ── Backgrounds ── */
  --color-bg-base:        #0a0d12;   /* Page background — near-black, slightly blue-tinted */
  --color-bg-surface:     #111620;   /* Card / panel background */
  --color-bg-elevated:    #1a2030;   /* Dropdown, tooltip, modal background */
  --color-bg-overlay:     rgba(10, 13, 18, 0.85); /* Backdrop overlays */

  /* ── Borders ── */
  --color-border-subtle:  rgba(255, 255, 255, 0.07);
  --color-border-default: rgba(255, 255, 255, 0.12);
  --color-border-strong:  rgba(255, 255, 255, 0.20);

  /* ── Brand / Accent ── */
  --color-accent:         #4f8ef7;   /* Institutional blue — primary interactive */
  --color-accent-hover:   #3b7aee;
  --color-accent-muted:   rgba(79, 142, 247, 0.12); /* Subtle bg for accent elements */

  /* ── Semantic ── */
  --color-success:        #34c47c;
  --color-success-muted:  rgba(52, 196, 124, 0.10);
  --color-warning:        #e8a838;
  --color-warning-muted:  rgba(232, 168, 56, 0.10);
  --color-danger:         #e85454;
  --color-danger-muted:   rgba(232, 84, 84, 0.10);
  --color-neutral:        #7a8ba0;
  --color-neutral-muted:  rgba(122, 139, 160, 0.10);

  /* ── Typography ── */
  --color-text-primary:   #e8edf5;   /* Main text */
  --color-text-secondary: #8a99b0;   /* Metadata, labels */
  --color-text-muted:     #4a5568;   /* Disabled, placeholders */
  --color-text-inverse:   #0a0d12;   /* Text on accent backgrounds */

  /* ── Data Visualization ── */
  --color-data-1:         #4f8ef7;   /* Primary series */
  --color-data-2:         #34c47c;   /* Secondary series */
  --color-data-3:         #e8a838;   /* Tertiary series */
  --color-data-4:         #a78bfa;   /* Quaternary series */
  --color-data-5:         #38bdf8;   /* Quinary series */
}
```

### Color Rationale

- **`#0a0d12`** background: Deep navy-black — institutional, not trendy "pure black"
- **`#4f8ef7`** accent: Mid-weight blue — trustworthy, academic, not neon
- No rainbow gradients. No purple-pink-orange combinations.
- Semantic colors are desaturated — warning is amber, not glowing yellow.

---

## 3. Typography

### Font Stack

```css
--font-sans: 'Inter', 'system-ui', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

Load via `next/font/google` for optimized delivery.

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--text-display` | 3rem / 48px | 600 | 1.1 | Hero headline |
| `--text-h1` | 2rem / 32px | 600 | 1.2 | Page titles |
| `--text-h2` | 1.375rem / 22px | 600 | 1.3 | Section headings |
| `--text-h3` | 1.125rem / 18px | 500 | 1.35 | Card titles |
| `--text-body` | 0.9375rem / 15px | 400 | 1.6 | Primary body text |
| `--text-small` | 0.8125rem / 13px | 400 | 1.5 | Labels, metadata |
| `--text-xs` | 0.6875rem / 11px | 500 | 1.4 | Badges, tags (uppercase) |
| `--text-mono` | 0.875rem / 14px | 400 | 1.5 | IDs, scores, code |

---

## 4. Spacing & Radius

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-full: 9999px;
```

---

## 5. Component Patterns

### Cards / Panels
- Background: `--color-bg-surface`
- Border: `1px solid var(--color-border-subtle)`
- Radius: `--radius-lg`
- No drop shadows on dark backgrounds — use border contrast instead
- Hover: border brightens to `--color-border-default`

### Badges / Status Indicators
- Small pill: `border-radius: var(--radius-full)`, `font-size: var(--text-xs)`, uppercase
- Always paired with a dot or icon — never color-only meaning
- States: `success`, `warning`, `danger`, `neutral`, `accent`

### Tables
- Header: `--color-bg-elevated`, 11px uppercase label style
- Row hover: subtle `--color-bg-elevated` background
- Borders: horizontal rules only (`border-bottom: 1px solid var(--color-border-subtle)`)

### Metric / KPI Cards
- Large mono-font number: `--font-mono`, `--text-h1` or larger
- Delta indicator: small colored arrow + percentage
- Label: `--text-small`, `--color-text-secondary`

---

## 6. Motion System

### Principles
- Animations communicate **state changes and data loading** — not decorative
- Respect `prefers-reduced-motion` — all animations must be wrapped in the media query
- Prefer `transform` and `opacity` only — no layout-triggering properties
- Duration: fast interactions 150ms, page reveals 400ms, data animations 600ms

### Easing Functions
```css
--ease-out:        cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-in-out:     cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1); /* Subtle spring for reveals */
```

### Animation Catalogue

| Animation | Usage | Duration | Implementation |
|---|---|---|---|
| **Fade + Slide Up** | Page section reveals on scroll | 400ms | Framer Motion `viewport` trigger |
| **Stagger Children** | Lists, directory cards | 30ms per item | Framer Motion `staggerChildren` |
| **Counter** | KPI number roll-up | 800ms | Custom hook with `useMotionValue` |
| **Chart Entrance** | Bar/line chart data load | 600ms | Recharts animation props |
| **Hover Lift** | Interactive cards | 150ms | `translateY(-2px)` + border brighten |
| **Data Flow** | Hero source-to-insight visual | Loop | Framer Motion path animation |
| **Nav Transition** | Route changes | 200ms | Next.js + Framer `AnimatePresence` |

### What NOT to do
- No constant looping animations on the main UI
- No particle systems, floating blobs, or ambient movement
- No spring physics on data tables or form inputs
- No animation on every hover — only interactive affordances

---

## 7. Iconography

Library: **Lucide React** — consistent 2px stroke weight, clean geometric forms.

Icon sizes:
- Navigation: `20px`
- Inline / label: `16px`
- Status dot replacement: `12px`
- Feature illustration: `48px` (stroke only, no fill)

---

## 8. Layout System

### Sidebar + Content Shell
```
┌─────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main Content Area     │
│                         │                        │
│  Logo                   │  Page Header           │
│  Nav items              │  ─────────────────     │
│                         │  Content Grid          │
│  ─────────────────      │                        │
│  User info              │                        │
└─────────────────────────────────────────────────┘
```

- Sidebar: `240px` wide, fixed position, `--color-bg-surface` background
- Content area: fluid, max-width `1280px`, centered with `auto` margins
- Content padding: `--space-8` horizontal, `--space-6` vertical

### Responsive Breakpoints
```css
--breakpoint-sm:  640px;
--breakpoint-md:  768px;
--breakpoint-lg:  1024px;
--breakpoint-xl:  1280px;
--breakpoint-2xl: 1536px;
```

Mobile: sidebar collapses to icon rail or off-canvas drawer.

---

## 9. Accessibility Requirements

- Minimum contrast ratio 4.5:1 for body text
- Focus rings: `2px solid var(--color-accent)` with `2px offset`
- All interactive elements keyboard-navigable
- ARIA labels on icon-only buttons
- Screen reader text for status indicators
- `prefers-reduced-motion` respected globally
