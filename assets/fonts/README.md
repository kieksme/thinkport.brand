# Brand Fonts

This directory contains the official Thinkport GmbH brand fonts and typography assets.

**Note**: Assets are distributed as ZIP archives only. Individual font files are not available for download. Download the complete font assets as part of the [latest release ZIP](https://github.com/kieksme/thinkport.brand/releases).

## Directory Structure

```plaintext
assets/fonts/
├── README.md           # This file
├── tailwind.config.js  # Tailwind CSS theme configuration for fonts
├── [font-family]/      # Font family directories (e.g., "inter", "roboto")
│   ├── [weight]/       # Font weight directories (e.g., "400", "700")
│   │   ├── [style]/    # Font style files (e.g., "regular.woff2", "italic.woff2")
│   │   └── ...
│   └── ...
└── fonts.css           # CSS @font-face declarations (to be created)
```

### Primary Brand Font (Hausschrift)

**Montserrat** is the official brand font (Hausschrift) for Thinkport GmbH. It is used on the main website (thinkport.digital) and in official brand materials.

- **Font Family**: Montserrat
- **Usage**: Headings, UI elements, CTAs, and brand-specific typography
- **Style**: Sans-serif
- **Source**: [Google Fonts](https://fonts.google.com/specimen/Montserrat)
- **License**: SIL Open Font License 1.1 (OFL)
- **License URL**: [Montserrat License](https://fonts.google.com/specimen/Montserrat/license)

### Implementation Fonts (this repository)

The following fonts are used by **generators and generated assets** in this repository (social previews, README headers, Open Graph banners, portfolio PDFs, business card generator). They are not the primary brand font; Montserrat is.

**Hanken Grotesk** – used for headings in generated assets:

- **Font Family**: Hanken Grotesk
- **Usage**: Headings in generated images/PDFs (e.g. social preview, README header, iOS poster job title)
- **Source**: [Google Fonts](https://fonts.google.com/specimen/Hanken+Grotesk)
- **License**: SIL Open Font License 1.1 (OFL)

**Source Sans 3** – used for body text in generated assets:

- **Font Family**: Source Sans 3
- **Usage**: Body text in generated assets (e.g. social preview, README header, portfolio PDF)
- **Source**: [Google Fonts](https://fonts.google.com/specimen/Source+Sans+3)
- **License**: SIL Open Font License 1.1 (OFL)

### Font Organization

Fonts should be organized by:

1. **Font Family** - Each font family gets its own directory
2. **Font Weight** - Subdirectories for different weights (100, 200, 300, 400, 500, 600, 700, 800, 900)
3. **Font Style** - Individual font files for regular, italic, etc.

### Example Structure

```plaintext
assets/fonts/
├── hanken-grotesk/
│   ├── 400/
│   │   ├── regular.woff2
│   │   └── italic.woff2
│   ├── 500/
│   │   └── regular.woff2
│   └── 700/
│       └── regular.woff2
└── source-sans-3/
    ├── 400/
    │   ├── regular.woff2
    │   └── italic.woff2
    └── 600/
        └── regular.woff2
```

## Supported Font Formats

For optimal browser support, fonts should be provided in the following formats (in order of preference):

1. **WOFF2** - Modern, compressed format with best compression (recommended)
2. **WOFF** - Fallback for older browsers
3. **TTF/OTF** - Source formats (required for **PDF generation**, e.g. business card generator; can be converted to web formats)

## PDF Generation (Business Cards)

The business card generator (`scripts/generate-card.mjs`) embeds custom fonts only if **TTF or OTF** files are present. It looks for:

- `hanken-grotesk/500/regular.ttf` (or `.otf`), optionally `italic`
- `source-sans-3/400/regular.ttf` (or `.otf`), optionally `italic`

WOFF2 is not supported by pdf-lib. If these files are missing, the generator falls back to Helvetica.

**Getting the fonts:** You can download TTF from the [Google Fonts GitHub](https://github.com/google/fonts) repo (OFL license) and place them in the structure above. For example:

- Hanken Grotesk: `ofl/hankengrotesk/HankenGrotesk[wght].ttf` → `hanken-grotesk/500/regular.ttf`, `HankenGrotesk-Italic[wght].ttf` → `italic.ttf`
- Source Sans 3: `ofl/sourcesans3/SourceSans3[wght].ttf` → `source-sans-3/400/regular.ttf`, `SourceSans3-Italic[wght].ttf` → `italic.ttf`

These are variable fonts; if the generator reports "Unknown font format", try static TTF builds from [Google Fonts](https://fonts.google.com) (download and extract the TTF files into the same folder structure).

## Usage

### For Developers

For **official brand projects** (e.g. websites, apps), use **Montserrat** as the primary font (e.g. from Google Fonts or self-hosted). The examples below reference the **implementation fonts** (Hanken Grotesk, Source Sans 3) used by this repo’s generators; directory layout and script behaviour remain unchanged.

**CSS Example** (using fonts.css):

```css
@import './fonts.css';

body {
  font-family: var(--font-body), sans-serif; /* Source Sans 3 */
  font-weight: 400;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-primary), sans-serif; /* Hanken Grotesk */
}
```

**Direct @font-face Declaration**:

```css
/* Primary Brand Font - Hanken Grotesk */
@font-face {
  font-family: 'Hanken Grotesk';
  src: url('./hanken-grotesk/400/regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Hanken Grotesk';
  src: url('./hanken-grotesk/400/italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

/* Body Text Font - Source Sans 3 */
@font-face {
  font-family: 'Source Sans 3';
  src: url('./source-sans-3/400/regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Source Sans 3';
  src: url('./source-sans-3/400/italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
```

**JavaScript/TypeScript Example**:

```javascript
// Load fonts dynamically
const hankenGrotesk = new FontFace('Hanken Grotesk', 'url(./hanken-grotesk/400/regular.woff2)');
const sourceSans3 = new FontFace('Source Sans 3', 'url(./source-sans-3/400/regular.woff2)');

await Promise.all([hankenGrotesk.load(), sourceSans3.load()]);
document.fonts.add(hankenGrotesk);
document.fonts.add(sourceSans3);
```

**Tailwind CSS Example**:

```javascript
// In your tailwind.config.js
const fontsConfig = require('./assets/fonts/tailwind.config.js');

module.exports = {
  ...fontsConfig,
  // Your other Tailwind config
};
```

Or import just the font configuration:

```javascript
// In your tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: require('./assets/fonts/tailwind.config.js').theme.extend.fontFamily,
      fontWeight: require('./assets/fonts/tailwind.config.js').theme.extend.fontWeight,
      fontSize: require('./assets/fonts/tailwind.config.js').theme.extend.fontSize,
    },
  },
};
```

**Usage in HTML/Tailwind classes**:

```html
<!-- Font families -->
<h1 class="font-heading">Heading with Hanken Grotesk</h1>
<p class="font-body">Body text with Source Sans 3</p>
<div class="font-hanken-grotesk">Direct font family usage</div>
<div class="font-source-sans-3">Direct font family usage</div>

<!-- Font weights -->
<div class="font-heading-light">Light heading (300)</div>
<div class="font-heading-regular">Regular heading (400)</div>
<div class="font-heading-medium">Medium heading (500)</div>
<div class="font-heading-bold">Bold heading (700)</div>

<div class="font-body-regular">Regular body (400)</div>
<div class="font-body-semibold">Semibold body (600)</div>

<!-- Type scale (Desktop) -->
<h1 class="text-h1-desktop">H1 Desktop (48px, Bold)</h1>
<h2 class="text-h2-desktop">H2 Desktop (40px, Bold)</h2>
<h3 class="text-h3-desktop">H3 Desktop (32px, Medium)</h3>
<p class="text-body-desktop">Body Desktop (16px, Regular)</p>
<p class="text-body-large-desktop">Body Large Desktop (18px, Regular)</p>
<p class="text-body-small-desktop">Body Small Desktop (14px, Regular)</p>
<span class="text-caption-desktop">Caption Desktop (12px, Regular)</span>

<!-- Type scale (Mobile) -->
<h1 class="text-h1-mobile">H1 Mobile (36px, Bold)</h1>
<h2 class="text-h2-mobile">H2 Mobile (32px, Bold)</h2>
<h3 class="text-h3-mobile">H3 Mobile (28px, Medium)</h3>
<p class="text-body-mobile">Body Mobile (16px, Regular)</p>
<p class="text-body-small-mobile">Body Small Mobile (14px, Regular)</p>
<span class="text-caption-mobile">Caption Mobile (12px, Regular)</span>
```

### For Designers

- Use font files from this directory in design applications
- Ensure font licensing allows web usage
- Refer to Typography Guidelines for font pairing and usage recommendations

## Font Specifications

Brand fonts should be documented with:

- **Font Family Name** - Official name of the font
- **Font Weights** - Available weights (100-900)
- **Font Styles** - Available styles (regular, italic, etc.)
- **File Formats** - Available formats (WOFF2, WOFF, TTF, OTF)
- **License** - Font license information (see [FONT_LICENSES.md](../../FONT_LICENSES.md) for details)
- **Source** - Where the font was obtained (Google Fonts, Adobe Fonts, custom, etc.)

## Font Usage Guidelines

- **Primary Brand Font (Montserrat)** – Use for official brand materials, the website (thinkport.digital), headings, and CTAs.
- **Implementation Fonts (Hanken Grotesk, Source Sans 3)** – Used by this repo’s generators; when creating new brand materials, prefer Montserrat.
- **Monospace Font** – For code blocks and technical content (to be defined)
- **Accessibility** – Ensure fonts meet readability requirements (minimum 16px for body text)

## Adding New Fonts

When adding new fonts to the brand assets:

1. Create a directory structure: `[font-family]/[weight]/[style].woff2`
2. Add font files in WOFF2 format (preferred) or other web formats
3. Update `fonts.css` with @font-face declarations
4. Document the font family, weights, and styles in this README
5. Ensure proper licensing for web usage
6. Test font loading and fallbacks
7. Update Typography Guidelines documentation

### Font File Naming Convention

- Use lowercase with hyphens: `font-family-weight-style.woff2`
- Examples:
  - `hanken-grotesk-400-regular.woff2`
  - `hanken-grotesk-400-italic.woff2`
  - `hanken-grotesk-700-regular.woff2`
  - `source-sans-3-400-regular.woff2`
  - `source-sans-3-400-italic.woff2`
  - `source-sans-3-600-regular.woff2`

## Performance Considerations

- **Preload critical fonts**: Use `<link rel="preload">` for above-the-fold fonts
- **Font-display**: Use `font-display: swap` to prevent invisible text during font load
- **Subset fonts**: Only include characters needed for your language/locale
- **Limit font families**: Use 2-3 font families maximum to reduce page weight

## Browser Support

- **WOFF2**: Supported in all modern browsers (Chrome 36+, Firefox 39+, Safari 10+, Edge 14+)
- **WOFF**: Fallback for older browsers (IE 9+, Chrome 5+, Firefox 3.6+)
- **TTF/OTF**: Fallback for very old browsers (not recommended for production)

---

## Font Licenses

For detailed license information for all fonts used in this project, see [FONT_LICENSES.md](../../FONT_LICENSES.md).

---

*For detailed typography guidelines, see [TYPOGRAPHY.md](../guidelines/TYPOGRAPHY.md)*
