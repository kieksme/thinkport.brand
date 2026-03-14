#!/usr/bin/env node
/**
 * Tests for generate-portfolio-pdf.mjs
 */

import {
  buildPortfolioHtml,
  generatePortfolioPdf,
} from '../../scripts/generate-portfolio-pdf.mjs';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');
const testOutputDir = join(projectRoot, 'tests', 'output');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  const results = [];

  function test(name, fn) {
    results.push({ name, fn });
  }

  async function run() {
    console.log('\nPortfolio PDF Generator Tests\n');
    let passed = 0;
    let failed = 0;

    for (const { name, fn } of results) {
      try {
        await fn();
        console.log(`✓ ${name}`);
        passed++;
      } catch (error) {
        console.error(`✗ ${name}: ${error.message}`);
        if (error.stack) {
          console.error(error.stack.split('\n').slice(0, 3).join('\n'));
        }
        failed++;
      }
    }

    console.log(`\nTests: ${passed} passed, ${failed} failed`);
    return failed === 0;
  }

  return { test, run };
}

const { test, run } = await runTests();

test('buildPortfolioHtml contains name and position', () => {
  const person = { name: 'Jane Doe', slug: 'jane-doe', position: 'Senior Engineer' };
  const html = buildPortfolioHtml(person);
  assert(html.includes('Jane Doe'), 'HTML should contain name');
  assert(html.includes('Senior Engineer'), 'HTML should contain position');
  assert(html.includes('<!DOCTYPE html>'), 'Should be full document');
});

test('buildPortfolioHtml contains skill bars when skills present', () => {
  const person = {
    name: 'Dev',
    slug: 'dev',
    position: 'Dev',
    skills: [
      { id: 'ts', name: 'TypeScript', yearsOfExperience: 3 },
      { id: 'go', name: 'Go', yearsOfExperience: 1 },
    ],
  };
  const html = buildPortfolioHtml(person);
  assert(html.includes('TypeScript'), 'HTML should list skill name');
  assert(html.includes('Go'), 'HTML should list second skill');
  assert(html.includes('skill-bar-fill'), 'HTML should have skill bar elements');
  assert(html.includes('3 Jahre'), 'Should show years text');
});

test('buildPortfolioHtml handles empty skills gracefully', () => {
  const person = { name: 'No Skills', slug: 'no-skills', position: 'Lead' };
  const html = buildPortfolioHtml(person);
  assert(html.includes('No Skills'), 'Name should be present');
  assert(html.includes('Keine Skills hinterlegt') || html.includes('Keine Skills'), 'Should show no-skills message');
});

test('buildPortfolioHtml escapes HTML in name', () => {
  const person = { name: '<script>alert(1)</script>', slug: 'x', position: 'P' };
  const html = buildPortfolioHtml(person);
  assert(!html.includes('<script>'), 'Script tag should be escaped');
  assert(html.includes('&lt;script&gt;'), 'Should contain escaped angle brackets');
});

test('buildPortfolioHtml uses new design: portfolio header with background and logo or fallback', () => {
  const person = { name: 'Test', slug: 'test', position: 'Role' };
  const html = buildPortfolioHtml(person);
  assert(html.includes('portfolio-header'), 'Should have portfolio header section');
  assert(
    html.includes('assets/backgrounds/5.svg') || html.includes('background:'),
    'Should reference header background (5.svg) or fallback background',
  );
});

test('buildPortfolioHtml includes certificates section when person has certificates', () => {
  const person = {
    name: 'Cert Person',
    slug: 'cert-person',
    position: 'Architect',
    certificates: [
      { id: 'az-900', name: 'Azure Fundamentals', badgeUrl: 'https://example.com/badge.png' },
    ],
  };
  const html = buildPortfolioHtml(person);
  assert(html.includes('Zertifikate'), 'Should have Zertifikate section');
  assert(html.includes('cert-card'), 'Should have certificate card class');
  assert(html.includes('example.com/badge'), 'Should include badge URL');
});

test('buildPortfolioHtml shows Termin buchen section with QR section styling when bookingLink is set', () => {
  const person = {
    name: 'Bookable',
    slug: 'bookable',
    position: 'Consultant',
    bookingLink: 'https://cal.example.com/book',
  };
  const html = buildPortfolioHtml(person);
  assert(html.includes('Termin buchen'), 'Should have Termin buchen heading');
  assert(html.includes('qr-section'), 'Should have QR section class');
  assert(html.includes('cal.example.com/book'), 'Should include booking URL in link');
  assert(html.includes('e5e7e6'), 'Should have gray QR section background');
});

test('buildPortfolioHtml does not show Termin buchen section when bookingLink is missing', () => {
  const person = { name: 'No Booking', slug: 'no-booking', position: 'Dev' };
  const html = buildPortfolioHtml(person);
  assert(!html.includes('Termin buchen</h2>'), 'Should not have Termin buchen section');
});

