#!/usr/bin/env node
/**
 * Generate sample avatars
 * Creates example avatars with Abstract 5 (default) and optional other backgrounds (Abstract 3, 7)
 */

import { join, resolve, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import sharp from 'sharp';
import { generateAvatar } from './generate-avatar.mjs';
import { header, success, info, error, endGroup } from './misc-cli-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

/** Background variants for sample avatars: default (Abstract 5) + extra for "various backgrounds" section */
const BACKGROUND_VARIANTS = [
  { path: 'assets/backgrounds/5.svg', fileSuffix: '', generateGrayscale: true },
  { path: 'assets/backgrounds/3.svg', fileSuffix: '-abstract-3', generateGrayscale: false },
  { path: 'assets/backgrounds/7.svg', fileSuffix: '-abstract-7', generateGrayscale: false },
];

/** Placeholder portrait filename when source/avatars is empty (so samples can be generated without real portraits). */
const PLACEHOLDER_FILENAME = 'placeholder.png';

/**
 * Create a neutral placeholder portrait (512×512) so sample generation works without real source images.
 * @param {string} outputPath - Full path for the placeholder PNG
 * @returns {Promise<void>}
 */
async function createPlaceholderPortrait(outputPath) {
  const size = 512;
  const buffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 180, g: 180, b: 190, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
  writeFileSync(outputPath, buffer);
}

/**
 * Generate all sample avatars (one per portrait, size, and background variant)
 */
async function generateSampleAvatars() {
  const sourceDir = join(projectRoot, 'source', 'avatars');
  const outputDir = join(projectRoot, 'examples', 'avatars');

  if (!existsSync(sourceDir)) {
    mkdirSync(sourceDir, { recursive: true });
    info(`Quellverzeichnis erstellt: source/avatars`);
    error('Bitte Portrait-Bilder (PNG/JPG) in source/avatars ablegen und den Befehl erneut ausführen.');
    process.exit(1);
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const { readdirSync } = await import('fs');
  let portraitFiles = readdirSync(sourceDir)
    .filter(file => {
      const ext = extname(file).toLowerCase();
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return false;
      }
      const name = basename(file, extname(file)).toLowerCase();
      return !name.includes('tschoene');
    })
    .map(file => join(sourceDir, file));

  if (portraitFiles.length === 0) {
    const placeholderPath = join(sourceDir, PLACEHOLDER_FILENAME);
    info('Keine Portrait-Dateien in source/avatars – erstelle Platzhalter für Beispiel-Ausgabe.');
    await createPlaceholderPortrait(placeholderPath);
    portraitFiles = [placeholderPath];
  }

  const sizes = [256, 512];
  let totalAvatars = 0;
  const generatedAvatars = [];

  for (const portraitPath of portraitFiles) {
    const portraitName = basename(portraitPath, extname(portraitPath));
    info(`\nVerarbeite Portrait: ${portraitName}`);

    for (const size of sizes) {
      const fileNameSlug = portraitName;

      for (const variant of BACKGROUND_VARIANTS) {
        const options = { backgroundPath: variant.path };
        const baseName = `avatar-${fileNameSlug}-${size}${variant.fileSuffix}`;

        // Full color
        const outputFileName = `${baseName}.png`;
        const outputPath = join(outputDir, outputFileName);
        try {
          info(`  Generiere: ${outputFileName}`);
          await generateAvatar(portraitPath, size, outputPath, options);
          generatedAvatars.push(outputFileName);
          totalAvatars++;
        } catch (err) {
          error(`  Fehler bei ${outputFileName}: ${err.message}`);
        }

        // Grayscale (only for default Abstract 5)
        if (variant.generateGrayscale) {
          const grayscaleFileName = `${baseName}-grayscale.png`;
          const grayscalePath = join(outputDir, grayscaleFileName);
          try {
            info(`  Generiere: ${grayscaleFileName}`);
            await generateAvatar(portraitPath, size, grayscalePath, { ...options, grayscalePortrait: true });
            generatedAvatars.push(grayscaleFileName);
            totalAvatars++;
          } catch (err) {
            error(`  Fehler bei ${grayscaleFileName}: ${err.message}`);
          }
        }
      }
    }
  }

  return { totalAvatars, generatedAvatars, outputDir };
}

/**
 * Main function
 */
async function main() {
  try {
    header('Sample Avatars Generator', 'Generiere Beispiel-Avatare mit verschiedenen Hintergründen', 'bgCyan');

    info('Generiere Beispiel-Avatare:');
    info('  - Hintergründe: Abstract 3, Abstract 5 (Standard + Graustufen), Abstract 7');
    info('  - Varianten: Farbe + Graustufen-Portrait nur bei Abstract 5');
    info('  - Größen: 256px, 512px');
    info('');

    const result = await generateSampleAvatars();

    endGroup();
    success(`Alle ${result.totalAvatars} Beispiel-Avatare erfolgreich generiert!`);
    info(`Ausgabe-Verzeichnis: ${result.outputDir}`);
    info(`\nGenerierte Dateien:`);
    result.generatedAvatars.forEach(file => {
      info(`  - ${file}`);
    });
  } catch (err) {
    endGroup();
    error(`Fehler: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
