#!/usr/bin/env node
/**
 * LinkedIn Image Generator
 * Generates LinkedIn-compliant images for company pages and career pages
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
  warn,
} from './misc-cli-utils.mjs';
import { loadConfig, loadBrandColors, hexToRgb } from './config-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load configuration
const CONFIG = loadConfig();
const LINKEDIN_SPECS = CONFIG.linkedin.imageSpecs;

const DEFAULT_LOGO_SOLO = join(projectRoot, 'assets', 'logos', 'solo', 'thinkport-solo-light.svg');
const DEFAULT_LOGO_HORIZONTAL = join(projectRoot, 'assets', 'logos', 'horizontal', 'thinkport-horizontal-light.svg');
const HORIZONTAL_LOGO_ASPECT = 1479 / 280;

/** Default background graphic (dark variant for brand colors). Config override: linkedin.backgroundPath */
const DEFAULT_BACKGROUND_PATH = join(projectRoot, 'assets', 'backgrounds', '5-dark.svg');

/** Minimum contrast ratio for logo on background (WCAG 2.1 Level AA for large graphics). */
const MIN_LOGO_CONTRAST = 3;

/**
 * Convert RGB (0–255) to hex string.
 * @param {number} r - Red
 * @param {number} g - Green
 * @param {number} b - Blue
 * @returns {string} Hex e.g. "#0B2649"
 */
