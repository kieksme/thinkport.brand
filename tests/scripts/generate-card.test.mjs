#!/usr/bin/env node
/**
 * Tests for generate-card.mjs
 */

import { generateBusinessCardWithPdfLib, generateVCard } from '../../scripts/generate-card.mjs';
import { getSampleContact } from '../../scripts/sample-data.mjs';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');
const testOutputDir = join(projectRoot, 'tests', 'output');

/**
 * Simple test utilities
 */
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
    console.log('\nBusiness Card Generator (pdf-lib) Tests\n');
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

test('should generate PDF files for sample contact', async () => {
  const testContact = getSampleContact('Anna Schmidt');
  assert(testContact !== null, 'Sample contact should exist');
  
  // Ensure test output directory exists
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }
  
  const result = await generateBusinessCardWithPdfLib(testContact, testOutputDir);
  
  // Check that files were created
  assert(existsSync(result.front), 'Front PDF should be created');
  assert(existsSync(result.back), 'Back PDF should be created');
  assert(existsSync(result.json), 'JSON file should be created');
  
  // Check file sizes (should not be empty)
  const frontStats = readFileSync(result.front);
  const backStats = readFileSync(result.back);
  
  assert(frontStats.length > 0, 'Front PDF should not be empty');
  assert(backStats.length > 0, 'Back PDF should not be empty');
});

test('should validate contact data', async () => {
  const invalidContact = { name: '' }; // Missing required name
  
  try {
    await generateBusinessCardWithPdfLib(invalidContact, testOutputDir);
    assert(false, 'Should throw validation error');
  } catch (error) {
    assert(error.message.includes('Validierungsfehler'), 'Should throw validation error');
  }
});

test('should handle missing optional fields', async () => {
  const minimalContact = {
    name: 'Test User',
    email: 'test@kieks.me',
  };
  
  const result = await generateBusinessCardWithPdfLib(minimalContact, testOutputDir);
  
  assert(existsSync(result.front), 'Should generate PDF with minimal data');
  assert(existsSync(result.back), 'Should generate back PDF');
});

test('generateVCard includes PRODID and REV and uses \\r\\n line endings', () => {
  const data = { name: 'VCard Test', email: 'v@example.com', companyName: 'Thinkport GmbH' };
  const vcard = generateVCard(data);
  assert(vcard.includes('BEGIN:VCARD'), 'Should start with BEGIN:VCARD');
  assert(vcard.includes('PRODID:'), 'Should include PRODID');
  assert(vcard.includes('REV:'), 'Should include REV');
  assert(/REV:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(vcard), 'REV should be ISO 8601 UTC');
  assert(vcard.includes('\r\n'), 'Should use RFC 2426 line endings \\r\\n');
});

test('generateVCard includes GEO and TZ when provided', () => {
  const data = {
    name: 'Geo Person',
    email: 'geo@example.com',
    geo: '51.339695;12.373075',
    tz: 'Europe/Berlin',
  };
  const vcard = generateVCard(data);
  assert(vcard.includes('GEO:51.339695;12.373075'), 'Should include GEO');
  assert(vcard.includes('TZ:Europe/Berlin'), 'Should include TZ');
});

test('generateVCard includes NOTE and CATEGORIES when provided', () => {
  const data = {
    name: 'Note Person',
    email: 'n@example.com',
    note: 'Kontakt über thinkport.digital',
    categories: ['Thinkport', 'Consulting'],
  };
  const vcard = generateVCard(data);
  assert(vcard.includes('NOTE:'), 'Should include NOTE');
  assert(vcard.includes('Kontakt über thinkport.digital'), 'NOTE should contain text');
  assert(vcard.includes('CATEGORIES:Thinkport,Consulting'), 'Should include CATEGORIES');
});

// Run tests
const success = await run();
process.exit(success ? 0 : 1);
