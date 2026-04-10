/**
 * Reference PDF generator: load Thinkport references via GraphQL, filter, export A4 pages (letterhead layout) with jsPDF + html2canvas.
 * Always calls same-origin `/api/thinkport/…` (Vite dev proxy or Netlify function); optional server PDF via VITE_THINKPORT_SERVER_PDF.
 * @see https://thinkportapi.netlify.app (Thinkport API, Basic Auth)
 */
import {
  REFERENCES_QUERY,
  THINKPORT_API_ORIGIN,
  REFS_PER_PAGE,
  splitIntoChunks,
  uniqueSorted,
  escapeHtml,
  buildListingMainHtml,
  PDF_EXPORT_LOGO_PLACEHOLDER_DATA_URL,
  PDF_EXPORT_BROKEN_IMG_PLACEHOLDER,
} from '../../lib/references-pdf-shared.mjs'

const USE_SERVER_PDF = import.meta.env.VITE_THINKPORT_SERVER_PDF === 'true'

/**
 * Absolute-path URL under Vite `base` (e.g. /thinkport.brand/api/... on GitHub Pages).
 * @param {string} path must start with /
 */
function apiUrl(path) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function getEndpoint() {
  if (import.meta.env.DEV) return '/api/thinkport/.netlify/functions/references'
  return apiUrl('/api/thinkport/.netlify/functions/references')
}

/**
 * Rewrites Thinkport API asset URLs to the local or Netlify media proxy (same-origin fetch/html2canvas).
 * @param {string} url
 * @returns {string}
 */
function rewriteThinkportApiMedia(url) {
  if (!url || typeof url !== 'string') return url
  if (url.startsWith('/api/thinkport')) return url
  // Legacy dev paths (older Vite proxy)
  if (url.startsWith('/api/thinkport-references-media')) {
    return url.replace(/^\/api\/thinkport-references-media/, '/api/thinkport')
  }
  try {
    const u = new URL(url, window.location.href)
    if (u.origin === THINKPORT_API_ORIGIN) {
      if (import.meta.env.DEV) {
        return `/api/thinkport${u.pathname}${u.search}`
      }
      return `${apiUrl('/api/thinkport')}${u.pathname}${u.search}`
    }
  } catch {
    // ignore invalid URL
  }
  return url
}

/**
 * `image` from the API is typically an absolute URL under {@link THINKPORT_API_ORIGIN} (e.g. …/images/references/*.png)
 * or a root-relative path such as `/images/references/...`.
 * @param {string} basePath
 * @param {string} pathOrUrl
 * @returns {string}
 */
function resolveReferenceImageUrl(basePath, pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return ''
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:')) {
    return rewriteThinkportApiMedia(pathOrUrl)
  }
  if (pathOrUrl.startsWith('/')) {
    return rewriteThinkportApiMedia(`${THINKPORT_API_ORIGIN}${pathOrUrl}`)
  }
  return rewriteThinkportApiMedia(toAbsoluteAssetUrl(basePath, pathOrUrl))
}

/** Filter DevTools console with this string to trace PDF export. */
const PDF_LOG = '[refs-pdf]'

/**
 * @param {string} step
 * @param {string} [detail]
 */
function pdfLog(step, detail = '') {
  const t = typeof performance !== 'undefined' ? Math.round(performance.now()) : 0
  if (detail) console.info(PDF_LOG, step, detail, `(t=${t}ms)`)
  else console.info(PDF_LOG, step, `(t=${t}ms)`)
}

/**
 * @param {string} url
 * @param {number} [max]
 */
function pdfShortUrl(url, max = 72) {
  if (url == null || typeof url !== 'string') return ''
  if (url.startsWith('data:')) return `data:… (len=${url.length})`
  return url.length <= max ? url : `${url.slice(0, max)}…`
}

function authHeader(user, pass) {
  const u = (user || '').trim()
  if (!u || pass == null || pass === '') return null
  const token = btoa(`${u}:${pass}`)
  return `Basic ${token}`
}

