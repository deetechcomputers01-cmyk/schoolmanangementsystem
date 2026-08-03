---
name: Institutional Clarity
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#464555'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4e41e8'
  primary: '#4131dc'
  on-primary: '#ffffff'
  primary-container: '#5b50f5'
  on-primary-container: '#edeaff'
  inverse-primary: '#c3c0ff'
  secondary: '#5d5e65'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2ea'
  on-secondary-container: '#63646b'
  tertiary: '#8c3900'
  on-tertiary: '#ffffff'
  tertiary-container: '#b34b00'
  on-tertiary-container: '#ffe8de'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#341dd1'
  secondary-fixed: '#e2e2ea'
  secondary-fixed-dim: '#c5c6ce'
  on-secondary-fixed: '#191b21'
  on-secondary-fixed-variant: '#45464d'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb692'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#793000'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
  border-base: '#E4E4EC'
  status-healthy: '#10B981'
  status-degraded: '#F59E0B'
  status-critical: '#F43F5E'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-margin: 24px
  gutter: 16px
  section-gap: 48px
---

## Brand & Style
The design system is centered on the concept of "Institutional Clarity." It is designed to evoke a sense of absolute reliability, systematic organization, and professional transparency. The target audience includes administrators, educators, and technical stakeholders who require high-density information presented without visual noise.

The style is **Corporate / Modern**, leaning towards a high-utility, utilitarian aesthetic. It prioritizes crisp edges, generous white space (utilizing the #FFFFFF background as a functional canvas), and a highly disciplined use of color to signal system status rather than for mere decoration.

## Colors
The palette is anchored by a #FFFFFF background to ensure maximum legibility and a clean, "scholarly" feel. 

- **Primary Indigo (#5B50F5):** Used for primary actions, active navigation states, and key interactive landmarks.
- **Surface & Border (#E4E4EC):** This neutral serves as the primary structural color, defining container boundaries and table rows without creating heavy visual breaks.
- **Semantic Indicators:**
    - **Emerald (Healthy):** Used for positive system states and successful operations.
    - **Amber (Degraded):** Used for warnings, maintenance modes, or performance latency.
    - **Rose (Critical):** Used for errors, data loss risks, or system failures.

## Typography
This design system utilizes **Inter** exclusively to achieve a systematic and functional feel. The typeface is chosen for its exceptional legibility in data-heavy environments.

Headlines should utilize tighter letter spacing and heavier weights to provide a strong visual anchor. Body text maintains a standard tracking to ensure long-form readability. Labels (especially `label-sm`) may use uppercase styling with slight letter spacing when used for metadata or table headers to differentiate them from interactive body text.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop (centered 12-column grid, 1200px max-width) and a **Fluid Grid** on mobile devices. 

A strict 4px base unit governs all spatial relationships. 
- **Margins:** 24px (6 units) for mobile edges; 48px+ for desktop.
- **Gutters:** 16px (4 units) between columns.
- **Component Padding:** Internal padding for inputs and buttons should be 8px vertical and 16px horizontal to maintain a balanced, professional "airiness" within functional elements.

## Elevation & Depth
In keeping with the "Institutional Clarity" theme, this design system avoids heavy shadows and complex gradients. Depth is communicated through:

- **Tonal Layers:** Using light gray backgrounds (#F9FAFB) for page headers or sidebars to separate them from the main #FFFFFF content area.
- **Low-Contrast Outlines:** Containers and cards are defined by 1px borders using #E4E4EC.
- **Functional Elevation:** Only use a subtle, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) for floating elements like dropdown menus or active modals to suggest they sit above the primary interface plane.

## Shapes
The shape language is precise and conservative. A **4px (0.25rem)** corner radius is applied globally to buttons, input fields, and cards. This small radius softens the "brutal" feel of sharp corners while maintaining a rigid, disciplined structure appropriate for an institutional setting. Status indicators and chips may use a slightly more rounded "pill" shape only when they need to be clearly distinguished as non-interactive metadata.

## Components
- **Buttons:** Primary buttons use the #5B50F5 background with white text. Secondary buttons use a #E4E4EC border with the primary color for text.
- **Input Fields:** 1px border (#E4E4EC), 4px radius, and Inter Body-md text. Active states should use a 1px #5B50F5 border.
- **Health Indicators:** Small circular dots or subtle badges using the semantic status colors (Emerald, Amber, Rose) accompanied by `label-sm` text.
- **Cards:** White background, #E4E4EC border, 4px corner radius. No shadow by default.
- **Lists/Tables:** Use horizontal dividers in #E4E4EC. Alternate row striping is discouraged; instead, use hover states with a very light tint (#F9FAFB) to highlight the current row.