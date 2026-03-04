#!/usr/bin/env node
/**
 * Avatar Generator
 * Generates square avatar images from cut-out portraits with Abstract 5 as background
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve, extname, basename } from 'path';
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

// Load configuration once at module level
const CONFIG = loadConfig();
const AVATAR_CONFIG = CONFIG.avatarGenerator;

/**
 * Generate square avatar with Abstract 5 background
 * @param {string} portraitPath - Path to cut-out portrait image (PNG with transparency)
 * @param {number} size - Output size in pixels (square)
 * @param {string} outputPath - Output file path
 * @returns {Promise<void>}
 */
async function generateAvatar(portraitPath, size, outputPath) {
  try {
    // Validate inputs
    if (!existsSync(portraitPath)) {
      throw new Error(`Portrait image not found: ${portraitPath}`);
    }

    const backgroundPath = join(projectRoot, AVATAR_CONFIG.abstractBackgroundPath);
    if (!existsSync(backgroundPath)) {
      throw new Error(`Abstract background not found: ${backgroundPath}`);
    }

    if (size <= 0 || !Number.isInteger(size)) {
      throw new Error(`Invalid size: ${size}. Must be a positive integer`);
    }

    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    info(`Generating ${size}x${size}px avatar with Abstract 5 background...`);

    const targetSize = size;

    // Rasterize Abstract 5 SVG to size×size as background
    const background = await sharp(readFileSync(backgroundPath))
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    // Resize portrait to fill the square (cover strategy)
    const resizedPortrait = await sharp(portraitPath)
      .resize(targetSize, targetSize, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer();

    // Composite portrait over background (centered)
    const portraitX = Math.floor((size - targetSize) / 2);
    const portraitY = Math.floor((size - targetSize) / 2);

    const avatar = await sharp(background)
      .composite([
        {
          input: resizedPortrait,
          blend: 'over',
          left: portraitX,
          top: portraitY,
        },
      ])
      .png()
      .toBuffer();

    writeFileSync(outputPath, avatar);

    success(`Avatar generated successfully: ${outputPath}`);
    info(`Size: ${size}x${size}px`);
  } catch (err) {
    error(`Failed to generate avatar: ${err.message}`);
    throw err;
  }
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    portrait: null,
    size: AVATAR_CONFIG.defaults.size,
    output: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--portrait' && i + 1 < args.length) {
      parsed.portrait = args[++i];
    } else if (arg === '--size' && i + 1 < args.length) {
      parsed.size = parseInt(args[++i], 10);
    } else if (arg === '--output' && i + 1 < args.length) {
      parsed.output = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      return { help: true };
    }
  }

  return parsed;
}

/**
 * Prompt user for portrait image path
 * @returns {Promise<string>} Portrait image path
 */
async function promptPortraitPath() {
  const { portraitPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'portraitPath',
      message: 'Pfad zum freigestellten Portrait (PNG mit Transparenz):',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Portrait-Pfad ist erforderlich';
        }
        const path = resolve(input.trim());
        if (!existsSync(path)) {
          return `Datei nicht gefunden: ${path}`;
        }
        const ext = extname(path).toLowerCase();
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
          return 'Bitte eine PNG- oder JPEG-Datei angeben';
        }
        return true;
      },
    },
  ]);
  return resolve(portraitPath.trim());
}

/**
 * Prompt user for avatar size
 * @returns {Promise<number>} Avatar size in pixels
 */
async function promptAvatarSize() {
  const sizeChoices = [...AVATAR_CONFIG.sizeOptions, { name: 'Benutzerdefiniert', value: 'custom' }];
  const { size } = await inquirer.prompt([
    {
      type: 'list',
      name: 'size',
      message: 'Welche Größe soll der Avatar haben?',
      choices: sizeChoices,
      default: AVATAR_CONFIG.defaults.size,
    },
  ]);

  if (size === 'custom') {
    const { customSize } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customSize',
        message: 'Größe in Pixeln (quadratisch):',
        validate: (input) => {
          const num = parseInt(input, 10);
          if (isNaN(num) || num <= 0) {
            return 'Bitte eine positive Zahl eingeben';
          }
          if (num < AVATAR_CONFIG.sizeLimits.min || num > AVATAR_CONFIG.sizeLimits.max) {
            return `Größe muss zwischen ${AVATAR_CONFIG.sizeLimits.min} und ${AVATAR_CONFIG.sizeLimits.max} Pixeln liegen`;
          }
          return true;
        },
      },
    ]);
    return parseInt(customSize, 10);
  }

  return size;
}

/**
 * Prompt user for output path
 * @param {string} portraitPath - Portrait image path (for default output name)
 * @param {number} size - Avatar size
 * @returns {Promise<string>} Output file path
 */
