#!/usr/bin/env node
/**
 * Generate sample avatars
 * Creates example avatars with Abstract 5 (default) and other backgrounds (Abstract 1, 2, 3, 4, 7)
 */

import { join, resolve, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
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
  { path: 'assets/backgrounds/1.svg', fileSuffix: '-abstract-1', generateGrayscale: false },
  { path: 'assets/backgrounds/2.svg', fileSuffix: '-abstract-2', generateGrayscale: false },
  { path: 'assets/backgrounds/4.svg', fileSuffix: '-abstract-4', generateGrayscale: false },
];

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
    error('Keine Portrait-Dateien in source/avatars gefunden.');
    info('Für die Beispielseite (Tobias Drexler): pnpm run generate:staff:assets --slug tobias (API-Zugang nötig).');
    info('Oder Portrait(s) als PNG/JPG in source/avatars ablegen und den Befehl erneut ausführen.');
    process.exit(1);
  }

  const sizes = [256, 512];
  let totalAvatars = 0;
  const generatedAvatars = [];

  // Use generic filenames (no person/placeholder name) so examples/avatars stays neutral
  for (const portraitPath of portraitFiles) {
    const portraitName = basename(portraitPath, extname(portraitPath));
    info(`\nVerarbeite Portrait: ${portraitName}`);

    for (const size of sizes) {
      for (const variant of BACKGROUND_VARIANTS) {
        const options = { backgroundPath: variant.path };
        const baseName = `avatar-${size}${variant.fileSuffix}`;

        // Full color
        const outputFileName = `${baseName}.png`;
        const outputPath = join(outputDir, outputFileName);
        try {
          info(`  Generiere: ${outputFileName}`);
          await generateAvatar(portraitPath, size, outputPath, options);
          if (!generatedAvatars.includes(outputFileName)) generatedAvatars.push(outputFileName);
          totalAvatars++;
        } catch (err) {
          error(`  Fehler bei ${outputFileName}: ${err.message}`);
        }

        // Grayscale (only for default Abstract 5)
        if (variant.generateGrayscale) {
          const grayscaleFileName = `avatar-${size}-grayscale.png`;
          const grayscalePath = join(outputDir, grayscaleFileName);
          try {
            info(`  Generiere: ${grayscaleFileName}`);
            await generateAvatar(portraitPath, size, grayscalePath, { ...options, grayscalePortrait: true });
            if (!generatedAvatars.includes(grayscaleFileName)) generatedAvatars.push(grayscaleFileName);
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
    info('  - Hintergründe: Abstract 1, 2, 3, 4, 5 (Standard + Graustufen), 7');
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
