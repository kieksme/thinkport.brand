/**
 * Reference PDF generator: load Thinkport references via GraphQL, filter, export A4 pages (letterhead layout) with jsPDF + html2canvas.
 * @see https://thinkportapi.netlify.app (References API, Basic Auth)
 */

const REFERENCES_QUERY = `
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

const PRODUCTION_ENDPOINT = 'https://thinkportapi.netlify.app/.netlify/functions/references'

function getEndpoint() {
  return import.meta.env.DEV ? '/api/thinkport-references' : PRODUCTION_ENDPOINT
}

function authHeader(user, pass) {
  const u = (user || '').trim()
  if (!u || pass == null || pass === '') return null
  const token = btoa(`${u}:${pass}`)
  return `Basic ${token}`
}

function initBarcode(svgEl, barcodeValue) {
  if (!svgEl) return
  svgEl.innerHTML = ''
  let bits = '101011110'
  for (let i = 0; i < barcodeValue.length; i += 1) {
    const byteBits = barcodeValue.charCodeAt(i).toString(2).padStart(8, '0')
    bits += byteBits
    if (i < barcodeValue.length - 1) bits += '0'
  }
  bits += '1110101'
  const ns = 'http://www.w3.org/2000/svg'
  for (let x = 0; x < bits.length; x += 1) {
    if (bits.charAt(x) !== '1') continue
    const rect = document.createElementNS(ns, 'rect')
    rect.setAttribute('x', String(x))
    rect.setAttribute('y', '0')
    rect.setAttribute('width', '1')
    rect.setAttribute('height', '64')
    rect.setAttribute('fill', '#0B2649')
    svgEl.appendChild(rect)
  }
  svgEl.setAttribute('viewBox', `0 0 ${bits.length} 64`)
}

function escapeHtml(s) {
  if (s == null || typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(md) {
  if (!md || typeof md !== 'string') return ''
  const m = globalThis.marked
  if (!m) return `<p>${escapeHtml(md)}</p>`
  try {
    if (typeof m.parse === 'function') return m.parse(md, { async: false })
    if (typeof m === 'function') return m(md)
  } catch {
    /* fall through */
  }
  return `<p>${escapeHtml(md)}</p>`
}

/**
 * @param {object} ref
 * @param {{ index: number, total: number, basePath: string }} ctx
 */
function buildReferencePageElement(ref, ctx) {
  const title = ref.title || ref.id || 'Referenz'
  const customer = ref.customer || '—'
  const year = ref.year || '—'
  const cats = Array.isArray(ref.categories) ? ref.categories.join(', ') : ''
  const tags = Array.isArray(ref.tags) ? ref.tags.join(', ') : ''
  const excerpt = ref.excerpt || ''
  const bodyHtml = renderMarkdown(ref.body || '')
  const logoSrc = `${ctx.basePath}logos/venitus/thinkport-venitus-light.svg`

  const wrap = document.createElement('div')
  wrap.innerHTML = `
  <main class="tp-ref-page">
    <div class="print-mark fold-mark-top" aria-hidden="true"></div>
    <div class="print-mark fold-mark-bottom" aria-hidden="true"></div>
    <div class="hole-mark" aria-hidden="true"></div>
    <div class="edge-barcode" aria-hidden="true">
      <svg class="edge-barcode-svg" viewBox="0 0 240 64" preserveAspectRatio="none"></svg>
    </div>
    <section class="content">
      <div class="top-row">
        <div class="claim"></div>
        <div class="logo">
          <img src="${escapeHtml(logoSrc)}" alt="Thinkport - A Venitus Company" crossorigin="anonymous" />
        </div>
      </div>
      <div class="ref-block">
        <div class="sender-line">Thinkport GmbH – Referenz / Case Study</div>
        <div class="ref-meta">
          <div><strong>Kunde</strong> ${escapeHtml(customer)}</div>
          <div><strong>Jahr</strong> ${escapeHtml(year)}</div>
          ${cats ? `<div><strong>Kategorien</strong> ${escapeHtml(cats)}</div>` : ''}
          ${tags ? `<div><strong>Tags</strong> ${escapeHtml(tags)}</div>` : ''}
        </div>
      </div>
      <div class="subject">${escapeHtml(title)}</div>
      ${ref.image ? `<div class="ref-hero"><img src="${escapeHtml(ref.image)}" alt="" crossorigin="anonymous" /></div>` : ''}
      <div class="letter">
        ${excerpt ? `<p class="ref-excerpt">${escapeHtml(excerpt)}</p>` : ''}
        <div class="markdown-body">${bodyHtml}</div>
      </div>
    </section>
    <div class="page-number">Seite ${ctx.index + 1} von ${ctx.total}</div>
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

  const main = wrap.firstElementChild
  const svg = main.querySelector('.edge-barcode-svg')
  initBarcode(svg, 'https://thinkport.digital')
  return main
}

