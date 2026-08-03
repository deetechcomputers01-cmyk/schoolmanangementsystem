---
name: Academic Pillar
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
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built for the modern Ghanaian educational landscape, balancing institutional authority with contemporary efficiency. The personality is **Professional, Academic, and Resilient**. Unlike generic SaaS products, this system prioritizes high-density information architecture and "at-a-glance" status reporting, essential for busy school administrators and educators.

The design style is a hybrid of **Minimalism** and **Tonal Layering**. It utilizes a structured "Information First" approach, where whitespace is used strategically to separate complex data sets rather than just for aesthetic decoration. The aesthetic is clean and authoritative, evoking the feeling of a prestigious physical institution translated into a digital workspace. Special attention is given to "Offline-First" visual cues, ensuring users feel confident in the system’s data integrity regardless of connectivity.

## Colors

The palette is rooted in a **Deep Navy (#0F172A)**, used for primary navigation and structural hierarchy to provide a sense of stability. **Emerald Green (#10B981)** is the primary action and "growth" color, symbolizing academic progress.

- **Primary (Navy):** Used for sidebars, headers, and primary text to establish authority.
- **Success (Emerald):** Used for "Synced" states, fee payments, and passing grades.
- **Warning (Amber):** Critical for attendance alerts and pending GHS payments.
- **Alert (Rose):** Reserved for overdue accounts, expulsion notices, or system errors.
- **Neutral (Soft Gray):** The primary background color to reduce eye strain during long administrative sessions.

The system supports a native Dark Mode where surfaces shift to deep charcoal tones, maintaining the same semantic hierarchy while preserving legibility.

## Typography

This design system uses a dual-font approach to maximize clarity and technical precision. **Geist** is utilized for headings, labels, and data points due to its rhythmic spacing and "developer-grade" precision—ideal for GHS currency formatting and student IDs. **Inter** is used for body copy and long-form descriptions to ensure maximum readability across all devices.

- **Currency Formatting:** All GHS amounts should use the `mono-data` style to ensure decimal alignment in tables.
- **Roles & Labels:** Use `label-sm` with Geist for role badges (Admin, Teacher) to distinguish them from standard body text.

## Layout & Spacing

The layout utilizes a **12-column fluid grid** for desktop and a **single-column vertical stack** for mobile. A 4px baseline grid ensures vertical rhythm.

- **Desktop:** Sidebar is fixed at 280px. Content area expands fluidly with a maximum width of 1600px.
- **Data Density:** In student lists and finance tables, vertical padding is reduced to `sm` (8px) to allow more rows per screen. 
- **Mobile:** Margins are set to 16px to maximize screen real estate for data entry.
- **Containers:** Content is grouped in cards with `lg` (24px) internal padding for standard views, and `md` (16px) for data-heavy views.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and subtle **Ambient Shadows**. 

1.  **Level 0 (Background):** Soft Gray (#F8FAFC). No shadow.
2.  **Level 1 (Cards/Surface):** Pure White (#FFFFFF). 1px border (#E2E8F0) and a very soft, diffused shadow (0px 4px 6px -1px rgba(0, 0, 0, 0.05)).
3.  **Level 2 (Modals/Dropdowns):** Pure White. 1px border. Deep shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.1)) to indicate physical separation.

Floating Action Buttons (FABs) or primary action triggers use a slight Emerald Green glow-tinted shadow to emphasize their importance.

## Shapes

The shape language is modern and approachable. 
- **Cards & Modules:** Use a consistent 12px or 16px corner radius (`rounded-lg` or `rounded-xl`).
- **Input Fields:** 8px radius (`rounded-md`) to maintain a clean, professional appearance.
- **Pills & Badges:** Full-round (pill-shaped) for status indicators and role badges to contrast against the more geometric card structures.
- **Data Tables:** Outer containers should match the card radius (12px), but internal row hover states are sharp or have a 4px radius.

## Components

### Role Badges
- **Admin:** Deep Navy background, white text.
- **Teacher:** Emerald Green tint background, Emerald Green text.
- **Accountant:** Amber tint background, Amber text.
- **Parent/Student:** Light Gray background, Deep Navy text.

### Sync Status Pills
Located in the top-right header or sidebar footer:
- **Online:** Emerald dot + "Online" text.
- **Offline:** Rose dot + "Working Offline" text.
- **Syncing:** Amber spinning icon + "Syncing..." text.
- **Synced:** Emerald checkmark + "Last synced: 2m ago" text.

### Data Tables
High-contrast styling. Headers use `label-sm` with a light gray background (#F1F5F9). Rows utilize a subtle hover effect (#F8FAFC). All GHS currency columns must be right-aligned using the `mono-data` font.

### Buttons
- **Primary:** Deep Navy background, Geist semi-bold text. 
- **Secondary:** White background, 1px border (#E2E8F0), Navy text.
- **Tertiary/Ghost:** No background, Emerald Green text (for "Add New" or "Export").

### Input Fields
Clean, 1px borders. Focused state uses an Emerald Green 2px ring. Labels are `label-sm` positioned above the input field. Error states use Rose (#E11D48) for both border and helper text.