/** html2canvas scale: 1.5 keeps A4 text sharp while sampling ~44% fewer pixels than 2.0. */
const PDF_EXPORT_CANVAS_SCALE = 1.5
/** JPEG quality for page rasters and downscaled assets (lower = faster encode, smaller PDF). */
const PDF_EXPORT_JPEG_QUALITY = 0.88
/** Card hero images (~full content width); cap bitmap size before DOM insert. */
const PDF_EXPORT_CARD_HERO_MAX_W = 720
const PDF_EXPORT_CARD_HERO_MAX_H = 405
/** Header logo ~48 mm; cap raster width. */
const PDF_EXPORT_LOGO_MAX_W = 380

/**
 * Replace images that did not decode so html2canvas does not reject the page.
 * @param {HTMLElement} root
 */
function applyPlaceholderForBrokenImages(root) {
  const imgs = root.querySelectorAll('img')
  for (const img of imgs) {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) continue
    pdfLog('broken img → placeholder', pdfShortUrl(img.currentSrc || img.src, 48))
    img.removeAttribute('srcset')
    img.src = PDF_EXPORT_BROKEN_IMG_PLACEHOLDER
  }
}

/**
 * Resolve a site-relative path (e.g. ../logos/...) against the current page URL.
 * @param {string} basePath
 * @param {string} pathOrUrl
 * @returns {string}
 */
function toAbsoluteAssetUrl(basePath, pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return ''
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:')) return pathOrUrl
  const rel = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : `${basePath}${pathOrUrl}`.replace(/\/{2,}/g, '/')
  try {
    return new URL(rel, window.location.href).href
  } catch {
    return pathOrUrl
  }
}

/**
 * Fetch image as data URL when CORS allows (better for html2canvas + SVG/remote heroes).
 * @param {string} url
 * @param {string | null} [authorization] `Authorization` header (e.g. Basic …) for dev proxy + protected assets
 * @returns {Promise<string|null>}
 */
async function tryFetchAsDataUrl(url, authorization = null) {
  if (!url || typeof url !== 'string') return null
  pdfLog('fetch start', `${pdfShortUrl(url)}${authorization ? ' +Authorization' : ''}`)
  try {
    /** @type {Record<string, string>} */
    const headers = {}
    if (authorization) headers.Authorization = authorization
    const res = await fetch(url, { mode: 'cors', credentials: 'omit', cache: 'force-cache', headers })
    if (!res.ok) {
      pdfLog('fetch HTTP', `${res.status} ${pdfShortUrl(url)}`)
      return null
    }
    const blob = await res.blob()
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(/** @type {string} */ (fr.result))
      fr.onerror = () => reject(fr.error)
      fr.readAsDataURL(blob)
    })
    pdfLog('fetch ok', `${pdfShortUrl(url)} blob=${blob.size}b dataLen=${dataUrl.length}`)
    return dataUrl
  } catch (err) {
    pdfLog('fetch error', `${pdfShortUrl(url)} ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

/**
 * Downscale large raster `data:image/...` URLs before DOM insert so html2canvas has less to sample.
 * @param {string} dataUrl
 * @param {number} maxW
 * @param {number} maxH
 * @returns {Promise<string>}
 */
async function downscaleRasterDataUrl(dataUrl, maxW, maxH) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) return dataUrl
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (!w || !h) {
        pdfLog('downscale skip', '0×0 natural size')
        resolve(dataUrl)
        return
      }
      if (w <= maxW && h <= maxH) {
        pdfLog('downscale skip', `${w}×${h} within max ${maxW}×${maxH}`)
        resolve(dataUrl)
        return
      }
      const r = Math.min(maxW / w, maxH / h, 1)
      const cw = Math.max(1, Math.round(w * r))
      const ch = Math.max(1, Math.round(h * r))
      pdfLog('downscale run', `${w}×${h} → ${cw}×${ch}`)
      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, cw, ch)
      try {
        resolve(canvas.toDataURL('image/jpeg', PDF_EXPORT_JPEG_QUALITY))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => {
      pdfLog('downscale img error', 'decode failed, keep original')
      resolve(dataUrl)
    }
    img.src = dataUrl
  })
}

/**
 * Wait until images in subtree have loaded (or errored).
 * @param {HTMLElement} root
 */
async function waitForImages(root) {
  const imgs = [...root.querySelectorAll('img')]
  const needLoad = imgs.filter((img) => !(img.complete && img.naturalHeight > 0)).length
  pdfLog('waitForImages', `${imgs.length} <img> · ${needLoad} await load/error`)
  await Promise.all(
    imgs.map(
      (img, idx) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve()
            return
          }
          const done = () => {
            pdfLog('waitForImages loaded', `#${idx} ${img.naturalWidth}×${img.naturalHeight} src=${pdfShortUrl(img.currentSrc || img.src, 48)}`)
            resolve()
          }
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
        }),
    ),
  )
  pdfLog('waitForImages', 'decode…')
  await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())))
  pdfLog('waitForImages', 'done')
}

