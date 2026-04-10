import { Buffer } from 'node:buffer'
import { THINKPORT_API_ORIGIN } from '../../lib/thinkport-api-constants.mjs'
import { thinkportBasicAuthHeader } from './thinkport-basic-auth.mjs'

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

function guessContentType(pathname) {
  const lower = pathname.toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot === -1) return 'application/octet-stream'
  const ext = lower.slice(dot)
  return MIME[ext] || 'application/octet-stream'
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
}

/**
 * Path on thinkportapi host (must start with /), without query.
 * @param {string} rawPath
 */
function extractUpstreamPath(rawPath) {
  const noQuery = (rawPath || '/').split('?')[0]
  const prefixes = ['/.netlify/functions/thinkport-api-proxy', '/api/thinkport']
  let path = noQuery
  for (const p of prefixes) {
    if (path.startsWith(p)) {
      path = path.slice(p.length) || '/'
      break
    }
  }
  if (!path.startsWith('/')) path = `/${path}`
  return path
}

function buildSearch(event, pathWithQuery) {
  const qInPath = pathWithQuery.indexOf('?')
  if (qInPath >= 0) return pathWithQuery.slice(qInPath)
  if (event.rawQuery) return `?${event.rawQuery}`
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length) {
    return `?${new URLSearchParams(event.queryStringParameters).toString()}`
  }
  return ''
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  let authorization
  try {
    authorization = thinkportBasicAuthHeader()
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ error: e.message }),
    }
  }

  const method = event.httpMethod
  if (!['GET', 'HEAD', 'POST'].includes(method)) {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const pathWithQuery = event.path || '/'
  const pathOnly = extractUpstreamPath(pathWithQuery)
  const search = buildSearch(event, pathWithQuery)
  const upstreamUrl = `${THINKPORT_API_ORIGIN}${pathOnly}${search}`

  /** @type {Record<string, string>} */
  const forwardHeaders = {
    Authorization: authorization,
  }
  if (method === 'POST') {
    const ct = event.headers?.['Content-Type'] || event.headers?.['content-type']
    if (ct) forwardHeaders['Content-Type'] = ct
  }

  let body
  if (method === 'POST' && event.body) {
    body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body
  }

  let upstream
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers: forwardHeaders,
      ...(body !== undefined ? { body } : {}),
    })
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ error: `Upstream fetch failed: ${err.message}` }),
    }
  }

  const resCt = upstream.headers.get('content-type') || ''
  const isText =
    resCt.includes('json') ||
    resCt.startsWith('text/') ||
    resCt.includes('javascript') ||
    resCt.includes('xml')

  if (method === 'HEAD') {
    return {
      statusCode: upstream.status,
      headers: {
        'Content-Type': resCt || guessContentType(pathOnly),
        ...CORS,
      },
      body: '',
    }
  }

  if (isText || upstream.status >= 400) {
    const text = await upstream.text()
    return {
      statusCode: upstream.status,
      headers: {
        'Content-Type': resCt || 'application/json',
        ...CORS,
      },
      body: text,
    }
  }

  const buf = Buffer.from(await upstream.arrayBuffer())
  const contentType = resCt || guessContentType(pathOnly)

  return {
    statusCode: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': method === 'GET' ? 'public, max-age=3600' : 'no-store',
      ...CORS,
    },
    body: buf.toString('base64'),
    isBase64Encoded: true,
  }
}
