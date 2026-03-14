#!/usr/bin/env node
/**
 * Generate staff assets (avatars, business cards, email footers, portfolio PDFs) for active staff.
 *
 * - Fetches people from Thinkport GraphQL API (Basic Auth via THINKPORT_API_USERNAME/PASSWORD)
 * - Generates avatars (multiple sizes, incl. grayscale variant and one set with random background from assets/backgrounds) from remote image URLs
 * - Generates iOS posters (template + portrait + job title) into release-assets/staff/ios-posters
 * - Generates business card PDFs (front/back) using existing pdf-lib generator
 * - Generates vCards (.vcf) into release-assets/staff/vcards
 * - Generates portfolio PDFs (Thinkport staff only, with skill graphs) into release-assets/staff/portfolios
 * - Generates HTML + plain text email footers from templates
 * - Writes everything into release-assets/staff/* for later packaging in CI
 *
 * Usage:
 *   node scripts/generate-staff-assets.mjs [--slug <substring>]
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import os from 'os';
import dotenv from 'dotenv';

import { getActiveThinkportPeople, getActiveThinkportPeopleWithSkills } from './thinkport-api-client.mjs';
import { generateAvatar } from './generate-avatar.mjs';
import { generateIosPoster } from './generate-ios-poster.mjs';
import { generateBusinessCardWithPdfLib, generateVCard } from './generate-card.mjs';
import { generatePortfolioPdf } from './generate-portfolio-pdf.mjs';
import { renderTemplate } from './template-engine.mjs';
import { header, info, success, warn, error, endGroup, table } from './misc-cli-utils.mjs';
import { loadConfig, getVcardOffice } from './config-loader.mjs';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

dotenv.config({ path: join(projectRoot, '.env') });

const STAFF_BASE_DIR = join(projectRoot, 'release-assets', 'staff');
const AVATAR_DIR = join(STAFF_BASE_DIR, 'avatars');
const IOS_POSTER_DIR = join(STAFF_BASE_DIR, 'ios-posters');
const CARD_DIR = join(STAFF_BASE_DIR, 'business-cards');
const VCARD_DIR = join(STAFF_BASE_DIR, 'vcards');
const PORTFOLIO_DIR = join(STAFF_BASE_DIR, 'portfolios');
const FOOTER_HTML_DIR = join(STAFF_BASE_DIR, 'email-footers');
const FOOTER_TEXT_DIR = join(STAFF_BASE_DIR, 'email-footers-text');
const REPORT_DIR = join(STAFF_BASE_DIR, 'reports');
const BACKGROUNDS_DIR = join(projectRoot, 'assets', 'backgrounds');

/**
 * List SVG files in assets/backgrounds and return one random path (relative to project root).
 * Excludes dark variants (filenames containing "-dark" before .svg) so only light backgrounds are chosen.
 * @returns {string|null} Path like "assets/backgrounds/7.svg" or null if none found
 */
