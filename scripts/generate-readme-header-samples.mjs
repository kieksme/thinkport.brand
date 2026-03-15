#!/usr/bin/env node
/**
 * README Header Sample Banner Generator
 * Generates sample README header banners (1200×200) in Thinkport brand:
 * same front styling as OG banners – 5.svg background, dark overlay, Thinkport logo,
 * Hanken Grotesk title, Source Sans 3 subtitle (optional), turquoise accent line.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import sharp from 'sharp';
import {
  header,
  success,
  error,
  info,
} from './misc-cli-utils.mjs';
import { getProjectRoot } from './config-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = getProjectRoot();

const README_HEADER_SPECS = { width: 1200, height: 200 };
const BG_SVG_PATH = join(projectRoot, 'assets', 'backgrounds', '5.svg');
/** Thinkport + Venitus horizontal logo (dark) for README/GitHub banners */
const LOGO_VENITUS_HORIZONTAL_PATH = join(projectRoot, 'assets', 'logos', 'horizontal', 'thinkport-venitus-dark.svg');

/** Accent color for tag line and underline (matches OG banners) */
const ACCENT_COLOR = '#00BCD4';

const LOGO_VIEWBOX_HEIGHT = 347;
/** Horizontal logo viewBox width (thinkport-venitus-dark.svg) */
const LOGO_VIEWBOX_WIDTH = 1480;
/** Minimum gap between logo and text block when logo is shown */
const MIN_GAP_LOGO_TEXT = 24;
/** Approximate title width: character width as fraction of font size (Hanken Grotesk bold) */
const TITLE_CHAR_WIDTH_RATIO = 0.52;

/** Typography for right-aligned text block (used to compute vertical centering) */
const TITLE_FONT_SIZE = 48;
const SUBTITLE_FONT_SIZE = 22;
const TAG_FONT_SIZE = 20;
const ACCENT_HEIGHT = 4;
const GAP_AFTER_TITLE = -11;
const GAP_AFTER_SUBTITLE = 4;
const GAP_AFTER_TAG = 0;

function getReadmeHeaderLogoContent() {
  if (!existsSync(LOGO_VENITUS_HORIZONTAL_PATH)) {
    throw new Error(`Logo file not found: ${LOGO_VENITUS_HORIZONTAL_PATH}`);
  }
  const raw = readFileSync(LOGO_VENITUS_HORIZONTAL_PATH, 'utf8');
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  const defsMatch = inner.match(/<defs>[\s\S]*?<\/defs>/);
  const logoDefs = defsMatch ? defsMatch[0] : '';
  const logoBody = inner.replace(/<defs>[\s\S]*?<\/defs>/, '').trim();
  return { logoDefs, logoBody };
}

function getReadmeHeaderBackground() {
  const raw = readFileSync(BG_SVG_PATH, 'utf8');
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  const styleMatch = inner.match(/<style>[\s\S]*?<\/style>/);
  const bgStyle = styleMatch ? styleMatch[0] : '';
  const graphic = inner.replace(/<style>[\s\S]*?<\/style>/, '').trim();
  const scale = Math.max(1200 / 1024, 200 / 1024);
  const bgGraphic = `<g transform="translate(600,100) scale(${scale}) translate(-512,-512)">${graphic}</g>`;
  return { bgStyle, bgGraphic };
}

/**
 * Build font-face block for OG-style banners. Use fontPathPrefix so that when the SVG
 * is in assets/ use "", when in examples/github/ use "../../assets/".
 * @param {string} fontPathPrefix - Prefix for font URLs (e.g. "" or "../../assets/")
 * @returns {string} <style> with @font-face rules
 */
function getFontFaceStyle(fontPathPrefix = '') {
  const f = (p) => `${fontPathPrefix}${p}`;
  return `<style>
      @font-face {
        font-family: HankenGrotesk;
        src: url("${f('fonts/hanken-grotesk/500/regular.ttf')}") format("truetype");
        font-weight: 500 700;
      }
      @font-face {
        font-family: SourceSans3;
        src: url("${f('fonts/source-sans-3/400/regular.ttf')}") format("truetype");
        font-weight: 400;
      }
      @font-face {
        font-family: SourceSans3;
        src: url("${f('fonts/source-sans-3/700/regular.ttf')}") format("truetype");
        font-weight: 700;
      }
    </style>`;
}

const ACCENT_LINE_WIDTH = 120;

