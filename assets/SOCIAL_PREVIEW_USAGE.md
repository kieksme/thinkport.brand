# Social Preview Image Usage Guide

This guide explains how to set up and use social preview images for GitHub repositories.

## Overview

Social preview images are displayed when your repository is shared on social media platforms (Twitter, LinkedIn, Facebook, etc.) or in messaging apps. GitHub automatically uses the image from `.github/social-preview.png` or `.github/social-preview.svg`.

## File Specifications

### Dimensions

- **Width**: 1280px
- **Height**: 640px
- **Aspect Ratio**: 2:1
- **Format**: PNG or SVG

These dimensions follow GitHub's recommended specifications for social preview images.

### Safe Area

- **Border**: 40pt (pixels) on all sides
- **Content Area**: 1200x560px
- **Important**: Keep important content within the safe area to avoid cropping on different platforms

## File Placement

GitHub looks for social preview images in the following locations (in order of priority):

1. `.github/social-preview.png`
2. `.github/social-preview.svg`
3. `assets/social-preview.png`
4. `assets/social-preview.svg`

**Recommended location**: `.github/social-preview.png` or `.github/social-preview.svg`

## Setting Up Social Preview

### Step 1: Generate PNG from SVG

If you have the SVG version, generate the PNG:

```bash
pnpm generate:social-preview
```

Or with custom paths:

```bash
node scripts/generate-social-preview.mjs \
  --input .github/social-preview.svg \
  --output .github/social-preview.png
```

### Step 2: Commit Files

Commit both SVG and PNG files to your repository:

```bash
git add .github/social-preview.svg
git add .github/social-preview.png
git commit -m "feat: add social preview images"
git push
```

### Step 3: Verify

After pushing, verify the preview appears:
1. Visit your repository on GitHub
2. Share the repository URL on a social platform
3. Check that the preview image displays correctly

## Platform-Specific Guidelines

### GitHub

- Automatically detects `.github/social-preview.png` or `.github/social-preview.svg`
- Displays in repository cards and when sharing links
- Supports both PNG and SVG formats

### Twitter/X

- Recommended: 1200x675px (1.91:1 ratio)
- Our 1280x640px (2:1) works but may be slightly cropped
- Maximum file size: 5MB
- Formats: PNG, JPG, GIF

### LinkedIn

- Recommended: 1200x627px (1.91:1 ratio)
- Our 1280x640px (2:1) works well
- Maximum file size: 5MB
- Formats: PNG, JPG

### Facebook

- Recommended: 1200x630px (1.91:1 ratio)
- Our 1280x640px (2:1) works well
- Maximum file size: 8MB
- Formats: PNG, JPG

### Discord/Slack

- Uses Open Graph meta tags
- GitHub automatically provides these
- Works with our 1280x640px format

## Per-page Open Graph banners

The site uses page-specific OG images in `assets/banner/opengraph/` (1200×630px SVG). Each banner shares:

- **Background:** Abstract background image from `assets/backgrounds/5.svg` (scaled to cover 1200×630).
- **Logo:** Thinkport logo at the top.
- **Typography:** Hanken Grotesk (headings) and Source Sans 3 (body), embedded via `@font-face` for consistent rendering where supported.
- **Content:** Page title, subtitle, optional tag line, and a page-specific graphic (e.g. color swatches for Colors, “Aa” sample for Typography, avatar squares for Avatars).

To regenerate all OG banners from the shared template, run `node scripts/generate-og-banners.mjs` (see script for page list and customization).

## Design Guidelines

### Content Layout

1. **Logo**: Centered in the top area
2. **Repository Name**: Prominent, centered
3. **Description**: Brief, readable text
4. **Decorative Elements**: Subtle, non-distracting

### Text Guidelines

- **Font Size**: Large enough to read at small sizes (minimum 32px)
- **Contrast**: High contrast for readability
- **Length**: Keep text concise (2-3 lines max)
- **Safe Area**: Keep all text within the 1200x560px content area

### Color Guidelines

