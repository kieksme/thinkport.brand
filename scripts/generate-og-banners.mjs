#!/usr/bin/env node
/**
 * Generates Open Graph banner SVGs for all pages.
 * Template: blue gradient background (290°, #00BCD4 → #0B2649), Thinkport logo,
 * brand fonts (Hanken Grotesk, Source Sans 3), title/subtitle/tag, page-specific graphic.
 * Fonts are referenced relative to assets/banner/opengraph/ (../fonts/).
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets", "banner", "opengraph");
const BG_SVG_PATH = join(__dirname, "..", "assets", "backgrounds", "5.svg");
const VENITUS_LOGO_PATH = join(__dirname, "..", "assets", "logos", "venitus", "thinkport-venitus-dark.svg");

/** Load and prepare embedded background from 5.svg (scale to cover 1200x630). */
function getEmbeddedBackground() {
  const raw = readFileSync(BG_SVG_PATH, "utf8");
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();
  const styleMatch = inner.match(/<style>[\s\S]*?<\/style>/);
  const bgStyle = styleMatch ? styleMatch[0] : "";
  const graphic = inner.replace(/<style>[\s\S]*?<\/style>/, "").trim();
  const scale = Math.max(1200 / 1024, 630 / 1024);
  return { bgStyle, bgGraphic: `<g transform="translate(600,315) scale(${scale}) translate(-512,-512)">${graphic}</g>` };
}

let bgStyle, bgGraphic;
try {
  const bg = getEmbeddedBackground();
  bgStyle = bg.bgStyle;
  bgGraphic = bg.bgGraphic;
} catch (err) {
  console.error("Failed to load background 5.svg:", err.message);
  process.exit(1);
}

