#!/usr/bin/env node
/**
 * Thinkport People API client
 *
 * Fetches people data from the Thinkport GraphQL API using HTTP Basic Auth
 * and exposes a normalized model that can be consumed by generators
 * (avatars, business cards, email footers, etc.).
 */

import { Buffer } from 'buffer';

const DEFAULT_API_URL = 'https://thinkportapi.netlify.app/.netlify/functions/data';

/**
 * Build Basic Auth header from environment variables.
 * Expects THINKPORT_API_USERNAME and THINKPORT_API_PASSWORD to be set.
 * @returns {{ Authorization: string }}
 */
function buildBasicAuthHeaderFromEnv() {
  const username = process.env.THINKPORT_API_USERNAME;
  const password = process.env.THINKPORT_API_PASSWORD;

  if (!username || !password) {
    const missing = [];
    if (!username) missing.push('THINKPORT_API_USERNAME');
    if (!password) missing.push('THINKPORT_API_PASSWORD');
    throw new Error(
      `Missing required environment variables for Thinkport API Basic Auth: ${missing.join(
        ', ',
      )}. ` +
        'Set them in your local environment (e.g. via .env) and as GitHub Secrets for CI.',
    );
  }

  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
  };
}

/**
 * Raw GraphQL query for fetching people and locations.
 * Uses arguments documented in the People API schema:
 * - isThinkport: true -> only Thinkport
 * - isActive: true   -> only active staff
 */
const PEOPLE_QUERY = `
  query GetThinkportPeople($isThinkport: Boolean!, $isActive: Boolean) {
    people(isThinkport: $isThinkport, isActive: $isActive) {
      givenName
      familyName
      name
      slug
      image
      email
      circle
      department
      locationLabel
      location {
        id
        name
        description
        address {
          street
          postalCode
          city
          country
        }
      }
      company {
        id
        name
        url
        logo
        active
      }
      certificates {
        id
        name
        issuer
        level
        badgeUrl
        issueDate
        expiryDate
        verificationUrl
      }
    }
  }
`;

/**
 * Execute a GraphQL POST request against the Thinkport API.
 * @param {Object} params
 * @param {string} [params.url] - Override API URL (defaults to DEFAULT_API_URL)
 * @param {string} params.query - GraphQL query string
 * @param {string} [params.operationName] - Operation name
 * @param {Object} [params.variables] - GraphQL variables
 * @returns {Promise<any>} Parsed JSON body
 */
async function executeGraphQL({ url = DEFAULT_API_URL, query, operationName, variables }) {
  const headers = {
    'Content-Type': 'application/json',
    ...buildBasicAuthHeaderFromEnv(),
  };

  const body = JSON.stringify({
    query,
    operationName,
    variables,
  });

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
  } catch (err) {
    throw new Error(`Failed to reach Thinkport API at ${url}: ${err.message}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Thinkport API responded with HTTP ${response.status} ${response.statusText}${
        text ? ` – body: ${text.slice(0, 500)}` : ''
      }`,
    );
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    throw new Error(`Failed to parse Thinkport API JSON response: ${err.message}`);
  }

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join('; ');
    throw new Error(`Thinkport API returned GraphQL errors: ${messages}`);
  }

  return json.data;
}

/**
 * Normalized person model used by generators.
 * @typedef {Object} NormalizedPerson
 * @property {string} name
 * @property {string} slug
 * @property {string|null} givenName
 * @property {string|null} familyName
 * @property {string|null} email
 * @property {string|null} imageUrl
 * @property {string} companyName
 * @property {string|null} companyUrl
 * @property {string|null} locationName
 * @property {string|null} locationCity
 * @property {string|null} locationCountry
 * @property {string|null} street
 * @property {string|null} postalCode
 * @property {string|null} addressLine
 * @property {string|null} position
 */

/**
 * Normalize a raw Person from the API into a shape that all generators can consume.
 * @param {any} person
 * @returns {NormalizedPerson|null}
 */
function normalizePerson(person) {
  if (!person) {
    return null;
  }

  const givenName = person.givenName || null;
  const familyName = person.familyName || null;

  const fullNameFromParts =
    givenName || familyName ? [givenName, familyName].filter(Boolean).join(' ') : null;

  const displayName = fullNameFromParts || person.name;

  if (!displayName) {
    return null;
  }

  const companyName =
    (person.company && (person.company.name || person.company.id)) || 'Thinkport GmbH';
  const companyUrl = person.company && person.company.url ? person.company.url : null;

  const location = person.location || null;
  const address = location && location.address ? location.address : null;

  const locationName =
    (location && (location.name || location.id)) || person.locationLabel || null;

  const addressParts = [];
  if (address && address.street) addressParts.push(address.street);
  if (address && (address.postalCode || address.city)) {
    const cityLine = [address.postalCode, address.city].filter(Boolean).join(' ');
    if (cityLine) addressParts.push(cityLine);
  }
  const addressLine = addressParts.length > 0 ? addressParts.join(', ') : null;

  const position =
    person.jobTitle || person.position || person.department || person.circle || null;

  return {
    name: displayName,
    slug:
      person.slug ||
      displayName.toLowerCase().replace(/\s+/g, '-'),
    givenName,
    familyName,
    email: person.email || null,
    imageUrl: person.image || null,
    companyName,
    companyUrl,
    locationName,
    locationCity: address && address.city ? address.city : null,
    locationCountry: address && address.country ? address.country : null,
    street: address && address.street ? address.street : null,
    postalCode: address && address.postalCode ? address.postalCode : null,
    addressLine,
    position,
  };
}

/**
 * Fetch all active Thinkport staff from the API and normalize them.
 * @returns {Promise<NormalizedPerson[]>}
 */
export async function getActiveThinkportPeople() {
  const data = await executeGraphQL({
    query: PEOPLE_QUERY,
    operationName: 'GetThinkportPeople',
    variables: {
      isThinkport: true,
      isActive: true,
    },
  });

  const rawPeople = Array.isArray(data?.people) ? data.people : [];
  const normalized = rawPeople
    .map((p) => normalizePerson(p))
    .filter((p) => p && p.name)
    .map((p) => p);

  return normalized;
}

export { buildBasicAuthHeaderFromEnv, executeGraphQL, normalizePerson, DEFAULT_API_URL };