function pickRandomBackgroundPath() {
  if (!existsSync(BACKGROUNDS_DIR)) return null;
  const files = readdirSync(BACKGROUNDS_DIR).filter(
    (f) => f.endsWith('.svg') && !f.toLowerCase().includes('-dark')
  );
  if (files.length === 0) return null;
  const chosen = files[Math.floor(Math.random() * files.length)];
  return join('assets', 'backgrounds', chosen);
}

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    slugFilter: null,
    vcardsOnly: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--slug' && i + 1 < args.length) {
      result.slugFilter = String(args[++i]).toLowerCase();
    } else if (arg === '--vcards-only') {
      result.vcardsOnly = true;
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

/**
 * Fetch a remote image and return base64 + MIME type for vCard PHOTO;ENCODING=b.
 * Many contact apps only display photos when embedded as base64, not as URI.
 * @param {string} url - Image URL (e.g. from API)
 * @returns {Promise<{ base64: string, type: string }|null>} PNG/JPEG type and base64, or null on failure
 */
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const type = contentType.includes('png') ? 'PNG' : 'JPEG';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return { base64, type };
  } catch {
    return null;
  }
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

    // One additional avatar set per person with a random background from assets/backgrounds
    const randomBgPath = pickRandomBackgroundPath();
    if (randomBgPath) {
      const bgName = randomBgPath.split('/').pop()?.replace(/\.svg$/i, '') || 'bg';
      for (const size of sizes) {
        const altPath = join(AVATAR_DIR, `avatar-${slug}-${size}-bg-${bgName}.png`);
        try {
          await generateAvatar(portraitPath, size, altPath, { backgroundPath: randomBgPath });
          generatedCount += 1;
        } catch (err) {
          error(`Failed to generate avatar with background ${bgName} at size ${size}: ${err.message}`, slug);
        }
      }
    }
  }

  const reportPath = join(REPORT_DIR, 'avatar-skipped.json');
  writeFileSync(reportPath, JSON.stringify({ skipped }, null, 2), 'utf8');

  success(`Avatar generation finished – ${generatedCount} files created`);
  info(`Avatar skip report: ${reportPath}`);
}

async function generatePostersForPeople(people) {
  ensureDir(IOS_POSTER_DIR);

  let generatedCount = 0;

  for (const person of people) {
    const slug = person.slug;
    const companyName = (person.companyName || '').toLowerCase();
    if (!companyName.includes('thinkport')) {
      warn(`Skipping iOS poster – external (not Thinkport)`, slug);
      continue;
    }

    const imageUrl = person.imageUrl;
    const jobTitle = person.position || '';

    if (!imageUrl) {
      warn(`Skipping iOS poster – no image URL`, slug);
      continue;
    }

    info(`Generating iOS poster`, slug);

    let portraitPath;
    try {
      portraitPath = await downloadImageToTempFile(imageUrl, slug);
    } catch (err) {
      error(`Skipping poster – image download failed: ${err.message}`, slug);
      continue;
    }

    const outputPath = join(IOS_POSTER_DIR, `poster-${slug}.png`);
    try {
      await generateIosPoster(portraitPath, jobTitle, outputPath);
      generatedCount++;
    } catch (err) {
      error(`Failed to generate iOS poster: ${err.message}`, slug);
    }
  }

  success(`iOS poster generation finished – ${generatedCount} files created`);
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
    phone: person.phone || '',
    mobile: person.mobile || '',
    address: person.street || person.addressLine || '',
    postalCode: person.postalCode || '',
    city: person.locationCity || '',
    country: person.locationCountry || 'Deutschland',
    website,
    socialMedia: null,
  };
}

/**
 * Try to load poster image as base64 for vCard PHOTO. Uses iOS poster if present, so the vCard shows the poster (template + portrait + job title).
 * @param {string} slug - Person slug
 * @returns {{ base64: string, type: 'PNG' }|null}
 */
function loadPosterAsBase64(slug) {
  const posterPath = join(IOS_POSTER_DIR, `poster-${slug}.png`);
  if (!existsSync(posterPath)) return null;
  try {
    const buffer = readFileSync(posterPath);
    return { base64: buffer.toString('base64'), type: 'PNG' };
  } catch {
    return null;
  }
}

