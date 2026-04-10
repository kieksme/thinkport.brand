/**
 * Shared reference listing PDF helpers (browser + Netlify Functions).
 * Listing layout CSS mirrors app/implementations/references-pdf.html (#refs-pdf-export-root rules).
 */

import { THINKPORT_API_ORIGIN, THINKPORT_GRAPHQL_CASE_STUDIES_URL } from './thinkport-api-constants.mjs'

export { THINKPORT_API_ORIGIN, THINKPORT_GRAPHQL_CASE_STUDIES_URL }

export const REFERENCES_QUERY = `
  query ReferencesForPdf {
    references {
      id
      title
      customer
      customerHidden
      year
      categories
      tags
      excerpt
      image
      disableDetail
      body
    }
  }
`

export const REFS_PER_PAGE = 3

export const PDF_CARD_TITLE_MAX = 140
export const PDF_CARD_EXCERPT_MAX = 420
export const PDF_CARD_META_CUSTOMER_MAX = 72

export const PDF_EXPORT_LOGO_PLACEHOLDER_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="380" height="84" viewBox="0 0 380 84"/>',
)}`

export const PDF_EXPORT_BROKEN_IMG_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 720 405"/>',
)}`

/**
 * CSS for a single A4 listing page (scoped under .tp-ref-page).
 * Derived from #refs-pdf-export-root rules in references-pdf.html.
 */
export const REFERENCE_LISTING_PAGE_CSS = `
  .tp-ref-page {
    width: 210mm;
    height: 297mm;
    background: #ffffff;
    margin: 0;
    position: relative;
    overflow: hidden;
    font-family: "Montserrat", sans-serif;
    font-size: 10pt;
    color: #333333;
    box-sizing: border-box;
  }
  .tp-ref-page * {
    box-sizing: border-box;
  }
  .tp-ref-page .print-mark {
    position: absolute;
    left: 0;
    width: 8mm;
    border-top: 0.25mm solid #7a7a7a;
    z-index: 2;
  }
  .tp-ref-page .fold-mark-top { top: 105mm; }
  .tp-ref-page .fold-mark-bottom { top: 210mm; }
  .tp-ref-page .hole-mark {
    position: absolute;
    left: 3.3mm;
    top: 148.5mm;
    width: 1.6mm;
    height: 1.6mm;
    border: 0.25mm solid #7a7a7a;
    border-radius: 50%;
    transform: translateY(-50%);
    background: transparent;
    z-index: 2;
  }
  .tp-ref-page .edge-barcode {
    position: absolute;
    right: 0.8mm;
    top: 200mm;
    width: 66mm;
    height: 7mm;
    transform-origin: bottom right;
    transform: rotate(-90deg);
    z-index: 2;
    overflow: hidden;
    background: #fff;
  }
  .tp-ref-page .edge-barcode svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .tp-ref-page .content {
    position: absolute;
    left: 28mm;
    right: 28mm;
    top: 20mm;
    bottom: 42mm;
  }
  .tp-ref-page .top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    min-height: 28mm;
  }
  .tp-ref-page .logo img {
    width: 64mm;
    height: auto;
    display: block;
    margin-top: -0.5mm;
  }
  .tp-ref-page .sender-line {
    font-size: 7pt;
    letter-spacing: -0.08pt;
    white-space: nowrap;
    color: #0b2649;
    margin-bottom: 3.2mm;
  }
  .tp-ref-page .page-number {
    position: absolute;
    right: 28mm;
    bottom: 32mm;
    font-size: 9pt;
    color: #333333;
    font-weight: 500;
  }
  .tp-ref-page .footer {
    position: absolute;
    left: 28mm;
    right: 28mm;
    bottom: 8mm;
    border-top: 0.35mm solid #d6d6d6;
    padding-top: 3.5mm;
    font-size: 7.5pt;
    color: #0b2649;
  }
  .tp-ref-page .footer-grid {
    display: grid;
    grid-template-columns: 1.15fr 1fr 1fr 1.2fr;
    gap: 5mm;
    line-height: 1.2;
  }
  .tp-ref-page .footer-title {
    color: #0b2649;
    font-weight: 600;
  }
  .tp-ref-page.tp-ref-page--listing .top-row {
    min-height: 16mm;
  }
  .tp-ref-page.tp-ref-page--listing .logo img {
    width: 48mm;
    height: auto;
  }
  .tp-ref-page .content--listing {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .tp-ref-page .ref-listing-subject {
    margin-top: 1.5mm;
    font-size: 9pt;
    font-weight: 700;
    color: #0b2649;
    letter-spacing: -0.01em;
  }
  .tp-ref-page .ref-listing-meta {
    margin-top: 0.8mm;
    font-size: 7pt;
    color: #555;
  }
  .tp-ref-page .ref-listing-stack {
    margin-top: 2mm;
    display: flex;
    flex-direction: column;
    gap: 2.5mm;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .tp-ref-page .ref-card {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 0.15mm solid #e0e8f0;
    border-radius: 1.2mm;
    overflow: hidden;
    background: #fff;
  }
  .tp-ref-page .ref-card__row {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 3mm;
    flex: 1 1 auto;
    min-height: 0;
  }
  .tp-ref-page .ref-card__hero {
    flex: 0 0 48mm;
    width: 48mm;
    min-width: 48mm;
    min-height: 28mm;
    align-self: stretch;
    overflow: hidden;
    background: #f0f4f8;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0.8mm;
    box-sizing: border-box;
  }
  .tp-ref-page .ref-card__hero img {
    max-width: 100%;
    max-height: 28mm;
    width: auto;
    height: auto;
    object-fit: contain;
    object-position: left top;
    display: block;
  }
  .tp-ref-page .ref-card__noimg {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    min-height: 26mm;
    padding: 1mm 0;
    background: transparent;
    color: #999;
    font-size: 9pt;
  }
  .tp-ref-page .ref-card__body {
    padding: 1.2mm 1.8mm 1.2mm 0;
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .tp-ref-page .ref-card__title {
    margin: 0 0 0.6mm 0;
    font-size: 10pt;
    font-weight: 700;
    color: #0b2649;
    line-height: 1.25;
  }
  .tp-ref-page .ref-card__meta {
    margin: 0 0 0.8mm 0;
    font-size: 8.5pt;
    color: #5a6a7a;
    line-height: 1.3;
  }
  .tp-ref-page .ref-card__excerpt {
    margin: 0;
    font-size: 8pt;
    line-height: 1.34;
    color: #333;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }
  .tp-ref-page .ref-card__tags {
    margin-top: 0.8mm;
    padding-top: 0.7mm;
    border-top: 0.12mm solid #e8edf3;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    align-content: flex-start;
    gap: 0.9mm 1mm;
  }
  .tp-ref-page .ref-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-height: 4.5mm;
    padding: 0.35mm 1.5mm;
    font-family: "Montserrat", sans-serif;
    font-size: 6pt;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.03em;
    color: #0b2649;
    background: transparent;
    border: none;
    border-radius: 2.5mm;
    white-space: nowrap;
    text-align: center;
  }
`

