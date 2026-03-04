# Brand Colors

This directory contains the official Thinkport GmbH brand color palette, including developer files and visual swatches.

**Note**: Assets are distributed as ZIP archives only. Individual files are not available for download. Download the complete color assets as part of the [latest release ZIP](https://github.com/kieksme/kieks.me.cicd/releases).

## Available Files

| File Name              | Format | Description                                                  | Download                                                                                        |
|------------------------|--------|--------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `colors.css`           | CSS    | CSS variables for web projects                               | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/colors.css)             |
| `colors.json`          | JSON   | HEX, RGB, and CMYK values for JavaScript/TypeScript projects | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/colors.json)            |
| `tailwind.config.js`   | JS     | Tailwind CSS theme configuration for colors                 | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/tailwind.config.js)     |

### Color Swatches

| File Name                   | Format | Color                  | Download                                                                                              |
|-----------------------------|--------|------------------------|--------------------------------------------------------------------------------------------------------|
| `swatches/dark-blue.svg`    | SVG    | Dark Blue (#0B2649)    | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/dark-blue.svg)       |
| `swatches/orange.svg`       | SVG    | Orange (#FF5722)       | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/orange.svg)          |
| `swatches/turquoise.svg`    | SVG    | Turquoise (#00BCD4)    | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/turquoise.svg)        |
| `swatches/white.svg`        | SVG    | White (#FFFFFF)        | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/white.svg)            |
| `swatches/dark-gray.svg`    | SVG    | Dark Gray (#333333)    | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/dark-gray.svg)        |

## Primary Brand Colors

The Thinkport brand uses three primary colors for a consistent visual identity: Dark Blue, Orange, and Turquoise (with Pantone 533 C, 1505 C, 319 C for print).

### Primary Colors

| Color    | Hex       | RGB                | Description                          |
|----------|-----------|--------------------|--------------------------------------|
| Dark Blue | `#0B2649` | `rgb(11, 38, 73)`  | Primary dark; trust, professionalism |
| Orange   | `#FF5722` | `rgb(255, 87, 34)` | Accent; energy, call-to-action       |
| Turquoise | `#00BCD4` | `rgb(0, 188, 212)` | Accent; clarity, innovation         |

**JSON keys** (in `colors.json`): `selection.darkBlue`, `selection.orange`, `selection.turquoise` (each with `hex`, `rgb`, `pantone`, `usage`, `shades`). The `primary` object is set to Dark Blue (#0B2649). Legacy keys `selection.aqua`, `selection.navy`, `selection.fuchsia` remain for backwards compatibility. For Tailwind, extend your theme with e.g. `darkBlue: '#0B2649'`, `orange: '#FF5722'`, `turquoise: '#00BCD4'` when consuming this palette.

### Text Colors

| Color                                          | Hex       | RGB                  | Usage                          |
|------------------------------------------------|-----------|----------------------|--------------------------------|
| ![White](swatches/white.svg) White             | `#FFFFFF` | `rgb(255, 255, 255)` | Text color on white background |
| ![Dark Gray](swatches/dark-gray.svg) Dark Gray | `#333333` | `rgb(51, 51, 51)`    | Text color on white background |

## Usage

### For Developers

**CSS Example**:

```css
@import './colors.css';

.button {
  background-color: var(--color-primary);
  color: var(--color-secondary);
}
```

**JavaScript/TypeScript Example**:

```javascript
import colors from './colors.json';

const primaryColor = colors.primary.hex;
```

**Tailwind CSS Example**:

```javascript
// In your tailwind.config.js
const colorsConfig = require('./assets/colors/tailwind.config.js');

module.exports = {
  ...colorsConfig,
  // Your other Tailwind config
};
```

Or import just the colors:

```javascript
// In your tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: require('./assets/colors/tailwind.config.js').theme.extend.colors,
    },
  },
};
```

**Usage in HTML/Tailwind classes** (use primary brand color utilities when available):

```html
<!-- Primary brand colors (Dark Blue, Orange, Turquoise) -->
<div class="bg-primary text-secondary">Primary background</div>
<div class="bg-secondary text-primary">Secondary background</div>

<!-- Inline HEX when custom utilities are not yet configured -->
<div style="background-color: #0B2649; color: white;">Dark Blue background</div>
<div style="background-color: #FF5722; color: white;">Orange accent</div>
<div style="background-color: #00BCD4; color: white;">Turquoise accent</div>

<!-- Neutral colors -->
<div class="text-gray-dark">Dark gray text</div>
<div class="text-gray-medium">Medium gray text</div>
<div class="bg-gray-light">Light gray background</div>
```

### For Designers

- Use the SVG swatches in `swatches/` directory for visual reference
- Import `.ase` (Adobe Swatch Exchange) files into Adobe Creative Cloud applications when available
- Refer to the Color Palette Guidelines for complete specifications

## Color Specifications

Brand colors are documented with:

- **Hex values** – For digital/web use (#0B2649, #FF5722, #00BCD4)
- **RGB values** – For digital displays
- **Pantone codes** – For print/screen printing (533 C, 1505 C, 319 C)
- **CMYK** – Use Pantone solid coated or convert as needed for print

## Color Usage

- **Primary colors** – Dark Blue, Orange, Turquoise for major elements and accents
- **Text colors** – White on dark backgrounds; dark gray on light backgrounds
- **Accessibility** – Ensure color combinations meet WCAG contrast requirements

## Adding New Colors

When adding new colors to the palette:

1. Update the color definition files (CSS, JSON)
2. Add SVG swatch to `swatches/` directory
3. Ensure the color meets accessibility contrast requirements
4. Update the Color Palette Guidelines documentation
5. Generate new palette reference images if needed

**Note**: SCSS files are no longer maintained. Use CSS variables or JSON for your projects.

---

*For detailed color usage guidelines, see [COLOR_PALETTE.md](../guidelines/COLOR_PALETTE.md)*
