#!/usr/bin/env node
/**
 * Sample contact data for business card generation
 * Shared data to keep DRY principle
 */

/**
 * Sample contact data for testing and examples
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
