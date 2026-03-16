# PowerPoint templates – Company introduction

Updated company introduction deck following the current Thinkport Corporate Design.

## Files

- `thinkport-company-intro.pptx` – Main PowerPoint deck for the short company introduction.
- `thinkport-company-intro-preview.pdf` – PDF export of the deck for browser preview on the brand site.

> Note: The binary files are **not** tracked or generated automatically by this repository. Add or refresh them manually as described below.

## Applying the Thinkport Corporate Design

When you update or recreate the deck, make sure it follows the current CD:

- **Colors** – Use the official brand colors from `guidelines/COLOR_PALETTE.md`:
  - Dark Blue `#0B2649` for primary backgrounds, headings and key shapes.
  - Orange `#FF5722` for highlights, call-to-action elements and important accents.
  - Turquoise `#00BCD4` for links, secondary accents and supporting visuals.
  - Neutral grays (`#333333`, `#666666`, `#CCCCCC`) for text and subtle UI elements.
- **Typography** – Use the primary brand typeface from `guidelines/TYPOGRAPHY.md`:
  - Montserrat for headings and (where appropriate) body text.
  - Recommended weights: 400 (Regular), 600 (Semi-Bold), 700 (Bold).
  - Keep line height around 1.4–1.5 and avoid mixing in additional fonts without approval.
- **Logos** – Use only official logo files from `assets/logos/` as described in `guidelines/LOGO_USAGE.md`:
  - Horizontal or Venitus lockups for title slides and closing slides.
  - Solo/icon variants for small, compact placements where full wordmarks do not fit.
  - Do not recolor, distort, or modify the logos.

### Slide master / layout checklist

In the PowerPoint Slide Master:

- Define **master background colors** using the Dark Blue / Turquoise palette.
- Set **text styles** (title, subtitle, body, captions) to Montserrat with sizes and weights aligned to the typography guidelines.
- Configure **default placeholder colors**:
  - Headings in Dark Blue.
  - Body text in Dark Gray.
  - Links and call-to-action elements in Turquoise or Orange.
- Place the **logo** on the master or key layouts, respecting clear space and minimum size rules from `LOGO_USAGE.md`.
- Avoid ad-hoc colors and typefaces; reuse the CD styles defined above.

## Generating the deck with the CD script

You can generate the CD-aligned PPTX from a source deck (e.g. the original Firmenvorstellung) using the repo script:

1. Put the source PPTX in `Downloads/Thinkport_Firmenvorstellung.pptx`, or set `SOURCE_PPTX` to its path.
2. From the repo root run:
   ```bash
   pnpm run generate:powerpoint
   ```
   This creates a Python venv (`.venv-pptx`) if needed, installs `python-pptx`, and runs `scripts/apply-cd-to-pptx.py`, which:
   - Sets theme colors to the Thinkport palette (Dark Blue, Orange, Turquoise, neutrals).
   - Sets all slide text to Montserrat.
3. Export a PDF for the site preview:
   - Open `examples/powerpoint/thinkport-company-intro.pptx` in PowerPoint or LibreOffice.
   - Export as PDF to `examples/powerpoint/thinkport-company-intro-preview.pdf`.

Manual alternative (without pnpm script):

```bash
python3 -m venv .venv-pptx
.venv-pptx/bin/pip install -r scripts/requirements-pptx.txt
.venv-pptx/bin/python scripts/apply-cd-to-pptx.py --source /path/to/source.pptx --output examples/powerpoint/thinkport-company-intro.pptx
```

## Refreshing the files manually

1. Open the latest company introduction PPTX from your shared drive or brand team source.
2. Update the **Slide Master** and layouts to match the color, typography and logo rules above.
3. Save the updated deck as:
   - `examples/powerpoint/thinkport-company-intro.pptx`
4. Export the deck as a PDF:
   - File → Export → PDF
   - Save as `examples/powerpoint/thinkport-company-intro-preview.pdf`
5. Commit the updated files if they are meant to live in this repository, or keep them on internal storage and only ship them with releases as needed.

## Usage in the brand site

The implementations page `app/implementations/powerpoint-templates.html` uses:

- `thinkport-company-intro-preview.pdf` for the in-page viewer (iframe).
- `thinkport-company-intro.pptx` as the downloadable PowerPoint template.

If you change file names, update the references on that page accordingly.