function rgbToHex(r, g, b) {
  const clamp = (v) => Math.round(Math.max(0, Math.min(255, v)));
  return '#' + [r, g, b].map(clamp).map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive lighter and darker variants from a brand color for background polygon fills.
 * Harmonizes the background graphic with the chosen brand color.
 * @param {string} colorHex - Base brand color hex
 * @returns {{ base: string, lighter: string, darker: string }}
 */
function deriveBackgroundVariants(colorHex) {
  const rgb = hexToRgb(colorHex);
  if (!rgb) return { base: colorHex, lighter: colorHex, darker: colorHex };
  const { r, g, b } = rgb;
  // Lighter: blend toward white (30%)
  const lighter = rgbToHex(
    r + (255 - r) * 0.3,
    g + (255 - g) * 0.3,
    b + (255 - b) * 0.3
  );
  // Darker: blend toward black (25%)
  const darker = rgbToHex(r * 0.75, g * 0.75, b * 0.75);
  return { base: colorHex, lighter, darker };
}

/** LinkedIn background palette: Thinkport primary colors only (config.linkedin.colors). */
function getLinkedInColors() {
  const c = CONFIG.linkedin?.colors || CONFIG.brand.colors;
  const darkBlue = c.darkBlue ?? c.aqua ?? '#0B2649';
  return {
    darkBlue,
    darkBlueBlur: c.darkBlueBlur ?? darkBlue,
    orange: c.orange ?? '#FF5722',
    turquoise: c.turquoise ?? '#00BCD4',
  };
}

/**
 * Relative luminance (sRGB) for contrast calculation.
 * @param {string} hex - Hex color e.g. "#0B2649"
 * @returns {number} Luminance 0..1
 */
function hexToLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Contrast ratio (WCAG) between two colors; >= 1.
 * @param {string} hex1 - First color
 * @param {string} hex2 - Second color
 * @returns {number} Contrast ratio
 */
function getContrastRatio(hex1, hex2) {
  const L1 = hexToLuminance(hex1);
  const L2 = hexToLuminance(hex2);
  const [light, dark] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Pick logo color (white or darkBlue) that meets minimum contrast on the given background.
 * Uses only Thinkport brand colors; ensures logo is always readable.
 * @param {string} backgroundHex - Background color hex
 * @returns {string} Hex for logo contrast (white or darkBlue)
 */
function getLogoContrastColor(backgroundHex) {
  const brand = CONFIG.brand.colors;
  const linkedin = getLinkedInColors();
  const whiteRatio = getContrastRatio(backgroundHex, brand.white);
  const darkRatio = getContrastRatio(backgroundHex, linkedin.darkBlue ?? linkedin.darkBlueBlur);
  const useWhite = whiteRatio >= darkRatio;
  const ratio = useWhite ? whiteRatio : darkRatio;
  if (ratio < MIN_LOGO_CONTRAST) {
    warn(`Logo contrast is ${ratio.toFixed(2)}:1 (target ≥${MIN_LOGO_CONTRAST}:1). Consider a different background.`);
  }
  return useWhite ? brand.white : linkedin.darkBlue;
}

/**
 * Modify SVG logo colors based on background (Thinkport brand, contrast-safe).
 * Solo logo: lighthouse (Leuchtturm) stays dark blue (#0B2649) on all backgrounds; other elements unchanged.
 */
function modifySoloLogoColors(svgContent, _backgroundColor) {
  return svgContent;
}

/**
 * Modify horizontal (wordmark) logo colors; ensures contrast-rich logo on background.
 */
function modifyHorizontalLogoColors(svgContent, backgroundColor) {
  const linkedin = getLinkedInColors();
  const backgroundHex = linkedin[backgroundColor] || linkedin.darkBlue;
  const textColor = getLogoContrastColor(backgroundHex);
  let modified = svgContent
    .replace(/fill:#1a2846/g, `fill:${textColor}`)
    .replace(/fill:#1eb8d1/g, `fill:${textColor}`)
    .replace(/fill="#1a2846"/g, `fill="${textColor}"`)
    .replace(/fill="#1eb8d1"/g, `fill="${textColor}"`)
    .replace(/fill="#ea592d"/g, `fill="${textColor}"`);
  return modified;
}

function modifyLogoColors(svgContent, backgroundColor, isHorizontal = false) {
  return isHorizontal
    ? modifyHorizontalLogoColors(svgContent, backgroundColor)
    : modifySoloLogoColors(svgContent, backgroundColor);
}

/**
 * Convert SVG to PNG buffer
 * @param {string} svgPath - Path to SVG file
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @param {string} backgroundColor - Background color name for color adjustment
 * @returns {Promise<Buffer>} PNG buffer
 */
async function svgToPng(svgPath, width, height, backgroundColor = null, isHorizontal = false) {
  try {
    let svgContent = readFileSync(svgPath, 'utf-8');

    if (backgroundColor) {
      svgContent = modifyLogoColors(svgContent, backgroundColor, isHorizontal);
    }
    
    const svgBuffer = Buffer.from(svgContent);
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
 * Render background graphic (from assets/backgrounds) with brand color as base fill.
 * Falls back to solid color if the background file is missing.
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {string} colorHex - Brand color for the background base
 * @param {string|null} [pathOverride] - Optional path relative to project root (e.g. for darkBlueBlur variant)
 * @returns {Promise<sharp.Sharp>} Sharp instance (background layer)
 */
async function getBackgroundLayer(width, height, colorHex, pathOverride = null) {
  const resolvedPath = pathOverride
    ? join(projectRoot, pathOverride)
    : (CONFIG.linkedin?.backgroundPath ? join(projectRoot, CONFIG.linkedin.backgroundPath) : DEFAULT_BACKGROUND_PATH);
  const backgroundPath = resolvedPath;

  if (!existsSync(backgroundPath)) {
    warn(`Background graphic not found: ${backgroundPath}, using solid color`);
    const rgb = hexToRgb(colorHex);
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: rgb.r, g: rgb.g, b: rgb.b, alpha: 1 },
      },
    });
  }

  let svgContent = readFileSync(backgroundPath, 'utf-8');

  // Disable CSS animations so the rasterized frame is static and predictable
  svgContent = svgContent.replace(
    /animation: [^;]+;/g,
    'animation: none;'
  );

  // Replace first rect fill (background base) with brand color
  svgContent = svgContent.replace(
    /(<rect\s[^>]*?)fill="#[0-9a-fA-F]{6}"([^>]*>)/,
    `$1fill="${colorHex}"$2`
  );

  // Replace polygon fills with brand-harmonized variants (5-dark.svg uses grey/teal; map to lighter/darker of colorHex)
  const { lighter, darker } = deriveBackgroundVariants(colorHex);
  const polygonColorMap = [
    ['#485b59', lighter],
    ['#4d5f67', darker],
    ['#496165', lighter],
    ['#2f3b3d', darker],
    ['#576e70', lighter],
  ];
  for (const [originalHex, variantHex] of polygonColorMap) {
    svgContent = svgContent.split(originalHex).join(variantHex);
  }

  const bgBuffer = await sharp(Buffer.from(svgContent))
    .resize(width, height, { fit: 'cover' })
    .png()
    .toBuffer();
  return sharp(bgBuffer);
}

/**
 * Create SVG text overlay with blend overlay (Thinkport colors only).
 * Only the text area gets a semi-transparent overlay so text blends over the background; logos stay solid.
 * @param {string} text - Text to display
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} options - Text options and brand colors (textFill, overlayFill, overlayOpacity)
 * @returns {string} SVG string
 */
function createTextOverlay(text, width, height, options = {}) {
  const {
    fontSize = Math.floor(height * 0.1),
    x = width / 2,
    y = height / 2,
    textAnchor = 'middle',
    fontFamily = 'Hanken Grotesk, sans-serif',
    fontWeight = '700',
    // Thinkport brand colors only (from config)
    textFill = CONFIG.brand.colors.white,
    overlayFill = getLinkedInColors().darkBlue,
    overlayOpacity = 0.65,
  } = options;

  // Approximate text bounds for overlay rect (so only text area blends)
  const paddingX = Math.max(fontSize * 0.8, 24);
  const paddingY = Math.max(fontSize * 0.5, 16);
  const rectWidth = Math.min(text.length * fontSize * 0.55 + paddingX * 2, width * 0.9);
  const rectHeight = fontSize * 1.5 + paddingY * 2;
  const rectX = textAnchor === 'middle' ? x - rectWidth / 2 : textAnchor === 'end' ? x - rectWidth : x;
  const rectY = y - rectHeight / 2;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${Math.max(0, rectX)}" y="${Math.max(0, rectY)}" width="${rectWidth}" height="${rectHeight}" rx="8" fill="${overlayFill}" fill-opacity="${overlayOpacity}"/>
      <text
        x="${x}"
        y="${y}"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        font-weight="${fontWeight}"
        fill="${textFill}"
        text-anchor="${textAnchor}"
        dominant-baseline="middle"
      >${escapeXml(text)}</text>
    </svg>
  `;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate LinkedIn image
 * @param {string} type - Image type (logo, title, culture-main, culture-module, photo, post)
 * @param {Object} options - Generation options
 * @returns {Promise<void>}
 */
async function generateLinkedInImage(type, options) {
  const {
    color = 'darkBlue',
    logoPath = null,
    text = null,
    outputPath,
    format = null,
    useRecommended = true,
  } = options;

  try {
    // Validate type
    if (!LINKEDIN_SPECS[type]) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${Object.keys(LINKEDIN_SPECS).join(', ')}`);
    }

    const spec = LINKEDIN_SPECS[type];
    const dimensions = useRecommended ? spec.recommended : spec.min;
    const width = dimensions.width;
    const height = dimensions.height;

    // Validate color – use config.json brand colors only (Thinkport LinkedIn palette)
    const linkedinColors = getLinkedInColors();
    const colorKey = Object.keys(linkedinColors).find((k) => k.toLowerCase() === String(color).toLowerCase());
    const colorHex = colorKey ? linkedinColors[colorKey] : null;
    if (!colorHex) {
      throw new Error(`Invalid color: ${color}. Must be one of: darkBlue, darkBlueBlur, orange, turquoise`);
    }

    // Determine output format
    let outputFormat = format;
    if (!outputFormat) {
      // Default: JPEG for large images, PNG for logos
      outputFormat = type === 'logo' ? 'png' : 'jpeg';
    }

    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    info(`Generating ${type} image: ${width}x${height}px with ${color} background...`);

    if (!hexToRgb(colorHex)) {
      throw new Error(`Invalid color hex: ${colorHex}`);
    }

    // Use background graphic from assets/backgrounds (brand color as base); no text in banners
    const darkBlueBlurBackground = CONFIG.linkedin?.backgroundPathDarkBlueBlur ?? 'assets/backgrounds/16.svg';
    const backgroundPathOverride = color === 'darkBlueBlur' ? darkBlueBlurBackground : null;
    const background = await getBackgroundLayer(width, height, colorHex, backgroundPathOverride);
    const compositeLayers = [];

    // Add logo if provided or use default (Thinkport brand)
    const useHorizontalForBanner = !logoPath && ['title', 'culture-main', 'culture-module'].includes(type);
    const logoToUse = logoPath || (useHorizontalForBanner ? DEFAULT_LOGO_HORIZONTAL : DEFAULT_LOGO_SOLO);

    if (!existsSync(logoToUse)) {
      if (logoPath || type === 'logo') {
        warn(`Logo not found: ${logoToUse}, skipping logo overlay`);
      }
    } else {
      let logoWidth, logoHeight;
      if (type === 'logo') {
        logoWidth = logoHeight = Math.floor(Math.min(width, height) * 0.8);
      } else if (useHorizontalForBanner) {
        logoHeight = Math.floor(height * 0.35);
        logoWidth = Math.min(
          Math.floor(logoHeight * HORIZONTAL_LOGO_ASPECT),
          Math.floor(width * 0.5)
        );
      } else {
        logoWidth = logoHeight = Math.floor(Math.min(width, height) * 0.3);
      }

      const logoBuffer = await svgToPng(
        logoToUse,
        logoWidth,
        logoHeight,
        color,
        useHorizontalForBanner
      );

      let logoX, logoY;
      if (type === 'logo') {
        logoX = Math.floor((width - logoWidth) / 2);
        logoY = Math.floor((height - logoHeight) / 2);
      } else if (type === 'title' || useHorizontalForBanner) {
        logoX = Math.floor(width * 0.05);
        logoY = Math.floor((height - logoHeight) / 2);
      } else {
        logoX = Math.floor(width * 0.05);
        logoY = Math.floor(height * 0.05);
      }

      compositeLayers.push({
        input: logoBuffer,
        blend: 'over',
        left: logoX,
        top: logoY,
      });
    }

    // No text in banners; logo only on background graphic

    // Composite all layers
    let image = background;
    if (compositeLayers.length > 0) {
      image = image.composite(compositeLayers);
    }

    // Apply format-specific processing
    let outputBuffer;
    if (outputFormat === 'jpeg') {
      outputBuffer = await image
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
    } else {
      outputBuffer = await image
        .png({ compressionLevel: 9 })
        .toBuffer();
    }

    // Check file size (max 3MB)
    const fileSizeMB = outputBuffer.length / (1024 * 1024);
    if (fileSizeMB > 3) {
      warn(`File size is ${fileSizeMB.toFixed(2)}MB, exceeding LinkedIn's 3MB limit. Compressing...`);
      
      // Re-compress with lower quality
      if (outputFormat === 'jpeg') {
        outputBuffer = await background
          .composite(compositeLayers)
          .jpeg({ quality: 75, mozjpeg: true })
          .toBuffer();
      } else {
        outputBuffer = await background
          .composite(compositeLayers)
          .png({ compressionLevel: 9, effort: 10 })
          .toBuffer();
      }
      
      const newFileSizeMB = outputBuffer.length / (1024 * 1024);
      if (newFileSizeMB > 3) {
        warn(`File size after compression: ${newFileSizeMB.toFixed(2)}MB. Still exceeds limit.`);
      }
    }

    // Write output file
    writeFileSync(outputPath, outputBuffer);

    const finalSizeMB = outputBuffer.length / (1024 * 1024);
    success(`LinkedIn image generated successfully: ${outputPath}`);
    info(`Size: ${width}x${height}px`);
    info(`Format: ${outputFormat.toUpperCase()}`);
    info(`File size: ${finalSizeMB.toFixed(2)}MB`);
    info(`Color: ${color} (${colorHex})`);
    if (text) {
      info(`Text: ${text}`);
    }
  } catch (err) {
    error(`Failed to generate LinkedIn image: ${err.message}`);
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
    type: null,
    color: null,
    logo: null,
    text: null,
    output: null,
    format: null,
    recommended: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--type' && i + 1 < args.length) {
      parsed.type = args[++i];
    } else if (arg === '--color' && i + 1 < args.length) {
      parsed.color = args[++i].toLowerCase();
    } else if (arg === '--logo' && i + 1 < args.length) {
      parsed.logo = args[++i];
    } else if (arg === '--text' && i + 1 < args.length) {
      parsed.text = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      parsed.output = args[++i];
    } else if (arg === '--format' && i + 1 < args.length) {
      parsed.format = args[++i].toLowerCase();
    } else if (arg === '--min') {
      parsed.recommended = false;
    } else if (arg === '--help' || arg === '-h') {
      return { help: true };
    }
  }

  return parsed;
}

