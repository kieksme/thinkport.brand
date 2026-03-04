#!/usr/bin/env node
/**
 * README Header Image Generator
 * Generates README header images (1200x200px) from SVG templates
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
import { getProjectRoot } from './config-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = getProjectRoot();

// README header specifications
const README_HEADER_SPECS = {
  width: 1200,
  height: 200,
};

/**
 * Convert SVG to PNG buffer
 * @param {string} svgPath - Path to SVG file
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {Promise<Buffer>} PNG buffer
 */
async function svgToPng(svgPath, width, height) {
  try {
    const svgBuffer = readFileSync(svgPath);
    const pngBuffer = await sharp(svgBuffer)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    return pngBuffer;
  } catch (err) {
    throw new Error(`SVG to PNG conversion failed: ${err.message}`);
  }
}

/**
 * Generate README header PNG from SVG
 * @param {string} svgPath - Path to SVG template
 * @param {string} outputPath - Output PNG file path
 * @param {Object} options - Generation options
 * @returns {Promise<void>}
 */
async function generateReadmeHeader(svgPath, outputPath, options = {}) {
  const {
    width = README_HEADER_SPECS.width,
    height = README_HEADER_SPECS.height,
  } = options;

  try {
    // Validate SVG file exists
    if (!existsSync(svgPath)) {
      throw new Error(`SVG file not found: ${svgPath}`);
    }

    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    info(`Generating README header image: ${width}x${height}px...`);
    info(`Source: ${svgPath}`);
    info(`Output: ${outputPath}`);

    // Convert SVG to PNG
    const pngBuffer = await svgToPng(svgPath, width, height);

    // Write output file
    writeFileSync(outputPath, pngBuffer);

    const fileSizeMB = pngBuffer.length / (1024 * 1024);
    success(`README header image generated successfully: ${outputPath}`);
    info(`Size: ${width}x${height}px`);
    info(`Format: PNG`);
    info(`File size: ${fileSizeMB.toFixed(2)}MB`);
  } catch (err) {
    error(`Failed to generate README header image: ${err.message}`);
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
    input: null,
    output: null,
    width: null,
    height: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--input' && i + 1 < args.length) {
      parsed.input = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      parsed.output = args[++i];
    } else if (arg === '--width' && i + 1 < args.length) {
      parsed.width = parseInt(args[++i], 10);
    } else if (arg === '--height' && i + 1 < args.length) {
      parsed.height = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      return { help: true };
    }
  }

  return parsed;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
${header('README Header Image Generator', 'Generate README header images from SVG templates')}

Usage:
  node scripts/generate-readme-header.mjs [options]

Options:
  --input <path>    Input SVG file path (default: assets/readme-header.svg)
  --output <path>  Output PNG file path (default: assets/readme-header.png)
  --width <px>      Custom width in pixels (default: 1200)
  --height <px>     Custom height in pixels (default: 200)
  --help, -h        Show this help message

Specifications:
  Default dimensions: 1200x200px (optimized for README width)
  Format: PNG

If no arguments are provided, uses default paths.

Examples:
  # Generate from default SVG template
  node scripts/generate-readme-header.mjs

  # Generate with custom paths
  node scripts/generate-readme-header.mjs \\
    --input assets/readme-header.svg \\
    --output assets/readme-header.png
`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(header('README Header Image Generator', 'Generate README header images from SVG templates'));
    
    const args = parseArgs();

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    // Default paths
    const defaultInput = join(projectRoot, 'assets', 'readme-header.svg');
    const defaultOutput = join(projectRoot, 'assets', 'readme-header.png');

    const inputPath = args.input || defaultInput;
    const outputPath = args.output || defaultOutput;

    await generateReadmeHeader(inputPath, outputPath, {
      width: args.width || README_HEADER_SPECS.width,
      height: args.height || README_HEADER_SPECS.height,
    });
    success('README header image generation completed!');
  } catch (err) {
    error(`Error: ${err.message}`);
    process.exit(1);
  }
}

// Run if called directly
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  main();
}

export { generateReadmeHeader, README_HEADER_SPECS };
