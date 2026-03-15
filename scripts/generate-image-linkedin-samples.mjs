#!/usr/bin/env node
/**
 * Generate sample LinkedIn images
 * Creates example LinkedIn images with different variants (types, colors)
 */

import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { generateLinkedInImage, LINKEDIN_SPECS } from './generate-image-linkedin.mjs';
import { loadConfig } from './config-loader.mjs';
import { header, success, info, error, endGroup } from './misc-cli-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load configuration
const CONFIG = loadConfig();

/**
 * Generate all sample LinkedIn image variants
 */
async function generateSampleLinkedInImages() {
  const outputDir = join(projectRoot, 'examples', 'linkedin');
  
  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Define variants to generate (darkBlue, darkBlueBlur, orange, turquoise)
  const colors = ['darkBlue', 'darkBlueBlur', 'orange', 'turquoise'];
  const imageTypes = Object.keys(LINKEDIN_SPECS);
  
  // No text in banners; background graphic + logo only
  let totalImages = 0;
  const generatedImages = [];

  for (const type of imageTypes) {
    info(`\nGeneriere ${type} Bilder...`);
    const spec = LINKEDIN_SPECS[type];
    const dimensions = spec.recommended;

    for (const color of colors) {
      const ext = type === 'logo' ? 'png' : 'jpg';
      const outputFileName = `linkedin-${type}-${color}-${dimensions.width}x${dimensions.height}.${ext}`;
      const outputPath = join(outputDir, outputFileName);

      try {
        info(`  Generiere: ${outputFileName}`);
        await generateLinkedInImage(type, {
          color,
          logoPath: null,
          text: null,
          outputPath,
          useRecommended: true,
        });
        generatedImages.push(outputFileName);
        totalImages++;
      } catch (err) {
        error(`  Fehler bei ${outputFileName}: ${err.message}`);
      }
    }
  }
  
  return { totalImages, generatedImages, outputDir };
}

/**
 * Main function
 */
async function main() {
  try {
    header('Sample LinkedIn Images Generator', 'Generiere Beispiel-LinkedIn-Bilder mit verschiedenen Varianten', 'bgCyan');
    
    info('Generiere Beispiel-LinkedIn-Bilder mit verschiedenen Varianten:');
    info('  - Bildtypen: logo, title, culture-main, culture-module, photo, post');
    info('  - Hintergründe: Dark Blue, Motiv 16 (eigenständig), Orange, Turquoise (Thinkport-Palette)');
    info('  - Empfohlene Größen');
    info('');
    
    const result = await generateSampleLinkedInImages();
    
    endGroup();
    success(`Alle ${result.totalImages} Beispiel-LinkedIn-Bilder erfolgreich generiert!`);
    info(`Ausgabe-Verzeichnis: ${result.outputDir}`);
    info(`\nGenerierte Dateien:`);
    result.generatedImages.forEach(file => {
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
