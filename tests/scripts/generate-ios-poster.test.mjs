#!/usr/bin/env node
/**
 * Tests for generate-ios-poster.mjs
 */

import { generateIosPoster, createJobTitleSvg } from '../../scripts/generate-ios-poster.mjs';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';

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
    console.log('\niOS Poster Generator Tests\n');
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

test('createJobTitleSvg returns buffer with SVG content', () => {
  const buf = createJobTitleSvg('Operations', 400, 800);
  assert(Buffer.isBuffer(buf), 'Should return a Buffer');
  const str = buf.toString('utf8');
  assert(str.includes('Operations'), 'SVG should contain job title text');
  assert(str.includes('text-anchor="middle"'), 'SVG should center text');
});

test('generateIosPoster throws when portrait path is missing', async () => {
  const templatePath = join(projectRoot, 'assets', 'ios', 'poster.png');
  if (!existsSync(templatePath)) {
    throw new Error('Template assets/ios/poster.png required for test');
  }
  try {
    await generateIosPoster('/nonexistent/portrait.png', 'Operations', join(testOutputDir, 'out.png'));
    assert(false, 'Should throw when portrait not found');
  } catch (err) {
    assert(err.message.includes('Portrait') || err.message.includes('not found'), 'Error should mention portrait/path');
  }
});

test('generateIosPoster creates file with template dimensions when given valid portrait', async () => {
  const templatePath = join(projectRoot, 'assets', 'ios', 'poster.png');
  if (!existsSync(templatePath)) {
    throw new Error('Template assets/ios/poster.png required for test');
  }
  const templateMeta = await sharp(templatePath).metadata();
  const needWidth = templateMeta.width;
  const needHeight = templateMeta.height;

  let portraitPath = null;
  const avatarDir = join(projectRoot, 'release-assets', 'staff', 'avatars');
  if (existsSync(avatarDir)) {
    const { readdirSync } = await import('fs');
    const files = readdirSync(avatarDir).filter((f) => f.endsWith('-512.png') && !f.includes('grayscale'));
    if (files.length > 0) {
      portraitPath = join(avatarDir, files[0]);
    }
  }
  if (!portraitPath) {
    const fixturePortrait = join(testOutputDir, 'test-portrait.png');
    if (!existsSync(fixturePortrait)) {
      mkdirSync(testOutputDir, { recursive: true });
      await sharp({
        create: { width: 200, height: 200, channels: 4, background: { r: 100, g: 150, b: 200, alpha: 1 } },
      })
        .png()
        .toFile(fixturePortrait);
    }
    portraitPath = fixturePortrait;
  }

  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }
  const outputPath = join(testOutputDir, 'ios-poster-test.png');

  await generateIosPoster(portraitPath, 'Operations', outputPath);

  assert(existsSync(outputPath), 'Output file should be created');
  const outMeta = await sharp(outputPath).metadata();
  assert(outMeta.width === needWidth, `Output width should match template: ${outMeta.width} === ${needWidth}`);
  assert(outMeta.height === needHeight, `Output height should match template: ${outMeta.height} === ${needHeight}`);

  const stat = await import('fs').then((fs) => fs.promises.stat(outputPath));
  assert(stat.size > 0, 'Output file should not be empty');
});

test('generateIosPoster accepts empty job title', async () => {
  const templatePath = join(projectRoot, 'assets', 'ios', 'poster.png');
  if (!existsSync(templatePath)) {
    throw new Error('Template assets/ios/poster.png required for test');
  }
  let portraitPath = join(projectRoot, 'release-assets', 'staff', 'avatars', 'avatar-andre-lademann-512.png');
  if (!existsSync(portraitPath)) {
    const avatarDir = join(projectRoot, 'release-assets', 'staff', 'avatars');
    if (existsSync(avatarDir)) {
      const { readdirSync } = await import('fs');
      const files = readdirSync(avatarDir).filter((f) => f.endsWith('-512.png'));
      if (files.length > 0) portraitPath = join(avatarDir, files[0]);
    }
  }
  if (!existsSync(portraitPath)) {
    portraitPath = join(testOutputDir, 'test-portrait.png');
    if (!existsSync(portraitPath)) {
      mkdirSync(testOutputDir, { recursive: true });
      await sharp({
        create: { width: 200, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
      })
        .png()
        .toFile(portraitPath);
    }
  }

  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }
  const outputPath = join(testOutputDir, 'ios-poster-no-title.png');

  await generateIosPoster(portraitPath, '', outputPath);

  assert(existsSync(outputPath), 'Output should be created with empty job title');
});

const success = await run();
process.exit(success ? 0 : 1);