/**
 * @param {object[]} refs
 * @param {string} basePath
 * @param {string | null} [authorization] Basic Auth for Thinkport API images (dev proxy forwards this).
 */
async function preloadRefCardImages(refs, basePath, authorization = null) {
  pdfLog('preloadRefCardImages', `${refs.length} card(s)`)
  return Promise.all(
    refs.map(async (ref) => {
      let heroSrc = ''
      if (ref.image) {
        const rid = ref.id || ref.title || '?'
        const abs = resolveReferenceImageUrl(basePath, ref.image)
        pdfLog('preload hero', `${rid} ← ${pdfShortUrl(abs)}`)
        const fetched = await tryFetchAsDataUrl(abs, authorization)
        if (fetched && fetched.startsWith('data:image')) {
          heroSrc = await downscaleRasterDataUrl(
            fetched,
            PDF_EXPORT_CARD_HERO_MAX_W,
            PDF_EXPORT_CARD_HERO_MAX_H,
          )
          pdfLog('preload hero done', `${rid} dataURL`)
        } else {
          heroSrc = ''
          pdfLog('preload hero skip', `${rid} (Motiv nicht ladbar — Platzhalter in PDF)`)
        }
      }
      return { ref, heroSrc }
    }),
  )
}

/**
 * @param {{ ref: object, heroSrc: string }[]} cardsWithHeroes
 * @param {{ pageIndex: number, totalPages: number, basePath: string, totalRefCount: number }} ctx
 */
async function buildReferenceListingPage(cardsWithHeroes, ctx) {
  const { pageIndex, totalPages, basePath, totalRefCount } = ctx
  pdfLog(
    'buildPage',
    `PDF ${pageIndex + 1}/${totalPages} · ${cardsWithHeroes.length} card(s) · ${totalRefCount} total refs`,
  )
  const logoAbs = toAbsoluteAssetUrl(basePath, 'logos/venitus/thinkport-venitus-light.svg')
  pdfLog('buildPage logo fetch', pdfShortUrl(logoAbs))
  let logoSrc = await tryFetchAsDataUrl(logoAbs)
  if (!logoSrc || !logoSrc.startsWith('data:image')) {
    pdfLog('buildPage logo fallback', 'placeholder (Logo nicht ladbar)')
    logoSrc = PDF_EXPORT_LOGO_PLACEHOLDER_DATA_URL
  } else {
    logoSrc = await downscaleRasterDataUrl(
      logoSrc,
      PDF_EXPORT_LOGO_MAX_W,
      Math.round(PDF_EXPORT_LOGO_MAX_W * 0.22),
    )
  }

  const html = buildListingMainHtml(cardsWithHeroes, { pageIndex, totalPages, totalRefCount }, logoSrc)
  const wrap = document.createElement('div')
  wrap.innerHTML = html
  const main = /** @type {HTMLElement} */ (wrap.firstElementChild)
  pdfLog('buildPage DOM ready', `page ${pageIndex + 1}/${totalPages}`)
  return main
}

