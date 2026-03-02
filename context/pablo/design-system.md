---
summary: Payoneer brand design system — full color palette, typography scale, spacing grid, CSS tokens, component patterns, accessibility rules
topics: [brand, design, ui, css]
agents: [analytics, hub-countries-pm]
source: Adapted from Pablo Battro's payoneer-cursor-skills (2026-Q1)
---

# Payoneer Design System

> Brand identity, design tokens, and UI patterns.
> For docx document styling, see `lib/doc-style.ts` (uses Avenir Next LT Pro + Payoneer midnight blue).
> This file covers the **web/digital** design system.

---

## Color Palette

### Primary

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Payoneer Orange | `#FF6B00` | 255, 107, 0 | Primary CTAs, brand accent, key highlights |
| Deep Navy | `#1A1A2E` | 26, 26, 46 | Primary text, headers, dark backgrounds |
| Midnight Blue | `#002373` | 0, 35, 115 | Document headers, formal contexts (used in docx) |
| White | `#FFFFFF` | 255, 255, 255 | Backgrounds, cards, clean space |

### Secondary

| Name | Hex | Usage |
|------|-----|-------|
| Light Gray | `#F5F5F7` | Section backgrounds, dividers |
| Medium Gray | `#6B7280` | Secondary text, captions |
| Border Gray | `#E5E7EB` | Borders, subtle separators |
| Success Green | `#10B981` | Success states, positive indicators |
| Error Red | `#EF4444` | Error states, destructive actions |
| Warning Amber | `#F59E0B` | Warning states, attention needed |

### Brand Gradient

```css
background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%);
```

### Accessibility Warning

Orange text on white fails WCAG contrast. Use orange for backgrounds, borders, and CTAs only — never as text on white.

## Typography

### Font Stack

| Context | Font | Fallback |
|---------|------|----------|
| Web/digital | Inter | -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif |
| Documents (docx/pptx) | Avenir Next LT Pro | Arial |

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 / Hero | 48px (3rem) | 700 | 1.1 | -0.02em |
| H2 / Section | 36px (2.25rem) | 700 | 1.2 | -0.01em |
| H3 / Subsection | 24px (1.5rem) | 600 | 1.3 | 0 |
| H4 / Card Title | 20px (1.25rem) | 600 | 1.4 | 0 |
| Body | 16px (1rem) | 400 | 1.6 | 0 |
| Body Small | 14px (0.875rem) | 400 | 1.5 | 0 |
| Caption | 12px (0.75rem) | 400 | 1.4 | 0.01em |

## Spacing System (8px grid)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps (icon padding) |
| `--space-2` | 8px | Inline spacing |
| `--space-3` | 12px | Form field gaps |
| `--space-4` | 16px | Component internal padding |
| `--space-5` | 24px | Card padding, section gaps |
| `--space-6` | 32px | Between components |
| `--space-8` | 48px | Section padding |
| `--space-10` | 64px | Page section separation |
| `--space-12` | 80px | Hero section padding |

## CSS Variables Block

```css
:root {
  /* Colors */
  --color-primary: #FF6B00;
  --color-primary-hover: #E65E00;
  --color-primary-light: rgba(255, 107, 0, 0.08);
  --color-text: #1A1A2E;
  --color-text-secondary: #6B7280;
  --color-bg: #FFFFFF;
  --color-bg-subtle: #F5F5F7;
  --color-border: #E5E7EB;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --space-8: 48px; --space-10: 64px;

  /* Radius */
  --radius-sm: 4px;  --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}
```

## Component Patterns

### Buttons

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `#FF6B00` | white | none | `#E65E00` |
| Secondary | transparent | `#FF6B00` | 2px solid `#FF6B00` | light orange bg |
| Ghost | transparent | `#1A1A2E` | none | `#F5F5F7` bg |

All buttons: 600 weight, 16px, 12px 24px padding, 8px radius.

### Form Inputs

- Default: 1px `#E5E7EB` border, 8px radius, 12px 16px padding
- Focus: `#FF6B00` border + `0 0 0 3px rgba(255,107,0,0.12)` ring
- Error: `#EF4444` border + red ring

### Cards

- White bg, 1px `#E5E7EB` border, 12px radius, 24px padding
- Hover: elevate to `--shadow-md`

## Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| Mobile | < 640px | Phones |
| Tablet | 640–1024px | Tablets, small laptops |
| Desktop | > 1024px | Laptops, monitors |

## Do's and Don'ts

- Use orange sparingly — accent, not background color
- Maintain generous whitespace
- Stick to the 8px grid
- Ensure visible focus states on all interactive elements
- Don't use orange text on white (fails WCAG)
- Don't mix rounded and sharp corners in the same section
- Max 2 font weights per section
