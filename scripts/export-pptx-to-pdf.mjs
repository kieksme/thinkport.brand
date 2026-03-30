#!/usr/bin/env node
/**
 * Export the company intro PPTX to PDF using LibreOffice (headless).
 * Requires: LibreOffice installed (e.g. brew install --cask libreoffice).
 *
 * Usage: pnpm run generate:powerpoint:pdf
 */

import { execSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'examples', 'powerpoint');
const pptx = join(dir, 'thinkport-company-intro.pptx');
const pdfOutput = join(dir, 'thinkport-company-intro-preview.pdf');

if (!existsSync(pptx)) {
  console.error('PPTX not found:', pptx);
  console.error('Run pnpm run generate:powerpoint first.');
  process.exit(1);
}

try {
  execSync(
    `libreoffice --headless --convert-to pdf --outdir "${dir}" "${pptx}"`,
    { stdio: 'inherit', cwd: root }
  );
  const rawPdf = join(dir, 'thinkport-company-intro.pdf');
  if (existsSync(rawPdf)) {
    renameSync(rawPdf, pdfOutput);
    console.log('PDF written:', pdfOutput);
  } else {
    console.error('LibreOffice did not produce expected PDF.');
    process.exit(1);
  }
} catch (err) {
  console.error('Export failed:', err.message || err);
  process.exit(1);
}
