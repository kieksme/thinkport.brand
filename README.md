# Thinkport Corporate Identity & Corporate Design

![Thinkport Corporate Identity & Corporate Design](assets/readme-header.svg)

Repository to hold and share Corporate Identity and Corporate Design of Thinkport GmbH.

## Download Assets

**Download the latest release of brand assets:**

[![Download Latest Release](https://img.shields.io/github/v/release/kieksme/thinkport.brand?label=Download%20Latest%20Release&style=for-the-badge&logo=github&logoColor=white&color=0B2649)](https://github.com/kieksme/thinkport.brand/releases/latest)

Visit the [Releases](https://github.com/kieksme/thinkport.brand/releases) page to download the latest version of all brand assets as a complete package.

## Purpose

This repository serves as the central source of truth for all Corporate Identity (CI) and Corporate Design (CD) materials for Thinkport GmbH. It contains brand assets, guidelines, templates, and resources to ensure consistent brand representation across all company communications and materials.

## Modification Policy

**IMPORTANT: No unauthorized modifications are permitted.**

- Changes to this repository require explicit permission from designated maintainers
- All changes must go through the proper approval process via pull requests
- Unauthorized modifications will be rejected
- See CODEOWNERS file for the list of authorized approvers

## Usage Rights

**All company members are allowed and encouraged to use these materials within the company context:**

- Use logos, colors, fonts, and templates for company projects
- Reference brand guidelines for consistent communications
- Download and utilize assets for internal and external company materials
- Share materials with partners and vendors when representing Thinkport GmbH

## What's Included

This repository contains all the visual identity assets and brand guidelines for Thinkport GmbH, organized into two main categories:

### Fundamentals

The foundational brand elements that form the core of our corporate identity:

- [**Logos**](assets/logos/) – Various logo versions (full, icon, wordmark) in multiple formats
- [**Colors**](assets/colors/) – Brand color palette with color codes (HEX, RGB, CMYK)
- [**Typography**](assets/fonts/) – Font specifications and typeface files

### Implementations

Products and applications built from our brand fundamentals:

- [**Business Cards**](examples/sample-business-cards/) – Digital business card presentations
- [**Templates**](assets/templates/) – Document templates, presentation templates, and other brand materials

### Documentation

- [**Guidelines**](guidelines/) – Comprehensive brand guidelines and usage rules

### Detailed documentation

Detailed documentation for each aspect of the brand identity:

- [Logo Usage](guidelines/LOGO_USAGE.md) - How to properly use logos
- [Color Palette](guidelines/COLOR_PALETTE.md) - Official color definitions
- [Typography](guidelines/TYPOGRAPHY.md) - Font usage and hierarchy
- [Design Elements & Webdesign](guidelines/DESIGN_ELEMENTS.md) - Buttons, overlays, borders, Photoshop
- [Templates and Resources](guidelines/TEMPLATES_AND_RESOURCES.md) - Slide Master, Geschäftsbrief DIN 5008, company intro
- [Brand History](guidelines/BRAND_HISTORY.md) - Policy changes (e.g. 2020 colour, 2021 logo)

The same guidelines are also available in the [Wiki](https://github.com/kieksme/thinkport.brand/wiki) (synced automatically from this repository).

## Usage

### For Developers

If you need to integrate assets directly into your project, you can clone this repository:

```bash
git clone https://github.com/kieksme/thinkport.brand.git
```

### For Designers & Marketing

Download the latest release package or refer to the guidelines for creating new materials. Use the templates and assets for creating consistent branded materials.

**Please review the brand guidelines before using any assets to ensure consistent brand representation across all touchpoints.**

### Business Card Generator

The repository includes a business card generator that creates print-ready PDFs with QR codes containing vCard data.

#### Installation

1. Install Node.js dependencies:

```bash
pnpm install
```

If you want to generate staff assets from the Thinkport People API locally, create a `.env` file based on `.env.example` and add:

```bash
THINKPORT_API_USERNAME=your-username-here
THINKPORT_API_PASSWORD=your-password-here
```

1. (Optional but recommended) Install Ghostscript for font-to-path conversion:
   - macOS: `brew install ghostscript`
   - Linux: `sudo apt-get install ghostscript` or `sudo yum install ghostscript`
   - Windows: Download from [Ghostscript website](https://www.ghostscript.com/download/gsdnld.html)

#### Usage (CLI)

Generate a business card:

```bash
pnpm generate-card
```

Generate sample business cards:

```bash
pnpm generate:card:samples
```

Generate staff assets (avatars, iOS posters, business cards, vCards, portfolio PDFs, email footers) for active Thinkport employees:

```bash
pnpm generate:staff:assets
```

You can limit the generation to a subset by slug substring:

```bash
pnpm generate:staff:assets -- --slug alex
```

Generate a single iOS poster (template + portrait + job title) or run the sample generator:

```bash
pnpm run generate:ios:poster -- --portrait path/to/portrait.png --job-title "Operations" --output output/ios-posters/poster.png
pnpm run generate:ios:poster:samples
```

Generate portfolio PDFs (one per person, with skill graphs showing years of experience). Requires the same API credentials as staff assets. Output: `release-assets/staff/portfolios/portfolio-<slug>.pdf`. Missing or null `yearsOfExperience` is shown as 0 years. The header uses the background graphic `assets/backgrounds/5.svg` and the Thinkport dark logo (`assets/logos/horizontal/thinkport-horizontal-dark.svg`); certificate badges are taken from the API when available.

```bash
pnpm generate:portfolio:pdf
pnpm generate:portfolio:pdf -- --slug alex
```

If portfolio PDFs fail with "Could not find Chrome", either install Chromium for Puppeteer (`pnpm exec puppeteer browsers install chrome`) or use system Chrome: on macOS the script will use `/Applications/Google Chrome.app` if present; otherwise set `PUPPETEER_EXECUTABLE_PATH` to your Chrome binary.

#### Dependencies

**Node.js packages:**

- `puppeteer` - PDF generation from HTML
- `qrcode` - QR code generation
- `inquirer` - Interactive CLI prompts

**External tools:**

- **Ghostscript** (optional) - Converts fonts to paths in PDFs for print compatibility
  - The generator automatically detects Ghostscript if installed
  - If not installed, PDFs will still be generated but fonts won't be converted to paths

#### Print Specifications

The generator creates PDFs compliant with print shop specifications:

- Final size: 85mm × 55mm (landscape)
- PDF size with bleed: 89mm × 59mm (2mm bleed on all sides)
- Safe area: 82mm × 52mm (content 1.5mm from edge)
- Resolution: 300 DPI minimum
- Color mode: CMYK with "PSO Uncoated ISO12647 (Fogra 47L)" profile
- Page order: Front = Page 1, Back = Page 2
- Fonts: Converted to paths (if Ghostscript is installed)

For more details, see [Business Card Templates documentation](assets/templates/README.md).

## Contributing

To propose changes to corporate identity materials:

1. Fork this repository
2. Create a feature branch
3. Make your proposed changes (follow the established directory structure and naming conventions)
4. Submit a pull request with detailed explanation
5. Wait for approval from authorized maintainers (see CODEOWNERS)

**Note:** Only authorized maintainers can approve and merge changes.

## Contact

For questions about using corporate identity materials or requesting changes, please contact the designated maintainers listed in the CODEOWNERS file.

## License

This repository is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

### Font Licenses

The fonts used in this project (Hanken Grotesk and Source Sans 3) are licensed under the SIL Open Font License 1.1. For detailed font license information, see [FONT_LICENSES.md](FONT_LICENSES.md).
