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

const LOGO_PATHS = `
      <path fill="#FFFFFF" d="M820.1 162.6l-46.4-61.2-.2-.2h-7.3v78h8.9v-61.4l46.2 61.2.1.2h7.6v-78h-8.9zM683.6 101.2h9.1v78h-9.1zM601.1 134.1H564v-32.9h-9.1v78h9.1v-35.9h37.1v35.9h9.1v-78h-9.1zM434.1 110.4h19.3v68.8h9.2v-68.8h18.9v-9.2h-47.4zM960.1 101.2H948l-36.5 36.7v-36.7h-9.1v78h9.1v-38.6l35.9 38.5.1.1h12.8l-38.1-40.1zM1346.6 142.1c1.9-1.4 3.6-3 4.9-4.9 1.3-1.9 2.4-4 3.2-6.2.8-2.3 1.2-4.7 1.2-7.1 0-3.1-.6-6.1-1.8-8.8-1.2-2.7-2.8-5.1-4.8-7.1s-4.4-3.6-7.1-4.8c-2.7-1.2-5.7-1.8-8.7-1.8h-29.2v78h9.1v-32.9h17.4l18 32.9h10.3l-18-34.1c1.9-.9 3.8-1.9 5.5-3.2zm.2-18.3c0 1.8-.4 3.6-1.1 5.2-.7 1.6-1.7 3-2.9 4.2-1.2 1.2-2.6 2.2-4.2 2.9-1.6.7-3.4 1.1-5.2 1.1h-20.1v-26.8h20.1c1.8 0 3.6.4 5.2 1.1 1.6.7 3.1 1.7 4.3 2.9 1.2 1.2 2.2 2.6 2.9 4.2.6 1.7 1 3.4 1 5.2zM1432.1 101.2v9.2h19.3v68.8h9.2v-68.8h18.9v-9.2zM1221.7 112.3c-3-3.6-6.9-6.6-11.4-8.8-4.6-2.2-9.9-3.3-15.9-3.3s-11.3 1.1-15.8 3.3c-4.5 2.2-8.3 5.1-11.3 8.8-3 3.6-5.3 7.9-6.9 12.6-1.5 4.7-2.3 9.7-2.3 14.9 0 5.2.8 10.2 2.3 15 1.5 4.8 3.8 9.1 6.9 12.8 3 3.7 6.8 6.7 11.3 8.9 4.5 2.2 9.8 3.4 15.8 3.4s11.3-1.1 15.9-3.4c4.6-2.2 8.4-5.2 11.4-8.9s5.3-8 6.9-12.8c1.5-4.8 2.3-9.8 2.3-15 0-5.2-.8-10.2-2.3-14.9-1.6-4.7-3.9-9-6.9-12.6zm-.1 27.6c0 4.2-.6 8.2-1.7 11.9-1.1 3.7-2.9 7-5.1 9.8-2.3 2.8-5.1 5-8.5 6.6s-7.4 2.4-11.9 2.4c-4.4 0-8.4-.8-11.7-2.5-3.3-1.6-6.2-3.9-8.4-6.7-2.3-2.8-4-6.1-5.1-9.8-1.2-3.7-1.7-7.7-1.7-11.8s.6-8.1 1.7-11.8c1.1-3.7 2.9-7 5.1-9.7 2.3-2.8 5.1-5 8.4-6.6 3.3-1.6 7.3-2.4 11.7-2.4 4.5 0 8.5.8 11.9 2.5 3.4 1.6 6.2 3.9 8.5 6.6 2.3 2.8 4 6 5.1 9.7 1.1 3.7 1.7 7.7 1.7 11.8zM1078.1 107.9c-2-2-4.4-3.6-7.1-4.8-2.7-1.2-5.7-1.8-8.7-1.8H1033v78h9.1v-32.9h20.1c3.1 0 6-.6 8.7-1.7s5.1-2.8 7.1-4.8 3.6-4.4 4.8-7.1c1.2-2.7 1.8-5.7 1.8-8.8s-.6-6.1-1.8-8.8c-1.1-2.9-2.7-5.3-4.7-7.3zm-2.5 15.9c0 1.8-.4 3.6-1.1 5.2-.7 1.6-1.7 3-2.9 4.2-1.2 1.2-2.6 2.2-4.2 2.9-1.6.7-3.4 1.1-5.2 1.1h-20.1v-26.8h20.1c1.8 0 3.6.4 5.2 1.1 1.6.7 3.1 1.7 4.3 2.9 1.2 1.2 2.2 2.6 2.9 4.2.6 1.7 1 3.4 1 5.2z"/>
      <path fill="none" d="M158.9 71h-14.1l-2 29.6h16.1zM157.8 224.2c1.4-22.2 5.5-29.7 5.5-43.2 0-13.5-6.4-19.8-6.4-30.6 0-7.9 2.8-12.6 3.7-22.6.3-2.7-.3-7.4-1.7-13.9h-20.5l-9.9 139.8c7.2-2.8 16.7-5.5 28.6-7.1-.1-6.2.2-13.7.7-22.4z"/>
      <path fill="#1eb8d1" d="M130.9 220.1v-.4.4z"/>
      <path fill="#ea592d" d="M133.6 59.4h6.9c17.1-27.7 32.2 0 32.2 0h6.1v10.8L246 53c-19-31.8-53.7-53-93.3-53-36.2 0-68.3 17.8-88.1 45.1l-62.2-11L0 47.2l133.6 23.5V59.4z"/>
      <path fill="#1eb8d1" d="M184.6 100.3v13.4H181l7.4 103.4c39.3-12.9 68.8-47.5 74.3-89.6l53.2 9.4 2.3-13.1-133.6-23.5zM124.7 218.5l7.9-105.3H129v-12.5L44.9 113c0 50.2 33.7 92.6 79.8 105.5z"/>
      <path fill="#1a2846" d="M223.9 263.4c-.2-.9-3.4-1.9-5.2-1.9-8 .2-14.3-2-19.2-7.2-2.2-2.4-4.7-4.7-8.9-4.2l-9.7-136.4h3.6v-13.4h-8l-1.9-30.1h4.1V59.4h-6.1s-15.1-27.7-32.2 0h-6.9v11.3h4.8l-2.5 30H129v12.5h3.7l-10.8 143.6c-1.1.5-2.1 1-3 1.5-2.4 1.1-7.3 4.1-12.7 7.3-4.2 2.4-8.3 5.1-12.5 7.8-2.4 1.5-4.5 2.8-5.7 3.6l.3.9c24.5-.3 44.5-9.7 66.2-14.6-7.8 4.3-15.6 8.6-24.6 13.7 2.3-.3 3-.2 3.6-.4 16-4 32.5-6.7 49.1-6.1 10.1.3 19.9 2.7 29.7 4.9 9.9 2.2 19.8 3.3 29.9 4.5.3-.6.5-1.2.8-1.7-10.9-1.6-17.4-6.3-19.1-14.8zM144.8 71h14.1v29.5h-16.1l2-29.5zm13 153.2c-.6 8.7-.8 16.1-.7 22.5-11.9 1.6-21.4 4.3-28.6 7.1l9.9-139.8h20.5c1.4 6.5 1.9 11.2 1.7 13.9-.9 10-3.7 14.7-3.7 22.6 0 10.8 6.4 17.1 6.4 30.6s-4 20.9-5.5 43.1z"/>
`;

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
  <!-- Thinkport logo -->
  <g transform="translate(100, 80)">
    <svg width="380" height="72" viewBox="0 0 1479 280" fill="none" xmlns="http://www.w3.org/2000/svg">${LOGO_PATHS}
    </svg>
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
