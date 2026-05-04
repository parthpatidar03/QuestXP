# Design

## Style

QuestXP uses a restrained professional product interface. The visual scene is a learner working at a desk in normal daylight, switching between focused study and progress review. The UI should feel calm, legible, and operational.

## Color

Use warm tinted neutrals and one restrained primary accent.

```css
:root {
  --color-bg: oklch(0.975 0.006 88);
  --color-surface: oklch(0.995 0.004 88);
  --color-surface-2: oklch(0.955 0.006 88);
  --color-surface-3: oklch(0.925 0.007 88);
  --color-border: oklch(0.86 0.008 88);
  --color-primary: oklch(0.47 0.095 155);
  --color-primary-hover: oklch(0.41 0.095 155);
  --color-gold: oklch(0.68 0.13 78);
  --color-success: oklch(0.54 0.11 155);
  --color-warning: oklch(0.71 0.14 70);
  --color-danger: oklch(0.56 0.18 28);
  --color-text-primary: oklch(0.23 0.018 88);
  --color-text-secondary: oklch(0.43 0.018 88);
  --color-text-muted: oklch(0.60 0.014 88);
}
```

## Typography

Use system UI fonts for product credibility and readability.

- Body: `Inter`, `ui-sans-serif`, `system-ui`, `Segoe UI`, `Arial`
- Data and compact labels: same family
- Avoid display fonts for core app screens
- Use clear weight contrast instead of oversized headings

## Components

- Cards: white or near-white surfaces, 1px neutral border, 8px radius
- Buttons: solid green primary, quiet neutral secondary
- Inputs: neutral surface, clear border, green focus ring
- Progress: green for course progress, amber for XP
- Empty states: direct and useful, no theatrical copy

## Layout

Authenticated surfaces use a predictable top navigation and max-width content area. Dashboards should be scan-friendly: stats first, primary action visible, courses below, secondary panels off to the side on wide screens.

## Motion

Use short 150-220ms transitions for hover and state changes. Avoid decorative floating elements on product screens.
