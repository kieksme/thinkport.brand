#!/usr/bin/env node
/**
 * Run apply-cd-to-pptx.py with an optional virtual environment.
 * Creates .venv-pptx and installs python-pptx if needed.
 *
 * Usage:
 *   pnpm run generate:powerpoint
 *   SOURCE_PPTX=/path/to/source.pptx pnpm run generate:powerpoint
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const venvDir = join(root, '.venv-pptx');
const pip = join(venvDir, 'bin', 'pip');
const python = join(venvDir, 'bin', 'python');
const requirements = join(root, 'scripts', 'requirements-pptx.txt');
const script = join(root, 'scripts', 'apply-cd-to-pptx.py');
const outputPath = join(root, 'examples', 'powerpoint', 'thinkport-company-intro.pptx');

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

try {
if (!existsSync(venvDir)) {
  console.log('Creating .venv-pptx and installing python-pptx…');
  run('python3 -m venv .venv-pptx');
  run(`${pip} install -r scripts/requirements-pptx.txt`);
}

const source = process.env.SOURCE_PPTX || join(process.env.HOME || '', 'Downloads', 'Thinkport_Firmenvorstellung.pptx');
console.log('Applying Thinkport CD to PowerPoint…');
run(`${python} scripts/apply-cd-to-pptx.py --source "${source}" --output "${outputPath}"`);
console.log('Done. To get a PDF preview, open the PPTX in LibreOffice and export as PDF to examples/powerpoint/thinkport-company-intro-preview.pdf');
} catch (err) {
  console.error('generate:powerpoint failed:', err.message || err);
  process.exit(1);
}