async function fetchReferences(user, pass) {
  const headers = { 'Content-Type': 'application/json' }
  if (import.meta.env.DEV) {
    const auth = authHeader(user, pass)
    if (auth) headers.Authorization = auth
  }

  const res = await fetch(getEndpoint(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: REFERENCES_QUERY }),
  })

  const json = await res.json().catch(() => ({}))
  if (json.error && !json.data) {
    const msg = json.message || json.error || 'API error'
    throw new Error(msg)
  }
  if (!res.ok) {
    const msg = json.message || json.error || res.statusText || 'Request failed'
    throw new Error(msg)
  }
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  if (!json.data || !Array.isArray(json.data.references)) {
    throw new Error('Unexpected API response')
  }
  return json.data.references
}

function refMatchesFilters(ref, selectedCategories, selectedTags) {
  const cats = Array.isArray(ref.categories) ? ref.categories : []
  const tags = Array.isArray(ref.tags) ? ref.tags : []
  if (selectedCategories.length > 0) {
    const hit = selectedCategories.some((c) => cats.includes(c))
    if (!hit) return false
  }
  if (selectedTags.length > 0) {
    const hit = selectedTags.some((t) => tags.includes(t))
    if (!hit) return false
  }
  return true
}

/** Lets the browser paint loading UI before heavy main-thread work (e.g. html2canvas). */
function flushUi() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}

/**
 * @param {HTMLElement} pageEl
 * @param {typeof globalThis.html2canvas} html2canvas
 * @param {boolean} [isRetry]
 */
async function pageToPdfImage(pageEl, html2canvas, isRetry = false) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0
  pdfLog('html2canvas', `${isRetry ? 'retry ' : ''}start scale=${PDF_EXPORT_CANVAS_SCALE}`)
  let canvas
  try {
    canvas = await html2canvas(pageEl, {
      scale: PDF_EXPORT_CANVAS_SCALE,
      useCORS: true,
      allowTaint: false,
      logging: import.meta.env.DEV,
      backgroundColor: '#ffffff',
      imageTimeout: 20000,
      removeContainer: true,
    })
  } catch (err) {
    pdfLog('html2canvas error', err instanceof Error ? err.message : String(err))
    if (!isRetry) {
      applyPlaceholderForBrokenImages(pageEl)
      return pageToPdfImage(pageEl, html2canvas, true)
    }
    throw err
  }
  const ms = typeof performance !== 'undefined' ? Math.round(performance.now() - t0) : 0
  pdfLog('html2canvas', `done ${ms}ms → JPEG`)
  try {
    return canvas.toDataURL('image/jpeg', PDF_EXPORT_JPEG_QUALITY)
  } catch (err) {
    pdfLog('toDataURL error', err instanceof Error ? err.message : String(err))
    if (!isRetry) {
      applyPlaceholderForBrokenImages(pageEl)
      return pageToPdfImage(pageEl, html2canvas, true)
    }
    throw err
  }
}