async function generateVcardsForPeople(people) {
  ensureDir(VCARD_DIR);
  const config = loadConfig();
  let generatedCount = 0;
  for (const person of people) {
    const slug = person.slug;
    const office = getVcardOffice(config, person.locationCity ?? null, person.locationId ?? null);
    let photoBase64 = undefined;
    let photoType = undefined;
    // Prefer poster image (template + portrait + job title) when available; otherwise avatar from API
    const posterPhoto = loadPosterAsBase64(slug);
    if (posterPhoto) {
      photoBase64 = posterPhoto.base64;
      photoType = posterPhoto.type;
    } else if (person.imageUrl) {
      const fetched = await fetchImageAsBase64(person.imageUrl);
      if (fetched) {
        photoBase64 = fetched.base64;
        photoType = fetched.type;
      }
    }
    const contact = {
      ...toBusinessCardContact(person),
      companyName: person.companyName || 'Thinkport GmbH',
      photoUrl: photoBase64 ? undefined : (person.imageUrl || undefined),
      photoBase64,
      photoType,
      geo: office?.geo,
      tz: office?.tz,
      note: config?.vcard?.defaultNote ?? undefined,
      categories: config?.vcard?.defaultCategories ?? undefined,
    };
    const vcard = generateVCard(contact);
    const outputPath = join(VCARD_DIR, `${slug}.vcf`);
    writeFileSync(outputPath, vcard, 'utf8');
    info(`vCard generated`, slug);
    generatedCount++;
  }
  success(`vCard generation finished – ${generatedCount} files created`);
}

async function generatePortfoliosForPeople(people) {
  ensureDir(PORTFOLIO_DIR);
  let generatedCount = 0;
  for (const person of people) {
    const slug = person.slug;
    const outputPath = join(PORTFOLIO_DIR, `portfolio-${slug}.pdf`);
    try {
      await generatePortfolioPdf(person, outputPath);
      info(`Portfolio generated`, slug);
      generatedCount++;
    } catch (err) {
      error(`Portfolio failed for ${slug}: ${err.message}`);
    }
  }
  success(`Portfolio PDF generation finished – ${generatedCount} files created`);
}

async function generateBusinessCardsForPeople(people) {
  ensureDir(CARD_DIR);

  for (const person of people) {
    const slug = person.slug;
    const contact = toBusinessCardContact(person);
    info(`Generating business card PDFs`, slug);

    // Write staff business cards into a per-person directory so we can package
    // one ZIP per person easily in the release workflow.
    const personCardDir = join(CARD_DIR, slug);
    ensureDir(personCardDir);

    const contactWithPhoto = {
      ...contact,
      photoUrl: person.imageUrl || undefined,
    };
    try {
      await generateBusinessCardWithPdfLib(contactWithPhoto, personCardDir);
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
    let thinkportPeople = await getActiveThinkportPeople();
    info('Fetching Thinkport people (with skills) for portfolios...');
    let thinkportPeopleWithSkills = await getActiveThinkportPeopleWithSkills();

    if (args.slugFilter) {
      const filter = args.slugFilter;
      thinkportPeople = thinkportPeople.filter((p) => p.slug.toLowerCase().includes(filter));
      thinkportPeopleWithSkills = thinkportPeopleWithSkills.filter((p) => p.slug.toLowerCase().includes(filter));
      warn(
        `Slug filter active ("${filter}") – Thinkport: ${thinkportPeople.length}`,
        'filter',
      );
    }

    if (thinkportPeople.length === 0 && thinkportPeopleWithSkills.length === 0) {
      warn('No Thinkport people returned from API after filtering – nothing to do');
      return;
    }

    table(
      ['Slug', 'Name', 'Email', 'Location'],
      (thinkportPeople.length > 0 ? thinkportPeople : thinkportPeopleWithSkills).map((p) => [
        p.slug,
        p.name,
        p.email || '',
        p.locationName || '',
      ]),
      { padding: 2, headerColor: 'cyan', border: false },
    );

    if (args.vcardsOnly) {
      await generateVcardsForPeople(thinkportPeople);
      success('vCards generated successfully');
    } else {
      await generateAvatarsForPeople(thinkportPeople);
      await generatePostersForPeople(thinkportPeople);
      await generateBusinessCardsForPeople(thinkportPeople);
      await generateVcardsForPeople(thinkportPeople);
      await generatePortfoliosForPeople(thinkportPeopleWithSkills);
      await generateEmailFootersForPeople(thinkportPeople);
      success('All staff assets generated successfully');
    }
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

