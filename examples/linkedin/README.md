# LinkedIn Banner Examples (Thinkport Brand)

This folder contains sample LinkedIn images generated with the Thinkport brand assets:

- **Background**: Graphic from `assets/backgrounds/` (default: 5-dark.svg), base fill set to brand color
- **Logo**: Solo icon for logo/photo/post; horizontal wordmark for title and culture banners. No text in banners.
- **Thinkport palette**: Dark Blue (#0B2649), Orange (#FF5722), Turquoise (#00BCD4)
- **Sizes**: LinkedIn-recommended dimensions (logo 400×400, title 4200×700, culture-main 1128×376, etc.)

## Regenerating samples

From the project root:

```bash
pnpm run generate:image:linkedin:samples
```

All variants (all types × aqua/navy/fuchsia) are written to this folder.

## Single image (CLI)

```bash
pnpm run generate:image:linkedin -- --type culture-main --color darkBlue --output examples/linkedin/my-banner.jpg
```

See `pnpm run generate:image:linkedin -- --help` for options.
