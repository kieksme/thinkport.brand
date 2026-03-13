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

const success = await run();
process.exit(success ? 0 : 1);
