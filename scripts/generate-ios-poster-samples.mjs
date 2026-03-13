#!/usr/bin/env node
/**
 * Generate sample iOS posters
 * Creates example posters from source/avatars or examples/avatars with template + portrait + job title
 */

import { join, resolve, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { generateIosPoster } from './generate-ios-poster.mjs';
import { header, success, info, error, endGroup } from './misc-cli-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const SAMPLE_JOB_TITLES = ['Operations', 'Development', 'Consulting'];

/**
 * Collect portrait paths from source/avatars or fallback to examples/avatars (one per person)
 */
function getPortraitPaths() {
  const sourceDir = join(projectRoot, 'source', 'avatars');
  const examplesDir = join(projectRoot, 'examples', 'avatars');

  if (existsSync(sourceDir)) {
    const files = readdirSync(sourceDir)
      .filter((file) => {
        const ext = extname(file).toLowerCase();
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') return false;
        const name = basename(file, extname(file)).toLowerCase();
        return !name.includes('tschoene');
      })
      .map((file) => join(sourceDir, file));
    if (files.length > 0) return files;
  }

  if (existsSync(examplesDir)) {
    const files = readdirSync(examplesDir)
      .filter((file) => {
        const ext = extname(file).toLowerCase();
        if (ext !== '.png') return false;
        const name = basename(file, extname(file)).toLowerCase();
        return name.includes('-512') && !name.includes('grayscale');
      })
      .map((file) => join(examplesDir, file));
    if (files.length > 0) return files;
  }

  return [];
}

/**
 * Generate all sample iOS posters
 */
async function generateSamplePosters() {
  const outputDir = join(projectRoot, 'examples', 'ios');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const portraitPaths = getPortraitPaths();
  if (portraitPaths.length === 0) {
    error('No portrait files in source/avatars or examples/avatars (run generate:avatar:samples first).');
    process.exit(1);
  }

  let total = 0;
  const generated = [];

  for (let i = 0; i < portraitPaths.length; i++) {
    const portraitPath = portraitPaths[i];
    const name = basename(portraitPath, extname(portraitPath))
      .replace(/-512$/, '')
      .replace(/^avatar-/, '');
    const jobTitle = SAMPLE_JOB_TITLES[i % SAMPLE_JOB_TITLES.length];
    const outputFileName = `poster-${name}-${jobTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    const outputPath = join(outputDir, outputFileName);

    try {
      info(`Generating: ${outputFileName}`);
      await generateIosPoster(portraitPath, jobTitle, outputPath);
      generated.push(outputFileName);
      total++;
    } catch (err) {
      error(`  Failed ${outputFileName}: ${err.message}`);
    }
  }

  return { total, generated, outputDir };
}

async function main() {
  try {
    header('Sample iOS Posters Generator', 'Template + portrait + job title', 'bgCyan');
    info('Output: examples/ios/');
    info('');

    const result = await generateSamplePosters();

    endGroup();
    success(`Generated ${result.total} sample poster(s).`);
    info(`Output: ${result.outputDir}`);
    result.generated.forEach((f) => info(`  - ${f}`));
  } catch (err) {
    endGroup();
    error(err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
