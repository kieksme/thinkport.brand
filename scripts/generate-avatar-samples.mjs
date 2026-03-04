#!/usr/bin/env node
/**
 * Generate sample avatars
 * Creates example avatars with Abstract 5 background (one variant per portrait and size)
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

/**
 * Generate all sample avatars (one per portrait and size)
 */
async function generateSampleAvatars() {
  const sourceDir = join(projectRoot, 'source', 'avatars');
  const outputDir = join(projectRoot, 'examples', 'avatars');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const { readdirSync } = await import('fs');
  const portraitFiles = readdirSync(sourceDir)
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
    error('Keine Portrait-Dateien in source/avatars gefunden!');
    process.exit(1);
  }

  const sizes = [256, 512];
  let totalAvatars = 0;
  const generatedAvatars = [];

  for (const portraitPath of portraitFiles) {
    const portraitName = basename(portraitPath, extname(portraitPath));
    info(`\nVerarbeite Portrait: ${portraitName}`);

    for (const size of sizes) {
      const fileNameSlug = portraitName.replace(/kieksme/gi, 'thinkport');

      // Full color
      const outputFileName = `avatar-${fileNameSlug}-${size}.png`;
      const outputPath = join(outputDir, outputFileName);
      try {
        info(`  Generiere: ${outputFileName}`);
        await generateAvatar(portraitPath, size, outputPath);
        generatedAvatars.push(outputFileName);
        totalAvatars++;
      } catch (err) {
        error(`  Fehler bei ${outputFileName}: ${err.message}`);
      }

      // Grayscale portrait, color background
      const grayscaleFileName = `avatar-${fileNameSlug}-${size}-grayscale.png`;
      const grayscalePath = join(outputDir, grayscaleFileName);
      try {
        info(`  Generiere: ${grayscaleFileName}`);
        await generateAvatar(portraitPath, size, grayscalePath, { grayscalePortrait: true });
        generatedAvatars.push(grayscaleFileName);
        totalAvatars++;
      } catch (err) {
        error(`  Fehler bei ${grayscaleFileName}: ${err.message}`);
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
    header('Sample Avatars Generator', 'Generiere Beispiel-Avatare mit Abstract-5-Hintergrund', 'bgCyan');

    info('Generiere Beispiel-Avatare:');
    info('  - Hintergrund: Abstract 5 (immer in Farbe)');
    info('  - Varianten: Farbe + Graustufen-Portrait (Person Grau, Hintergrund Farbe)');
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
