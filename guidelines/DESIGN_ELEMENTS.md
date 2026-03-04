# Design Elements & Webdesign

Guidelines for buttons, background overlays, borders, and image treatments to keep Thinkport’s digital and print materials consistent.

## Buttons

### Primary button (CTA)

Use for main calls-to-action (e.g. “Contact”, “Learn more”).

- **Font:** Montserrat (see [TYPOGRAPHY.md](TYPOGRAPHY.md) for current typeface note), weight 600, 13px.
- **Background / border:** `#FF5722` (Orange).
- **Text:** White (`#FFFFFF`).
- **Border radius:** 4px.
- **Padding:** 10px 20px (top/bottom, left/right).
- **Letter spacing:** 1px.
- **Shadow:** `0px 0px 10px 0px rgba(0,0,0,0.2)`.
- **Hover:** Background and border white; text `#FF5722`.

Example CSS:

```css
.button {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 13px;
  background-color: #FF5722;
  border-color: #FF5722;
  color: #FFFFFF;
  border-radius: 4px;
  display: inline-block;
  padding: 10px 20px;
  letter-spacing: 1px;
  box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.2);
}
.button:hover {
  background-color: #FFFFFF;
  border-color: #FFFFFF;
  color: #FF5722;
}
```

## Background overlay

For hero or full-bleed image areas with a brand overlay:

- **Base:** Image as background.
- **Overlay:** Linear gradient from `#00BCD4` (Turquoise) to `#0B2649` (Dark Blue).
- **Angle:** 290°.
- **Opacity:** 93% (stops at 0 and 100).
- **Locations:** 0 and 100.

Use this overlay so imagery keeps a consistent CI look (e.g. on the Thinkport website).

## Borders

For dividers or framed content:

- **Thickness:** 4pt.
- **Colors:** `#FF5722` (Orange) or `#00BCD4` (Turquoise).

Use one of these two colours only; avoid other border colours for brand elements.

## Photoshop: CI background images

For a consistent CI background style in Photoshop (e.g. hero images with gradient):

1. Add a **gradient fill layer** (e.g. on the bottom right or as needed).
2. **Gradient colours:** From `#00BCD4` to `#0B2649` (double-click the colour stops and enter the HEX values).
3. **Colour stops:** Set each stop to **93% opacity**. Locations 0 and 100.
4. **Layer opacity:** Set the gradient fill layer itself to **70%** opacity.

This matches the overlay described in “Background overlay” and keeps print/digital assets aligned.

## Related

- [COLOR_PALETTE.md](COLOR_PALETTE.md) – Brand colours (HEX, RGB, Pantone).
- [TYPOGRAPHY.md](TYPOGRAPHY.md) – Typeface and weights.