/** Load thinkport-venitus-dark.svg: inner content + viewBox for all OG banners. */
function getVenitusLogo() {
  const raw = readFileSync(VENITUS_LOGO_PATH, "utf8");
  const viewBoxMatch = raw.match(/viewBox\s*=\s*["']([^"']+)["']/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 1580 347";
  const [,, w, h] = viewBox.split(/\s+/).map(Number);
  const content = raw.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim();
  const logoWidth = 380;
  const logoHeight = Math.round((logoWidth * (h || 347)) / (w || 1580));
  return { content, viewBox, logoWidth, logoHeight };
}

let venitusLogo;
try {
  venitusLogo = getVenitusLogo();
} catch (err) {
  console.error("Failed to load thinkport-venitus-dark.svg:", err.message);
  process.exit(1);
}

/** Page-specific decorative graphic (right side). Only pages with a dedicated visual get one; others use only 5.svg background. */
function getPageGraphic(key) {
  switch (key) {
    case "index":
      return "";
    case "colors":
      return `
  <!-- Color swatches (primary palette) -->
  <rect x="850" y="150" width="100" height="100" rx="16" fill="#0B2649"/>
  <rect x="970" y="150" width="100" height="100" rx="16" fill="#FF5722"/>
  <rect x="1090" y="150" width="100" height="100" rx="16" fill="#00BCD4"/>`;
    case "fonts":
      return `
  <!-- Typography sample -->
  <text x="900" y="200" font-family="HankenGrotesk, 'Hanken Grotesk', sans-serif" font-size="120" font-weight="700" fill="#00BCD4" opacity="0.2">Aa</text>
  <text x="900" y="400" font-family="SourceSans3, 'Source Sans 3', sans-serif" font-size="80" font-weight="400" fill="#FF5722" opacity="0.2">Aa</text>`;
    case "avatars":
      return `
  <!-- Avatar examples -->
  <rect x="800" y="200" width="120" height="120" fill="#00BCD4" rx="8"/>
  <rect x="940" y="200" width="120" height="120" fill="#1E2A45" rx="8"/>
  <rect x="800" y="340" width="120" height="120" fill="#FF5722" rx="8"/>
  <rect x="940" y="340" width="120" height="120" fill="#00BCD4" rx="8" opacity="0.7"/>`;
    default:
      return "";
  }
}

const PAGES = [
  {
    key: "index",
    title: "Corporate Identity",
    titleLine2: "&amp; Corporate Design",
    subtitle: "Brand assets, logos, colors, fonts, and guidelines",
    tag: null,
    accentColor: "#00BCD4",
  },
  {
    key: "fundamentals",
    title: "Fundamentals",
    titleLine2: null,
    subtitle: "Logos, colors, typography, icons, and backgrounds",
    tag: null,
    accentColor: "#00BCD4",
  },
  {
    key: "logos",
    title: "Logos",
    titleLine2: null,
    subtitle: "All official logo variants and formats",
    tag: "Horizontal • Single • Icon",
    accentColor: "#00BCD4",
  },
  {
    key: "colors",
    title: "Brand Colors",
    titleLine2: null,
    subtitle: "Official color palette and specifications",
    tag: "Dark Blue • Orange • Turquoise",
    accentColor: "#00BCD4",
  },
  {
    key: "fonts",
    title: "Typography",
    titleLine2: null,
    subtitle: "Brand fonts and typography guidelines",
    tag: "Hanken Grotesk • Source Sans 3",
    accentColor: "#00BCD4",
  },
  {
    key: "backgrounds",
    title: "Backgrounds",
    titleLine2: null,
    subtitle: "Background graphics for hero, 16:9, banner, and web app – preview and SVG download",
    tag: "Hero • 16:9 • Banner • Web App",
    accentColor: "#00BCD4",
  },
  {
    key: "implementations",
    title: "Implementations",
    titleLine2: null,
    subtitle: "Applications and products built from brand fundamentals",
    tag: "Business Cards • Templates • More",
    accentColor: "#00BCD4",
  },
  {
    key: "avatars",
    title: "Avatars",
    titleLine2: null,
    subtitle: "Square avatar graphics with cut-out portraits and brand colors",
    tag: "Square Format • Brand Colors • Cut-out Portraits",
    accentColor: "#FF5722",
  },
  {
    key: "business-cards",
    title: "Business Cards",
    titleLine2: null,
    subtitle: "Digital presentation of official business cards",
    tag: "vCard • QR Code • Brand Identity",
    accentColor: "#00BCD4",
  },
  {
    key: "impressum",
    title: "Impressum",
    titleLine2: null,
    subtitle: "Legal notice and company information",
    tag: "Thinkport GmbH • Frankfurt am Main",
    accentColor: "#00BCD4",
  },
];

function buildSvg(page) {
  const graphic = getPageGraphic(page.key);
  const subtitleY = page.titleLine2 ? 450 : 380;
  const tagY = page.titleLine2 ? 450 : 440;
  const accentY = page.titleLine2 ? 480 : (page.tag ? 460 : 440);
  const titleY2 = page.titleLine2 ? 380 : 320;
  const titleY1 = 320;

  const titleBlock =
    page.titleLine2
      ? `<text x="100" y="${titleY1}" font-family="HankenGrotesk, 'Hanken Grotesk', sans-serif" font-size="64" font-weight="700" fill="#FFFFFF">${page.title}</text>
  <text x="100" y="${titleY2}" font-family="HankenGrotesk, 'Hanken Grotesk', sans-serif" font-size="64" font-weight="700" fill="#FFFFFF">${page.titleLine2}</text>`
      : `<text x="100" y="${titleY1}" font-family="HankenGrotesk, 'Hanken Grotesk', sans-serif" font-size="72" font-weight="700" fill="#FFFFFF">${page.title}</text>`;

  const subtitleEl = `<text x="100" y="${subtitleY}" font-family="SourceSans3, 'Source Sans 3', sans-serif" font-size="28" font-weight="400" fill="#E8E8E8">${page.subtitle}</text>`;
  const tagEl =
    page.tag &&
    `<text x="100" y="${tagY}" font-family="SourceSans3, 'Source Sans 3', sans-serif" font-size="24" font-weight="400" fill="#00BCD4">${page.tag}</text>`;
  const accentEl = `<rect x="100" y="${accentY}" width="200" height="4" fill="${page.accentColor}"/>`;

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${bgStyle}
    <style>
      @font-face {
        font-family: HankenGrotesk;
        src: url("../fonts/hanken-grotesk/500/regular.ttf") format("truetype");
        font-weight: 500 700;
      }
      @font-face {
        font-family: SourceSans3;
        src: url("../fonts/source-sans-3/400/regular.ttf") format("truetype");
        font-weight: 400;
      }
      @font-face {
        font-family: SourceSans3;
        src: url("../fonts/source-sans-3/700/regular.ttf") format("truetype");
        font-weight: 700;
      }
    </style>
    <linearGradient id="contentOverlay" x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#0B2649" stop-opacity="0.72"/>
      <stop offset="0.5" stop-color="#0B2649" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#0B2649" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Background: embedded 5.svg -->
  ${bgGraphic}
  <!-- Dark overlay for contrast (logo + text) -->
  <rect width="1200" height="630" fill="url(#contentOverlay)"/>
${graphic}
  <!-- Thinkport logo (venitus) -->
  <g transform="translate(100, 80)">
    <svg width="${venitusLogo.logoWidth}" height="${venitusLogo.logoHeight}" viewBox="${venitusLogo.viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">${venitusLogo.content}</svg>
  </g>
  <!-- Title (below logo) -->
  ${titleBlock}
  <!-- Subtitle -->
  ${subtitleEl}
${tagEl ? `  ${tagEl}\n` : ""}  <!-- Accent line -->
  ${accentEl}
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const page of PAGES) {
  const outPath = join(OUT_DIR, `${page.key}.svg`);
  writeFileSync(outPath, buildSvg(page), "utf8");
  console.log("Wrote", outPath);
}
console.log("Done. Generated", PAGES.length, "OG banners.");