/**
 * @param {string|null|undefined} s
 * @returns {string}
 */
export function escapeHtml(s) {
  if (s == null || typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * @param {string[]} arr
 * @returns {string[]}
 */
export function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'))
}

/**
 * @param {string|null|undefined} str
 * @param {number} max
 */
export function truncateText(str, max) {
  if (str == null || str === '') return '—'
  const s = String(str)
  if (s.length <= max) return s
  return `${s.slice(0, Math.max(0, max - 1))}…`
}

/**
 * @template T
 * @param {T[]} arr
 * @param {number} size
 * @returns {T[][]}
 */
export function splitIntoChunks(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * @param {object} ref
 * @returns {string}
 */
export function buildTagPillsHtml(ref) {
  const raw = [...(Array.isArray(ref.categories) ? ref.categories : []), ...(Array.isArray(ref.tags) ? ref.tags : [])]
  const labels = uniqueSorted(
    raw
      .map((s) => (s == null ? '' : String(s).trim().replace(/\s+/g, ' ')))
      .filter(Boolean),
  )
  if (labels.length === 0) return ''
  return labels.map((label) => `<span class="ref-tag">${escapeHtml(label)}</span>`).join('')
}

/**
 * Barcode SVG rects (same algorithm as initBarcode in references-pdf.mjs).
 * @param {string} barcodeValue
 * @returns {{ innerHtml: string, viewBox: string }}
 */
export function buildBarcodeSvgParts(barcodeValue) {
  let bits = '101011110'
  for (let i = 0; i < barcodeValue.length; i += 1) {
    const byteBits = barcodeValue.charCodeAt(i).toString(2).padStart(8, '0')
    bits += byteBits
    if (i < barcodeValue.length - 1) bits += '0'
  }
  bits += '1110101'
  const rects = []
  for (let x = 0; x < bits.length; x += 1) {
    if (bits.charAt(x) !== '1') continue
    rects.push(`<rect x="${x}" y="0" width="1" height="64" fill="#0B2649"/>`)
  }
  return {
    innerHtml: rects.join(''),
    viewBox: `0 0 ${bits.length} 64`,
  }
}

/**
 * @param {{ ref: object, heroSrc: string }[]} cardsWithHeroes
 * @param {{ pageIndex: number, totalPages: number, totalRefCount: number }} ctx
 * @param {string} logoSrc data URL or placeholder
 * @param {string} [barcodePayload]
 * @returns {string} outerHTML of <main>
 */
export function buildListingMainHtml(cardsWithHeroes, ctx, logoSrc, barcodePayload = 'https://thinkport.digital') {
  const { pageIndex, totalPages, totalRefCount } = ctx
  const { innerHtml: barcodeInner, viewBox: barcodeVb } = buildBarcodeSvgParts(barcodePayload)

  const refStart = pageIndex * REFS_PER_PAGE + 1
  const refEnd = refStart + cardsWithHeroes.length - 1

  const cardsHtml = cardsWithHeroes
    .map(({ ref, heroSrc }) => {
      const title = escapeHtml(truncateText(ref.title || ref.id, PDF_CARD_TITLE_MAX))
      const customerRaw = ref.customerHidden ? '—' : ref.customer || '—'
      const customer = escapeHtml(truncateText(customerRaw, PDF_CARD_META_CUSTOMER_MAX))
      const year = escapeHtml(truncateText(ref.year || '—', 24))
      const metaLine = `${customer} • ${year}`
      const excerpt = escapeHtml(truncateText(ref.excerpt || '', PDF_CARD_EXCERPT_MAX))
      const tagsHtml = buildTagPillsHtml(ref)
      const heroInner = heroSrc
        ? `<img src="${escapeHtml(heroSrc)}" alt="" />`
        : '<span class="ref-card__noimg">—</span>'
      return `<article class="ref-card">
        <div class="ref-card__row">
          <div class="ref-card__hero">${heroInner}</div>
          <div class="ref-card__body">
            <h3 class="ref-card__title">${title}</h3>
            <p class="ref-card__meta">${metaLine}</p>
            <p class="ref-card__excerpt">${excerpt}</p>
            ${tagsHtml ? `<div class="ref-card__tags">${tagsHtml}</div>` : ''}
          </div>
        </div>
      </article>`
    })
    .join('')

  return `<main class="tp-ref-page tp-ref-page--listing">
    <div class="print-mark fold-mark-top" aria-hidden="true"></div>
    <div class="print-mark fold-mark-bottom" aria-hidden="true"></div>
    <div class="hole-mark" aria-hidden="true"></div>
    <div class="edge-barcode" aria-hidden="true">
      <svg class="edge-barcode-svg" viewBox="${barcodeVb}" preserveAspectRatio="none">${barcodeInner}</svg>
    </div>
    <section class="content content--listing">
      <div class="top-row">
        <div class="claim"></div>
        <div class="logo">
          <img src="${escapeHtml(logoSrc)}" alt="Thinkport - A Venitus Company" />
        </div>
      </div>
      <div class="sender-line">Thinkport GmbH – Referenzübersicht</div>
      <p class="ref-listing-subject">Ausgewählte Referenzen</p>
      <p class="ref-listing-meta">${totalRefCount} ${totalRefCount === 1 ? 'Eintrag' : 'Einträge'} gesamt · Referenzen ${refStart}–${refEnd} · PDF-Seite ${pageIndex + 1} / ${totalPages}</p>
      <div class="ref-listing-stack">
        ${cardsHtml}
      </div>
    </section>
    <div class="page-number">Seite ${pageIndex + 1} von ${totalPages}</div>
    <footer class="footer">
      <div class="footer-grid">
        <div>
          <div class="footer-title">Thinkport GmbH</div>
          Arnsburger Straße 74<br />
          60385 Frankfurt
        </div>
        <div>
          <div class="footer-title">www.thinkport.digital</div>
          Telefon +49 151 63417156<br />
          kontakt@th.inkport.digital
        </div>
        <div>
          <div class="footer-title">Geschäftsführung</div>
          Tobias Drechsler<br />
          Dominik Fries<br />
          Henning Breyer
        </div>
        <div>
          <div class="footer-title">Handelsregister</div>
          Amtsgericht Frankfurt am<br />
          Main HRB 129804<br />
          <span style="text-decoration: underline;">USt-IDNr:</span> DE510746560
        </div>
      </div>
    </footer>
  </main>`
}

/**
 * Full HTML document for Puppeteer (one A4 page).
 * @param {string} mainOuterHtml from buildListingMainHtml
 */
export function wrapListingHtmlDocument(mainOuterHtml) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>${REFERENCE_LISTING_PAGE_CSS}</style>
</head>
<body style="margin:0;background:#fff">${mainOuterHtml}</body>
</html>`
}

/**
 * @param {string} pathOrUrl
 * @returns {string} absolute URL on Thinkport API origin
 */
export function resolveReferenceImageUrlForServer(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return ''
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:')) return pathOrUrl
  if (pathOrUrl.startsWith('/')) return `${THINKPORT_API_ORIGIN}${pathOrUrl}`
  return `${THINKPORT_API_ORIGIN}/${pathOrUrl.replace(/^\//, '')}`
}