test('buildPortfolioHtml includes booking QR when options.bookingQrDataUrl is passed', () => {
  const person = {
    name: 'QR Person',
    slug: 'qr-person',
    position: 'Lead',
    bookingLink: 'https://book.example.com',
  };
  const fakeQrDataUrl = 'data:image/png;base64,iVBORw0KGgo=';
  const html = buildPortfolioHtml(person, { bookingQrDataUrl: fakeQrDataUrl });
  assert(html.includes('Buchungslink'), 'Should have booking QR caption');
  assert(html.includes('data:image/png;base64,'), 'Should embed QR data URL');
  assert(html.includes('alt="QR Code Termin buchen"'), 'Booking QR img should have alt');
});

test('buildPortfolioHtml includes vCard QR in separate section when options.vcardQrDataUrl is passed', () => {
  const person = { name: 'VCard Person', slug: 'vcard-person', position: 'Architect' };
  const fakeVcardQrDataUrl = 'data:image/png;base64,abcd1234=';
  const html = buildPortfolioHtml(person, { vcardQrDataUrl: fakeVcardQrDataUrl });
  assert(html.includes('qr-section'), 'Should have QR section class');
  assert(html.includes('Kontaktdaten</h2>'), 'Should have Kontaktdaten heading');
  assert(html.includes('Kontakt speichern'), 'Should have vCard caption');
  assert(html.includes('alt="QR Code vCard Kontakt"'), 'vCard QR img should have alt');
  assert(html.includes('abcd1234='), 'Should embed vCard QR data URL');
});

test('buildPortfolioHtml booking section only has booking QR; vCard is in own section', () => {
  const person = {
    name: 'Dual QR',
    slug: 'dual-qr',
    position: 'Consultant',
    bookingLink: 'https://meet.example.com',
  };
  const html = buildPortfolioHtml(person, {
    bookingQrDataUrl: 'data:image/png;base64,booking',
    vcardQrDataUrl: 'data:image/png;base64,vcard',
  });
  assert(html.includes('Termin buchen'), 'Should have booking section');
  assert(html.includes('QR-Code scannen für Buchungslink'), 'Booking section should have booking caption only');
  assert(html.includes('Kontaktdaten</h2>'), 'vCard section should have Kontaktdaten heading');
  assert(html.includes('qr-block'), 'Both sections should use qr-block for QR display');
});

test('buildPortfolioHtml personalizes booking and vCard text with given name', () => {
  const person = {
    name: 'Christina Friede',
    givenName: 'Christina',
    slug: 'christina-friede',
    position: 'Consultant',
    bookingLink: 'https://cal.example.com/c',
  };
  const html = buildPortfolioHtml(person, {
    bookingQrDataUrl: 'data:image/png;base64,x',
    vcardQrDataUrl: 'data:image/png;base64,y',
  });
  assert(html.includes('Termin mit Christina vereinbaren'), 'Booking intro should use first name');
  assert(html.includes('Kontaktdaten von Christina in Ihr Adressbuch'), 'vCard intro should use first name');
});

test('generatePortfolioPdf creates PDF file at output path', async () => {
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }
  const outputPath = join(testOutputDir, 'portfolio-test.pdf');
  const person = {
    name: 'Test Person',
    slug: 'test-person',
    position: 'Engineer',
    skills: [{ id: 'js', name: 'JavaScript', yearsOfExperience: 2 }],
  };
  await generatePortfolioPdf(person, outputPath);
  assert(existsSync(outputPath), 'PDF file should be created');
  const { readFileSync } = await import('fs');
  const buf = readFileSync(outputPath);
  assert(buf.length > 0, 'PDF should not be empty');
  assert(buf.toString('binary', 0, 5) === '%PDF-', 'File should be PDF');
});

test('generatePortfolioPdf handles person with no skills', async () => {
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }
  const outputPath = join(testOutputDir, 'portfolio-no-skills.pdf');
  const person = { name: 'No Skills Person', slug: 'no-skills-person', position: 'Lead' };
  await generatePortfolioPdf(person, outputPath);
  assert(existsSync(outputPath), 'PDF file should be created');
  const { readFileSync } = await import('fs');
  const buf = readFileSync(outputPath);
  assert(buf.length > 0 && buf.toString('binary', 0, 5) === '%PDF-', 'Should be valid PDF');
});

test('generatePortfolioPdf with bookingLink creates PDF with booking and vCard QR section', async () => {
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }
  const outputPath = join(testOutputDir, 'portfolio-booking.pdf');
  const person = {
    name: 'Booking Test',
    slug: 'booking-test',
    position: 'Consultant',
    bookingLink: 'https://cal.example.com/me',
    email: 'booking@example.com',
    companyName: 'Thinkport GmbH',
  };
  await generatePortfolioPdf(person, outputPath);
  assert(existsSync(outputPath), 'PDF file should be created');
  const { readFileSync } = await import('fs');
  const buf = readFileSync(outputPath);
  assert(buf.length > 0, 'PDF should not be empty');
  assert(buf.toString('binary', 0, 5) === '%PDF-', 'Should be valid PDF');
});

const success = await run();
process.exit(success ? 0 : 1);
