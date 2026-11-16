---
name: Hydro Core Enterprise
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#545c72'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c748b'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a high-performance, contemporary enterprise portal designed for national hydrological and water utility administration. Evolving past legacy governmental portals, the visual identity strikes an intentional balance between institutional authority and modern fluid agility. The interface communicates dependability, transparent governance, ecological stewardship, and high-precision resource tracking.

The design movement combines **Modern Corporate Minimalism** with subtle **Hydro-Glass Tactility**. Structural surfaces feature clean, slate-tinted canvases, balanced data tables, and generous negative space to reduce cognitive fatigue during daily administrative tasks. Subtle micro-interactions, glassy atmospheric backdrops, crisp hairline dividers, and fluid luminous accents deliver a modern digital workstation experience for engineers, field technicians, administrative directors, and operational staff.

## Colors

The color architecture draws direct inspiration from aquatic systems, transitioning from deep abyssal governance tones to vibrant, clear water hues:

- **Primary (`#0284c7` - Ocean Blue):** Anchors primary calls-to-action, active enterprise module indicators, selected menu states, and foundational link interactions.
- **Secondary (`#06b6d4` - Vivid Cyan):** Acts as a hydro-luminescent accent for status pills, telemetry highlights, active service notifications, and focus rings.
- **Tertiary (`#0f172a` - Deep Slate Navy):** Provides high-contrast typography, top navigation banners, persistent corporate footers, and critical structural frames.
- **Neutral Surface (`#f8fafc` - Pure Slate White):** Forms the foundational background canvas, offering soft, glare-free legibility under intensive enterprise usage.

### Semantic & Surface Rules
- **Canvas Base:** `#f8fafc` serves as the root viewport color.
- **Card/Container Surface:** Pure `#ffffff` framed with subtle 1px border tokens (`#e2e8f0`).
- **Muted Content & Subtle Borders:** `#64748b` for secondary metadata and `#cbd5e1` for divider treatments.
- **Functional Semantics:** Success/Operational is mapped to `#059669` (Flow Normal), Warning to `#d97706` (Flow Constrained/Under Maintenance), and Critical Alert to `#dc2626` (Incident/Offline).

## Typography

The typographic hierarchy utilizes **Plus Jakarta Sans** for expressive, crisp headings and titles, combined with **Inter** for dense data displays, administrative forms, and long-form portal notifications.

- **Display & Section Headers (`Plus Jakarta Sans`):** Clean, geometric letterforms ensure immediate scannability across portal dashboards, departmental categories, and operational announcements.
- **Body & Data Grid (`Inter`):** Selected for its neutral legibility across tabular records, account balances, payroll files, and operational logs.
- **Category & Pill Overlines (`label-caps`):** Rendered in uppercase with a `+0.06em` tracking expansion to demarcate system categories (e.g., "TRABAJADORES", "ADMINISTRACIÓN", "SISTEMA INTEGRADO").

## Layout & Spacing

The portal structure utilizes a 12-column responsive grid system engineered to handle multi-tiered enterprise workflows, rapid application launchers, and real-time alerts.

- **Max Layout Enclosure:** 1280px maximum content width centered horizontally to ensure optimal reading lines on ultra-wide desktop workstations.
- **Breakpoints:**
  - **Mobile (< 768px):** 4-column layout, 1rem (`margin-mobile`) outer margin, 1rem (`gutter-mobile`) column gap. Navigation collapses into a full-height utility drawer.
  - **Tablet (768px - 1024px):** 8-column layout, 1.5rem margins and gutters. App shortcut cards reflow into 2 or 3 columns.
  - **Desktop (1024px+):** 12-column layout, 2rem (`margin`) margins and 1.5rem (`gutter`) gutters. App launcher grids operate in 4-column groupings.
- **Spacing Cadence:** Vertical component spacing relies strictly on a standardized 4px/8px rhythm. Structural card interior padding defaults to `space-lg` (24px) for desktop and `space-md` (16px) for compact application tiles.

