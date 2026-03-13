#!/usr/bin/env node
/**
 * Generate staff assets (avatars, business cards, email footers) for all active Thinkport employees.
 *
 * - Fetches people from Thinkport GraphQL API (Basic Auth via THINKPORT_API_USERNAME/PASSWORD)
 * - Generates avatars (multiple sizes, incl. grayscale variant) from remote image URLs
 * - Generates business card PDFs (front/back) using existing pdf-lib generator
 * - Generates HTML + plain text email footers from templates
 * - Writes everything into release-assets/staff/* for later packaging in CI
 *
 * Usage:
 *   node scripts/generate-staff-assets.mjs [--slug <substring>]
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import os from 'os';

import { getActiveThinkportPeople } from './thinkport-api-client.mjs';
import { generateAvatar } from './generate-avatar.mjs';
import { generateBusinessCardWithPdfLib } from './generate-card.mjs';
import { renderTemplate } from './template-engine.mjs';
import { header, info, success, warn, error, endGroup, table } from './misc-cli-utils.mjs';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const STAFF_BASE_DIR = join(projectRoot, 'release-assets', 'staff');
const AVATAR_DIR = join(STAFF_BASE_DIR, 'avatars');
const CARD_DIR = join(STAFF_BASE_DIR, 'business-cards');
const FOOTER_HTML_DIR = join(STAFF_BASE_DIR, 'email-footers');
const FOOTER_TEXT_DIR = join(STAFF_BASE_DIR, 'email-footers-text');
const REPORT_DIR = join(STAFF_BASE_DIR, 'reports');

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    slugFilter: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--slug' && i + 1 < args.length) {
      result.slugFilter = String(args[++i]).toLowerCase();
    }
  }

  return result;
}

/**
 * Download a remote image URL to a temporary file and return its path.
 * @param {string} url
 * @param {string} slug
 * @returns {Promise<string>}
 */
async function downloadImageToTempFile(url, slug) {
  const safeSlug = slug || 'person';
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(`Failed to fetch image: ${err.message}`);
  }

  if (!response.ok) {
    throw new Error(`Image download HTTP ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const tmpDir = join(os.tmpdir(), 'thinkport-staff-avatars');
  ensureDir(tmpDir);
  const tmpPath = join(tmpDir, `${safeSlug}.png`);
  writeFileSync(tmpPath, buffer);
  return tmpPath;
}

async function generateAvatarsForPeople(people) {
  ensureDir(AVATAR_DIR);
  ensureDir(REPORT_DIR);

  const sizes = [256, 512];
  const skipped = [];
  let generatedCount = 0;

  for (const person of people) {
    const slug = person.slug;
    const imageUrl = person.imageUrl;

    if (!imageUrl) {
      warn(`Skipping avatar – no image URL`, slug);
      skipped.push({ slug, reason: 'missing_image_url' });
      continue;
    }

    info(`Generating avatars`, slug);

    let portraitPath;
    try {
      portraitPath = await downloadImageToTempFile(imageUrl, slug);
    } catch (err) {
      error(`Skipping avatar – image download failed: ${err.message}`, slug);
      skipped.push({ slug, reason: 'image_download_failed', message: err.message });
      continue;
    }

    for (const size of sizes) {
      const baseName = `avatar-${slug}-${size}.png`;
      const fullColorPath = join(AVATAR_DIR, baseName);
      const grayscalePath = join(AVATAR_DIR, `avatar-${slug}-${size}-grayscale.png`);

      try {
        await generateAvatar(portraitPath, size, fullColorPath);
        await generateAvatar(portraitPath, size, grayscalePath, { grayscalePortrait: true });
        generatedCount += 2;
      } catch (err) {
        error(`Failed to generate avatar at size ${size}: ${err.message}`, slug);
        skipped.push({
          slug,
          reason: 'avatar_generation_failed',
          size,
          message: err.message,
        });
        break;
      }
    }
  }

  const reportPath = join(REPORT_DIR, 'avatar-skipped.json');
  writeFileSync(reportPath, JSON.stringify({ skipped }, null, 2), 'utf8');

  success(`Avatar generation finished – ${generatedCount} files created`);
  info(`Avatar skip report: ${reportPath}`);
}

function formatWebsiteForDisplay(person) {
  const raw = person.companyUrl || 'thinkport.digital';

  try {
    const hasProtocol = raw.startsWith('http://') || raw.startsWith('https://');
    const url = new URL(hasProtocol ? raw : `https://${raw}`);
    let host = url.hostname.replace(/^www\./i, '');
    const path = url.pathname && url.pathname !== '/' ? url.pathname.replace(/\/+$/, '') : '';
    return path ? `${host}${path}` : host;
  } catch {
    return raw
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '');
  }
}

