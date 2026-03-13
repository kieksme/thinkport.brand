#!/usr/bin/env node
/**
 * Tests for thinkport-api-client.mjs
 */

import {
  buildBasicAuthHeaderFromEnv,
  normalizePerson,
} from '../../scripts/thinkport-api-client.mjs';
import { assert, expect } from './test-utils.mjs';

async function main() {
  console.log('\nThinkport API Client Tests\n');

  const tests = [];

  function test(name, fn) {
    tests.push({ name, fn });
  }

  test('buildBasicAuthHeaderFromEnv throws when env vars are missing', () => {
    const originalUser = process.env.THINKPORT_API_USERNAME;
    const originalPass = process.env.THINKPORT_API_PASSWORD;

    delete process.env.THINKPORT_API_USERNAME;
    delete process.env.THINKPORT_API_PASSWORD;

    let threw = false;
    try {
      buildBasicAuthHeaderFromEnv();
    } catch (err) {
      threw = true;
      assert(
        err.message.includes('THINKPORT_API_USERNAME') &&
          err.message.includes('THINKPORT_API_PASSWORD'),
        'Error message should mention both missing env vars',
      );
    } finally {
      if (originalUser !== undefined) process.env.THINKPORT_API_USERNAME = originalUser;
      if (originalPass !== undefined) process.env.THINKPORT_API_PASSWORD = originalPass;
    }

    assert(threw, 'Expected buildBasicAuthHeaderFromEnv to throw when env vars missing');
  });

  test('buildBasicAuthHeaderFromEnv builds correct Basic token', () => {
    const originalUser = process.env.THINKPORT_API_USERNAME;
    const originalPass = process.env.THINKPORT_API_PASSWORD;

    process.env.THINKPORT_API_USERNAME = 'user';
    process.env.THINKPORT_API_PASSWORD = 'pass';

    try {
      const headers = buildBasicAuthHeaderFromEnv();
      assert(headers.Authorization, 'Authorization header should be present');
      assert(
        headers.Authorization.startsWith('Basic '),
        'Authorization header should start with "Basic "',
      );
    } finally {
      if (originalUser !== undefined) process.env.THINKPORT_API_USERNAME = originalUser;
      else delete process.env.THINKPORT_API_USERNAME;
      if (originalPass !== undefined) process.env.THINKPORT_API_PASSWORD = originalPass;
      else delete process.env.THINKPORT_API_PASSWORD;
    }
  });

  test('normalizePerson maps basic fields correctly and prefers jobTitle for position', () => {
    const raw = {
      givenName: 'Alex',
      familyName: 'Test',
      name: 'Alex Test',
      slug: 'alex-test',
      email: 'alex@example.com',
      image: 'https://example.com/image.png',
      jobTitle: 'Senior Cloud Consultant',
      company: {
        id: 'thinkport',
        name: 'Thinkport GmbH',
        url: 'https://thinkport.digital',
      },
      location: {
        id: 'frankfurt',
        name: 'Frankfurt',
        address: {
          street: 'Street 1',
          postalCode: '12345',
          city: 'Frankfurt',
          country: 'Deutschland',
        },
      },
      department: 'Cloud',
    };

    const person = normalizePerson(raw);
    expect(person.name).toBe('Alex Test');
    expect(person.givenName).toBe('Alex');
    expect(person.familyName).toBe('Test');
    expect(person.slug).toBe('alex-test');
    expect(person.email).toBe('alex@example.com');
    expect(person.imageUrl).toBe('https://example.com/image.png');
    expect(person.companyName).toBe('Thinkport GmbH');
    expect(person.companyUrl).toBe('https://thinkport.digital');
    expect(person.locationName).toBe('Frankfurt');
    expect(person.locationCity).toBe('Frankfurt');
    expect(person.locationCountry).toBe('Deutschland');
    expect(person.street).toBe('Street 1');
    expect(person.postalCode).toBe('12345');
    expect(person.addressLine).toBe('Street 1, 12345 Frankfurt');
    expect(person.position).toBe('Senior Cloud Consultant');
  });

  test('normalizePerson falls back for missing fields and generates slug when needed', () => {
    const raw = {
      name: 'No Slug Person',
      image: null,
      company: null,
      location: null,
      locationLabel: 'Remote',
      circle: 'Growth',
    };

    const person = normalizePerson(raw);
    expect(person.slug).toBe('no-slug-person');
    expect(person.companyName).toBe('Thinkport GmbH');
    expect(person.companyUrl).toBe(null);
    expect(person.locationName).toBe('Remote');
    expect(person.addressLine).toBe(null);
    expect(person.position).toBe('Growth');
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
  console.error('Unexpected error in thinkport-api-client tests:', err);
  process.exit(1);
});

