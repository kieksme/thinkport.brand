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

// Thinkport logo paths (same as OG banners; viewBox 0 0 1479 280)
const LOGO_PATHS = `
      <path fill="#FFFFFF" d="M820.1 162.6l-46.4-61.2-.2-.2h-7.3v78h8.9v-61.4l46.2 61.2.1.2h7.6v-78h-8.9zM683.6 101.2h9.1v78h-9.1zM601.1 134.1H564v-32.9h-9.1v78h9.1v-35.9h37.1v35.9h9.1v-78h-9.1zM434.1 110.4h19.3v68.8h9.2v-68.8h18.9v-9.2h-47.4zM960.1 101.2H948l-36.5 36.7v-36.7h-9.1v78h9.1v-38.6l35.9 38.5.1.1h12.8l-38.1-40.1zM1346.6 142.1c1.9-1.4 3.6-3 4.9-4.9 1.3-1.9 2.4-4 3.2-6.2.8-2.3 1.2-4.7 1.2-7.1 0-3.1-.6-6.1-1.8-8.8-1.2-2.7-2.8-5.1-4.8-7.1s-4.4-3.6-7.1-4.8c-2.7-1.2-5.7-1.8-8.7-1.8h-29.2v78h9.1v-32.9h17.4l18 32.9h10.3l-18-34.1c1.9-.9 3.8-1.9 5.5-3.2zm.2-18.3c0 1.8-.4 3.6-1.1 5.2-.7 1.6-1.7 3-2.9 4.2-1.2 1.2-2.6 2.2-4.2 2.9-1.6.7-3.4 1.1-5.2 1.1h-20.1v-26.8h20.1c1.8 0 3.6.4 5.2 1.1 1.6.7 3.1 1.7 4.3 2.9 1.2 1.2 2.2 2.6 2.9 4.2.6 1.7 1 3.4 1 5.2zM1432.1 101.2v9.2h19.3v68.8h9.2v-68.8h18.9v-9.2zM1221.7 112.3c-3-3.6-6.9-6.6-11.4-8.8-4.6-2.2-9.9-3.3-15.9-3.3s-11.3 1.1-15.8 3.3c-4.5 2.2-8.3 5.1-11.3 8.8-3 3.6-5.3 7.9-6.9 12.6-1.5 4.7-2.3 9.7-2.3 14.9 0 5.2.8 10.2 2.3 15 1.5 4.8 3.8 9.1 6.9 12.8 3 3.7 6.8 6.7 11.3 8.9 4.5 2.2 9.8 3.4 15.8 3.4s11.3-1.1 15.9-3.4c4.6-2.2 8.4-5.2 11.4-8.9s5.3-8 6.9-12.8c1.5-4.8 2.3-9.8 2.3-15 0-5.2-.8-10.2-2.3-14.9-1.6-4.7-3.9-9-6.9-12.6zm-.1 27.6c0 4.2-.6 8.2-1.7 11.9-1.1 3.7-2.9 7-5.1 9.8-2.3 2.8-5.1 5-8.5 6.6s-7.4 2.4-11.9 2.4c-4.4 0-8.4-.8-11.7-2.5-3.3-1.6-6.2-3.9-8.4-6.7-2.3-2.8-4-6.1-5.1-9.8-1.2-3.7-1.7-7.7-1.7-11.8s.6-8.1 1.7-11.8c1.1-3.7 2.9-7 5.1-9.7 2.3-2.8 5.1-5 8.4-6.6 3.3-1.6 7.3-2.4 11.7-2.4 4.5 0 8.5.8 11.9 2.5 3.4 1.6 6.2 3.9 8.5 6.6 2.3 2.8 4 6 5.1 9.7 1.1 3.7 1.7 7.7 1.7 11.8zM1078.1 107.9c-2-2-4.4-3.6-7.1-4.8-2.7-1.2-5.7-1.8-8.7-1.8H1033v78h9.1v-32.9h20.1c3.1 0 6-.6 8.7-1.7s5.1-2.8 7.1-4.8 3.6-4.4 4.8-7.1c1.2-2.7 1.8-5.7 1.8-8.8s-.6-6.1-1.8-8.8c-1.1-2.9-2.7-5.3-4.7-7.3zm-2.5 15.9c0 1.8-.4 3.6-1.1 5.2-.7 1.6-1.7 3-2.9 4.2-1.2 1.2-2.6 2.2-4.2 2.9-1.6.7-3.4 1.1-5.2 1.1h-20.1v-26.8h20.1c1.8 0 3.6.4 5.2 1.1 1.6.7 3.1 1.7 4.3 2.9 1.2 1.2 2.2 2.6 2.9 4.2.6 1.7 1 3.4 1 5.2z"/>
      <path fill="none" d="M158.9 71h-14.1l-2 29.6h16.1zM157.8 224.2c1.4-22.2 5.5-29.7 5.5-43.2 0-13.5-6.4-19.8-6.4-30.6 0-7.9 2.8-12.6 3.7-22.6.3-2.7-.3-7.4-1.7-13.9h-20.5l-9.9 139.8c7.2-2.8 16.7-5.5 28.6-7.1-.1-6.2.2-13.7.7-22.4z"/>
      <path fill="#1eb8d1" d="M130.9 220.1v-.4.4z"/>
      <path fill="#ea592d" d="M133.6 59.4h6.9c17.1-27.7 32.2 0 32.2 0h6.1v10.8L246 53c-19-31.8-53.7-53-93.3-53-36.2 0-68.3 17.8-88.1 45.1l-62.2-11L0 47.2l133.6 23.5V59.4z"/>
      <path fill="#1eb8d1" d="M184.6 100.3v13.4H181l7.4 103.4c39.3-12.9 68.8-47.5 74.3-89.6l53.2 9.4 2.3-13.1-133.6-23.5zM124.7 218.5l7.9-105.3H129v-12.5L44.9 113c0 50.2 33.7 92.6 79.8 105.5z"/>
      <path fill="#1a2846" d="M223.9 263.4c-.2-.9-3.4-1.9-5.2-1.9-8 .2-14.3-2-19.2-7.2-2.2-2.4-4.7-4.7-8.9-4.2l-9.7-136.4h3.6v-13.4h-8l-1.9-30.1h4.1V59.4h-6.1s-15.1-27.7-32.2 0h-6.9v11.3h4.8l-2.5 30H129v12.5h3.7l-10.8 143.6c-1.1.5-2.1 1-3 1.5-2.4 1.1-7.3 4.1-12.7 7.3-4.2 2.4-8.3 5.1-12.5 7.8-2.4 1.5-4.5 2.8-5.7 3.6l.3.9c24.5-.3 44.5-9.7 66.2-14.6-7.8 4.3-15.6 8.6-24.6 13.7 2.3-.3 3-.2 3.6-.4 16-4 32.5-6.7 49.1-6.1 10.1.3 19.9 2.7 29.7 4.9 9.9 2.2 19.8 3.3 29.9 4.5.3-.6.5-1.2.8-1.7-10.9-1.6-17.4-6.3-19.1-14.8zM144.8 71h14.1v29.5h-16.1l2-29.5zm13 153.2c-.6 8.7-.8 16.1-.7 22.5-11.9 1.6-21.4 4.3-28.6 7.1l9.9-139.8h20.5c1.4 6.5 1.9 11.2 1.7 13.9-.9 10-3.7 14.7-3.7 22.6 0 10.8 6.4 17.1 6.4 30.6s-4 20.9-5.5 43.1z"/>
`;

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
 * Build full README header SVG (1200×200) with Thinkport brand: 5.svg background, overlay, logo, title.
 * @param {string} title - Title text (HTML-escape before passing)
 * @returns {string} SVG string
 */
function buildReadmeHeaderSvg(title) {
  const { bgStyle, bgGraphic } = getReadmeHeaderBackground();
  const logoScale = 48 / 280; // logo height 48px from viewBox height 280
  return `<svg width="1200" height="200" viewBox="0 0 1200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${bgStyle}
    <linearGradient id="readmeOverlay" x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0" stop-color="#0B2649" stop-opacity="0.72"/>
      <stop offset="0.5" stop-color="#0B2649" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#0B2649" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Background: embedded 5.svg -->
  ${bgGraphic}
  <!-- Dark overlay for contrast -->
  <rect width="1200" height="200" fill="url(#readmeOverlay)"/>
  <!-- Thinkport logo (scale to 48px height) -->
  <g transform="translate(40, 20) scale(${logoScale})">
    <svg width="253" height="48" viewBox="0 0 1479 280" fill="none" xmlns="http://www.w3.org/2000/svg">${LOGO_PATHS}
    </svg>
  </g>
  <!-- Title (Hanken Grotesk) -->
  <text x="40" y="130" font-family="'Hanken Grotesk', sans-serif" font-size="32" font-weight="700" fill="#FFFFFF">${title}</text>
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
