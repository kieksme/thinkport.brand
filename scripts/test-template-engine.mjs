#!/usr/bin/env node
/**
 * Test Template Engine
 * Tests the template rendering functionality without external dependencies
 */

import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

/**
 * Simple template engine - replaces {{variable}} placeholders
 * Also supports {{#if variable}}...{{/if}} conditionals
 */
function renderTemplate(template, data) {
  let result = template;

  // Handle conditionals {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (match, variable, content) => {
    if (data[variable] && data[variable].toString().trim() !== '') {
      return content;
    }
    return '';
  });

  // Replace simple placeholders {{variable}}
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(placeholderRegex, (match, variable) => {
    return data[variable] || '';
  });

  return result;
}

// Test data
const testData = {
  name: 'Max Mustermann',
  position: 'Geschäftsführer',
  email: 'max@example.com',
  phone: '+49 123 456789',
  mobile: '+49 123 4567890',
  website: 'www.example.com',
  logoPath: 'data:image/svg+xml;base64,test',
};

console.log('Testing Template Engine...\n');

// Test front template
try {
  const frontTemplatePath = join(projectRoot, 'assets', 'templates', 'business-card-front.html');
  const frontTemplate = readFileSync(frontTemplatePath, 'utf-8');
  const renderedFront = renderTemplate(frontTemplate, testData);
  
  console.log('✓ Front template loaded and rendered');
  console.log(`  Template length: ${frontTemplate.length} chars`);
  console.log(`  Rendered length: ${renderedFront.length} chars`);
  
  // Check if name was replaced
  if (renderedFront.includes('Max Mustermann')) {
    console.log('✓ Name placeholder replaced correctly');
  } else {
    console.log('✗ Name placeholder NOT replaced');
  }
  
  // Check if conditional worked
  if (renderedFront.includes('Geschäftsführer')) {
    console.log('✓ Position conditional rendered correctly');
  } else {
    console.log('✗ Position conditional NOT rendered');
  }
  
  // Check if email was rendered
  if (renderedFront.includes('max@example.com')) {
    console.log('✓ Email conditional rendered correctly');
  } else {
    console.log('✗ Email conditional NOT rendered');
  }
  
} catch (err) {
  console.error('✗ Front template test failed:', err.message);
}

// Test back template
try {
  const backTemplatePath = join(projectRoot, 'assets', 'templates', 'business-card-back.html');
  const backTemplate = readFileSync(backTemplatePath, 'utf-8');
  const renderedBack = renderTemplate(backTemplate, testData);
  
  console.log('\n✓ Back template loaded and rendered');
  console.log(`  Template length: ${backTemplate.length} chars`);
  console.log(`  Rendered length: ${renderedBack.length} chars`);
  
} catch (err) {
  console.error('✗ Back template test failed:', err.message);
}

// Test CSS file
try {
  const cssPath = join(projectRoot, 'assets', 'templates', 'business-card-styles.css');
  const css = readFileSync(cssPath, 'utf-8');
  console.log('\n✓ CSS file loaded');
  console.log(`  CSS length: ${css.length} chars`);
  
  // Check for key styles
  if (css.includes('.business-card-front')) {
    console.log('✓ Front styles found');
  }
  if (css.includes('.business-card-back')) {
    console.log('✓ Back styles found');
  }
  if (css.includes('.qr-code')) {
    console.log('✓ QR code styles found');
  }
  
} catch (err) {
  console.error('✗ CSS test failed:', err.message);
}

// Test logo file
try {
  const logoPath = join(projectRoot, 'assets', 'logos', 'thinkport-solo-light.svg');
  const logo = readFileSync(logoPath, 'utf-8');
  console.log('\n✓ Logo file found');
  console.log(`  Logo length: ${logo.length} chars`);
  
  if (logo.includes('<svg')) {
    console.log('✓ Valid SVG format');
  }
  
} catch (err) {
  console.error('✗ Logo test failed:', err.message);
}

console.log('\n✅ Template engine test completed!');
