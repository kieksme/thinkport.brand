#!/usr/bin/env node
/**
 * iOS Poster Generator
 * Composites staff portrait at bottom of assets/ios/poster.png and overlays job title.
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import sharp from 'sharp';
import inquirer from 'inquirer';
import {
  header,
  success,
  error,
  info,
} from './misc-cli-utils.mjs';
import { loadConfig } from './config-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const CONFIG = loadConfig();
const IOS_POSTER_CONFIG = CONFIG.iosPoster || {
  templatePath: 'assets/ios/poster.png',
  portraitHeightRatio: 0.4,
  jobTitleYRatio: 0.52,
  jobTitleFontSizeRatio: 0.045,
  jobTitleFill: '#FFFFFF',
  defaults: { outputDir: 'output/ios-posters' },
};

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Keep only the job title (strip company suffix like " | Thinkport" or " bei Thinkport GmbH"). */
function jobTitleOnly(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let t = raw.trim();
  const strip = [/\s*[|]\s*.*$/i, /\s+bei\s+.*$/i];
  for (const r of strip) {
    t = t.replace(r, '').trim();
  }
  return t;
}

/**
 * Create SVG buffer for job title text (centered, white, sans-serif).
 * @param {string} text - Job title
 * @param {number} width - Poster width
 * @param {number} height - Poster height
 * @param {{ fontSize?: number, fill?: string }} [options]
 * @returns {Buffer}
 */
function createJobTitleSvg(text, width, height, options = {}) {
  const fontSize = options.fontSize ?? Math.round(height * IOS_POSTER_CONFIG.jobTitleFontSizeRatio);
  const fill = options.fill ?? IOS_POSTER_CONFIG.jobTitleFill;
  const y = Math.round(height * IOS_POSTER_CONFIG.jobTitleYRatio);
  const safeText = text ? escapeXml(String(text).trim()) : '';
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="${width / 2}" y="${y}" font-family="Hanken Grotesk, sans-serif" font-size="${fontSize}" font-weight="200" fill="${fill}" text-anchor="middle" dominant-baseline="middle">${safeText}</text>
</svg>`;
  return Buffer.from(svg);
}

/**
 * Generate iOS poster: template + portrait at bottom + job title overlay.
 * @param {string} portraitPath - Path to portrait image
 * @param {string} jobTitle - Job title text (e.g. "Operations")
 * @param {string} outputPath - Output PNG path
 * @param {{ portraitHeightRatio?: number }} [options]
 * @returns {Promise<void>}
 */
async function generateIosPoster(portraitPath, jobTitle, outputPath, options = {}) {
  const templatePath = join(projectRoot, IOS_POSTER_CONFIG.templatePath);

  if (!existsSync(templatePath)) {
    throw new Error(`Poster template not found: ${templatePath}`);
  }
  if (!existsSync(portraitPath)) {
    throw new Error(`Portrait image not found: ${portraitPath}`);
  }

  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const templateMeta = await sharp(templatePath).metadata();
  const width = templateMeta.width;
  const height = templateMeta.height;
  if (!width || !height) {
    throw new Error('Could not read template dimensions');
  }

  const portraitMeta = await sharp(portraitPath).metadata();
  const pw = portraitMeta.width || 1;
  const ph = portraitMeta.height || 1;
  // Scale so full portrait fits on poster (contain); no cropping of avatar
  const scale = Math.min(width / pw, height / ph);
  const targetW = Math.round(pw * scale);
  const targetH = Math.round(ph * scale);
  const portraitLeft = Math.round((width - targetW) / 2);
  const portraitTop = height - targetH;

  info(`Generating iOS poster ${width}x${height}px (portrait full visible ${targetW}x${targetH}px)...`);

  let base = sharp(readFileSync(templatePath));

  const portraitBuffer = await sharp(portraitPath)
    .resize(targetW, targetH, { fit: 'contain' })
    .toBuffer();

  const composites = [
    {
      input: portraitBuffer,
      blend: 'over',
      left: portraitLeft,
      top: portraitTop,
    },
  ];

  const jobTitleText = jobTitleOnly(jobTitle);
  if (jobTitleText) {
    const titleSvg = createJobTitleSvg(jobTitleText, width, height);
    const titleBuffer = await sharp(titleSvg)
      .resize(width, height)
      .png()
      .toBuffer();
    composites.push({
      input: titleBuffer,
      blend: 'over',
      left: 0,
      top: 0,
    });
  }

  const result = await base
    .composite(composites)
    .png()
    .toBuffer();

  writeFileSync(outputPath, result);
  success(`Poster generated: ${outputPath}`);
  info(`Size: ${width}x${height}px`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    portrait: null,
    jobTitle: '',
    output: null,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--portrait' && i + 1 < args.length) parsed.portrait = args[++i];
    else if (arg === '--job-title' && i + 1 < args.length) parsed.jobTitle = args[++i];
    else if (arg === '--output' && i + 1 < args.length) parsed.output = args[++i];
    else if (arg === '--help' || arg === '-h') return { help: true };
  }
  return parsed;
}

function showHelp() {
  console.log(`
${header('iOS Poster Generator', 'Template + portrait + job title')}

Usage:
  node scripts/generate-ios-poster.mjs --portrait <path> [--job-title <text>] --output <path>

Options:
  --portrait <path>   Path to portrait image (required)
  --job-title <text>  Job title text overlay (optional)
  --output <path>     Output PNG path (required)
  --help, -h          Show this help

Template: assets/ios/poster.png. Portrait is composited at the bottom; job title is drawn below the logo area.
`);
}

async function main() {
  try {
    console.log(header('iOS Poster Generator', 'Template + portrait + job title'));

    const args = parseArgs();
    if (args.help) {
      showHelp();
      process.exit(0);
    }

    if (args.portrait && args.output) {
      await generateIosPoster(args.portrait, args.jobTitle || '', args.output);
      success('Done.');
      return;
    }

    info('Interactive mode – answer the prompts.\n');

    const { portraitPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'portraitPath',
        message: 'Path to portrait image:',
        validate: (input) => {
          if (!input?.trim()) return 'Portrait path is required';
          if (!existsSync(resolve(input.trim()))) return `File not found: ${input}`;
          return true;
        },
      },
    ]);

    const { jobTitle } = await inquirer.prompt([
      {
        type: 'input',
        name: 'jobTitle',
        message: 'Job title (optional):',
        default: '',
      },
    ]);

    const defaultOut = join(projectRoot, IOS_POSTER_CONFIG.defaults.outputDir, 'poster.png');
    const { outputPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'outputPath',
        message: 'Output file path:',
        default: defaultOut,
        validate: (input) => {
          if (!input?.trim()) return 'Output path is required';
          const dir = dirname(resolve(input.trim()));
          if (!existsSync(dir)) {
            try {
              mkdirSync(dir, { recursive: true });
            } catch {
              return `Cannot create directory: ${dir}`;
            }
          }
          return true;
        },
      },
    ]);

    await generateIosPoster(resolve(portraitPath.trim()), jobTitle?.trim() || '', resolve(outputPath.trim()));
    success('Done.');
  } catch (err) {
    if (err.isTtyError) {
      error('Interactive mode not available. Use --portrait, --job-title, --output.');
    } else {
      error(err.message);
    }
    process.exit(1);
  }
}

const currentFile = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && (
  currentFile === process.argv[1] ||
  currentFile.endsWith(process.argv[1]) ||
  process.argv[1].endsWith('generate-ios-poster.mjs')
);
if (isMain) {
  main();
}

export { generateIosPoster, createJobTitleSvg };
