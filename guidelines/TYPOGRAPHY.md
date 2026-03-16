# Typography Guidelines

## Type System

Typography is a key component of our visual identity. Consistent use of typefaces helps maintain brand recognition and readability.

### Primary brand typeface

**Montserrat** is the official brand typeface (Hausschrift) for Thinkport GmbH. It is used on the main website (thinkport.digital) and in official brand materials. Use Montserrat for headings and, where appropriate, body text in new designs and channels (weight 400/600, line height 1.4).

## Primary Typeface

### Brand font: Montserrat

**Montserrat** is the primary typeface for all headings and headlines in official brand materials.

```text
Font Family: Montserrat
Weights Available: Regular (400), Semi-Bold (600), Bold (700)
License: SIL Open Font License 1.1 (OFL)
License URL: https://fonts.google.com/specimen/Montserrat/license
```

**Usage**: Headlines, page titles, major headings, CTAs, and brand-specific typography

**Character Set**: Latin, Extended Latin

### Body font (brand context)

For body text in official materials, **Montserrat** (Regular 400) can be used, or a secondary body font as defined by the brand team. Line height 1.4–1.5 is recommended for readability.

## Implementation fonts (this repository)

Some scripts and generated assets in this repository use **Hanken Grotesk** (headings) and **Source Sans 3** (body) for technical reasons (e.g. social previews, README headers, Open Graph banners, portfolio PDFs). These are implementation details; new brand materials and external channels should follow **Montserrat** as the primary brand font.

- **Hanken Grotesk**: Used in generated assets (social preview images, README headers, OG banners, iOS poster job titles). Weights: Light (300), Regular (400), Medium (500), Bold (700).
- **Source Sans 3**: Used for body text in those same generated assets. Weights: Regular (400), Semi-Bold (600).

See [FONT_LICENSES.md](../FONT_LICENSES.md) for license information for all fonts.

## Type Scale

### Desktop/Web

```text
H1: 48px / 3rem (Bold)
H2: 40px / 2.5rem (Bold)
H3: 32px / 2rem (Medium)
H4: 24px / 1.5rem (Medium)
H5: 20px / 1.25rem (Medium)
H6: 16px / 1rem (Medium)

Body Large: 18px / 1.125rem (Regular)
Body: 16px / 1rem (Regular)
Body Small: 14px / 0.875rem (Regular)
Caption: 12px / 0.75rem (Regular)
```

### Mobile

```text
H1: 36px / 2.25rem (Bold)
H2: 32px / 2rem (Bold)
H3: 28px / 1.75rem (Medium)
H4: 20px / 1.25rem (Medium)
H5: 18px / 1.125rem (Medium)
H6: 16px / 1rem (Medium)

Body: 16px / 1rem (Regular)
Body Small: 14px / 0.875rem (Regular)
Caption: 12px / 0.75rem (Regular)
```‬‬

## Line Height

```plaintext
Headings: 1.2 - 1.3
Body Text: 1.5 - 1.6
Captions: 1.4
```

## Letter Spacing

```plaintext
Headings: -0.02em to 0em
Body Text: 0em (normal)
All Caps: 0.05em - 0.1em
```

## Fallback Fonts

### Web Fallback Stack

**Brand (Montserrat) – for official sites and new materials**:

```css
font-family: 'Montserrat', -apple-system, BlinkMacSystemFont,
             'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

**Implementation fonts** (used in this repo’s generators; fallback when using Hanken Grotesk or Source Sans 3):

```css
font-family: 'Hanken Grotesk', 'Source Sans 3', -apple-system, BlinkMacSystemFont,
             'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

## Usage Guidelines

### Headings

- Use heading hierarchy (H1 → H2 → H3, etc.) semantically
- H1 should appear once per page/document
- Don't skip heading levels
- Use bold weight for primary headings
- Keep headings concise and clear

### Body Text

- Use 16px as the base font size for readability
- Maintain comfortable line length (45-75 characters per line)
- Use proper line height for readability (1.5-1.6)
- Align text left for better readability (avoid justified text in digital)

### Emphasis

- **Bold**: Use for strong emphasis
- *Italic*: Use for subtle emphasis or citations
- Avoid underlining except for links
- Don't use all caps for large blocks of text

### Lists

- Use bulleted lists for unordered information
- Use numbered lists for sequential steps or rankings
- Maintain consistent spacing between list items

## Special Typography

### Quotes

```text
"Use proper quotation marks"
— Attribution (if applicable)
```

### Code

```text
Use monospace font for code snippets
Font: Monaco, 'Courier New', monospace
```

## Accessibility

- Minimum font size: 16px for body text
- Ensure sufficient color contrast (see Color Palette)
- Use relative units (rem, em) for better scaling
- Test readability with screen readers
- Maintain clear visual hierarchy

### Application to generated assets

Generated assets in this repository (social preview images, README headers, Open Graph banners, iOS posters, portfolio PDFs) currently use **implementation fonts** (Hanken Grotesk for headings, Source Sans 3 for body) for technical reasons. New brand materials and external channels should use **Montserrat** as the primary brand typeface.

When designing new templates or materials, prefer Montserrat and avoid adding additional typefaces without explicit approval.

## Print Typography

### Print Adjustments

- Increase body text to 10-12pt
- Adjust line height to 1.4-1.5 for better print readability
- Use CMYK color values (see Color Palette)
- Embed fonts when sharing PDFs

## Web Font Loading

- Use `font-display: swap` for better performance
- Subset fonts to include only necessary characters
- Self-host fonts when possible for better control
- Provide fallbacks for older browsers

## Font Files

Font files are located in:

- `fonts/` - Font files in various formats (.woff, .woff2, .ttf, .otf)
- Include license information for each font
