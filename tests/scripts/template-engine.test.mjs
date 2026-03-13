#!/usr/bin/env node
/**
 * Tests for template-engine.mjs
 */

import { renderTemplate } from '../../scripts/template-engine.mjs';
import { assert, expect } from './test-utils.mjs';

async function main() {
  console.log('\nTemplate Engine Tests\n');

  const tests = [];

  function test(name, fn) {
    tests.push({ name, fn });
  }

  test('replaces simple placeholders', () => {
    const tpl = 'Hello {{name}}, welcome to {{company}}!';
    const out = renderTemplate(tpl, { name: 'Alex', company: 'Thinkport' });
    expect(out).toBe('Hello Alex, welcome to Thinkport!');
  });

  test('handles missing variables as empty string', () => {
    const tpl = 'Hello {{name}}, you work at {{company}}.';
    const out = renderTemplate(tpl, { name: 'Alex' });
    expect(out).toBe('Hello Alex, you work at .');
  });

  test('renders conditional blocks when value is truthy', () => {
    const tpl = 'Name: {{name}}{{#if position}} ({{position}}){{/if}}';
    const out = renderTemplate(tpl, { name: 'Alex', position: 'Consultant' });
    expect(out).toBe('Name: Alex (Consultant)');
  });

  test('omits conditional blocks when value is falsy', () => {
    const tpl = 'Name: {{name}}{{#if position}} ({{position}}){{/if}}';
    const out = renderTemplate(tpl, { name: 'Alex', position: '' });
    expect(out).toBe('Name: Alex');
  });

  test('supports multiline conditional content', () => {
    const tpl = 'Line 1\n{{#if show}}Line 2: {{value}}\nLine 3{{/if}}\nEnd';
    const out = renderTemplate(tpl, { show: true, value: 'X' });
    expect(out).toBe('Line 1\nLine 2: X\nLine 3\nEnd');
  });

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nTests: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Unexpected error in template-engine tests:', err);
  process.exit(1);
});

