---
name: Academic Logic
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2fe'
  surface-container: '#ededf9'
  surface-container-high: '#e8e7f3'
  surface-container-highest: '#e2e1ed'
  on-surface: '#1a1b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#7f2500'
  on-tertiary: '#ffffff'
  tertiary-container: '#a73400'
  on-tertiary-container: '#ffc9b7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59c'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832700'
  background: '#faf8ff'
  on-background: '#1a1b23'
  surface-variant: '#e2e1ed'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
---

## Brand & Style

The brand personality is authoritative yet accessible, designed to instill confidence in educational administrators managing complex data on the move. The design style follows a **Modern Corporate** aesthetic with a strong emphasis on clarity, information density, and functional elegance.

The UI evokes a sense of organized efficiency through a disciplined 8px grid, generous whitespace, and a high-contrast color palette. Visual interest is maintained through subtle depth and high-quality typography rather than decorative elements, ensuring the focus remains on student success metrics and administrative tasks.

## Colors

The palette is anchored by a deep **Primary Blue** for brand recognition and primary actions, complemented by an **Accent Teal** used for both secondary actions and positive status indicators. 

- **Neutral Foundations:** The background uses a cool-toned off-white to reduce glare, while the surface color provides a clean white canvas for content containers.
- **Semantic Logic:** Status colors are strictly enforced to provide immediate cognitive cues. Teal represents "Active" or "Healthy," Amber represents "Pending" or "Warning," Red indicates "Blocked," and Dark Red is reserved for "Critical" system failures or high-priority alerts.

## Typography

This design system utilizes **Inter** exclusively for its exceptional legibility and neutral, systematic appearance. 

- **Hierarchy:** 18px headlines serve as the primary structural markers for page sections. 14px is the standard body size for readability, while 12px labels are used for metadata and secondary data points.
- **Mobile Optimization:** Headlines are capped at 24px for high-level dashboards to ensure no word wrapping on small viewports. 
- **Formatting:** Use `600` weight for emphasis in data labels and `400` for general prose.

## Layout & Spacing

The system follows a strict **8px linear scale** for all spacing and layout decisions. This ensures vertical rhythm and consistent alignment across complex data views.

- **Grid:** A 4-column fluid grid is utilized for mobile devices with a fixed 16px outer margin.
- **Touch Targets:** All interactive elements maintain a minimum hit area of 44x44px.
- **Safe Areas:** Implement standard OS-level safe areas for bottom navigation and top status bars to prevent content clipping on notched devices.

## Elevation & Depth

Depth is used sparingly to differentiate between the background canvas and interactive content containers.

- **Level 0 (Background):** Solid `#F8FAFC`, no shadow.
- **Level 1 (Cards/Surfaces):** White background with a soft, diffused shadow: `0px 2px 4px rgba(15, 23, 42, 0.05), 0px 1px 2px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Active/Floating):** Used for modals and floating action buttons. A more pronounced shadow to indicate higher Z-index: `0px 10px 15px -3px rgba(15, 23, 42, 0.1)`.
- **Dividers:** Use 1px borders in `#E2E8F0` for internal content separation within a single elevation level.

## Shapes

The shape language is "Soft-Modern," utilizing a generous corner radius to balance the professional nature of the app with a friendly, modern educational feel.

- **Major Elements:** Cards, modals, and primary containers use a **16px (rounded-lg)** radius.
- **Small Elements:** Buttons, input fields, and tags use an **8px (base)** radius.
- **Icons:** Use rounded caps and joins to match the UI's geometry.

## Components

### Buttons
- **Primary:** Solid `#1D4ED8` with white text. 8px border radius.
- **Secondary:** Outline `#1D4ED8` with a 1px stroke.
- **Status-Specific:** Small ghost buttons using semantic colors for quick actions like "Approve" (Teal) or "Block" (Red).

### Cards
- Standard containers for student profiles or course data. Must use the 16px corner radius and Level 1 shadow. Padding is fixed at 16px (md).

### Input Fields
- Height of 48px for touch accessibility. White fill with `#E2E8F0` border. Active state switches border to Primary Blue with a 1px focus ring.

### Chips & Tags
- Used for status indicators (e.g., "Active"). Backgrounds should be 10% opacity of the semantic color with 100% opacity text for high legibility (e.g., Teal text on light teal background).

### Lists
- Use for student directories or logs. Minimum 56px row height. Use thin `#E2E8F0` bottom dividers and 16px horizontal padding.

### Progress Bars
- 8px height with a 4px radius. Uses Secondary Teal for completion and `#E2E8F0` for the track.