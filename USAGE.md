# Usage Guidelines for Thinkport Corporate Identity Materials

This document provides guidance on how to properly use the corporate identity materials in this repository.

## 📖 General Usage Policy

All employees, contractors, and authorized partners of Thinkport GmbH are permitted to use the materials in this repository for company-related purposes.

### ✅ Permitted Uses

You may use these materials for:

- **Internal Communications**
  - Presentations to team members
  - Internal documentation
  - Company newsletters and announcements
  
- **External Communications**
  - Client presentations and proposals
  - Marketing materials and campaigns
  - Website and digital content
  - Social media posts
  - Business cards and stationery
  
- **Partner Communications**
  - Providing brand assets to vendors and suppliers
  - Sharing templates with authorized partners
  - Collaborative materials with approved third parties

- **Product and Service Delivery**
  - Integration into company products
  - Customer-facing documentation
  - Support materials

### ❌ Prohibited Uses

Do NOT use these materials for:

- Personal projects unrelated to Thinkport GmbH
- Competing businesses or conflicting interests
- Unauthorized modifications or derivatives
- Purposes that could damage the company's reputation
- Distribution to unauthorized third parties

## 📥 How to Download and Use Materials

1. **Browse the Repository**
   - Navigate to the appropriate directory (logos, fonts, templates, etc.)
   - Review the README in each directory for specific guidance

2. **Download What You Need**
   - Click on the file you need
   - Use the "Download" or "Raw" button to save the file
   - Or clone the entire repository for local access

3. **Use the Materials**
   - Follow the brand guidelines provided in the `assets/guidelines/` directory
   - Maintain the integrity of logos and brand assets
   - Use appropriate file formats for your medium (print vs. digital)

4. **Generate Staff Assets from the Thinkport API (for internal use)**

- Install dependencies with `pnpm install`
- Create a `.env` file based on `.env.example` and set:
  - `THINKPORT_API_USERNAME`
  - `THINKPORT_API_PASSWORD`
- Run:

```bash
pnpm generate:staff:assets
```

This will generate avatars, iOS posters, business cards, vCards (`.vcf` per person in `release-assets/staff/vcards/`), portfolio PDFs (one per active person with skill graphs in `release-assets/staff/portfolios/`), and email footers for active Thinkport employees into `release-assets/staff/` (including `release-assets/staff/ios-posters/` for per-person posters). The release Staff ZIP uploaded on each GitHub release contains six folders when present: `avatars`, `business-cards`, `email-footers`, `email-footers-text`, `portfolios`, and `ios-posters` (vcards are generated but not included in the ZIP). Per-person download ZIPs include the same six folder types for that person. Portfolio PDFs include all active people (Thinkport and external) and visualize each person's skills with years of experience; missing experience values are shown as 0 years. The portfolio header uses the background `assets/backgrounds/5.svg` and the Thinkport dark logo; certificate badges are displayed from the API when present.

**Using email footers (logo as embedded attachment):** The generated HTML footers reference the Thinkport logo via `src="cid:thinkport-logo"`. To display the logo in sent emails, attach the logo file as an **inline (embedded) attachment** with **Content-ID: `thinkport-logo`** when sending. Many email clients block external images; embedding ensures the logo is shown. For best compatibility across clients (e.g. Outlook, Gmail), use a **PNG** version of the horizontal dark logo (e.g. export from `assets/logos/horizontal/thinkport-horizontal-dark.svg`); SVG is often blocked in email.

To generate only portfolio PDFs (same API credentials required):

```bash
pnpm generate:portfolio:pdf
pnpm generate:portfolio:pdf -- --slug <substring>
```

## Staff assets generated from the Thinkport API

The CLI tooling in this repository can generate a complete set of **staff-related brand assets** from the Thinkport People API. These assets are written to `release-assets/staff/` and packaged into ZIP files in the GitHub release workflow.

### Overview of generated staff assets

Running:

```bash
pnpm generate:staff:assets
```

creates the following asset types for active Thinkport staff:

- **Avatars** (`release-assets/staff/avatars/`)
  - Square PNG avatars in multiple sizes (256px, 512px), including grayscale variants
  - Additional variants with branded abstract backgrounds from `assets/backgrounds/`
  - Used for internal docs, slides, websites, and the `implementations/avatars` example page

- **iOS posters** (`release-assets/staff/ios-posters/`)
  - Device-style poster PNGs built from a shared template plus a staff portrait and job title overlay
  - Intended for internal use (e.g. iOS wallpapers, onboarding visuals, campaigns)
  - See **“iOS Poster Guidelines”** below for details

- **Business cards** (`release-assets/staff/business-cards/`)
  - Print-ready PDF business cards (front + back) per person, matching the templates in `assets/templates/`
  - Respect print specs (bleed, safe area, CMYK profile) from the business card templates guide

- **vCards** (`release-assets/staff/vcards/`)
  - Individual `.vcf` files per staff member with contact data
  - Where available, embeds a **base64 staff photo**; when an iOS poster exists, its image is preferred

- **Portfolio PDFs** (`release-assets/staff/portfolios/`)
  - One-page portfolio PDFs per person with skill graphs, description, and certificates
  - Use the same brand background as `assets/backgrounds/5.svg` and the Thinkport dark logo
  - A sample portfolio is also stored in `examples/portfolios/`

