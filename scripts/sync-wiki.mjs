#!/usr/bin/env node
/**
 * Syncs brand guidelines from guidelines/ to the wiki output format.
 * Transforms internal links to wiki page names and creates _Sidebar, _Header, _Footer, Home.
 *
 * Usage: node scripts/sync-wiki.mjs [repoRoot] [outputDir]
 * Defaults: repoRoot=., outputDir=./wiki-output
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.argv[2] || join(__dirname, '..');
const OUTPUT_DIR = process.argv[3] || join(REPO_ROOT, 'wiki-output');
const GUIDELINES_DIR = join(REPO_ROOT, 'guidelines');

const FILE_MAPPING = [
  ['LOGO_USAGE.md', 'Logo-Usage.md', 'Logo Usage'],
  ['COLOR_PALETTE.md', 'Color-Palette.md', 'Color Palette'],
  ['TYPOGRAPHY.md', 'Typography.md', 'Typography'],
  ['DESIGN_ELEMENTS.md', 'Design-Elements.md', 'Design Elements'],
  ['TEMPLATES_AND_RESOURCES.md', 'Templates-and-Resources.md', 'Templates and Resources'],
  ['BRAND_HISTORY.md', 'Brand-History.md', 'Brand History'],
];

const LINK_REPLACEMENTS = [
  [/\[COLOR_PALETTE\.md\]\(COLOR_PALETTE\.md\)(#[^)]*)?/g, '[Color Palette](Color-Palette$1)'],
  [/\[LOGO_USAGE\.md\]\(LOGO_USAGE\.md\)(#[^)]*)?/g, '[Logo Usage](Logo-Usage$1)'],
  [/\[TYPOGRAPHY\.md\]\(TYPOGRAPHY\.md\)(#[^)]*)?/g, '[Typography](Typography$1)'],
  [/\[DESIGN_ELEMENTS\.md\]\(DESIGN_ELEMENTS\.md\)(#[^)]*)?/g, '[Design Elements](Design-Elements$1)'],
  [/\[TEMPLATES_AND_RESOURCES\.md\]\(TEMPLATES_AND_RESOURCES\.md\)(#[^)]*)?/g, '[Templates and Resources](Templates-and-Resources$1)'],
  [/\[BRAND_HISTORY\.md\]\(BRAND_HISTORY\.md\)(#[^)]*)?/g, '[Brand History](Brand-History$1)'],
  [/\[guidelines\]\(\.\)/g, '[guidelines](Home)'],
];

function transformLinks(content) {
  let result = content;
  for (const [pattern, replacement] of LINK_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function main() {
  ensureDir(OUTPUT_DIR);

  for (const [srcName, destName, displayName] of FILE_MAPPING) {
    const srcPath = join(GUIDELINES_DIR, srcName);
    if (!existsSync(srcPath)) {
      console.warn(`Warning: ${srcPath} not found, skipping`);
      continue;
    }
    const content = readFileSync(srcPath, 'utf-8');
    const transformed = transformLinks(content);
    const destPath = join(OUTPUT_DIR, destName);
    writeFileSync(destPath, transformed, 'utf-8');
    console.log(`Synced ${srcName} -> ${destName}`);
  }

  const sidebar = `**[Thinkport Brand Guidelines](Home)**

- [Logo Usage](Logo-Usage)
- [Color Palette](Color-Palette)
- [Typography](Typography)
- [Design Elements](Design-Elements)
- [Templates and Resources](Templates-and-Resources)
- [Brand History](Brand-History)

---
[Source Repository](https://github.com/kieksme/thinkport.brand)
`;

  const header = `# Thinkport Brand Guidelines

Corporate Identity & Corporate Design für Thinkport GmbH
`;

  const footer = `---
*Guidelines werden automatisch aus dem [thinkport.brand](https://github.com/kieksme/thinkport.brand) Repository gespiegelt.*
`;

  const home = `# Thinkport Brand Guidelines

Corporate Identity & Corporate Design für Thinkport GmbH.

## Overview

This wiki contains the brand guidelines for Thinkport GmbH. Use these guidelines to ensure consistent brand representation across all company communications and materials.

## Guidelines

- [Logo Usage](Logo-Usage) – How to properly use logos
- [Color Palette](Color-Palette) – Official color definitions
- [Typography](Typography) – Font usage and hierarchy
- [Design Elements & Webdesign](Design-Elements) – Buttons, overlays, borders, Photoshop
- [Templates and Resources](Templates-and-Resources) – Slide Master, Geschäftsbrief DIN 5008, company intro
- [Brand History](Brand-History) – Policy changes (e.g. 2020 colour, 2021 logo)

## Source

The guidelines are automatically synced from the [thinkport.brand](https://github.com/kieksme/thinkport.brand) repository.
`;

  writeFileSync(join(OUTPUT_DIR, '_Sidebar.md'), sidebar, 'utf-8');
  writeFileSync(join(OUTPUT_DIR, '_Header.md'), header, 'utf-8');
  writeFileSync(join(OUTPUT_DIR, '_Footer.md'), footer, 'utf-8');
  writeFileSync(join(OUTPUT_DIR, 'Home.md'), home, 'utf-8');

  console.log('Created _Sidebar.md, _Header.md, _Footer.md, Home.md');
  console.log(`Wiki content ready in ${OUTPUT_DIR}`);
}

main();
