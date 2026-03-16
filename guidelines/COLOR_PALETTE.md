# Color Palette

## Brand Colors

The Thinkport GmbH color palette consists of primary brand colors (Dark Blue, Orange, Turquoise) that work together for a consistent visual identity across all marketing and sales channels.

## Primary Colors

### Dark Blue

```text
Name: Dark Blue
HEX: #0B2649
RGB: 11 38 73
Pantone: 533 C
```

**Usage**: Trust, professionalism; primary dark backgrounds, headings, key brand elements

### Orange

```text
Name: Orange
HEX: #FF5722
RGB: 255 87 34
Pantone: 1505 C
```

**Usage**: Energy, call-to-action; accents, highlights, interactive elements

### Turquoise

```text
Name: Turquoise
HEX: #00BCD4
RGB: 0 188 212
Pantone: 319 C
```

**Usage**: Clarity, innovation; secondary accents, links, supporting visuals

## Color Harmony and Shades

Color shades and harmony rules provide additional variations for contrast and visual hierarchy. Use the [Adobe Color Wheel](https://color.adobe.com/create/color-wheel) with a base color in HEX (Cyan/Turquoise, Orange, or Dark Blue) to explore harmony rules.

### Analogous Harmony (Cyan #00BCD4)

Related harmony colors for Turquoise/Cyan:

- **#00BCD4** – Base Turquoise
- **#51F07F** – Light green
- **#AFD955** – Lime
- **#F0CF51** – Yellow
- **#E6934E** – Orange accent

Use for complementary palettes and secondary accents while keeping the base Turquoise as primary.

### Turquoise (#00BCD4) Shading

| HEX     | Usage / note        |
|---------|---------------------|
| #00C6E0 | Lighter variant     |
| #00BCD4 | Base                |
| #00B6CF | Slightly darker     |
| #00A4BA | Darker              |
| #004A54 | Dark for contrast   |

### Orange (#FF5722) Shading

| HEX     | Usage / note        |
|---------|---------------------|
| #FF5722 | Base                |
| #E64C1E | Darker              |
| #BF4019 | Medium dark         |
| #802A11 | Dark                |
| #401508 | Very dark           |

### Dark Blue (#0B2649) Shading

| HEX     | Usage / note        |
|---------|---------------------|
| #0B2649 | Base                |
| #206FD6 | Lighter blue        |
| #174E96 | Medium blue         |
| #0D2D57 | Darker              |
| #081A33 | Very dark           |

### Pantone (Screen Printing)

For consistent reproduction in print and industrial applications, use the Pantone Color System (CMYK Pantone + solid coated). Find in Illustrator:

- **Dark Blue:** Pantone 533 C
- **Orange:** Pantone 1505 C
- **Turquoise:** Pantone 319 C

## Neutral Colors

### Dark Gray

```text
Name: Dark Gray
HEX: #333333
RGB: rgb(51, 51, 51)
CMYK: C:0 M:0 Y:0 K:80
```

**Usage**: Body text, dark UI elements

### Medium Gray

```text
Name: Medium Gray
HEX: #666666
RGB: rgb(102, 102, 102)
CMYK: C:0 M:0 Y:0 K:60
```

**Usage**: Secondary text, borders

### Light Gray

```text
Name: Light Gray
HEX: #CCCCCC
RGB: rgb(204, 204, 204)
CMYK: C:0 M:0 Y:0 K:20
```

**Usage**: Backgrounds, dividers, subtle elements

## Color Usage Guidelines

### Backgrounds

- **Light Backgrounds**: Use Dark Blue or dark gray for text and primary elements
- **Dark Backgrounds**: Use white or Turquoise/Orange for text and accents (e.g. Dark Blue #0B2649 as background)
- Ensure WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)

### Text

- **Headings**: Dark Blue (#0B2649) or dark gray
- **Body Text**: Dark gray (#333333)
- **Links**: Use Turquoise (#00BCD4) or darker shade (#00A4BA) on white backgrounds; check contrast for WCAG AA
- **Link Hover**: Slightly lighter or darker Turquoise/Orange as appropriate
- **Disabled Text**: Medium gray (#666666)

### Buttons and Interactive Elements

- **Primary Actions**: Orange (#FF5722) or Turquoise (#00BCD4) on light backgrounds; white text on Dark Blue
- **Secondary Actions**: Outlined with Dark Blue or Turquoise; neutral backgrounds
- **Hover States**: Use shading variants (e.g. #E64C1E for Orange, #00A4BA for Turquoise)
- **Disabled State**: Light gray with reduced opacity

### Application to generated assets (posters, portfolios, social images)

Generated assets in this repository – such as **iOS posters** (`release-assets/staff/ios-posters/`), **portfolio PDFs** (`release-assets/staff/portfolios/`), social preview images, and README headers – are all built from the same brand colors documented here:

- Backgrounds use Dark Blue or navy tones as defined in this palette.
- Accent elements (e.g. lines, tags) use Orange or Turquoise.
- Text colors follow the neutral palette (Dark Gray, White) and WCAG contrast rules.

When creating new templates or generators, always reuse these colors instead of introducing new ad-hoc values.

## Accessibility

All color combinations must meet WCAG 2.1 Level AA standards for accessibility:

- Normal text: Minimum contrast ratio of 4.5:1
- Large text (18pt+): Minimum contrast ratio of 3:1
- UI components: Minimum contrast ratio of 3:1

## Color Combinations to Avoid

- Low contrast combinations that fail accessibility standards
- Primary colors on primary colors without sufficient contrast
- Colors that vibrate when placed together

## Digital Color Management

### Web/Digital

- Use HEX or RGB values
- Test colors on different displays for consistency
- Consider dark mode variations if applicable

### Print

- Use Pantone (533 C, 1505 C, 319 C) or CMYK values where defined
- Request color proofs before final printing
- Be aware that colors may vary between digital and print media

## Color Files

Color palette files are available in multiple formats:

- **ASE** (Adobe Swatch Exchange): `assets/colors/thinkport-palette.ase` (if available)
- **CSS Variables**: `assets/colors/colors.css` for web projects
- **JSON**: `assets/colors/colors.json` for developers and applications
- **Color Swatches**: SVG files in the `colors/` directory

---

Last updated: 2025
