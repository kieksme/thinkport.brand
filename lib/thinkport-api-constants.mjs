/**
 * Thinkport API host and URLs (browser-safe constants).
 * GraphQL functions and static assets live on the same origin.
 */

export const THINKPORT_API_ORIGIN = 'https://thinkportapi.netlify.app'

/** Prefix on this site / Vite dev: append upstream path (e.g. `/.netlify/functions/data`). */
export const THINKPORT_SITE_PROXY_PREFIX = '/api/thinkport'

export const THINKPORT_FN_DATA = '/.netlify/functions/data'

/** Upstream GraphQL for case-study listings (`/.netlify/functions/references` on the API host). */
export const THINKPORT_GRAPHQL_CASE_STUDIES_URL = `${THINKPORT_API_ORIGIN}/.netlify/functions/references`
export const THINKPORT_DATA_UPSTREAM_GRAPHQL = `${THINKPORT_API_ORIGIN}${THINKPORT_FN_DATA}`
