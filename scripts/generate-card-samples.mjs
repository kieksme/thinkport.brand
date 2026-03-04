#!/usr/bin/env node
/**
 * Generate sample business cards using pdf-lib
 * Creates example business cards for demonstration purposes
 */

import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateBusinessCardWithPdfLib } from './generate-card.mjs';
import { header, success, info, endGroup } from './misc-cli-utils.mjs';
import { getSampleContacts } from './sample-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

/**
 * Main function – uses data from examples/business-cards/*.json, fallback to built-in sample data
 */
async function main() {
  try {
    header('Sample Business Cards Generator (pdf-lib)', 'Generiere Mustervisitenkarten mit pdf-lib', 'bgCyan');

    const contacts = getSampleContacts(projectRoot);
    const outputDir = join(projectRoot, 'examples', 'sample-business-cards');

    info(`Generiere ${contacts.length} Mustervisitenkarten (Daten: examples/business-cards/)...`);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      info(`\nGeneriere Visitenkarte ${i + 1}/${contacts.length}: ${contact.name}`);
      
      const result = await generateBusinessCardWithPdfLib(contact, outputDir);
      success(`✓ ✓ ${contact.name} - Vorder- und Rückseite generiert`);
    }

    endGroup();
    success(`Alle ${contacts.length} Mustervisitenkarten erfolgreich generiert!`);
    info(`Ausgabe-Verzeichnis: ${outputDir}`);
  } catch (err) {
    endGroup();
    console.error('Fehler:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();
