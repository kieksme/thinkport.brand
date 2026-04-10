import { Buffer } from 'node:buffer'
import { PDFDocument } from 'pdf-lib'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import {
  REFERENCES_QUERY,
  THINKPORT_GRAPHQL_CASE_STUDIES_URL,
  REFS_PER_PAGE,
  splitIntoChunks,
  wrapListingHtmlDocument,
  buildListingMainHtml,
  resolveReferenceImageUrlForServer,
  PDF_EXPORT_LOGO_PLACEHOLDER_DATA_URL,
} from '../../lib/references-pdf-shared.mjs'
import { thinkportBasicAuthHeader } from './thinkport-basic-auth.mjs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function fetchReferencesFromApi() {
  const auth = thinkportBasicAuthHeader()
  const res = await fetch(THINKPORT_GRAPHQL_CASE_STUDIES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify({ query: REFERENCES_QUERY }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json.message || json.error || res.statusText || 'References API error'
    throw new Error(msg)
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  if (!json.data?.references || !Array.isArray(json.data.references)) {
    throw new Error('Unexpected API response')
  }
  return json.data.references
}

async function fetchAsDataUrl(url, withAuth) {
  const headers = {}
  if (withAuth) headers.Authorization = thinkportBasicAuthHeader()
  const res = await fetch(url, { headers })
  if (!res.ok) return ''
  const buf = Buffer.from(await res.arrayBuffer())
  const ct = res.headers.get('content-type') || 'application/octet-stream'
  return `data:${ct};base64,${buf.toString('base64')}`
}

async function getLogoDataUrl() {
  const base = (process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '')
  if (!base) return PDF_EXPORT_LOGO_PLACEHOLDER_DATA_URL
  const logoUrl = `${base}/logos/venitus/thinkport-venitus-light.svg`
  const res = await fetch(logoUrl)
  if (!res.ok) return PDF_EXPORT_LOGO_PLACEHOLDER_DATA_URL
  const buf = Buffer.from(await res.arrayBuffer())
  const ct = res.headers.get('content-type') || 'image/svg+xml'
  return `data:${ct};base64,${buf.toString('base64')}`
}

/**
 * @param {object[]} refs
 */
async function preloadCardHeroes(refs) {
  return Promise.all(
    refs.map(async (ref) => {
      let heroSrc = ''
      if (ref.image) {
        const url = resolveReferenceImageUrlForServer(ref.image)
        heroSrc = await fetchAsDataUrl(url, true)
        if (!heroSrc.startsWith('data:image')) heroSrc = ''
      }
      return { ref, heroSrc }
    }),
  )
}

async function launchBrowser() {
  const devChrome = process.env.PUPPETEER_EXECUTABLE_PATH
  if (process.env.NETLIFY_DEV === 'true' && devChrome) {
    return puppeteer.launch({
      executablePath: devChrome,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  const referenceIds = payload.referenceIds
  if (!Array.isArray(referenceIds) || referenceIds.length === 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ error: 'referenceIds must be a non-empty array' }),
    }
  }

  let browser
  try {
    const all = await fetchReferencesFromApi()
    const byId = new Map(all.map((r) => [r.id, r]))
    const ordered = referenceIds.map((id) => byId.get(id)).filter(Boolean)
    if (ordered.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
        body: JSON.stringify({ error: 'No matching references for given ids' }),
      }
    }

    const logoSrc = await getLogoDataUrl()
    const chunks = splitIntoChunks(ordered, REFS_PER_PAGE)
    const totalPages = chunks.length
    const totalRefCount = ordered.length

    browser = await launchBrowser()
    const page = await browser.newPage()
    const merged = await PDFDocument.create()

    for (let i = 0; i < chunks.length; i += 1) {
      const cardsWithHeroes = await preloadCardHeroes(chunks[i])
      const mainHtml = buildListingMainHtml(cardsWithHeroes, {
        pageIndex: i,
        totalPages,
        totalRefCount,
      }, logoSrc)
      const docHtml = wrapListingHtmlDocument(mainHtml)
      await page.setContent(docHtml, {
        waitUntil: 'networkidle0',
        timeout: 90000,
      })
      const onePdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      })
      const single = await PDFDocument.load(onePdf)
      const copied = await merged.copyPages(single, single.getPageIndices())
      copied.forEach((p) => merged.addPage(p))
    }

    await browser.close()
    browser = null

    const out = Buffer.from(await merged.save())

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="thinkport-referenzen.pdf"',
        ...CORS,
      },
      body: out.toString('base64'),
      isBase64Encoded: true,
    }
  } catch (err) {
    console.error(err)
    if (browser) await browser.close().catch(() => {})
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify({ error: err.message || String(err) }),
    }
  }
}