## Elevation & Depth

Visual hierarchy is maintained through flat tonal layering accompanied by soft ambient oceanic shadows rather than stark heavy drops:

- **Level 0 (Flat Ground):** Neutral slate `#f8fafc` canvas. Zero elevation.
- **Level 1 (Default Containers & App Cards):** Pure `#ffffff` surface, framed with a 1px hairline border in `#e2e8f0`, backed by `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Level 2 (Interactive Hover / Focused Panels):** Activated application modules elevate with `box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` alongside a subtle dynamic border tint of `#0284c7`.
- **Level 3 (Modals, Slide-over Drawers, Floating Quick Nav):** Elevated popovers and contextual flyouts use `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`.
- **Glass Accents:** Translucent elements (such as secondary status badges and utility headers) employ `backdrop-filter: blur(8px)` with an 85% opacity fill to preserve clean layering over background media.

## Shapes

The design system standardizes on **Rounded (Level 2)** geometry:
- **Base UI Elements (`rounded` = 0.5rem / 8px):** Standard buttons, input text fields, select dropdowns, search bars, and utility chips.
- **Containers & Module Cards (`rounded-lg` = 1rem / 16px):** Enterprise service groups, institutional news cards, profile summaries, and interactive modal shells.
- **Hero & Announcement Wrappers (`rounded-xl` = 1.5rem / 24px):** Major telemetry banners, photo carousels, and priority corporate alerts.
- **Status Indicators & Micro-Badges:** Full pill-radius (`rounded-full` / 9999px) for operational state tags, counter pills, and avatar anchors.

## Components

### Buttons & Interactive Controls
- **Primary Action:** Solid background of `#0284c7`, text `#ffffff`, font `label-lg`, 8px radius (`rounded`). Transitions smoothly to `#0369a1` on hover with a subtle 2px cyan glow ring on keyboard focus (`#06b6d4`).
- **Secondary / Ghost:** Transparent surface with a 1px solid `#cbd5e1` boundary, `#0f172a` text. On hover, background shifts to `#f1f5f9` with border tint `#94a3b8`.
- **Enterprise Utility Bar:** Navy-toned quick links (`#0f172a`) with subtle white hover opacity shifts for corporate tools (Zimbra Mail, Recibos de Pago, Trámites).

### Application Shortcut Cards (Launcher Modules)
- White container cards (`#ffffff`) surrounded by a 1px `#e2e8f0` border.
- Cards host an icon enclosure (48x48px container with `#f0f9ff` background and `#0284c7` dual-tone vector iconography), followed by a clear title in `label-lg` and an optional micro-badge.
- Hover states initiate a gentle -2px vertical translation, an outer border change to `#38bdf8`, and a light cyan ambient glow.

### Micro-Badges & Status Pills
- Compact status elements with 9999px pill rounding and `label-caps` typography.
- **In Construction / En Construcción:** Light amber background (`#fef3c7`) with rich amber text (`#92400e`) and border `#fde68a`.
- **Active / Operational:** Light cyan-blue background (`#e0f2fe`) with primary blue text (`#0369a1`).
- **Alert / Overdue:** Light rose background (`#ffe4e6`) with deep crimson text (`#9f1239`).

### Input Fields & Search Inputs
- Clean 44px height inputs featuring an internal `#f8fafc` tint, bordered by 1px `#cbd5e1`.
- Focused state transitions the background to `#ffffff`, with a crisp 1px `#0284c7` border and a 3px outer glow ring of `rgba(6, 182, 212, 0.2)`. Placeholder text in `#94a3b8`.

### Category Groups & Section Headers
- Structured groupings (e.g., "Trabajadores", "Administración", "Conexiones de Interés") separated by light gray divider bands (`#e2e8f0`).
- Section headers pair an uppercase tracking indicator with bold Plus Jakarta Sans headers, coupled with action counters showing total available applications.