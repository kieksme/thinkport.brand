#!/usr/bin/env node
/**
 * README Header Sample Banner Generator
 * Generates sample README header banners (1200×200) in Thinkport brand:
 * embedded 5.svg background, dark overlay, Thinkport logo, Hanken Grotesk title.
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

const LOGO_VIEWBOX_HEIGHT = 347;

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
 * Build full README header SVG (1200×200) with Thinkport brand: 5.svg background, overlay, Thinkport+Venitus horizontal logo, title.
 * @param {string} title - Title text (HTML-escape before passing)
 * @returns {string} SVG string
 */
function buildReadmeHeaderSvg(title) {
  const { bgStyle, bgGraphic } = getReadmeHeaderBackground();
  const { logoDefs, logoBody } = getReadmeHeaderLogoContent();
  const paddingX = 56;
  const logoScale = (README_HEADER_SPECS.height / LOGO_VIEWBOX_HEIGHT) * 0.6 * 0.6;
  const logoHeight = LOGO_VIEWBOX_HEIGHT * logoScale;
  const logoTop = (README_HEADER_SPECS.height - logoHeight) / 2;
  const logoLeft = paddingX;
  const titleX = README_HEADER_SPECS.width - paddingX;
  const titleY = README_HEADER_SPECS.height / 2 + 20;
  const clipIdPrefix = 'readme-';
  const logoDefsUnique = logoDefs
    .replace(/id="(clip\d+_[^"]+)"/g, (_, id) => `id="${clipIdPrefix}${id}"`)
    .replace(/url\(#(clip\d+_[^)]+)\)/g, (_, id) => `url(#${clipIdPrefix}${id})`);
  const logoBodyUnique = logoBody
    .replace(/url\(#(clip\d+_[^)]+)\)/g, (_, id) => `url(#${clipIdPrefix}${id})`);
  return `<svg width="1200" height="200" viewBox="0 0 1200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${bgStyle}
    <linearGradient id="readmeOverlay" x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#0B2649" stop-opacity="0.72"/>
      <stop offset="0.5" stop-color="#0B2649" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#0B2649" stop-opacity="0"/>
    </linearGradient>
    ${logoDefsUnique}
  </defs>
  <!-- Background: embedded 5.svg -->
  ${bgGraphic}
  <!-- Dark overlay for contrast -->
  <rect width="1200" height="200" fill="url(#readmeOverlay)"/>
  <!-- Thinkport + Venitus horizontal logo (70% of banner height, vertically centred) -->
  <g transform="translate(${logoLeft}, ${logoTop}) scale(${logoScale})">${logoBodyUnique}
  </g>
  <!-- Title (Montserrat 400) – right-aligned, vertically centred -->
  <text x="${titleX}" y="${titleY}" text-anchor="end" font-family="'Montserrat', sans-serif" font-size="56" font-weight="200" fill="#FFFFFF">${title}</text>
</svg>
`;
}

const EXAMPLE_REPOSITORIES = [
  { id: 'web-app', title: 'Web Application' },
  { id: 'api-service', title: 'API Service' },
  { id: 'mobile-app', title: 'Mobile App' },
  { id: 'cli-tool', title: 'CLI Tool' },
  { id: 'library', title: 'JavaScript Library' },
  { id: 'documentation', title: 'Documentation' },
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

  info('Generating sample README header banners (Thinkport brand: 5.svg, logo, Hanken Grotesk)...');
  info(`Output directory: ${outputDir}`);

  // Update default template used by generate-readme-header.mjs
  const defaultTemplatePath = join(projectRoot, 'assets', 'readme-header.svg');
  const defaultSvg = buildReadmeHeaderSvg(escapeXml('Corporate Identity & Corporate Design'));
  writeFileSync(defaultTemplatePath, defaultSvg, 'utf8');
  success(`Updated default template: ${defaultTemplatePath}`);

  for (const repo of EXAMPLE_REPOSITORIES) {
    try {
      const svgContent = buildReadmeHeaderSvg(escapeXml(repo.title));
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
    console.log(header('README Header Sample Banner Generator', 'Thinkport brand: background 5.svg, logo, Hanken Grotesk'));
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
