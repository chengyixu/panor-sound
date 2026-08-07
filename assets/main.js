const config = window.SOUND_SITE_CONFIG

if (!config?.site || !config?.hero || !config?.footer) {
  throw new Error('Missing required SOUND_SITE_CONFIG fields.')
}

const byId = id => document.getElementById(id)

function el(tag, className, attrs = {}) {
  const e = document.createElement(tag)
  if (className) e.className = className
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'textContent') e.textContent = v
    else if (k === 'href') e.setAttribute('href', v)
    else e.setAttribute(k, v)
  }
  return e
}

function safeHref(value) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const href = value.trim()
  if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../') || href.startsWith('#')) return href
  try {
    const url = new URL(href)
    return url.protocol === 'https:' || url.protocol === 'mailto:' ? href : null
  } catch { return null }
}

function addLink(container, item, className = '') {
  const href = safeHref(item?.href)
  if (!href || typeof item?.label !== 'string' || item.label.trim() === '') return
  const link = el('a', className, { href, textContent: item.label })
  if (item.external) { link.target = '_blank'; link.rel = 'noreferrer' }
  container.append(link)
}

/* ---- Navigation ---- */
function renderNavigation() {
  const nav = byId('primary-nav')
  for (const item of config.navigation || []) {
    const entry = document.createElement('li')
    addLink(entry, item)
    if (entry.childNodes.length) nav.append(entry)
  }
}

/* ---- Hero ---- */
function renderHero() {
  byId('hero-eyebrow').textContent = config.hero.eyebrow || ''
  byId('hero-heading').textContent = config.hero.heading || config.site.name
  byId('hero-body').textContent = config.hero.body || ''
  const actions = byId('hero-actions')
  for (const action of config.hero.actions || []) addLink(actions, action, 'button-link')
}

/* ---- Section Router ---- */
function renderSections() {
  const container = byId('sections')
  for (const section of config.sections || []) {
    if (typeof section.heading !== 'string' || section.heading.trim() === '') continue
    const wrapper = el('section', 'content-section')
    wrapper.id = section.heading.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const h2 = el('h2', '', { textContent: section.heading })
    wrapper.append(h2)
    if (section.body) {
      wrapper.append(el('p', 'section-body', { textContent: section.body }))
    }

    if (section.type === 'featured') renderFeaturedRows(wrapper, section)
    else if (section.type === 'map') renderMapSection(wrapper, section)
    else if (section.type === 'halloffame') renderHallOfFame(wrapper, section)
    else renderGenericSection(wrapper, section)

    container.append(wrapper)
  }
}

/* ---- Featured Carousel Section ---- */
function renderFeaturedRows(wrapper, section) {
  for (const row of section.rows || []) {
    const rowEl = el('div', 'featured-row')
    rowEl.append(el('div', 'featured-row-label', { textContent: row.label || '' }))
    if (row.description) {
      rowEl.append(el('div', 'featured-row-desc', { textContent: row.description }))
    }
    const carousel = el('div', 'carousel')
    for (const item of row.items || []) {
      const card = el('div', 'carousel-card')
      const cover = el('img', 'carousel-card-cover', { src: item.cover || '', alt: item.title || '', loading: 'lazy' })
      cover.onerror = function () {
        this.remove()
        const fb = el('div', 'carousel-card-cover-fallback')
        fb.textContent = item.title ? item.title.charAt(0) : 'S'
        card.insertBefore(fb, card.firstChild)
      }
      card.append(cover)
      const body = el('div', 'carousel-card-body')
      body.append(el('div', 'carousel-card-title', { textContent: item.title || '' }))
      body.append(el('div', 'carousel-card-location', { textContent: item.location || '' }))
      if (item.story) body.append(el('div', 'carousel-card-story', { textContent: item.story }))
      if (item.plays) body.append(el('div', 'carousel-card-meta', { textContent: item.plays + ' plays' }))
      card.append(body)
      carousel.append(card)
    }
    rowEl.append(carousel)
    wrapper.append(rowEl)
  }
}

/* ---- Map + Gallery Section ---- */
function renderMapSection(wrapper, section) {
  const mapContainer = el('div', 'map-container')
  const placeholder = el('div', 'map-placeholder')
  const icon = el('div', 'map-placeholder-icon', { textContent: '◉' })
  placeholder.append(icon)
  placeholder.append(el('p', 'map-hint', {
    textContent: 'Interactive sound map loading from panor.tech/soundscape. Explore soundscapes by location — zoom, pan, and click any marker to listen.'
  }))
  mapContainer.append(placeholder)
  wrapper.append(mapContainer)

  // Record-cover grid
  const coverPool = [
    '80c3ec82c7324720a279bc3bc7c8aa10.png',
    'df88a9aea3d1475b80a4bc099685b429.png',
    'ae0dd34b0bd04bdfae046dc63554f05b.png',
    'cf99bfb5ec15414a8b4a9e250feb132e.png',
    '0d35e9451bdd46b8a73c3cbd8c4b4428.png',
    'c4278a6141114a1882bec01470aacd0d.png',
    '8d5250afc2f94dfc8803d207214ebe30.png',
  ]
  const grid = el('div', 'map-grid')
  const locations = [
    { title: 'Mong Kok Footbridge', location: 'Mong Kok, Hong Kong' },
    { title: 'Wong Tai Sin Temple', location: 'Wong Tai Sin, Hong Kong' },
    { title: 'Victoria Park', location: 'Causeway Bay, Hong Kong' },
    { title: 'Sham Shui Po Market', location: 'Sham Shui Po, Hong Kong' },
    { title: 'Star Ferry Pier', location: 'Tsim Sha Tsui, Hong Kong' },
    { title: 'Innovation Campus', location: 'Bao\'an, Shenzhen' },
    { title: 'Longhua Alleys', location: 'Xuhui, Shanghai' },
    { title: 'Yantian Old Lanes', location: 'Bao\'an, Shenzhen' },
  ]
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i]
    const card = el('div', 'map-grid-card')
    const cover = el('img', 'map-grid-card-cover', { src: './assets/covers/' + coverPool[i % coverPool.length], alt: loc.title, loading: 'lazy' })
    cover.onerror = function () { this.remove() }
    card.append(cover)
    const body = el('div', 'map-grid-card-body')
    body.append(el('div', 'map-grid-card-title', { textContent: loc.title }))
    body.append(el('div', 'map-grid-card-location', { textContent: loc.location }))
    card.append(body)
    grid.append(card)
  }
  wrapper.append(grid)
}

