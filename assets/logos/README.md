# Logos

This directory contains official Thinkport GmbH logos in various formats.

## File Formats

- **SVG** – Scalable Vector Graphics (preferred for web and print)
- **PNG** – Portable Network Graphics (for fixed-size or email use)

## Available Logos

### Horizontal Logos

| File | Format | Use |
|------|--------|-----|
| `thinkport-logo-horizontal-dark.svg` | SVG | Dark backgrounds |
| `thinkport-logo-horizontal-light.svg` | SVG | Light backgrounds |
| `thinkport-logo-horizontal-light-200x50.png` | PNG | Fixed size (e.g. 200×50) |
| `thinkport-logo-horizontal-light-hr.png` | PNG | High resolution |

Use **dark** on dark backgrounds and **light** on light backgrounds.

### Icon & Venitus Variants

| File | Format | Description |
|------|--------|-------------|
| `thinkport-solo-light.svg` | SVG | Icon-only (solo), light version |
| `thinkport-venitus-dark.svg` | SVG | Thinkport + Venitus wordmark, dark |
| `thinkport-venitus-light.svg` | SVG | Thinkport + Venitus wordmark, light |
| `thinkport-venitus-dark.png` | PNG | Venitus dark, raster |
| `thinkport-venitus-light.png` | PNG | Venitus light, raster (e.g. favicon) |
| `thinkport-venitus-dark-big-100.png` | PNG | Venitus dark, 100px |
| `tp.svg` | SVG | Minimal “tp” icon |
| `a-venitus-company-hoch.svg` | SVG | “A Venitus Company” lockup (horizontal) |

## Logo Variants Summary

- **Horizontal** – Full wordmark: dark and light for different backgrounds.
- **Solo** – Icon only (`thinkport-solo-light.svg`).
- **Venitus** – Thinkport with “A Venitus Company” / Venitus branding (`thinkport-venitus-*`, `a-venitus-company-hoch.svg`).
- **Icon** – Minimal mark (`tp.svg`).

## Usage Guidelines

- Maintain clear space around the logo.
- Do not distort, rotate, or modify the logo.
- Choose the variant that matches your background (dark vs light).
- Prefer SVG for scalability; use PNG when a raster asset is required (e.g. email, favicon).
- See [LOGO_USAGE.md](../../guidelines/LOGO_USAGE.md) in the guidelines folder for detailed usage.

## Paths in This Repo

Assets are served from the `assets` folder (e.g. Vite `publicDir: 'assets'`). In the built app, logo URLs are:

- `/logos/thinkport-logo-horizontal-dark.svg`
- `/logos/thinkport-logo-horizontal-light.svg`
- `/logos/thinkport-solo-light.svg`
- `/logos/thinkport-venitus-dark.svg`
- `/logos/thinkport-venitus-light.svg`
- `/logos/thinkport-venitus-light.png`
- `/logos/tp.svg`
- `/logos/a-venitus-company-hoch.svg`

(and similarly for other files in this directory.)
