import { Buffer } from 'node:buffer'

/**
 * Basic Auth for thinkportapi.netlify.app.
 */
export function thinkportBasicAuthHeader() {
  const user = process.env.THINKPORT_API_USERNAME
  const pass = process.env.THINKPORT_API_PASSWORD
  if (!user || !pass) {
    throw new Error('Missing Thinkport API credentials: set THINKPORT_API_USERNAME and THINKPORT_API_PASSWORD.')
  }
  const token = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64')
  return `Basic ${token}`
}