/**
 * Prompt user for image type
 * @returns {Promise<string>} Image type
 */
async function promptImageType() {
  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Welchen LinkedIn-Bildtyp möchten Sie generieren?',
      choices: Object.entries(LINKEDIN_SPECS).map(([key, spec]) => ({
        name: `${key} - ${spec.description} (${spec.recommended.width}x${spec.recommended.height}px)`,
        value: key,
      })),
    },
  ]);
  return type;
}

/**
 * Prompt user for brand color
 * @returns {Promise<string>} Brand color name
 */
async function promptBrandColor() {
  const colors = getLinkedInColors();
  const { color } = await inquirer.prompt([
    {
      type: 'list',
      name: 'color',
      message: 'Welche Thinkport-Farbe soll als Hintergrund verwendet werden?',
      choices: [
        { name: `Dark Blue (#${colors.darkBlue.replace('#', '')})`, value: 'darkBlue' },
        { name: `Orange (#${colors.orange.replace('#', '')})`, value: 'orange' },
        { name: `Turquoise (#${colors.turquoise.replace('#', '')})`, value: 'turquoise' },
      ],
    },
  ]);
  return color;
}

/**
 * Prompt user for logo path
 * @returns {Promise<string|null>} Logo path or null
 */
async function promptLogoPath() {
  const { useLogo } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useLogo',
      message: 'Möchten Sie ein Logo hinzufügen?',
      default: true,
    },
  ]);

  if (!useLogo) {
    return null;
  }

  const { logoPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'logoPath',
      message: 'Pfad zum Logo (leer für Standard-Logo):',
      default: '',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return true; // Empty is OK, will use default
        }
        const path = resolve(input.trim());
        if (!existsSync(path)) {
          return `Datei nicht gefunden: ${path}`;
        }
        return true;
      },
    },
  ]);

  return logoPath.trim() || null;
}