async function fetchReferences(user, pass) {
  const headers = { 'Content-Type': 'application/json' }
  const auth = authHeader(user, pass)
  if (auth) headers.Authorization = auth

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

function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'))
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

async function pageToPdfImage(pageEl, html2canvas) {
  const canvas = await html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
  })
  return canvas.toDataURL('image/jpeg', 0.92)
}

export function bootReferencesPdf(basePath) {
  const statusEl = document.getElementById('refs-load-status')
  const userEl = document.getElementById('refs-api-user')
  const passEl = document.getElementById('refs-api-pass')
  const loadBtn = document.getElementById('refs-load-btn')
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
   * @param {{ page?: number, total?: number, progress?: number }} [opts]
   */
  function setGenerateUiLoading(on, opts = {}) {
    if (!genBtn) return
    genBtn.classList.toggle('is-generating', on)
    genBtn.setAttribute('aria-busy', on ? 'true' : 'false')
    if (genBtnFill) {
      if (!on) {
        genBtnFill.style.width = '0%'
      } else if (typeof opts.progress === 'number') {
        genBtnFill.style.width = `${Math.min(100, Math.max(0, opts.progress))}%`
      }
    }
    if (genBtnLabel) {
      if (!on) {
        genBtnLabel.textContent = GEN_LABEL_DEFAULT
      } else if (opts.total != null && opts.page != null) {
        genBtnLabel.textContent = `Seite ${opts.page + 1} von ${opts.total}…`
      } else {
        genBtnLabel.textContent = 'PDF wird erzeugt…'
      }
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
      })
    })
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
    loadBtn.disabled = true
    try {
      allReferences = await fetchReferences(user, pass)
      setStatus(`${allReferences.length} Referenz(en) geladen.`, false)
      renderFilterSection()
    } catch (e) {
      console.error(e)
      setStatus(e.message || 'Laden fehlgeschlagen', true)
      allReferences = []
      if (catContainer) catContainer.innerHTML = ''
      if (tagContainer) tagContainer.innerHTML = ''
      if (refListEl) refListEl.innerHTML = ''
    } finally {
      loadBtn.disabled = false
    }
  })

  genBtn?.addEventListener('click', async () => {
    const jspdf = globalThis.jspdf
    const html2canvas = globalThis.html2canvas
    if (!jspdf?.jsPDF || !html2canvas) {
      shakeGenerateBtn()
      setStatus('PDF-Bibliotheken fehlen (jsPDF / html2canvas).', true)
      return
    }
    const filtered = getFilteredReferences()
    const toExport = filtered.filter((r) => selectedRefIds.has(r.id))
    if (toExport.length === 0) {
      shakeGenerateBtn()
      setStatus('Keine Referenzen zum Export ausgewählt.', true)
      return
    }

    genBtn.disabled = true
    const total = toExport.length
    setGenerateUiLoading(true, { page: 0, total, progress: 0 })
    setStatus('PDF wird erzeugt…', false)

    try {
      const { jsPDF } = jspdf
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      if (!exportRoot) throw new Error('Export container missing')

      for (let i = 0; i < toExport.length; i += 1) {
        setGenerateUiLoading(true, { page: i, total, progress: (i / total) * 100 })
        const pageEl = buildReferencePageElement(toExport[i], { index: i, total, basePath })
        exportRoot.innerHTML = ''
        exportRoot.appendChild(pageEl)
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        const imgData = await pageToPdfImage(pageEl, html2canvas)
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH)
        setGenerateUiLoading(true, { page: i, total, progress: ((i + 1) / total) * 100 })
      }

      exportRoot.innerHTML = ''
      pdf.save('thinkport-referenzen.pdf')
      setStatus('PDF fertig.', false)
    } catch (e) {
      console.error(e)
      setStatus(e.message || 'PDF-Erzeugung fehlgeschlagen (z. B. CORS bei Bildern).', true)
    } finally {
      setGenerateUiLoading(false)
      genBtn.disabled = false
    }
  })

  if (import.meta.env.DEV) {
    setStatus('Dev: optional .env mit THINKPORT_REFERENCES_USER / THINKPORT_REFERENCES_PASS für den Proxy.', false)
  } else {
    setStatus('Basic-Auth-Zugang eingeben und „Referenzen laden“.', false)
  }
}
