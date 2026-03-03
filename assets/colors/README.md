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

| File Name                | Format | Color               | Download                                                                                        |
|--------------------------|--------|---------------------|-------------------------------------------------------------------------------------------------|
| `swatches/aqua.svg`      | SVG    | Aqua (#00FFDC)      | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/aqua.svg)      |
| `swatches/navy.svg`      | SVG    | Navy (#1E2A45)      | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/navy.svg)      |
| `swatches/fuchsia.svg`   | SVG    | Fuchsia (#FF008F)   | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/fuchsia.svg)   |
| `swatches/white.svg`     | SVG    | White (#FFFFFF)     | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/white.svg)     |
| `swatches/dark-gray.svg` | SVG    | Dark Gray (#333333) | [View](https://github.com/kieksme/kieks.me.cicd/blob/main/assets/colors/swatches/dark-gray.svg) |

## Primary Brand Colors

### Selection Colors

| Color                                    | Hex       | RGB                | Description                           |
|------------------------------------------|-----------|--------------------|---------------------------------------|
| ![Aqua](swatches/aqua.svg) Aqua          | `#00FFDC` | `rgb(0, 255, 220)` | Bright turquoise/aqua selection color |
| ![Navy](swatches/navy.svg) Navy          | `#1E2A45` | `rgb(30, 42, 69)`  | Dark blue/navy selection color        |
| ![Fuchsia](swatches/fuchsia.svg) Fuchsia | `#FF008F` | `rgb(255, 0, 143)` | Vibrant pink/fuchsia selection color  |

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

**Usage in HTML/Tailwind classes**:

```html
<!-- Selection colors -->
<div class="bg-aqua text-white">Aqua background</div>
<div class="bg-aqua-medium text-white">Aqua medium background</div>
<div class="bg-aqua-dark text-white">Aqua dark background</div>

<div class="bg-navy text-white">Navy background</div>
<div class="bg-navy-medium text-white">Navy medium background</div>
<div class="bg-navy-light text-white">Navy light background</div>

<div class="bg-fuchsia text-white">Fuchsia background</div>
<div class="bg-fuchsia-medium text-white">Fuchsia medium background</div>
<div class="bg-fuchsia-light text-white">Fuchsia light background</div>

<!-- Primary brand colors -->
<div class="bg-primary text-secondary">Primary background</div>
<div class="bg-secondary text-primary">Secondary background</div>

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

Brand colors should be documented with:

- **Hex values** - For digital/web use
- **RGB values** - For digital displays
- **CMYK values** - For print materials (to be added)
- **Pantone codes** - For professional printing (to be added)

## Color Usage

- **Primary colors** - Main brand colors for major elements (Selection colors)
- **Text colors** - Colors for text on white backgrounds
- **Accessibility** - Ensure color combinations meet WCAG contrast requirements

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