async function promptOutputPath(portraitPath, size) {
  const portraitName = basename(portraitPath, extname(portraitPath));
  const defaultOutputDir = join(projectRoot, AVATAR_CONFIG.defaults.outputDir);
  const defaultOutput = join(defaultOutputDir, `avatar-${portraitName}-${size}.png`);

  const { outputPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'outputPath',
      message: 'Ausgabedatei-Pfad:',
      default: defaultOutput,
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Ausgabepfad ist erforderlich';
        }
        const path = resolve(input.trim());
        const dir = dirname(path);
        if (!existsSync(dir)) {
          // Check if we can create the directory
          try {
            mkdirSync(dir, { recursive: true });
          } catch (err) {
            return `Verzeichnis kann nicht erstellt werden: ${dir}`;
          }
        }
        const ext = extname(path).toLowerCase();
        if (ext !== '.png') {
          return 'Ausgabedatei muss eine PNG-Datei sein';
        }
        return true;
      },
    },
  ]);
  return resolve(outputPath.trim());
}

/**
 * Prompt user if they want to generate multiple avatars
 * @returns {Promise<boolean>} True if user wants to generate multiple avatars
 */
async function promptGenerateMultiple() {
  const { generateMultiple } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateMultiple',
      message: 'Möchten Sie mehrere Avatare generieren (verschiedene Größen)?',
      default: false,
    },
  ]);
  return generateMultiple;
}

/**
 * Prompt user for multiple avatar configurations
 * @param {string} portraitPath - Portrait image path
 * @returns {Promise<Array>} Array of avatar configurations
 */
async function promptMultipleAvatars(portraitPath) {
  const sizeChoices = AVATAR_CONFIG.sizeOptions.map((option, index) => ({
    name: option.name.replace(' (Klein)', '').replace(' (Standard)', '').replace(' (Groß)', ''),
    value: option.value,
    checked: index < 2,
  }));

  const { selectedSizes } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSizes',
      message: 'Welche Größen sollen generiert werden?',
      choices: sizeChoices,
      validate: (input) => {
        if (input.length === 0) {
          return 'Mindestens eine Größe muss ausgewählt werden';
        }
        return true;
      },
    },
  ]);

  const { outputDir } = await inquirer.prompt([
    {
      type: 'input',
      name: 'outputDir',
      message: 'Ausgabeverzeichnis:',
      default: join(projectRoot, AVATAR_CONFIG.defaults.outputDir),
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Ausgabeverzeichnis ist erforderlich';
        }
        const dir = resolve(input.trim());
        if (!existsSync(dir)) {
          try {
            mkdirSync(dir, { recursive: true });
          } catch (err) {
            return `Verzeichnis kann nicht erstellt werden: ${dir}`;
          }
        }
        return true;
      },
    },
  ]);

  const portraitName = basename(portraitPath, extname(portraitPath));
  const configs = [];

  for (const size of selectedSizes) {
    configs.push({
      portraitPath,
      size,
      outputPath: join(resolve(outputDir.trim()), `avatar-${portraitName}-${size}.png`),
    });
  }

  return configs;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
${header('Avatar Generator', 'Einfach besser aussehen')}

Usage:
  node scripts/generate-avatar.mjs [--portrait <path>] [--size <pixels>] [--output <path>]

Options:
  --portrait <path>    Path to cut-out portrait image (PNG with transparency)
  --size <pixels>      Output size in pixels (square, default: 512)
  --output <path>      Output file path
  --help, -h           Show this help message

Background: Abstract 5 (assets/images/abstracts/svg-12-animated/5.svg) is used as the avatar background.
The portrait is composited centered on top.

If no arguments are provided, an interactive prompt will guide you through the process.

Examples:
  # Interactive mode (recommended)
  node scripts/generate-avatar.mjs

  # Generate 512x512px avatar
  node scripts/generate-avatar.mjs --portrait path/to/portrait.png --size 512 --output output/avatar-512.png

  # Generate 256x256px avatar
  node scripts/generate-avatar.mjs --portrait path/to/portrait.png --size 256 --output output/avatar-256.png
`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(header('Avatar Generator', 'Einfach besser aussehen'));
    
    const args = parseArgs();

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    // If all required arguments are provided, use CLI mode
    if (args.portrait && args.output) {
      await generateAvatar(args.portrait, args.size, args.output);
      success('Avatar generation completed!');
      return;
    }

    // Interactive mode
    info('Interaktiver Modus - Bitte beantworten Sie die folgenden Fragen:\n');

    const generateMultiple = await promptGenerateMultiple();

    if (generateMultiple) {
      const portraitPath = await promptPortraitPath();
      const configs = await promptMultipleAvatars(portraitPath);

      info(`\nGeneriere ${configs.length} Avatar(s)...\n`);

      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        info(`[${i + 1}/${configs.length}] Generiere Avatar: ${basename(config.outputPath)}`);
        await generateAvatar(config.portraitPath, config.size, config.outputPath);
      }

      success(`\nAlle ${configs.length} Avatar(s) erfolgreich generiert!`);
    } else {
      const portraitPath = await promptPortraitPath();
      const size = await promptAvatarSize();
      const outputPath = await promptOutputPath(portraitPath, size);

      info('\nGeneriere Avatar...\n');
      await generateAvatar(portraitPath, size, outputPath);
      success('\nAvatar generation completed!');
    }
  } catch (err) {
    if (err.isTtyError) {
      error('Prompt konnte nicht im aktuellen Umfeld ausgeführt werden.');
      error('Bitte verwenden Sie die CLI-Argumente: --portrait, --size, --output');
    } else {
      error(`Error: ${err.message}`);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateAvatar, loadConfig };
