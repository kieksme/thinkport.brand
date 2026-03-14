#!/usr/bin/env node
/**
 * Portfolio PDF generator (HTML + Puppeteer)
 *
 * Renders a single-page portfolio per person with skill graphs (years of experience).
 * Output: PDF to a given path (e.g. release-assets/staff/portfolios/portfolio-<slug>.pdf).
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { platform } from 'os';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import { loadConfig, getVcardOffice } from './config-loader.mjs';
import { info, error, warn } from './misc-cli-utils.mjs';

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

/**
 * Header background: SVG from assets/backgrounds. Visual target: assets/portfolio/portfoilo-header.png.
 * We build the header from this background SVG + SVG logos (no PNG).
 */
const PORTFOLIO_HEADER_BACKGROUND = 'assets/backgrounds/5.svg';
/** @deprecated Use PORTFOLIO_HEADER_BACKGROUND. Kept for compatibility. */
const PORTFOLIO_HEADER_PATH = PORTFOLIO_HEADER_BACKGROUND;
/** Single logo (SVG) in header – Thinkport + A Venitus Company combined. */
const PORTFOLIO_HEADER_LOGO = 'assets/logos/venitus/thinkport-venitus-dark.svg';

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
 * Format ISO date string for display (e.g. "2024-03-15" → "15.03.2024").
 * @param {string|null} isoDate
 * @returns {string}
 */
function formatIssueDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '—';
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return escapeHtml(isoDate);
  return `${match[3]}.${match[2]}.${match[1]}`;
}

/**
 * Read a file and return as data URI (for SVG so it loads in PDF regardless of baseURL).
 * @param {string} absolutePath
 * @returns {string} data URI or empty string on error
 */
function fileToDataUri(absolutePath) {
  try {
    const raw = readFileSync(absolutePath, 'utf8');
    const base64 = Buffer.from(raw, 'utf8').toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch {
    return '';
  }
}

/**
 * Generate QR code as data URL for embedding in HTML (e.g. booking link).
 * @param {string} url - URL to encode
 * @returns {Promise<string|null>} Data URL or null on error
 */
const QR_OPTIONS = { errorCorrectionLevel: 'M', type: 'image/png', width: 280, margin: 1 };

async function generateBookingQrDataUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    return await QRCode.toDataURL(url, QR_OPTIONS);
  } catch {
    return null;
  }
}

/**
 * Build vCard 3.0 string from normalized person (FN, N, TITLE, ORG, EMAIL, ADR, PRODID, REV, optional GEO/TZ).
 * @param {Object} person - Normalized person (name, position, email, companyName, street, locationCity, postalCode, locationCountry, locationId, …)
 * @param {Object} [config] - Optional config (from loadConfig()); used for PRODID and office GEO/TZ. If omitted, CONFIG is used.
 * @returns {string} vCard formatted string (RFC 2426 \r\n)
 */