export function bootReferencesPdf(basePath) {
  const statusEl = document.getElementById('refs-load-status')
  const userEl = document.getElementById('refs-api-user')
  const passEl = document.getElementById('refs-api-pass')
  const authFieldsEl = document.getElementById('refs-api-auth-fields')
  const netlifyHintEl = document.getElementById('refs-netlify-mode-hint')

  if (!import.meta.env.DEV) {
    if (authFieldsEl) {
      authFieldsEl.hidden = true
      authFieldsEl.setAttribute('aria-hidden', 'true')
    }
    if (netlifyHintEl) {
      netlifyHintEl.hidden = false
      netlifyHintEl.removeAttribute('hidden')
      netlifyHintEl.classList.remove('hidden')
    }
  }
  const loadBtn = document.getElementById('refs-load-btn')
  const loadBtnLabel = loadBtn?.querySelector('.refs-load-btn__label')
  const LOAD_LABEL_DEFAULT = 'Referenzen laden'
  const catContainer = document.getElementById('refs-category-filters')
  const tagContainer = document.getElementById('refs-tag-filters')
  const refListEl = document.getElementById('refs-reference-list')
  const genBtn = document.getElementById('refs-generate-btn')
  const genBtnLabel = genBtn?.querySelector('.refs-generate-btn__label')
  const genBtnFill = genBtn?.querySelector('.refs-generate-btn__fill')
  const GEN_LABEL_DEFAULT = 'PDF generieren'
  const catSelectAll = document.getElementById('refs-cat-all')
  const catSelectNone = document.getElementById('refs-cat-none')
  const tagSelectAll = document.getElementById('refs-tag-all')
  const tagSelectNone = document.getElementById('refs-tag-none')
  const refSelectAll = document.getElementById('refs-ref-all')
  const refSelectNone = document.getElementById('refs-ref-none')
  const exportRoot = document.getElementById('refs-pdf-export-root')
  const exportCountEl = document.getElementById('refs-pdf-count')
  const progressWrap = document.getElementById('refs-pdf-progress-wrap')
  const progressBar = document.getElementById('refs-pdf-progress-bar')
  const progressText = document.getElementById('refs-pdf-progress-text')
  const progressPct = document.getElementById('refs-pdf-progress-pct')
  const progressTrack = progressWrap?.querySelector('[role="progressbar"]')

  let allReferences = []
  let selectedRefIds = new Set()

  function setStatus(msg, isError) {
    if (!statusEl) return
    statusEl.textContent = msg
    statusEl.classList.toggle('text-red-600', !!isError)
    statusEl.classList.toggle('text-gray-700', !isError)
  }

  function shakeGenerateBtn() {
    if (!genBtn) return
    genBtn.classList.add('refs-generate-btn--shake')
    window.setTimeout(() => genBtn.classList.remove('refs-generate-btn--shake'), 420)
  }

  /**
   * @param {boolean} on
   */
  function setLoadUiLoading(on) {
    if (!loadBtn) return
    loadBtn.classList.toggle('is-loading', on)
    loadBtn.setAttribute('aria-busy', on ? 'true' : 'false')
    if (loadBtnLabel) {
      loadBtnLabel.textContent = on ? 'Lade Referenzen…' : LOAD_LABEL_DEFAULT
    }
  }

  /**
   * @param {boolean} on
   * @param {{ page?: number, total?: number, progress?: number, phase?: 'prepare' | 'render' }} [opts]
   */
  function setGenerateUiLoading(on, opts = {}) {
    if (!genBtn) return
    genBtn.classList.toggle('is-generating', on)
    genBtn.setAttribute('aria-busy', on ? 'true' : 'false')
    const pct = typeof opts.progress === 'number' ? Math.min(100, Math.max(0, opts.progress)) : null
    if (genBtnFill) {
      if (!on) {
        genBtnFill.style.width = '0%'
      } else if (pct != null) {
        genBtnFill.style.width = `${pct}%`
      }
    }
    if (genBtnLabel) {
      if (!on) {
        genBtnLabel.textContent = GEN_LABEL_DEFAULT
      } else if (opts.total != null && opts.page != null && opts.phase === 'render') {
        genBtnLabel.textContent = `Seite ${opts.page + 1}/${opts.total} · Rendern…`
      } else if (opts.total != null && opts.page != null) {
        genBtnLabel.textContent = `Seite ${opts.page + 1} von ${opts.total}…`
      } else {
        genBtnLabel.textContent = 'PDF wird erzeugt…'
      }
    }
    if (progressWrap) {
      progressWrap.hidden = !on
      progressWrap.setAttribute('aria-hidden', on ? 'false' : 'true')
    }
    if (progressBar) {
      if (!on) {
        progressBar.style.width = '0%'
      } else if (pct != null) {
        progressBar.style.width = `${pct}%`
      }
    }
    if (progressTrack) {
      if (!on) {
        progressTrack.setAttribute('aria-valuenow', '0')
      } else if (pct != null) {
        progressTrack.setAttribute('aria-valuenow', String(Math.round(pct)))
      }
    }
    if (progressText) {
      if (!on) {
        progressText.textContent = ''
      } else if (opts.total != null && opts.page != null && opts.phase === 'render') {
        progressText.textContent = `Seite ${opts.page + 1} von ${opts.total} — Layout wird gerendert (kurz warten…)`
      } else if (opts.total != null && opts.page != null) {
        progressText.textContent = `Seite ${opts.page + 1} von ${opts.total} — Vorbereitung`
      } else {
        progressText.textContent = 'PDF wird vorbereitet…'
      }
    }
    if (progressPct) {
      progressPct.textContent = on && pct != null ? `${Math.round(pct)}%` : ''
    }
  }

  function getSelectedFromContainer(container) {
    if (!container) return []
    return [...container.querySelectorAll('input[type="checkbox"]:checked')].map((el) => el.value)
  }

  function getFilteredReferences() {
    const sc = getSelectedFromContainer(catContainer)
    const st = getSelectedFromContainer(tagContainer)
    return allReferences.filter((r) => refMatchesFilters(r, sc, st))
  }

  function updateExportCountPreview() {
    if (!exportCountEl) return
    const filtered = getFilteredReferences()
    const n = filtered.filter((r) => selectedRefIds.has(r.id)).length
    const numEl = exportCountEl.querySelector('[data-refs-count]')
    const labelEl = exportCountEl.querySelector('[data-refs-label]')
    const pagesEl = exportCountEl.querySelector('[data-pdf-pages]')
    if (numEl) {
      numEl.textContent = String(n)
      numEl.classList.remove('refs-count-pop')
      void numEl.offsetWidth
      numEl.classList.add('refs-count-pop')
    }
    if (labelEl) {
      labelEl.textContent = n === 1 ? 'Referenz' : 'Referenzen'
    }
    if (pagesEl) {
      const p = n === 0 ? 0 : Math.ceil(n / REFS_PER_PAGE)
      pagesEl.textContent = p === 0 ? '0 Seiten' : p === 1 ? '1 Seite' : `${p} Seiten`
    }
  }

  function renderFilterSection() {
    const cats = uniqueSorted(allReferences.flatMap((r) => (Array.isArray(r.categories) ? r.categories : [])))
    const tags = uniqueSorted(allReferences.flatMap((r) => (Array.isArray(r.tags) ? r.tags : [])))

    if (catContainer) {
      catContainer.innerHTML = cats
        .map(
          (c) =>
            `<label class="flex items-center gap-2 font-body text-sm text-gray-800"><input type="checkbox" value="${escapeHtml(c)}" class="refs-cat-cb rounded border-gray-300" /> ${escapeHtml(c)}</label>`,
        )
        .join('')
    }
    if (tagContainer) {
      tagContainer.innerHTML = tags
        .map(
          (t) =>
            `<label class="flex items-center gap-2 font-body text-sm text-gray-800"><input type="checkbox" value="${escapeHtml(t)}" class="refs-tag-cb rounded border-gray-300" /> ${escapeHtml(t)}</label>`,
        )
        .join('')
    }

    if (catContainer) {
      catContainer.querySelectorAll('.refs-cat-cb').forEach((cb) => {
        cb.addEventListener('change', onFilterChange)
      })
    }
    if (tagContainer) {
      tagContainer.querySelectorAll('.refs-tag-cb').forEach((cb) => {
        cb.addEventListener('change', onFilterChange)
      })
    }

    onFilterChange()
  }

  function onFilterChange() {
    const filtered = getFilteredReferences()
    selectedRefIds = new Set(filtered.map((r) => r.id))
    renderReferenceCheckboxes(filtered)
    setStatus(`${filtered.length} Referenz(en) nach Filter.`, false)
  }

  function renderReferenceCheckboxes(refs) {
    if (!refListEl) return
    if (refs.length === 0) {
      refListEl.innerHTML = '<p class="font-body text-gray-600 text-sm">Keine Referenzen für die aktuelle Filterkombination.</p>'
      return
    }
    refListEl.innerHTML = refs
      .map((r) => {
        const label = escapeHtml(r.title || r.id)
        const sub = [r.customer, r.year].filter(Boolean).join(' · ')
        const checked = selectedRefIds.has(r.id) ? 'checked' : ''
        return `<label class="flex items-start gap-3 py-2 border-b border-gray-100 ref-row">
          <input type="checkbox" class="refs-ref-cb mt-1 rounded border-gray-300" data-id="${escapeHtml(r.id)}" ${checked} />
          <span class="font-body text-sm"><span class="font-semibold text-navy">${label}</span>${sub ? `<span class="block text-gray-600">${escapeHtml(sub)}</span>` : ''}</span>
        </label>`
      })
      .join('')

    refListEl.querySelectorAll('.refs-ref-cb').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id')
        if (cb.checked) selectedRefIds.add(id)
        else selectedRefIds.delete(id)
        updateExportCountPreview()
      })
    })
    updateExportCountPreview()
  }

  catSelectAll?.addEventListener('click', () => {
    catContainer?.querySelectorAll('.refs-cat-cb').forEach((cb) => {
      cb.checked = true
    })
    onFilterChange()
  })
  catSelectNone?.addEventListener('click', () => {
    catContainer?.querySelectorAll('.refs-cat-cb').forEach((cb) => {
      cb.checked = false
    })
    onFilterChange()
  })
  tagSelectAll?.addEventListener('click', () => {
    tagContainer?.querySelectorAll('.refs-tag-cb').forEach((cb) => {
      cb.checked = true
    })
    onFilterChange()
  })
  tagSelectNone?.addEventListener('click', () => {
    tagContainer?.querySelectorAll('.refs-tag-cb').forEach((cb) => {
      cb.checked = false
    })
    onFilterChange()
  })

  refSelectAll?.addEventListener('click', () => {
    getFilteredReferences().forEach((r) => selectedRefIds.add(r.id))
    renderReferenceCheckboxes(getFilteredReferences())
  })
  refSelectNone?.addEventListener('click', () => {
    selectedRefIds.clear()
    renderReferenceCheckboxes(getFilteredReferences())
  })

  loadBtn?.addEventListener('click', async () => {
    const user = userEl?.value || ''
    const pass = passEl?.value || ''
    setStatus('Lade Referenzen…', false)
    setLoadUiLoading(true)
    loadBtn.disabled = true
    try {
      allReferences = await fetchReferences(user, pass)
      setStatus(`${allReferences.length} Referenz(en) geladen.`, false)
      renderFilterSection()
    } catch (e) {
      console.error(e)
      const err = e instanceof Error ? e : null
      let msg = err?.message || 'Laden fehlgeschlagen'
      if (!import.meta.env.DEV && msg === 'Failed to fetch') {
        msg =
          'Netzwerkfehler: `/api/thinkport/…` ist nicht erreichbar (z. B. statisches Hosting ohne Netlify Functions). Siehe NETLIFY.md.'
      }
      setStatus(msg, true)
      allReferences = []
      if (catContainer) catContainer.innerHTML = ''
      if (tagContainer) tagContainer.innerHTML = ''
      if (refListEl) refListEl.innerHTML = ''
    } finally {
      setLoadUiLoading(false)
      loadBtn.disabled = false
    }
  })

  genBtn?.addEventListener('click', async () => {
    const filtered = getFilteredReferences()
    const toExport = filtered.filter((r) => selectedRefIds.has(r.id))
    if (toExport.length === 0) {
      shakeGenerateBtn()
      setStatus('Keine Referenzen zum Export ausgewählt.', true)
      return
    }

    if (USE_SERVER_PDF) {
      genBtn.disabled = true
      setGenerateUiLoading(true, { page: 0, total: 1, progress: 5 })
      setStatus('PDF wird auf dem Server erzeugt (kann etwas dauern)…', false)
      await flushUi()
      try {
        const res = await fetch(apiUrl('/api/references-pdf'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referenceIds: toExport.map((r) => r.id) }),
        })
        if (!res.ok) {
          const text = await res.text()
          let msg = text || res.statusText || 'PDF-Anfrage fehlgeschlagen'
          try {
            const j = JSON.parse(text)
            if (j?.error) msg = j.error
          } catch {
            /* plain text body */
          }
          throw new Error(msg)
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'thinkport-referenzen.pdf'
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        setGenerateUiLoading(true, { page: 0, total: 1, progress: 100 })
        setStatus(`PDF fertig (${toExport.length} Referenz(en)).`, false)
        pdfLog('export success', `server PDF · ${toExport.length} refs`)
      } catch (e) {
        console.error(e)
        setStatus(e.message || 'Server-PDF fehlgeschlagen.', true)
      } finally {
        setGenerateUiLoading(false)
        genBtn.disabled = false
      }
      return
    }

    const jspdf = globalThis.jspdf
    const html2canvas = globalThis.html2canvas
    if (!jspdf?.jsPDF || !html2canvas) {
      shakeGenerateBtn()
      setStatus('PDF-Bibliotheken fehlen (jsPDF / html2canvas).', true)
      return
    }
    const pdfAuth = import.meta.env.DEV ? authHeader(userEl?.value || '', passEl?.value ?? '') : null

    genBtn.disabled = true
    const refTotal = toExport.length
    const chunks = splitIntoChunks(toExport, REFS_PER_PAGE)
    const pdfPageCount = chunks.length
    pdfLog('export start', `${refTotal} ref(s) → ${pdfPageCount} PDF page(s) · authField=${pdfAuth ? 'yes' : 'no'} (proxy may still inject .env)`)
    setGenerateUiLoading(true, { page: 0, total: pdfPageCount, progress: 0 })
    setStatus('PDF wird erzeugt…', false)
    await flushUi()

    try {
      const { jsPDF } = jspdf
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      if (!exportRoot) throw new Error('Export container missing')

      for (let i = 0; i < chunks.length; i += 1) {
        pdfLog('page', `${i + 1}/${pdfPageCount} — preload + build`)
        setGenerateUiLoading(true, { page: i, total: pdfPageCount, progress: (i / pdfPageCount) * 100, phase: 'prepare' })
        setStatus(`PDF: Seite ${i + 1} von ${pdfPageCount} — Bilder und Layout…`, false)
        await flushUi()

        const cards = await preloadRefCardImages(chunks[i], basePath, pdfAuth)
        const pageEl = await buildReferenceListingPage(cards, {
          pageIndex: i,
          totalPages: pdfPageCount,
          basePath,
          totalRefCount: refTotal,
        })
        exportRoot.innerHTML = ''
        exportRoot.appendChild(pageEl)
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        await waitForImages(pageEl)
        applyPlaceholderForBrokenImages(pageEl)
        await new Promise((r) => setTimeout(r, 80))

        setGenerateUiLoading(true, {
          page: i,
          total: pdfPageCount,
          progress: ((i + 0.35) / pdfPageCount) * 100,
          phase: 'render',
        })
        setStatus(`PDF: Seite ${i + 1} von ${pdfPageCount} — Rendern (CPU-intensiv, oft ~10–45 s je Seite)…`, false)
        await flushUi()

        pdfLog('page', `${i + 1}/${pdfPageCount} — html2canvas (UI kann hier „einfrieren“ — normal)`)
        const imgData = await pageToPdfImage(pageEl, html2canvas)
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH)
        setGenerateUiLoading(true, {
          page: i,
          total: pdfPageCount,
          progress: ((i + 1) / pdfPageCount) * 100,
          phase: 'prepare',
        })
        setStatus(`PDF: Seite ${i + 1} von ${pdfPageCount} — fertig.`, false)
        await flushUi()
      }

      exportRoot.innerHTML = ''
      pdf.save('thinkport-referenzen.pdf')
      pdfLog('export success', `saved thinkport-referenzen.pdf (${refTotal} refs, ${pdfPageCount} pages)`)
      setStatus(`PDF fertig (${refTotal} Referenz(en), ${pdfPageCount} Seite(n)).`, false)
    } catch (e) {
      console.error(e)
      pdfLog('export FAILED', e instanceof Error ? e.message : String(e))
      setStatus(e.message || 'PDF-Erzeugung fehlgeschlagen (z. B. CORS bei Bildern).', true)
    } finally {
      setGenerateUiLoading(false)
      genBtn.disabled = false
    }
  })

  updateExportCountPreview()

  if (import.meta.env.DEV) {
    setStatus(
      'Dev: Zugangsdaten in .env für den Vite-Proxy, oder unten eingeben — dann „Referenzen laden“.',
      false,
    )
  } else {
    setStatus('„Referenzen laden“ nutzt `/api/thinkport/…` (Basic Auth serverseitig auf Netlify).', false)
  }
}
