---
name: ScholarSphere Settings & Support
colors:
  surface: '#f9f9fe'
  surface-dim: '#d9dade'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f8'
  surface-container: '#ededf2'
  surface-container-high: '#e7e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#464555'
  inverse-surface: '#2e3034'
  inverse-on-surface: '#f0f0f5'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4e41e8'
  primary: '#4131dc'
  on-primary: '#ffffff'
  primary-container: '#5b50f5'
  on-primary-container: '#edeaff'
  inverse-primary: '#c3c0ff'
  secondary: '#5d5e67'
  on-secondary: '#ffffff'
  secondary-container: '#e2e1ec'
  on-secondary-container: '#63646d'
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
  secondary-fixed: '#e2e1ec'
  secondary-fixed-dim: '#c6c5d0'
  on-secondary-fixed: '#1a1b23'
  on-secondary-fixed-variant: '#45464f'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb692'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#793000'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  section-header:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
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
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 20px
---

## Brand & Style
This design system is built for a high-performance educational administrative environment. The aesthetic combines **Corporate Modernism** with a **Minimalist** lean, prioritizing clarity, authority, and efficiency. 

The target audience consists of school administrators and faculty who require a tool that feels reliable and professional. The emotional response should be one of "structured calm"—reducing the cognitive load of complex data through precise alignment, generous whitespace, and a restrained color palette. The UI leverages a mobile-first approach, ensuring that critical settings and support features are accessible under high-pressure, on-the-go scenarios.

## Colors
The color strategy employs a "High-End Utility" logic. 

- **Primary Accent:** Used for call-to-action buttons, active states, and critical branding moments.
- **Surface & Background:** A layered approach using `White` for interactive cards and `Very Light Neutral` for the base canvas to create subtle depth without heavy shadows.
- **Muted Tones:** `Light Gray` is strictly for structural borders, while `Gray` is reserved for secondary information and metadata.
- **Semantic Colors:** Green, Amber, and Red are used sparingly for status indicators (Success, Warning, Error) to ensure they retain their psychological urgency.

## Typography
The system uses **Inter** exclusively to maintain a systematic, utilitarian feel. 

- **Headlines:** Must be bold and compact. Use `headline-lg` for primary page titles and `headline-md` for sub-sections within a view.
- **Section Headers:** Placed above list groups, these should use `section-header` styling with the `text_muted` color to provide clear visual anchors.
- **Body Text:** Uses a medium weight (`500`) by default to ensure legibility on mobile screens against white backgrounds.
- **Labels:** Small, uppercase, and muted. These are primarily for secondary metadata or "Overline" text above titles.

## Layout & Spacing
The design system follows a strict **8px square grid**. 

- **Grid Model:** Mobile layouts use a fluid single-column system with `20px` side margins to ensure content doesn't feel cramped on the iPhone 14 Pro's display.
- **Vertical Rhythm:** Elements are separated by increments of 8px. Use `16px` (md) for standard spacing between related items and `32px` (xl) to separate distinct functional blocks.
- **Touch Targets:** All interactive rows and buttons must maintain a minimum height of `48px` to ensure accessibility, even if the visual element (like a toggle) is smaller.

## Elevation & Depth
This system avoids heavy drop shadows in favor of **Tonal Layering** and **Soft Elevation**.

- **Level 0 (Background):** `#FAFAFF` - The base layer.
- **Level 1 (Cards/Rows):** `#FFFFFF` - Used for the main content containers.
- **Shadows:** Only used on Level 1 elements to provide a subtle "lift." Shadows should be highly diffused: `0px 2px 8px rgba(91, 80, 245, 0.05)`. Note the slight indigo tint in the shadow to harmonize with the primary accent.
- **Borders:** All cards and list items use a `1px` solid border (`#E4E4EC`) to maintain structural integrity in high-density views.

## Shapes
The shape language is precise and disciplined. 

- **Corner Radius:** A maximum radius of `4px` is applied to all cards, buttons, and input fields. This "Soft" (Level 1) approach maintains a professional, serious tone while avoiding the aggressive feel of sharp 90-degree corners.
- **Pills:** Status indicators (Status Pills) may use a fully rounded (pill-shaped) radius to distinguish them from interactive buttons.

## Components
Consistent implementation of these components ensures a predictable user experience:

- **Compact List Rows:** Height of 56px. Features a 24px icon (Primary Color), a label (Body-MD), and a trailing chevron or toggle. Separated by a 1px divider that insets 56px from the left to align with text.
- **Interactive Toggles:** Use the Primary Accent (#5B50F5) for the 'On' state. The track should be slim with a high-contrast white thumb.
- **Status Pills:** Small, non-interactive badges using 10% opacity of the semantic color for the background and 100% opacity for the text (e.g., Success Pill: #10B981 at 10% background).
- **Input Fields:** 48px height, 4px border radius, with a 1px border (#E4E4EC). Focused state uses a 2px border of the Primary Accent.
- **Primary Buttons:** Bold Inter text, Primary Accent background, white text. No gradient.
- **App Bar:** Fixed at the top, 56px height, White background with a subtle bottom border. Features a back arrow (Left) and the Page Title (Center or Left-aligned based on platform convention).