export function buildVCardFromPerson(person, config = null) {
  const conf = config ?? CONFIG;
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  const prodId = conf?.vcard?.prodId || '-//Thinkport GmbH//Brand Staff Assets//EN';
  lines.push(`PRODID:${prodId}`);
  lines.push(`REV:${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`);

  const name = (person.name ?? '').trim();
  if (name) {
    lines.push(`FN:${name}`);
    const parts = name.split(/\s+/);
    const family = parts.length >= 2 ? parts.slice(-1)[0] : name;
    const given = parts.length >= 2 ? parts.slice(0, -1).join(' ') : '';
    lines.push(`N:${family};${given};;;`);
  }
  if (person.position) {
    lines.push(`TITLE:${String(person.position).replace(/\n/g, ' ')}`);
  }
  const org = person.companyName || 'Thinkport GmbH';
  lines.push(`ORG:${org}`);
  if (person.email) {
    lines.push(`EMAIL;TYPE=WORK,INTERNET:${person.email}`);
  }
  const city = person.locationCity ?? '';
  const postalCode = person.postalCode ?? '';
  const country = person.locationCountry ?? 'Deutschland';
  const street = person.street ?? '';
  if (street || city || postalCode) {
    const adr = ['', '', street, city, '', postalCode, country];
    lines.push(`ADR;TYPE=WORK:${adr.join(';')}`);
  }
  const office = getVcardOffice(conf, person.locationCity ?? null, person.locationId ?? null);
  if (office?.geo && typeof office.geo === 'string' && office.geo.includes(';')) {
    lines.push(`GEO:${office.geo.trim()}`);
  }
  if (office?.tz && typeof office.tz === 'string') {
    lines.push(`TZ:${office.tz.trim()}`);
  }
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/**
 * Generate QR code as data URL for vCard string (same size as booking QR).
 * @param {string} vCardData - vCard 3.0 string
 * @returns {Promise<string|null>} Data URL or null on error
 */
async function generateVcardQrDataUrl(vCardData) {
  if (!vCardData || typeof vCardData !== 'string') return null;
  try {
    return await QRCode.toDataURL(vCardData, QR_OPTIONS);
  } catch {
    return null;
  }
}

/**
 * Build single-page portfolio HTML for a person (new design with header image).
 * Header looks like assets/portfolio/portfoilo-header.png: background from background SVG (assets/backgrounds), branding from SVG logos (Thinkport + A Venitus Company). Then personal info, skill bars, certificates.
 * @param {Object} person - Normalized person with optional skills[], certificates[]
 * @param {{ bookingQrDataUrl?: string|null, vcardQrDataUrl?: string|null }} [options] - Optional QR data URLs (booking link, vCard)
 * @returns {string} Full HTML document
 */
export function buildPortfolioHtml(person, options = {}) {
  const { bookingQrDataUrl = null, vcardQrDataUrl = null } = options;
  const name = escapeHtml(person.name ?? '');
  const position = escapeHtml(person.position ?? '');
  const email = escapeHtml(person.email ?? '');
  const companyName = escapeHtml(person.companyName ?? 'Thinkport GmbH');
  const description = person.description ? escapeHtml(person.description) : '';
  const givenName = person.givenName ? escapeHtml(person.givenName) : (person.name ? escapeHtml(String(person.name).trim().split(/\s+/)[0] || '') : '');
  const aboutHeading = givenName ? `Über ${givenName}` : 'Über mich';
  const bookingIntro = givenName
    ? `Über den folgenden Link können Sie einen Termin mit ${givenName} vereinbaren:`
    : 'Über den folgenden Link können Sie einen Termin mit mir vereinbaren:';
  const vcardIntro = givenName
    ? `Scannen Sie den QR-Code, um die Kontaktdaten von ${givenName} in Ihr Adressbuch zu übernehmen.`
    : 'Scannen Sie den QR-Code, um die Kontaktdaten in Ihr Adressbuch zu übernehmen.';
  const education = person.education ? escapeHtml(person.education) : '';
  const bookingLinkUrl = person.bookingLink ? escapeHtml(person.bookingLink) : '';
  const skills = Array.isArray(person.skills) ? person.skills : [];
  const certificates = Array.isArray(person.certificates) ? person.certificates : [];
  const maxSkillYears = skills.length
    ? Math.max(0, ...skills.map((s) => (s.yearsOfExperience != null ? s.yearsOfExperience : 0)))
    : 0;
  const experienceText =
    maxSkillYears >= 10 ? '10+ Jahre' : maxSkillYears > 0 ? `${maxSkillYears} ${maxSkillYears === 1 ? 'Jahr' : 'Jahre'}` : '–';
  const maxYears = Math.max(1, maxSkillYears);

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

  const headerBgPath = join(projectRoot, PORTFOLIO_HEADER_BACKGROUND);
  const headerLogoPath = join(projectRoot, PORTFOLIO_HEADER_LOGO);
  const hasHeaderBg = existsSync(headerBgPath);
  const hasHeaderLogo = existsSync(headerLogoPath);
  /* Embed background and logo as data URIs so they render in PDF (file:// often blocked). */
  const headerBgDataUri = hasHeaderBg ? fileToDataUri(headerBgPath) : '';
  const headerLogoDataUri = hasHeaderLogo ? fileToDataUri(headerLogoPath) : '';
  const headerStyle =
    headerBgDataUri
      ? `background-image: url(${escapeHtml(headerBgDataUri)}); background-size: cover; background-position: center; background-repeat: no-repeat;`
      : `background: ${NAVY};`;

  const certCards = certificates.map((c) => {
    const title = escapeHtml(c.name || 'Zertifikat');
    const description = c.description ? escapeHtml(c.description) : '';
    const issueDate = formatIssueDate(c.issueDate);
    const issuer = c.issuer ? escapeHtml(c.issuer) : '—';
    const category = c.category ? escapeHtml(c.category) : '—';
    const level = c.level ? escapeHtml(c.level) : '—';
    const skillsList = Array.isArray(c.skills) && c.skills.length > 0 ? c.skills.map((s) => escapeHtml(String(s))).join(', ') : '—';
    const badgeImg = c.badgeUrl
      ? `<img class="cert-card-badge" src="${escapeHtml(c.badgeUrl)}" alt="" loading="lazy">`
      : '';
    return `
    <div class="cert-card">
      <div class="cert-card-head">
        ${badgeImg}
        <div class="cert-card-title">${title}</div>
      </div>
      ${description ? `<p class="cert-card-desc">${description}</p>` : ''}
      <dl class="cert-meta">
        <dt class="cert-meta-label">Ausstellungsdatum</dt><dd class="cert-meta-value">${issueDate}</dd>
        <dt class="cert-meta-label">Issuer</dt><dd class="cert-meta-value">${issuer}</dd>
        <dt class="cert-meta-label">Kategorie</dt><dd class="cert-meta-value">${category}</dd>
        <dt class="cert-meta-label">Level</dt><dd class="cert-meta-value">${level}</dd>
        <dt class="cert-meta-label">Skills</dt><dd class="cert-meta-value">${skillsList}</dd>
      </dl>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${name} – Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 2cm 0; }
    @page :first { margin-top: 0; margin-bottom: 2cm; }
    * { box-sizing: border-box; }
    :root { --page-gutter: 56px; }
    body { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 11pt; color: ${DARK_GRAY}; }
    a.email-link { color: ${ORANGE}; text-decoration: underline; font-weight: 600; }
    .page { width: 210mm; min-height: 297mm; padding: var(--page-gutter); padding-bottom: max(2cm, var(--page-gutter)); }
    .portfolio-header { position: relative; min-height: 160px; ${headerStyle} display: flex; align-items: center; justify-content: space-between; padding: 20px var(--page-gutter); margin: calc(-1 * var(--page-gutter)) calc(-1 * var(--page-gutter)) 0 calc(-1 * var(--page-gutter)); width: calc(100% + 2 * var(--page-gutter)); box-sizing: border-box; }
    .header-branding { display: flex; align-items: center; }
    .header-logo { height: 54px; width: auto; object-fit: contain; margin: 0; display: block; }
    .header-avatar-wrap { width: 195px; height: 195px; border-radius: 50%; border: 3px solid #fff; background: rgba(220,235,255,0.45); overflow: hidden; flex-shrink: 0; box-sizing: border-box; }
    .header-avatar-wrap .header-avatar { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
    .personal-info { display: flex; padding: 16px var(--page-gutter); gap: 24px; border-bottom: 1px dashed ${NAVY}; margin: 0 calc(-1 * var(--page-gutter)); width: calc(100% + 2 * var(--page-gutter)); box-sizing: border-box; }
    .personal-info-left { flex: 1; }
    .personal-info-left .name { margin: 0 0 4px 0; font-size: 20pt; font-weight: 700; color: ${DARK_GRAY}; }
    .personal-info-left .position { margin: 0; font-size: 11pt; color: ${DARK_GRAY}; border-bottom: 2px solid ${NAVY}; padding-bottom: 2px; display: inline-block; }
    .personal-info-right { flex: 1; text-align: right; font-size: 10pt; color: ${DARK_GRAY}; }
    .personal-info-right .line { margin: 2px 0; }
    .section { padding: 16px var(--page-gutter); margin: 0 calc(-1 * var(--page-gutter)); width: calc(100% + 2 * var(--page-gutter)); box-sizing: border-box; }
    .section h2, .section h3, .section-subhead { break-after: avoid; page-break-after: avoid; }
    .section.skills { background: #f5f5f5; }
    .section.skills h2 { margin: 0 0 12px 0; font-size: 12pt; font-weight: 600; color: ${ORANGE}; }
    .skill-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 10pt; color: ${DARK_GRAY}; }
    .skill-label { flex: 0 0 180px; }
    .skill-bar-track { flex: 1; height: 10px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden; }
    .skill-bar-fill { height: 100%; background: ${ORANGE}; border-radius: 4px; }
    .skill-years { flex: 0 0 52px; text-align: right; font-size: 9pt; }
    .section.certifications h2 { margin: 0 0 10px 0; font-size: 11pt; color: ${ORANGE}; }
    .cert-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 12px; }
    .cert-card { background: #fafafa; border-left: 2px solid rgba(255,87,34,0.4); border-radius: 2px; padding: 8px 10px; break-inside: avoid; }
    .cert-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .cert-card-badge { height: 36px; width: auto; object-fit: contain; flex-shrink: 0; }
    .cert-card-title { margin: 0; font-size: 10pt; font-weight: 700; color: ${NAVY}; line-height: 1.2; }
    .cert-card-desc { margin: 0 0 6px 0; font-size: 8pt; color: ${DARK_GRAY}; line-height: 1.3; }
    .cert-meta { display: grid; grid-template-columns: auto 1fr; gap: 0 10px; margin: 0; font-size: 7pt; }
    .cert-meta-label { margin: 0; color: ${NAVY}; font-weight: 600; }
    .cert-meta-value { margin: 0; color: ${DARK_GRAY}; }
    .person-description { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.08); font-size: 10pt; color: ${DARK_GRAY}; line-height: 1.5; white-space: pre-line; }
    .section-subhead { margin: 16px 0 8px 0; font-size: 11pt; font-weight: 600; color: ${ORANGE}; }
    .section-text { margin: 0; font-size: 10pt; color: ${DARK_GRAY}; line-height: 1.5; }
    .section h2 + *, .section h3 + *, .section-subhead + * { break-before: avoid; page-break-before: avoid; }
    .section.qr-section { background: #e5e7e6; border-left: 4px solid ${ORANGE}; padding: 24px var(--page-gutter); border-radius: 0 6px 6px 0; break-inside: avoid; page-break-inside: avoid; }
    .section.qr-section h2 { color: ${ORANGE}; font-size: 13pt; font-weight: 700; margin: 0 0 12px 0; letter-spacing: 0.02em; }
    .section.qr-section .section-text { font-weight: 500; font-size: 10pt; line-height: 1.5; margin: 0; color: ${DARK_GRAY}; }
    .section.qr-section .email-link { font-weight: 700; }
    .section.qr-section .qr-block { margin-top: 16px; display: inline-flex; flex-direction: column; gap: 8px; background: #fff; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .section.qr-section .qr-block img { width: 200px; height: 200px; display: block; }
    .section.qr-section .qr-caption { font-size: 9pt; color: ${DARK_GRAY}; font-weight: 500; }
  </style>
</head>
<body>
  <div class="page">
    <header class="portfolio-header">
      <div class="header-branding">
        ${headerLogoDataUri ? `<img class="header-logo" src="${escapeHtml(headerLogoDataUri)}" alt="Thinkport – A Venitus Company">` : ''}
      </div>
      ${person.imageUrl ? `<div class="header-avatar-wrap"><img class="header-avatar" src="${escapeHtml(person.imageUrl)}" alt=""></div>` : ''}
    </header>
    <section class="personal-info">
      <div class="personal-info-left">
        <h1 class="name">${name}</h1>
        <p class="position">${position}</p>
      </div>
      <div class="personal-info-right">
        <p class="line">${name}</p>
        <p class="line">${position}</p>
        ${email ? `<p class="line">E-Mail: <a href="mailto:${escapeHtml(person.email ?? '')}" class="email-link">${email}</a></p>` : ''}
        <p class="line">Erfahrung: ${experienceText}</p>
      </div>
    </section>
    <section class="section skills">
      <h2>Skills &amp; Erfahrung</h2>
      ${skillRows || '<p>Keine Skills hinterlegt.</p>'}
    </section>
    ${education ? `<section class="section"><h2>Ausbildung</h2><p class="section-text">${education}</p></section>` : ''}
    ${certificates.length > 0 ? `<section class="section certifications"><h2>Zertifikate</h2><div class="cert-cards">${certCards}</div>${description ? `<h3 class="section-subhead">${aboutHeading}</h3><div class="person-description">${description}</div>` : ''}</section>` : ''}
    ${certificates.length === 0 && description ? `<section class="section certifications"><h2>${aboutHeading}</h2><div class="person-description">${description}</div></section>` : ''}
    ${bookingLinkUrl ? `<section class="section qr-section"><h2>Termin buchen</h2><p class="section-text">${bookingIntro} <a href="${bookingLinkUrl}" class="email-link">Termin buchen</a>.</p>${bookingQrDataUrl ? `<div class="qr-block"><img src="${escapeHtml(bookingQrDataUrl)}" alt="QR Code Termin buchen" width="200" height="200"><span class="qr-caption">QR-Code scannen für Buchungslink</span></div>` : ''}</section>` : ''}
    ${vcardQrDataUrl ? `<section class="section qr-section"><h2>Kontaktdaten</h2><p class="section-text">${vcardIntro}</p><div class="qr-block"><img src="${escapeHtml(vcardQrDataUrl)}" alt="QR Code vCard Kontakt" width="200" height="200"><span class="qr-caption">vCard – Kontakt speichern</span></div></section>` : ''}
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
  const bookingPromise = person.bookingLink
    ? generateBookingQrDataUrl(person.bookingLink)
    : Promise.resolve(null);
  const vcardPromise = generateVcardQrDataUrl(buildVCardFromPerson(person));
  const [bookingQrDataUrl, vcardQrDataUrl] = await Promise.all([
    bookingPromise,
    vcardPromise,
  ]);
  const html = buildPortfolioHtml(person, { bookingQrDataUrl, vcardQrDataUrl });
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
  const baseURL = 'file://' + projectRoot.replace(/\\/g, '/') + '/';
  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 10000,
      baseURL,
    });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: false,
    });
    await browser.close();

    const name = person.name || 'Portfolio';
    const position = person.position || '';
    const title = `${name} – Portfolio`;
    const subject = position ? `Portfolio – ${position}` : 'Staff portfolio – Thinkport GmbH';
    const keywords = ['Thinkport', 'Portfolio', name].filter(Boolean);
    if (position) keywords.push(position);

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor(name);
    pdfDoc.setSubject(subject);
    pdfDoc.setKeywords(keywords);
    pdfDoc.setCreator('Thinkport Brand – Portfolio PDF Generator');
    pdfDoc.setProducer('Thinkport GmbH');
    const pdfWithMeta = await pdfDoc.save();

    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(outputPath, Buffer.from(pdfWithMeta));
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
 * Without --slug: fetch active Thinkport people (with skills) and generate into default output dir.
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

  const { getActiveThinkportPeopleWithSkills } = await import('./thinkport-api-client.mjs');
  const outputDir = join(projectRoot, 'release-assets', 'staff', 'portfolios');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  let people = await getActiveThinkportPeopleWithSkills();
  if (slugFilter) {
    const lower = String(slugFilter).toLowerCase();
    people = people.filter((p) => p.slug && p.slug.toLowerCase().includes(lower));
  }

  if (!existsSync(join(projectRoot, PORTFOLIO_HEADER_BACKGROUND))) {
    warn(`Portfolio header background not found: ${PORTFOLIO_HEADER_BACKGROUND}`, 'portfolio');
  }
  if (!existsSync(join(projectRoot, PORTFOLIO_HEADER_LOGO))) {
    warn(`Portfolio header logo not found: ${PORTFOLIO_HEADER_LOGO}`, 'portfolio');
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
