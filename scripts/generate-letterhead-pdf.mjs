#!/usr/bin/env node
/**
 * Generate static A4 letterhead PDF from HTML template.
 *
 * Input:  assets/templates/letterhead-a4.html
 * Output: assets/templates/letterhead-a4.pdf
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { platform } from 'os';
import puppeteer from 'puppeteer';
import { info, success, error } from './misc-cli-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const TEMPLATE_HTML = join(projectRoot, 'assets', 'templates', 'letterhead-a4.html');
const OUTPUT_PDF = join(projectRoot, 'assets', 'templates', 'letterhead-a4.pdf');

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

async function generateLetterheadPdf() {
  if (!existsSync(TEMPLATE_HTML)) {
    throw new Error(`Template not found: ${TEMPLATE_HTML}`);
  }

  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  const executablePath = getChromeExecutablePath();
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
          'Or set PUPPETEER_EXECUTABLE_PATH to your Chrome binary.',
      );
    }
    throw launchErr;
  }

  try {
    const page = await browser.newPage();
    const fileUrl = `file://${TEMPLATE_HTML.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    const outDir = dirname(OUTPUT_PDF);
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    writeFileSync(OUTPUT_PDF, pdfBuffer);
    return OUTPUT_PDF;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function main() {
  info('Generating A4 letterhead PDF...', 'letterhead');
  const out = await generateLetterheadPdf();
  success(`PDF written: ${out}`, 'letterhead');
}

const isMain = process.argv[1] && (process.argv[1].endsWith('generate-letterhead-pdf.mjs') || process.argv[1] === __filename);
if (isMain) {
  main().catch((err) => {
    error(`Letterhead PDF generation failed: ${err.message || err}`, 'letterhead');
    process.exit(1);
  });
}

export { generateLetterheadPdf };
