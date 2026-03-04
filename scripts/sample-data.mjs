#!/usr/bin/env node
/**
 * Sample contact data for business card generation
 * Shared data to keep DRY principle.
 * Prefer data from examples/business-cards/*.json when available.
 */

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load contacts from JSON files in examples/business-cards/
 * @param {string} dir - Full path to business-cards directory
 * @returns {Object[]} Array of contact objects (sorted by name)
 */
export function loadContactsFromBusinessCards(dir) {
  try {
    const files = readdirSync(dir, { withFileTypes: true })
      .filter((f) => f.isFile() && f.name.endsWith('.json'))
      .map((f) => f.name);
    if (files.length === 0) return [];
    const contacts = files
      .map((file) => {
        try {
          const raw = readFileSync(join(dir, file), 'utf-8');
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return contacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch {
    return [];
  }
}

/**
 * Get contacts to use for samples: from examples/business-cards/*.json if present, else built-in list
 * @param {string} projectRoot - Project root path
 * @returns {Object[]} Contact array
 */
export function getSampleContacts(projectRoot) {
  const dataDir = join(projectRoot, 'examples', 'business-cards');
  const fromFiles = loadContactsFromBusinessCards(dataDir);
  return fromFiles.length > 0 ? fromFiles : sampleContacts;
}

/**
 * Sample contact data for testing and examples (fallback when no JSON files)
 */
export const sampleContacts = [
  {
    name: 'Max Mustermann',
    position: 'Geschäftsführer',
    email: 'max@thinkport.digital',
    phone: '+49 123 456789',
    mobile: '+49 123 4567890',
    address: 'Musterstraße 123',
    postalCode: '12345',
    city: 'Berlin',
    country: 'Deutschland',
    website: 'thinkport.digital',
    socialMedia: [
      { name: 'LinkedIn', url: 'https://linkedin.com/in/max-mustermann' },
      { name: 'Twitter', url: 'https://twitter.com/maxmustermann' },
    ],
  },
  {
    name: 'Anna Schmidt',
    position: 'Lead Developer',
    email: 'anna@thinkport.digital',
    phone: '+49 123 456788',
    mobile: '+49 123 4567880',
    address: 'Beispielweg 45',
    postalCode: '54321',
    city: 'München',
    country: 'Deutschland',
    website: 'thinkport.digital',
    socialMedia: [
      { name: 'GitHub', url: 'https://github.com/annaschmidt' },
      { name: 'LinkedIn', url: 'https://linkedin.com/in/anna-schmidt' },
    ],
  },
  {
    name: 'Tom Weber',
    position: 'Designer',
    email: 'tom@thinkport.digital',
    mobile: '+49 123 4567870',
    address: 'Designstraße 78',
    postalCode: '10115',
    city: 'Berlin',
    country: 'Deutschland',
    website: 'thinkport.digital',
  },
  {
    name: 'Sarah Klein',
    position: 'Cloud Consultant',
    email: 'sarah@thinkport.digital',
    phone: '+49 123 456786',
    mobile: '+49 123 4567860',
    address: 'Techpark 12',
    postalCode: '80331',
    city: 'Frankfurt',
    country: 'Deutschland',
    website: 'thinkport.digital',
    socialMedia: [
      { name: 'LinkedIn', url: 'https://linkedin.com/in/sarah-klein' },
    ],
  },
];

/**
 * Get sample contact by name
 * @param {string} name - Contact name
 * @returns {Object|null} Sample contact data or null if not found
 */
export function getSampleContact(name) {
  return sampleContacts.find(contact => contact.name === name) || null;
}

/**
 * Get all sample contact names
 * @returns {string[]} Array of contact names
 */
export function getSampleContactNames() {
  return sampleContacts.map(contact => contact.name);
}