- **Email footers** (`release-assets/staff/email-footers/` and `release-assets/staff/email-footers-text/`)
  - HTML and plain-text email footers generated from templates in `assets/templates/`
  - HTML footers embed the Thinkport horizontal logo via `src="cid:thinkport-logo"`; attach the logo as inline image when sending

> Note: The public **Staff ZIP** uploaded on each GitHub release contains `avatars`, `business-cards`, `email-footers`, `email-footers-text`, `portfolios`, and `ios-posters`. vCards are generated as well but are not included in the release ZIP.

## iOS poster guidelines

iOS posters are **device-style wallpapers** generated for each active Thinkport employee. They combine a shared background template (`assets/ios/poster.png`), a staff portrait, and a job title overlay.

### Intended usage

- **Internal use only**
  - Personal iOS wallpapers or lock-screen images for Thinkport devices
  - Internal slides, onboarding decks, and event communication
- **Do not**
  - Use iOS posters as generic marketing banners or external advertisements
  - Edit or remix the posters outside the constraints below without approval from the brand team

### Technical specifications

- **Template**: `assets/ios/poster.png`
- **Output**: PNG
- **Output directory**: `release-assets/staff/ios-posters/`
- **File naming**: `poster-<slug>.png` (e.g. `poster-andre-lademann.png`)
- **Generation**
  - Per-person via the staff assets generator:

```bash
pnpm generate:staff:assets
```

  - Single poster via the iOS poster generator:

```bash
pnpm generate:ios:poster -- --portrait path/to/portrait.png --job-title "Operations" --output output/ios-posters/poster.png
```

The script always keeps the **entire portrait visible** on the poster (no cropping) and centers it at the bottom of the template. The job title is drawn below the logo area using the brand typeface.

### Brand & design rules

- **Logo and background**
  - Do not replace or move the background template (`assets/ios/poster.png`) without brand team approval
  - Do not add extra logos, icons, or visual effects on top of the template
  - Follow the global [Logo Usage](guidelines/LOGO_USAGE.md) and [Color Palette](guidelines/COLOR_PALETTE.md) rules

- **Typography**
  - Job titles use the brand heading typeface (**Hanken Grotesk**) in a light weight
  - Do not switch to other fonts or add additional text blocks elsewhere on the poster
  - Keep job titles short and generic (e.g. “Operations”, “Consulting”, “Development”) rather than full sentences

- **Content rules**
  - Job titles are automatically normalized (company suffixes like `| Thinkport` or `bei Thinkport GmbH` are stripped)
  - Use professional job titles only; no emojis or informal nicknames
  - Portraits must be high quality, neutral, and on-brand (no filters, no extreme crops)

### Privacy & distribution

- Treat iOS posters as **personal data**:
  - Do not share posters publicly without explicit consent from the person
  - Do not upload posters to public repositories or social platforms by default
  - When in doubt, prefer internal channels (e.g. company devices, intranet, protected slide decks)

1. **Keep Materials Updated**
   - Periodically check for updates to brand materials
   - Replace outdated assets with current versions
   - Watch the repository for notifications of changes

## 🎨 Brand Consistency

To maintain brand consistency:

- **Use Official Assets Only**
  - Always use assets from this repository
  - Do not recreate logos or modify brand colors
  - Do not use outdated versions of materials

- **Follow Guidelines**
  - Read and follow the brand guidelines documentation
  - Maintain proper logo spacing and sizing
  - Use approved color combinations
  - Follow typography rules

- **Quality Standards**
  - Use high-resolution files for print materials
  - Ensure proper file formats for each medium
  - Test designs before final production

## 🤔 Questions and Support

### Common Questions

**Q: Can I modify the logo for my specific project?**
A: No. Logos must be used exactly as provided. Contact maintainers if you need a specific variation.

**Q: Can I change the brand colors to match my design?**
A: No. Brand colors are fixed. Use the approved palette only.

**Q: Can I share these materials with external vendors?**
A: Yes, if the vendor is working on an authorized Thinkport GmbH project.

**Q: What if I need an asset that's not in the repository?**
A: Contact the maintainers listed in CODEOWNERS to request new assets.

**Q: How often are materials updated?**
A: Materials are updated as needed. Watch the repository for change notifications.

### Getting Help

If you need assistance:

1. Check the README files in relevant directories
2. Review the brand guidelines documentation
3. Contact the maintainers (see CODEOWNERS file)
4. Open an issue in the repository for general questions

## 🔄 Staying Updated

To stay informed about changes:

1. **Watch the Repository**
   - Click "Watch" on GitHub to receive notifications

2. **Check for Updates Regularly**
   - Review the commit history periodically
   - Download updated materials when available

3. **Subscribe to Announcements**
   - Follow company communication channels for major brand updates

## ⚖️ Legal and Compliance

- All materials are owned by Thinkport GmbH
- Usage is governed by company policies and applicable laws
- Unauthorized use or distribution may result in disciplinary action
- See the [LICENSE](LICENSE) file for detailed licensing information

## 📞 Contact Information

For questions about usage or to request access to additional materials:

- Review the [CODEOWNERS](CODEOWNERS) file for maintainer contacts
- Open an issue in this repository for general inquiries
- Contact the marketing or design team for specific requests

---

**Remember:** When in doubt, ask before using. Maintaining brand consistency is everyone's responsibility.