function toBusinessCardContact(person) {
  const website = formatWebsiteForDisplay(person);

  return {
    name: person.name,
    position: person.position || '',
    email: person.email || '',
    phone: '',
    mobile: '',
    address: person.street || person.addressLine || '',
    postalCode: person.postalCode || '',
    city: person.locationCity || '',
    country: person.locationCountry || 'Deutschland',
    website,
    socialMedia: null,
  };
}

async function generateBusinessCardsForPeople(people) {
  ensureDir(CARD_DIR);

  for (const person of people) {
    const slug = person.slug;
    const contact = toBusinessCardContact(person);
    info(`Generating business card PDFs`, slug);

    try {
      await generateBusinessCardWithPdfLib(contact, CARD_DIR);
    } catch (err) {
      error(`Failed to generate business card: ${err.message}`, slug);
    }
  }

  success(`Business card generation finished`);
}

function buildFooterData(person) {
  const companyName = person.companyName || 'Thinkport GmbH';
  const address = person.addressLine || '';
  const year = new Date().getFullYear();

  return {
    companyName,
    address,
    name: person.name,
    position: person.position || '',
    email: person.email || '',
    phone: '',
    year,
    representatives: '',
    impressumUrl: 'https://thinkport.digital/impressum',
  };
}

function loadFooterTemplates() {
  const htmlTemplatePath = join(
    projectRoot,
    'assets',
    'templates',
    'email-footer.html',
  );
  const textTemplatePath = join(
    projectRoot,
    'assets',
    'templates',
    'email-footer-plain-text.txt',
  );

  const htmlTemplate = readFileSync(htmlTemplatePath, 'utf8');
  const textTemplate = readFileSync(textTemplatePath, 'utf8');

  return { htmlTemplate, textTemplate };
}

async function generateEmailFootersForPeople(people) {
  ensureDir(FOOTER_HTML_DIR);
  ensureDir(FOOTER_TEXT_DIR);

  const { htmlTemplate, textTemplate } = loadFooterTemplates();

  for (const person of people) {
    const slug = person.slug;
    const data = buildFooterData(person);
    const html = renderTemplate(htmlTemplate, data);
    const text = renderTemplate(textTemplate, data);

    const htmlPath = join(FOOTER_HTML_DIR, `email-footer-${slug}.html`);
    const textPath = join(FOOTER_TEXT_DIR, `email-footer-${slug}.txt`);

    writeFileSync(htmlPath, html, 'utf8');
    writeFileSync(textPath, text, 'utf8');

    info(`Email footer generated`, slug);
  }

  success(`Email footer generation finished`);
}

async function main() {
  const args = parseArgs();

  header(
    'Thinkport Staff Assets',
    'Generate avatars, business cards, and email footers for active Thinkport staff',
    'bgCyan',
  );

  ensureDir(STAFF_BASE_DIR);
  ensureDir(REPORT_DIR);

  try {
    info('Fetching active Thinkport people from API...');
    let people = await getActiveThinkportPeople();

    if (args.slugFilter) {
      const filter = args.slugFilter;
      people = people.filter((p) => p.slug.toLowerCase().includes(filter));
      warn(
        `Slug filter active ("${filter}") – processing ${people.length} person(s)`,
        'filter',
      );
    }

    if (people.length === 0) {
      warn('No people returned from API after filtering – nothing to do');
      return;
    }

    table(
      ['Slug', 'Name', 'Email', 'Location'],
      people.map((p) => [
        p.slug,
        p.name,
        p.email || '',
        p.locationName || '',
      ]),
      { padding: 2, headerColor: 'cyan', border: false },
    );

    await generateAvatarsForPeople(people);
    await generateBusinessCardsForPeople(people);
    await generateEmailFootersForPeople(people);

    success('All staff assets generated successfully');
  } catch (err) {
    error(`Staff asset generation failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    endGroup();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line no-console
  main().catch((err) => {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
  });
}

