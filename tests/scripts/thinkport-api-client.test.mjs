#!/usr/bin/env node
/**
 * Tests for thinkport-api-client.mjs
 */

import {
  buildBasicAuthHeaderFromEnv,
  normalizePerson,
  normalizePersonSkills,
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

  test('normalizePerson includes skills when present, sorted by yearsOfExperience desc', () => {
    const raw = {
      name: 'Skill Person',
      slug: 'skill-person',
      skills: [
        { skill: { id: 'ts', name: 'TypeScript', category: 'Language', logo: null }, yearsOfExperience: 2 },
        { skill: { id: 'go', name: 'Go', category: 'Language', logo: null }, yearsOfExperience: 5 },
        { skill: { id: 'react', name: 'React', category: 'Frontend', logo: null }, yearsOfExperience: null },
      ],
    };

    const person = normalizePerson(raw);
    expect(person.skills).toBeDefined();
    expect(person.skills.length).toBe(3);
    expect(person.skills[0].id).toBe('go');
    expect(person.skills[0].yearsOfExperience).toBe(5);
    expect(person.skills[1].id).toBe('ts');
    expect(person.skills[1].yearsOfExperience).toBe(2);
    expect(person.skills[2].id).toBe('react');
    expect(person.skills[2].yearsOfExperience).toBe(null);
  });

  test('normalizePersonSkills returns empty array for empty or invalid input', () => {
    expect(normalizePersonSkills(null).length).toBe(0);
    expect(normalizePersonSkills(undefined).length).toBe(0);
    expect(normalizePersonSkills([]).length).toBe(0);
    expect(normalizePersonSkills([{ skill: null }]).length).toBe(0);
  });

  test('normalizePersonSkills normalizes and sorts by yearsOfExperience desc', () => {
    const raw = [
      { skill: { id: 'a', name: 'A' }, yearsOfExperience: 1 },
      { skill: { id: 'b', name: 'B' }, yearsOfExperience: 10 },
      { skill: { id: 'c', name: 'C' }, yearsOfExperience: null },
    ];
    const out = normalizePersonSkills(raw);
    expect(out.length).toBe(3);
    expect(out[0].id).toBe('b');
    expect(out[0].yearsOfExperience).toBe(10);
    expect(out[1].id).toBe('a');
    expect(out[1].yearsOfExperience).toBe(1);
    expect(out[2].id).toBe('c');
    expect(out[2].yearsOfExperience).toBe(null);
  });

  test('normalizePerson includes certificates when present', () => {
    const raw = {
      name: 'Cert Person',
      slug: 'cert-person',
      certificates: [
        { id: 'az-900', name: 'Azure Fundamentals', badgeUrl: 'https://example.com/badge.png' },
      ],
    };
    const person = normalizePerson(raw);
    expect(person.certificates).toBeDefined();
    expect(person.certificates.length).toBe(1);
    expect(person.certificates[0].id).toBe('az-900');
    expect(person.certificates[0].name).toBe('Azure Fundamentals');
    expect(person.certificates[0].badgeUrl).toBe('https://example.com/badge.png');
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