/**
 * Build full README header SVG (1200×200) with OG-style front: 5.svg background, overlay,
 * Thinkport+Venitus logo (left), title + subtitle + tag + accent line (right-aligned).
 * @param {string} title - Title text (HTML-escape before passing)
 * @param {Object} [options] - Optional subtitle, tag, and font path
 * @param {string} [options.subtitle] - Optional subtitle (HTML-escape before passing)
 * @param {string} [options.tag] - Optional tag line in accent color, e.g. "Dark Blue • Orange • Turquoise" (HTML-escape before passing)
 * @param {string} [options.fontPathPrefix] - Prefix for font URLs ("" for assets/, "../../assets/" for examples/github/)
 * @returns {string} SVG string
 */
function buildReadmeHeaderSvg(title, options = {}) {
  const { subtitle = null, tag = null, fontPathPrefix = '' } = options;
  const { bgStyle, bgGraphic } = getReadmeHeaderBackground();
  const { logoDefs, logoBody } = getReadmeHeaderLogoContent();
  const paddingX = 56;
  const logoScale = (README_HEADER_SPECS.height / LOGO_VIEWBOX_HEIGHT) * 0.6 * 0.6;
  const logoHeight = LOGO_VIEWBOX_HEIGHT * logoScale;
  const logoTop = (README_HEADER_SPECS.height - logoHeight) / 2;
  const logoLeft = paddingX;
  const logoWidth = LOGO_VIEWBOX_WIDTH * logoScale;
  const textMinX = Math.round(logoLeft + logoWidth + MIN_GAP_LOGO_TEXT);
  const textRight = README_HEADER_SPECS.width - paddingX;
  const titleCharCount = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').length;
  const estimatedTitleWidth = titleCharCount * TITLE_FONT_SIZE * TITLE_CHAR_WIDTH_RATIO;
  const showLogo = textRight - estimatedTitleWidth >= textMinX;

  // Vertical centering: block from title top (baseline - font size) to accent bottom
  const blockHeight =
    TITLE_FONT_SIZE +
    GAP_AFTER_TITLE +
    (subtitle ? SUBTITLE_FONT_SIZE + GAP_AFTER_SUBTITLE : 0) +
    (tag ? TAG_FONT_SIZE + GAP_AFTER_TAG : 0) +
    ACCENT_HEIGHT +
    TITLE_FONT_SIZE; // title cap height above baseline
  const blockTop = (README_HEADER_SPECS.height - blockHeight) / 2;
  const titleY = Math.round(blockTop + TITLE_FONT_SIZE);
  const subtitleY = Math.round(titleY + TITLE_FONT_SIZE + GAP_AFTER_TITLE);
  const tagY = subtitle
    ? Math.round(subtitleY + SUBTITLE_FONT_SIZE + GAP_AFTER_SUBTITLE)
    : Math.round(titleY + TITLE_FONT_SIZE + GAP_AFTER_TITLE);
  const accentY = tag
    ? Math.round(tagY + TAG_FONT_SIZE + GAP_AFTER_TAG)
    : subtitle
      ? Math.round(subtitleY + SUBTITLE_FONT_SIZE + GAP_AFTER_SUBTITLE)
      : Math.round(titleY + TITLE_FONT_SIZE + GAP_AFTER_TITLE);

  const clipIdPrefix = 'readme-';
  const logoDefsUnique = logoDefs
    .replace(/id="(clip\d+_[^"]+)"/g, (_, id) => `id="${clipIdPrefix}${id}"`)
    .replace(/url\(#(clip\d+_[^)]+)\)/g, (_, id) => `url(#${clipIdPrefix}${id})`);
  const logoBodyUnique = logoBody
    .replace(/url\(#(clip\d+_[^)]+)\)/g, (_, id) => `url(#${clipIdPrefix}${id})`);

  const titleEl = `<text x="${textRight}" y="${titleY}" text-anchor="end" font-family="HankenGrotesk, 'Hanken Grotesk', sans-serif" font-size="48" font-weight="700" fill="#FFFFFF">${title}</text>`;
  const subtitleEl = subtitle
    ? `\n  <text x="${textRight}" y="${subtitleY}" text-anchor="end" font-family="SourceSans3, 'Source Sans 3', sans-serif" font-size="22" font-weight="400" fill="#E8E8E8">${subtitle}</text>`
    : '';
  const tagEl = tag
    ? `\n  <text x="${textRight}" y="${tagY}" text-anchor="end" font-family="SourceSans3, 'Source Sans 3', sans-serif" font-size="20" font-weight="400" fill="${ACCENT_COLOR}">${tag}</text>`
    : '';
  const accentEl = `<rect x="${textRight - ACCENT_LINE_WIDTH}" y="${accentY}" width="${ACCENT_LINE_WIDTH}" height="4" fill="${ACCENT_COLOR}"/>`;

  return `<svg width="1200" height="200" viewBox="0 0 1200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${bgStyle}
    ${getFontFaceStyle(fontPathPrefix)}
    <linearGradient id="readmeOverlay" x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#0B2649" stop-opacity="0.72"/>
      <stop offset="0.5" stop-color="#0B2649" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#0B2649" stop-opacity="0"/>
    </linearGradient>
    ${logoDefsUnique}
  </defs>
  <!-- Background: embedded 5.svg (same as OG banners) -->
  ${bgGraphic}
  <!-- Dark overlay for contrast -->
  <rect width="1200" height="200" fill="url(#readmeOverlay)"/>
  <!-- Thinkport + Venitus horizontal logo (hidden when title would overlap) -->
${showLogo ? `  <g transform="translate(${logoLeft}, ${logoTop}) scale(${logoScale})">${logoBodyUnique}
  </g>
` : ''}  <!-- Title + subtitle + tag + accent (right-aligned, vertically centred) -->
  ${titleEl}${subtitleEl}${tagEl}
  ${accentEl}
</svg>
`;
}

const EXAMPLE_REPOSITORIES = [
  { id: 'web-app', title: 'Web Application', subtitle: 'Frontend and user interfaces', tag: 'React • TypeScript • Vite' },
  { id: 'api-service', title: 'API Service', subtitle: 'REST and GraphQL backends', tag: 'Node.js • OpenAPI' },
  { id: 'mobile-app', title: 'Mobile App', subtitle: 'iOS and Android applications', tag: 'React Native • Expo' },
  { id: 'cli-tool', title: 'CLI Tool', subtitle: 'Command-line utilities', tag: 'Node.js • ESM' },
  { id: 'library', title: 'JavaScript Library', subtitle: 'Reusable packages and modules', tag: 'npm • TypeScript' },
  { id: 'documentation', title: 'Documentation', subtitle: 'Guides and API reference', tag: 'Markdown • MDX' },
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function generateSampleBanners() {
  const outputDir = join(projectRoot, 'examples', 'github');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  info('Generating sample README header banners (OG-style: 5.svg, overlay, Hanken Grotesk, Source Sans 3, turquoise accent)...');
  info(`Output directory: ${outputDir}`);

  // Update default template used by generate-readme-header.mjs (fonts relative to assets/)
  const defaultTemplatePath = join(projectRoot, 'assets', 'readme-header.svg');
  const defaultSvg = buildReadmeHeaderSvg(escapeXml('Corporate Identity & Corporate Design'), {
    subtitle: 'Brand assets, logos, colors, fonts, and guidelines',
    tag: 'Dark Blue • Orange • Turquoise',
    fontPathPrefix: '',
  });
  writeFileSync(defaultTemplatePath, defaultSvg, 'utf8');
  success(`Updated default template: ${defaultTemplatePath}`);

  for (const repo of EXAMPLE_REPOSITORIES) {
    try {
      const svgContent = buildReadmeHeaderSvg(escapeXml(repo.title), {
        subtitle: repo.subtitle ? escapeXml(repo.subtitle) : null,
        tag: repo.tag ? escapeXml(repo.tag) : null,
        fontPathPrefix: '../../assets/',
      });
      const svgPath = join(outputDir, `sample-readme-header-${repo.id}.svg`);
      writeFileSync(svgPath, svgContent, 'utf8');
      success(`Generated SVG: ${svgPath}`);

      const pngPath = join(outputDir, `sample-readme-header-${repo.id}.png`);
      const pngBuffer = await sharp(Buffer.from(svgContent))
        .resize(README_HEADER_SPECS.width, README_HEADER_SPECS.height, {
          fit: 'contain',
          background: { r: 27, g: 38, b: 73 },
        })
        .png()
        .toBuffer();
      writeFileSync(pngPath, pngBuffer);
      const fileSizeMB = pngBuffer.length / (1024 * 1024);
      success(`Generated PNG: ${pngPath} (${fileSizeMB.toFixed(2)} MB)`);
    } catch (err) {
      error(`Failed to generate banner for ${repo.id}: ${err.message}`);
    }
  }
}

async function main() {
  try {
    console.log(header('README Header Sample Banner Generator', 'OG-style front: 5.svg, overlay, Hanken Grotesk, Source Sans 3, turquoise accent'));
    await generateSampleBanners();
    success('Sample banner generation completed!');
    info(`Generated ${EXAMPLE_REPOSITORIES.length} sample banners in examples/github/`);
  } catch (err) {
    error(`Error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile || process.argv[1].endsWith('generate-readme-header-samples.mjs')) {
  main().catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

export { buildReadmeHeaderSvg, generateSampleBanners, EXAMPLE_REPOSITORIES, README_HEADER_SPECS };
