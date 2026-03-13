#!/usr/bin/env node
/**
 * Portfolio PDF generator (HTML + Puppeteer)
 *
 * Renders a single-page portfolio per person with skill graphs (years of experience).
 * Output: PDF to a given path (e.g. release-assets/staff/portfolios/portfolio-<slug>.pdf).
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { platform } from 'os';
import puppeteer from 'puppeteer';
import { loadConfig } from './config-loader.mjs';
import { info, error } from './misc-cli-utils.mjs';

/**
 * Resolve Chrome/Chromium executable for Puppeteer.
 * Uses PUPPETEER_EXECUTABLE_PATH if set; otherwise on macOS tries system Google Chrome.
 * @returns {string|undefined}
 */
function getChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (platform() === 'darwin') {
    const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (existsSync(macChrome)) {
      return macChrome;
    }
  }
  return undefined;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const CONFIG = loadConfig();
const NAVY = CONFIG.brand?.colors?.navy ?? '#1E2A45';
const ORANGE = '#FF5722';
const WHITE = CONFIG.brand?.colors?.white ?? '#FFFFFF';
const LIGHT_GRAY = CONFIG.brand?.colors?.lightGray ?? '#CCCCCC';
const DARK_GRAY = CONFIG.brand?.colors?.darkGray ?? '#333333';

/**
 * Escape string for safe HTML text content.
 * @param {string} s
 * @returns {string}
 */
function escapeHtml(s) {
  if (s == null || typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build single-page portfolio HTML for a person.
 * Skills are shown as horizontal bars (years of experience); already sorted by years desc in normalized data.
 * @param {Object} person - Normalized person with optional skills[]
 * @returns {string} Full HTML document
 */
export function buildPortfolioHtml(person) {
  const name = escapeHtml(person.name ?? '');
  const position = escapeHtml(person.position ?? '');
  const email = escapeHtml(person.email ?? '');
  const companyName = escapeHtml(person.companyName ?? 'Thinkport GmbH');
  const skills = Array.isArray(person.skills) ? person.skills : [];
  const maxYears = Math.max(
    1,
    ...skills.map((s) => (s.yearsOfExperience != null ? s.yearsOfExperience : 0)),
  );

  const skillRows = skills
    .map((s) => {
      const label = escapeHtml(s.name || s.id || '');
      const years = s.yearsOfExperience != null ? s.yearsOfExperience : 0;
      const pct = maxYears > 0 ? Math.min(100, (years / maxYears) * 100) : 0;
      return `
        <div class="skill-row">
          <span class="skill-label">${label}</span>
          <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${pct}%"></div></div>
          <span class="skill-years">${years} ${years === 1 ? 'Jahr' : 'Jahre'}</span>
        </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${name} – Portfolio</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11pt; color: ${DARK_GRAY}; }
    .page { width: 210mm; min-height: 297mm; padding: 0; }
    .header { background: ${NAVY}; color: ${WHITE}; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
    .header-left { flex: 1; }
    .header h1 { margin: 0 0 4px 0; font-size: 22pt; font-weight: 600; }
    .header .position { color: ${ORANGE}; font-size: 12pt; margin: 0 0 8px 0; }
    .header .meta { font-size: 9pt; color: ${LIGHT_GRAY}; }
    .header .avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; background: ${LIGHT_GRAY}; }
    .section { padding: 16px 24px; }
    .section.skills { background: ${ORANGE}; color: ${WHITE}; }
    .section.skills h2 { margin: 0 0 12px 0; font-size: 12pt; font-weight: 600; }
    .skill-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 10pt; }
    .skill-label { flex: 0 0 180px; }
    .skill-bar-track { flex: 1; height: 10px; background: rgba(255,255,255,0.3); border-radius: 4px; overflow: hidden; }
    .skill-bar-fill { height: 100%; background: ${WHITE}; border-radius: 4px; transition: width 0.2s; }
    .skill-years { flex: 0 0 52px; text-align: right; font-size: 9pt; }
    .body-section h2 { margin: 0 0 8px 0; font-size: 11pt; color: ${ORANGE}; }
    .body-section p { margin: 0; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      <div class="header-left">
        <h1>${name}</h1>
        <p class="position">${position}</p>
        <p class="meta">${email ? `E-Mail: ${email}` : ''} ${companyName ? ` · ${companyName}` : ''}</p>
      </div>
      ${person.imageUrl ? `<img class="avatar" src="${escapeHtml(person.imageUrl)}" alt="">` : ''}
    </header>
    <section class="section skills">
      <h2>Skills & Erfahrung</h2>
      ${skillRows || '<p>Keine Skills hinterlegt.</p>'}
    </section>
    <section class="section body-section">
      <h2>Über mich</h2>
      <p>${companyName}</p>
    </section>
  </div>
</body>
</html>`;
}

/**
 * Generate portfolio PDF for one person and write to outputPath.
 * @param {Object} person - Normalized person (name, slug, position, email, companyName, skills[], imageUrl optional)
 * @param {string} outputPath - Full path for the PDF file
 * @returns {Promise<string>} Resolved with outputPath on success
 */
export async function generatePortfolioPdf(person, outputPath) {
  const html = buildPortfolioHtml(person);
  const executablePath = getChromeExecutablePath();
  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }
  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (launchErr) {
    const msg = launchErr.message || String(launchErr);
    if (/Could not find Chrome|chromium/i.test(msg)) {
      throw new Error(
        'Chrome/Chromium not found. Install with: pnpm exec puppeteer browsers install chrome. ' +
          'Or set PUPPETEER_EXECUTABLE_PATH to your Chrome binary, or install Google Chrome (macOS: /Applications/Google Chrome.app).',
      );
    }
    throw launchErr;
  }
  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: false,
    });
    await browser.close();
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(outputPath, pdfBuffer);
    return outputPath;
  } catch (err) {
    await browser.close().catch(() => {});
    throw new Error(`Portfolio PDF generation failed: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * CLI entry when run as main (e.g. for single-person or sample run).
 * Usage: node scripts/generate-portfolio-pdf.mjs [--slug <slug>]
 * Without --slug: fetch all active people and generate into default output dir.
 */
async function main() {
  const args = process.argv.slice(2);
  let slugFilter = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && i + 1 < args.length) {
      slugFilter = args[++i];
      break;
    }
  }

  const { getActivePeople } = await import('./thinkport-api-client.mjs');
  const outputDir = join(projectRoot, 'release-assets', 'staff', 'portfolios');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  let people = await getActivePeople();
  if (slugFilter) {
    const lower = String(slugFilter).toLowerCase();
    people = people.filter((p) => p.slug && p.slug.toLowerCase().includes(lower));
  }

  for (const person of people) {
    const outputPath = join(outputDir, `portfolio-${person.slug}.pdf`);
    try {
      await generatePortfolioPdf(person, outputPath);
      info('Portfolio generated', person.slug);
    } catch (err) {
      error(`Portfolio failed for ${person.slug}: ${err.message}`);
    }
  }
}

const currentFile = fileURLToPath(import.meta.url);
const isMain =
  process.argv[1] &&
  (currentFile === process.argv[1] ||
    currentFile.endsWith(process.argv[1]) ||
    process.argv[1].endsWith('generate-portfolio-pdf.mjs'));
if (isMain) {
  main().catch((err) => {
    error(err.message);
    process.exit(1);
  });
}