- Use brand colors (Navy #1E2A45 background)
- Ensure sufficient contrast for text
- Use accent colors (Aqua #00FFDC) sparingly

## Generating Custom Social Previews

### Interactive Mode

Run the generator in interactive mode:

```bash
pnpm generate:social-preview
```

You'll be prompted for:
- Input SVG file path
- Output PNG file path
- Custom dimensions (optional)

### Command Line Mode

```bash
node scripts/generate-social-preview.mjs \
  --input .github/social-preview.svg \
  --output .github/social-preview.png \
  --width 1280 \
  --height 640
```

### Custom Dimensions

For platform-specific sizes:

```bash
# Twitter/X (1200x675)
node scripts/generate-social-preview.mjs \
  --input .github/social-preview.svg \
  --output .github/social-preview-twitter.png \
  --width 1200 \
  --height 675

# LinkedIn (1200x627)
node scripts/generate-social-preview.mjs \
  --input .github/social-preview.svg \
  --output .github/social-preview-linkedin.png \
  --width 1200 \
  --height 627
```

## Best Practices

1. **Use SVG source**: Always keep the SVG version for easy editing
2. **Generate PNG**: Provide PNG for maximum compatibility
3. **Test on platforms**: Verify preview appears correctly on different platforms
4. **Keep it updated**: Update when repository description or branding changes
5. **Optimize file size**: Keep PNG under 1MB for faster loading

## Troubleshooting

### Preview Not Showing

**Check file location:**
- Ensure file is in `.github/` directory
- Verify filename is exactly `social-preview.png` or `social-preview.svg`
- Check file is committed to the repository

**Check file format:**
- PNG should be valid PNG format
- SVG should be valid SVG format
- File should not be corrupted

**Clear cache:**
- Social platforms cache preview images
- Wait 24-48 hours for cache to clear
- Use [Open Graph Debugger](https://www.opengraph.xyz/) to test

### Image Quality Issues

**Regenerate PNG:**
```bash
pnpm generate:social-preview
```

**Check dimensions:**
- Ensure PNG is exactly 1280x640px
- Verify no scaling or compression artifacts

### Platform-Specific Issues

**Twitter/X:**
- May crop 2:1 images slightly
- Consider creating 1200x675px version for Twitter

**LinkedIn:**
- Generally works well with 1280x640px
- May show slight letterboxing

**Facebook:**
- Works well with 1280x640px
- May show slight letterboxing

## Technical Details

### SVG Structure

The social preview SVG includes:
- Navy background (#1E2A45)
- kieks.me horizontal logo (centered, top area)
- Repository name: "kieks.me Corporate Identity & Corporate Design"
- Description: "Brand assets, logos, colors, fonts, and guidelines"
- Decorative circles (aqua and fuchsia with opacity)

### Fonts

- **Hanken Grotesk** (Bold, 700) for repository name
- **Source Sans 3** (Regular, 400) for description
- Fonts are referenced but may fall back to system fonts

### Colors

- Background: Navy (#1E2A45)
- Logo accents: Aqua (#00FFDC)
- Text: White (#FFFFFF) and Light Gray (#CCCCCC)
- Decorative elements: Aqua (#00FFDC) and Fuchsia (#FF008F) with 10% opacity

## Customization

### For Other Repositories

To customize the social preview for a different repository:

1. Copy `.github/social-preview.svg` to your repository
2. Edit the SVG to change:
   - Repository name text
   - Description text
   - Logo position (if needed)
3. Regenerate PNG:
   ```bash
   pnpm generate:social-preview
   ```

### Design Guidelines

When customizing:
- Maintain brand colors (Navy background, Aqua accents)
- Keep logo visible and properly sized
- Ensure text is readable
- Stay within safe area (1200x560px content area)
- Preserve overall aesthetic

## Testing Your Preview

### Open Graph Validators

Test your social preview with these tools:

- [Open Graph Debugger](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

### Manual Testing

1. Share repository URL on different platforms
2. Check how preview appears
3. Verify text is readable
4. Ensure logo is visible
5. Check for any cropping issues

## Questions?

If you have questions about social preview images, please refer to:
- [GitHub Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-social-previews)
- [Logo Usage Guidelines](../guidelines/LOGO_USAGE.md)
- [Color Palette](../guidelines/COLOR_PALETTE.md)

Or contact the designated maintainers listed in the CODEOWNERS file.