/* ---- Hall of Fame ---- */
function renderHallOfFame(wrapper, section) {
  const c = section.contributors
  if (c) {
    const subH = el('h3', '', { textContent: c.heading || 'Contributors' })
    subH.style.cssText = 'font-size:1.1rem;font-weight:600;margin-top:2rem;'
    wrapper.append(subH)
    if (c.body) wrapper.append(el('p', 'section-body', { textContent: c.body }))

    // People
    const grid = el('div', 'hof-grid')
    for (const p of c.people || []) {
      const card = el('div', 'hof-card')
      const initials = p.name.split(' ').map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase()
      const avatar = el('div', 'hof-avatar', { textContent: initials })
      card.append(avatar)
      card.append(el('div', 'hof-card-name', { textContent: p.name }))
      card.append(el('div', 'hof-card-role', { textContent: p.role }))
      if (p.affiliation) card.append(el('div', 'hof-card-affiliation', { textContent: p.affiliation }))
      card.append(el('div', 'hof-card-contribution', { textContent: p.contribution }))
      grid.append(card)
    }
    wrapper.append(grid)

    // Sound Libraries
    if (c.libraries?.length) {
      const libH = el('p', '', { textContent: 'Sound Libraries' })
      libH.style.cssText = 'font-size:0.8rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-top:2rem;'
      wrapper.append(libH)
      const libGrid = el('div', 'hof-libraries')
      for (const lib of c.libraries) {
        const lc = el('div', 'hof-lib-card')
        lc.append(el('div', 'hof-lib-name', { textContent: lib.name }))
        lc.append(el('div', 'hof-lib-desc', { textContent: lib.description }))
        libGrid.append(lc)
      }
      wrapper.append(libGrid)
    }
  }

  // Team
  const t = section.team
  if (t) {
    const block = el('div', 'team-block')
    block.append(el('h3', '', { textContent: t.heading || 'Team' }))
    block.querySelector('h3').style.cssText = 'font-size:1.1rem;font-weight:600;margin-bottom:0.5rem;'
    block.append(el('p', 'section-body', { textContent: t.body || '' }))
    if (t.contact) addLink(block, t.contact, 'button-link ghost')
    wrapper.append(block)
  }

  // Events
  const ev = section.events
  if (ev) {
    const block = el('div', 'events-block')
    block.append(el('h3', '', { textContent: ev.heading || 'Events' }))
    block.querySelector('h3').style.cssText = 'font-size:1.1rem;font-weight:600;margin-bottom:0.25rem;'
    const list = el('div', 'event-list')
    for (const item of ev.items || []) {
      const ei = el('div', 'event-item')
      ei.append(el('div', 'event-item-title', { textContent: item.title }))
      ei.append(el('div', 'event-item-date', { textContent: item.date }))
      ei.append(el('div', 'event-item-desc', { textContent: item.description }))
      list.append(ei)
    }
    block.append(list)
    wrapper.append(block)
  }
}

function renderGenericSection(wrapper, section) {
  const actions = el('div', 'cta-row')
  for (const action of section.actions || []) addLink(actions, action, 'button-link')
  if (actions.childNodes.length) wrapper.append(actions)
}

/* ---- Footer ---- */
function renderFooter() {
  byId('footer-text').textContent = config.footer.text || ''
  const links = byId('footer-links')
  for (const item of config.footer.links || []) {
    const entry = document.createElement('li')
    addLink(entry, item)
    if (entry.childNodes.length) links.append(entry)
  }
}

/* ---- Bootstrap ---- */
document.documentElement.lang = config.site.locale || 'en'
document.title = config.site.title || config.site.name
const desc = config.site.description || ''
document.querySelector('meta[name="description"]')?.setAttribute('content', desc)
document.querySelector('meta[property="og:title"]')?.setAttribute('content', config.site.title || config.site.name)
document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc)
document.querySelector('meta[property="og:url"]')?.setAttribute('content', 'https://www.panor.tech' + (config.site.basePath || '/'))
document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', config.site.title || config.site.name)
document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', desc)

byId('brand').textContent = config.site.name
byId('brand').setAttribute('aria-label', `${config.site.name} home`)

renderNavigation()
renderHero()
renderSections()
renderFooter()