/**
 * Prompt user for text
 * @returns {Promise<string|null>} Text or null
 */
async function promptText() {
  const { useText } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useText',
      message: 'Möchten Sie Text hinzufügen?',
      default: false,
    },
  ]);

  if (!useText) {
    return null;
  }

  const { text } = await inquirer.prompt([
    {
      type: 'input',
      name: 'text',
      message: 'Text zum Anzeigen:',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Text ist erforderlich';
        }
        return true;
      },
    },
  ]);

  return text.trim();
}

/**
 * Prompt user for output path
 * @param {string} type - Image type
 * @param {string} color - Brand color
 * @returns {Promise<string>} Output file path
 */
async function promptOutputPath(type, color) {
  const spec = LINKEDIN_SPECS[type];
  const dimensions = spec.recommended;
  const defaultOutputDir = join(projectRoot, CONFIG.output.linkedin);
  const ext = type === 'logo' ? 'png' : 'jpg';
  const defaultOutput = join(
    defaultOutputDir,
    `linkedin-${type}-${color}-${dimensions.width}x${dimensions.height}.${ext}`
  );

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
  return resolve(outputPath.trim());
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
${header('LinkedIn Image Generator', 'Generate LinkedIn-compliant images')}

Usage:
  node scripts/generate-image-linkedin.mjs [options]

Options:
  --type <type>      Image type: logo, title, culture-main, culture-module, photo, post
  --color <color>    Thinkport color: darkBlue, orange, or turquoise
  --logo <path>      Logo file path (optional; default: solo logo for logo/photo/post, horizontal wordmark for title/culture)
  --text <text>      Ignored; banners have no text (logo + background graphic only)
  --output <path>    Output file path
  --format <format>  Output format: jpeg or png (default: jpeg for large images, png for logos)
  --min              Use minimum dimensions instead of recommended
  --help, -h         Show this help message

Image Types:
  logo              Logo image: 400x400px (recommended) / 268x268px (min)
  title             Title image: 4200x700px
  culture-main      Company culture main: 1128x376px
  culture-module    Company culture module: 502x282px
  photo             Company photo: 900x600px (recommended) / 264x176px (min)
  post              Post image: 1200x627px (1.91:1 ratio)

If no arguments are provided, an interactive prompt will guide you through the process.

Examples:
  # Interactive mode (recommended)
  node scripts/generate-image-linkedin.mjs

  # Generate title image with Dark Blue background
  node scripts/generate-image-linkedin.mjs \\
    --type title \\
    --color darkBlue \\
    --output output/linkedin-title-darkBlue.jpg

  # Generate logo image
  node scripts/generate-image-linkedin.mjs \\
    --type logo \\
    --color orange \\
    --output output/linkedin-logo-orange.png

Brand Colors:
  - darkBlue:      #0B2649 (default background graphic)
  - darkBlueBlur: Eigenständiger Hintergrund „Motiv 16“ (hellere Variante 16.svg), Farbe #0B2649
  - orange:       #FF5722
  - turquoise:    #00BCD4
`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(header('LinkedIn Image Generator', 'Generate LinkedIn-compliant images'));
    
    const args = parseArgs();

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    // If all required arguments are provided, use CLI mode
    if (args.type && args.color && args.output) {
      // Validate type
      if (!LINKEDIN_SPECS[args.type]) {
        error(`Invalid type: ${args.type}. Must be one of: ${Object.keys(LINKEDIN_SPECS).join(', ')}`);
        process.exit(1);
      }

      // Validate color
      const validColors = ['darkBlue', 'darkBlueBlur', 'orange', 'turquoise'];
      if (!validColors.includes(args.color)) {
        error(`Invalid color: ${args.color}. Must be one of: ${validColors.join(', ')}`);
        process.exit(1);
      }

      // Generate image
      await generateLinkedInImage(args.type, {
        color: args.color,
        logoPath: args.logo,
        text: args.text,
        outputPath: args.output,
        format: args.format,
        useRecommended: args.recommended,
      });
      success('LinkedIn image generation completed!');
      return;
    }

    // Interactive mode
    info('Interactive mode - Please answer the following questions:\n');

    const type = await promptImageType();
    const color = await promptBrandColor();
    const logoPath = await promptLogoPath();
    const text = await promptText();
    const outputPath = await promptOutputPath(type, color);

    info('\nGenerating LinkedIn image...\n');
    await generateLinkedInImage(type, {
      color,
      logoPath,
      text,
      outputPath,
      useRecommended: true,
    });
    success('\nLinkedIn image generation completed!');
  } catch (err) {
    if (err.isTtyError) {
      error('Prompt could not be executed in the current environment.');
      error('Please use CLI arguments: --type, --color, --output');
    } else {
      error(`Error: ${err.message}`);
    }
    process.exit(1);
  }
}

// Run if called directly
const currentFile = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && (
  currentFile === process.argv[1] ||
  currentFile.endsWith(process.argv[1]) ||
  process.argv[1].endsWith('generate-image-linkedin.mjs')
);
if (isMain) {
  main();
}

export { generateLinkedInImage, loadBrandColors, hexToRgb, LINKEDIN_SPECS };
