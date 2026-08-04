---
name: ScholarSphere
colors:
  surface: '#f5faff'
  surface-dim: '#d2dbe4'
  surface-bright: '#f5faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ebf5fd'
  surface-container: '#e6eff8'
  surface-container-high: '#e0e9f2'
  surface-container-highest: '#dae4ec'
  on-surface: '#141d23'
  on-surface-variant: '#41484b'
  inverse-surface: '#293238'
  inverse-on-surface: '#e9f2fa'
  outline: '#71787c'
  outline-variant: '#c1c7cb'
  surface-tint: '#3d6473'
  primary: '#001f29'
  on-primary: '#ffffff'
  primary-container: '#073543'
  on-primary-container: '#779eaf'
  inverse-primary: '#a5ccde'
  secondary: '#486647'
  on-secondary: '#ffffff'
  secondary-container: '#c9ecc5'
  on-secondary-container: '#4d6c4d'
  tertiary: '#2a1700'
  on-tertiary: '#ffffff'
  tertiary-container: '#472a00'
  on-tertiary-container: '#c88c3d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1e9fb'
  primary-fixed-dim: '#a5ccde'
  on-primary-fixed: '#001f29'
  on-primary-fixed-variant: '#244c5a'
  secondary-fixed: '#c9ecc5'
  secondary-fixed-dim: '#aecfaa'
  on-secondary-fixed: '#042109'
  on-secondary-fixed-variant: '#304d31'
  tertiary-fixed: '#ffddb7'
  tertiary-fixed-dim: '#fcba66'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f5faff'
  on-background: '#141d23'
  surface-variant: '#dae4ec'
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
  title-lg:
    fontFamily: Inter
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
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
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
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for the educational landscape of Ghana, balancing administrative authority with an approachable, modern interface. It targets school administrators, teachers, and staff who require a reliable, high-performance environment for managing complex data.

The aesthetic follows a **Corporate / Modern** style with subtle hints of **Minimalism**. It prioritizes clarity and efficiency through structured layouts and a restrained use of color. The emotional goal is to evoke feelings of competence, trust, and organized calm. The interface avoids unnecessary flair in favor of functional precision, utilizing clean lines and purposeful whitespace to reduce cognitive load during heavy data entry and student management tasks.

## Colors
The palette is rooted in a professional "Deep Teal," providing a sophisticated foundation that differentiates the system from generic blue enterprise tools. 

- **Primary (Deep Teal):** Used for core navigation, primary actions, and brand identification.
- **Secondary (Forest Green):** Reserved for success states and growth-related metrics.
- **Tertiary (Amber):** Used sparingly for highlights, warnings, or secondary focal points to create a warm contrast.
- **Functional Colors:** "Rose" is strictly for destructive actions and errors.
- **Neutrals:** "Shell" acts as the global background to soften the contrast against the "Surface White" containers, while "Ink" ensures high-legibility for all body text.

## Typography
This design system utilizes **Inter** across all levels to maintain a systematic and utilitarian feel. The typeface’s high x-height ensures excellent legibility for dense administrative tables and lists.

- **Headlines:** Use Semi-Bold (600) weights with tighter letter-spacing to create a strong visual anchor.
- **Body Text:** Standardized at 14px (md) and 16px (lg) for optimal reading comfort. 
- **Labels:** Small caps or increased letter spacing should be applied to metadata labels to distinguish them from interactive body text.
- **Hierarchy:** Maintain a clear vertical rhythm by using the defined line-heights, ensuring enough "breathing room" between paragraphs.

## Layout & Spacing
The layout follows a **Fluid Grid** logic with standardized gutters. 

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 24px gutters.
- **Mobile:** 4-column grid with 16px margins.

**Split-Screen Layout (Login/Onboarding):**
For authentication screens, the layout is divided into a 50/50 split on desktop. The left panel uses a solid "Deep Teal" background or a subtle brand pattern to establish presence. The right panel is centered, housing a "Surface White" login card with a maximum width of 400px. On mobile, the left panel is hidden or reduced to a top-aligned logo bar, and the login card expands to fill the width.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Ambient Shadows**. This design system avoids heavy drop shadows in favor of subtle, realistic depth to maintain a professional, flat appearance.

- **Level 0 (Background):** Shell (#F7F8F6), no shadow.
- **Level 1 (Cards/Containers):** Surface White with a 1px border (#D8DDD8) and a very soft, diffused shadow (0px 2px 4px rgba(20, 29, 35, 0.05)).
- **Level 2 (Dropdowns/Modals):** Surface White with a more pronounced shadow (0px 8px 16px rgba(20, 29, 35, 0.1)) to indicate a higher z-index above the main content.
- **Interactions:** Hover states on buttons should slightly deepen the shadow or shift the background color by 5-10% to provide tactile feedback.

## Shapes
The shape language is disciplined and professional. A standard **4px (Soft)** radius is applied to almost all UI elements, including buttons, input fields, and cards.

- **Standard Radius:** 4px for all primary components.
- **Large Radius:** 8px (rounded-lg) for main container cards or outer shells.
- **Full Radius:** Only used for circular avatars or status indicators (dots).

This consistent 4px radius maintains the "serious" feel of a school administration tool while feeling more modern and "finished" than sharp 0px corners.

## Components
- **Buttons:** Primary buttons use Deep Teal with white text and 4px corners. Secondary buttons use a transparent background with a Deep Teal border.
- **Input Fields:** Use a 1px Border (#D8DDD8) with 4px corners. Labels are placed above the field in Label-MD styling. Focus states use a 2px Deep Teal ring.
- **Cards:** White surfaces with a 1px border and Level 1 shadow. In the login split-screen, the card should be centered vertically and horizontally within its container.
- **Chips/Badges:** Small, 4px rounded indicators. Success states use Forest Green with white text; Warning uses Amber with white text.
- **Lists:** Clean rows separated by 1px horizontal lines (#D8DDD8), featuring 16px vertical padding for touch-target safety and readability.
- **Checkboxes/Radios:** Use Deep Teal for the selected state to maintain brand consistency.