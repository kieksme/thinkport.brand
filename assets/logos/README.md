# Logos

This directory contains official Thinkport GmbH logos in various formats, organised by variant.

## Directory structure

| Directory | Description |
|-----------|-------------|
| `horizontal/` | Logo with Thinkport text adjacent to icon (horizontal layout); light and dark for different backgrounds |
| `solo/` | Icon only (no wordmark); light, dark, and card-solid variants; 2022 set in SVG, PNG, EPS |
| `venitus/` | Thinkport with Venitus wordmark; light and dark; PNG raster and 100px variant |
| `a-venitus-company/` | “A Venitus Company” lockup (horizontal); light and dark |

## File formats

- **SVG** – Scalable vector graphics (preferred for web and print)
- **PNG** – Raster (e.g. fixed sizes, email, favicon)
- **EPS** – Print (in `solo/` for 2022 set)

## Available logos

### Horizontal (`horizontal/`)

| File | Format | Use |
|------|--------|-----|
| `thinkport-horizontal-dark.svg` | SVG | Dark logo (e.g. light backgrounds); also used in email footers as inline attachment (Content-ID `thinkport-logo`) – PNG recommended for email |
| `thinkport-horizontal-light.svg` | SVG | Light backgrounds |
| `thinkport-horizontal-light-200x50.png` | PNG | Fixed size (e.g. 200×50) |
| `thinkport-horizontal-light-hr.png` | PNG | High resolution |

Use **dark** on dark backgrounds and **light** on light backgrounds. For email footers, attach the dark logo as an inline attachment with Content-ID `thinkport-logo`; use PNG for best compatibility (export from the SVG if needed).

### Solo / icon (`solo/`)

| File | Format | Description |
|------|--------|-------------|
| `thinkport-solo-light.svg` | SVG | Icon-only, light |
| `thinkport-solo-light-card-solid.svg` | SVG | Icon-only, solid (e.g. cards) |
| `thinkport-solo-light-2022.svg` | SVG | 2022 variant, light |
| `thinkport-solo-dark-2022.svg` | SVG | 2022 variant, dark |
| `thinkport-solo-light-2022.png` | PNG | 2022 variant, light, raster |
| `thinkport-solo-dark-2022.png` | PNG | 2022 variant, dark, raster |
| `thinkport-solo-light-2022.eps` | EPS | 2022 variant, light, print |
| `thinkport-solo-dark-2022.eps` | EPS | 2022 variant, dark, print |

### Venitus (`venitus/`)

| File | Format | Description |
|------|--------|-------------|
| `thinkport-venitus-dark.svg` | SVG | Thinkport + Venitus wordmark, dark |
| `thinkport-venitus-light.svg` | SVG | Thinkport + Venitus wordmark, light |
| `thinkport-venitus-dark.png` | PNG | Venitus dark, raster |
| `thinkport-venitus-light.png` | PNG | Venitus light, raster (e.g. favicon) |
| `thinkport-venitus-dark-100px.png` | PNG | Venitus dark, 100 px (e.g. email signature) |
| `thinkport-venitus-light-card-solid.svg` | SVG | Venitus light, solid (e.g. cards) |

### A Venitus Company (`a-venitus-company/`)

| File | Format | Description |
|------|--------|-------------|
| `thinkport-a-venitus-company-horizontal.svg` | SVG | “A Venitus Company” lockup (dark) |
| `thinkport-a-venitus-company-horizontal-light.svg` | SVG | “A Venitus Company” lockup (light) |

## Usage guidelines

- Maintain clear space around the logo.
- Do not distort, rotate, or modify the logo.
- Choose the variant that matches your background (dark vs light).
- Prefer SVG for scalability; use PNG when a raster asset is required (e.g. email, favicon).
- See [LOGO_USAGE.md](../../guidelines/LOGO_USAGE.md) in the guidelines folder for detailed usage.

## Paths in the built app

Assets are served from the `assets` folder (e.g. Vite `publicDir: 'assets'`). In the built brand site, logo URLs use subpaths:

- `/logos/horizontal/thinkport-horizontal-dark.svg`
- `/logos/horizontal/thinkport-horizontal-light.svg`
- `/logos/solo/thinkport-solo-light.svg`
- `/logos/venitus/thinkport-venitus-dark.svg`
- `/logos/venitus/thinkport-venitus-light.svg`
- `/logos/venitus/thinkport-venitus-light.png`
- `/logos/a-venitus-company/thinkport-a-venitus-company-horizontal.svg`
- `/logos/a-venitus-company/thinkport-a-venitus-company-horizontal-light.svg`

(and similarly for other files in the subdirectories.)
