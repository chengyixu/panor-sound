const byId = id => document.getElementById(id)

function el(tag, className, attributes = {}) {
  const element = document.createElement(tag)
  if (className) element.className = className
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'textContent') element.textContent = value
    else if (key === 'hidden') element.hidden = Boolean(value)
    else element.setAttribute(key, value)
  }
  return element
}

function safeHref(value) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const href = value.trim()
  if (href.startsWith('/') || href.startsWith('./') || href.startsWith('#')) return href
  try {
    const url = new URL(href)
    return ['https:', 'mailto:'].includes(url.protocol) ? href : null
  } catch {
    return null
  }
}

function addLink(container, item, className = '') {
  const href = safeHref(item?.href)
  if (!href || typeof item?.label !== 'string' || item.label.trim() === '') return
  const link = el('a', className, { href, textContent: item.label })
  if (item.external) {
    link.target = '_blank'
    link.rel = 'noreferrer'
  }
  container.append(link)
}

function formatCount(value) {
  return new Intl.NumberFormat('en', { notation: value >= 1000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}

function formatDuration(totalSeconds) {
  const hours = totalSeconds / 3600
  if (hours >= 1) return `${hours.toFixed(hours >= 10 ? 0 : 1)} hours`
  return `${Math.max(1, Math.round(totalSeconds / 60))} minutes`
}

function renderImage(sound, className) {
  if (!sound.coverUrl) {
    return el('div', `${className} cover-fallback`, { textContent: sound.title.charAt(0).toUpperCase() })
  }
  const image = el('img', className, {
    src: sound.coverUrl,
    alt: '',
    loading: 'lazy',
    decoding: 'async',
  })
  image.addEventListener('error', () => {
    image.replaceWith(el('div', `${className} cover-fallback`, { textContent: sound.title.charAt(0).toUpperCase() }))
  }, { once: true })
  return image
}

function createSoundCard(sound, onListen) {
  const card = el('button', 'sound-card', {
    type: 'button',
    'data-sound-id': String(sound.id),
    'aria-label': `Listen to ${sound.title} from ${sound.location}`,
  })
  card.append(renderImage(sound, 'sound-card-cover'))
  const body = el('span', 'sound-card-body')
  body.append(el('span', 'sound-card-category', { textContent: sound.category }))
  body.append(el('span', 'sound-card-title', { textContent: sound.title }))
  body.append(el('span', 'sound-card-location', { textContent: sound.location }))
  if (sound.description) body.append(el('span', 'sound-card-description', { textContent: sound.description }))
  const meta = el('span', 'sound-card-meta')
  meta.append(el('span', '', { textContent: `${formatCount(sound.plays)} plays` }))
  meta.append(el('span', '', { textContent: sound.creator }))
  body.append(meta)
  card.append(body)
  card.addEventListener('click', () => onListen(sound))
  return card
}

function renderCarousel(container, items, onListen) {
  const carousel = el('div', 'sound-carousel')
  for (const sound of items) carousel.append(createSoundCard(sound, onListen))
  container.append(carousel)
}

function renderFeatured(config, model, onListen) {
  const section = el('section', 'content-section', { id: 'featured' })
  section.append(el('h2', '', { textContent: config.sections.featured.heading }))

  const latest = el('div', 'featured-row')
  latest.append(el('p', 'section-kicker', { textContent: config.sections.featured.latestLabel }))
  latest.append(el('p', 'section-body', { textContent: config.sections.featured.latestDescription }))
  renderCarousel(latest, model.featured, onListen)
  section.append(latest)

  const popular = el('div', 'featured-row')
  popular.append(el('p', 'section-kicker', { textContent: config.sections.featured.popularLabel }))
  popular.append(el('p', 'section-body', { textContent: config.sections.featured.popularDescription }))
  renderCarousel(popular, model.popular, onListen)
  section.append(popular)
  return section
}

function popupContent(sound, onListen) {
  const content = el('div', 'map-popup')
  content.append(el('strong', '', { textContent: sound.title }))
  content.append(el('span', '', { textContent: sound.location }))
  const listen = el('button', 'map-popup-listen', { type: 'button', textContent: 'Listen' })
  listen.addEventListener('click', () => onListen(sound))
  content.append(listen)
  return content
}

function renderMap(config, model, onListen) {
  if (!window.L) throw new Error('Leaflet failed to load')
  const section = el('section', 'content-section', { id: 'gallery' })
  section.append(el('h2', '', { textContent: config.sections.gallery.heading }))
  section.append(el('p', 'section-body', { textContent: config.sections.gallery.body }))
  const mapElement = el('div', 'live-map', { 'aria-label': 'Interactive map of published soundscapes' })
  section.append(mapElement)

  return {
    section,
    initialize() {
      const map = window.L.map(mapElement, { scrollWheelZoom: false, worldCopyJump: true })
      window.L.tileLayer(config.map.tileUrl, {
        attribution: config.map.attribution,
        maxZoom: 19,
      }).addTo(map)

      const bounds = []
      for (const sound of model.mapItems) {
        const point = [sound.latitude, sound.longitude]
        bounds.push(point)
        window.L.circleMarker(point, {
          radius: 7,
          color: '#ffffff',
          weight: 2,
          fillColor: '#111111',
          fillOpacity: 0.95,
        }).addTo(map).bindPopup(popupContent(sound, onListen))
      }
      if (bounds.length === 1) map.setView(bounds[0], 12)
      else if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 })
      else map.setView([20, 0], 2)
    },
  }
}

function renderArchive(config, model) {
  const section = el('section', 'content-section', { id: 'archive' })
  section.append(el('h2', '', { textContent: config.sections.archive.heading }))
  section.append(el('p', 'section-body', { textContent: config.sections.archive.body }))

  const stats = el('div', 'archive-stats')
  const values = [
    [formatCount(model.stats.recordings), 'published recordings'],
    [formatCount(model.stats.places), 'recorded places'],
    [formatDuration(model.stats.durationSeconds), 'of field audio'],
    [formatCount(model.stats.plays), 'community plays'],
  ]
  for (const [value, label] of values) {
    const card = el('div', 'archive-stat')
    card.append(el('strong', '', { textContent: value }))
    card.append(el('span', '', { textContent: label }))
    stats.append(card)
  }
  section.append(stats)

  section.append(el('h3', 'archive-subheading', { textContent: config.sections.archive.contributorsLabel }))
  const contributors = el('div', 'contributor-grid')
  for (const contributor of model.contributors) {
    const card = el('article', 'contributor-card')
    card.append(el('span', 'contributor-avatar', { textContent: contributor.name.charAt(0).toUpperCase() }))
    card.append(el('strong', '', { textContent: contributor.name }))
    card.append(el('span', '', { textContent: `${contributor.recordings} recording${contributor.recordings === 1 ? '' : 's'} · ${formatCount(contributor.plays)} plays` }))
    contributors.append(card)
  }
  section.append(contributors)

  const contact = el('div', 'archive-contact')
  contact.append(el('p', '', { textContent: config.sections.archive.contactBody }))
  addLink(contact, config.sections.archive.contact, 'button-link ghost')
  section.append(contact)
  return section
}

export function renderStaticChrome(config) {
  document.documentElement.lang = config.site.locale
  document.title = config.site.title
  document.querySelector('meta[name="description"]')?.setAttribute('content', config.site.description)
  byId('brand').textContent = config.site.name
  byId('brand').setAttribute('aria-label', `${config.site.name} home`)

  const navigation = byId('primary-nav')
  navigation.replaceChildren()
  for (const item of config.navigation) {
    const entry = document.createElement('li')
    addLink(entry, item)
    navigation.append(entry)
  }

  byId('hero-eyebrow').textContent = config.hero.eyebrow
  byId('hero-heading').textContent = config.hero.heading
  byId('hero-body').textContent = config.hero.body
  const actions = byId('hero-actions')
  actions.replaceChildren()
  for (const item of config.hero.actions) addLink(actions, item, 'button-link')

  byId('footer-text').textContent = config.footer.text
  const footerLinks = byId('footer-links')
  footerLinks.replaceChildren()
  for (const item of config.footer.links) {
    const entry = document.createElement('li')
    addLink(entry, item)
    footerLinks.append(entry)
  }
}

export function createPlayer(api, appUrl) {
  const player = byId('live-player')
  const audio = byId('live-player-audio')
  const cover = byId('live-player-cover')
  const title = byId('live-player-title')
  const location = byId('live-player-location')
  const description = byId('live-player-description')
  const appLink = byId('live-player-app-link')
  const close = byId('live-player-close')
  let activeSound = null
  let tracked = false

  appLink.href = appUrl

  async function trackCurrent() {
    if (!activeSound || tracked || audio.currentTime <= 0) return
    tracked = true
    try {
      await api.recordPlay(activeSound.id, audio.currentTime)
    } catch (error) {
      console.warn('[soundscape-play-tracking]', error)
    }
  }

  function open(sound) {
    void trackCurrent()
    activeSound = sound
    tracked = false
    title.textContent = sound.title
    location.textContent = sound.location
    description.textContent = sound.description
    if (sound.coverUrl) {
      cover.src = sound.coverUrl
      cover.alt = ''
      cover.hidden = false
    } else {
      cover.removeAttribute('src')
      cover.hidden = true
    }
    audio.src = sound.audioUrl
    player.hidden = false
    player.dataset.soundId = String(sound.id)
    audio.play().catch(() => audio.focus())
  }

  function dismiss() {
    void trackCurrent()
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    player.hidden = true
    player.removeAttribute('data-sound-id')
    activeSound = null
  }

  audio.addEventListener('ended', () => void trackCurrent())
  close.addEventListener('click', dismiss)
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !player.hidden) dismiss()
  })
  window.addEventListener('pagehide', () => void trackCurrent())
  return { open }
}

export function renderLoading() {
  const sections = byId('sections')
  sections.replaceChildren(el('div', 'live-state', { role: 'status', textContent: 'Loading the live sound archive…' }))
}

export function renderError(message, onRetry) {
  const sections = byId('sections')
  const state = el('div', 'live-state error-state', { role: 'alert' })
  state.append(el('strong', '', { textContent: 'The live archive is unavailable.' }))
  state.append(el('span', '', { textContent: message }))
  const retry = el('button', 'button-link', { type: 'button', textContent: 'Retry' })
  retry.addEventListener('click', onRetry)
  state.append(retry)
  sections.replaceChildren(state)
}

export function renderLiveSections(config, model, onListen) {
  const sections = byId('sections')
  const map = renderMap(config, model, onListen)
  sections.replaceChildren(
    renderFeatured(config, model, onListen),
    map.section,
    renderArchive(config, model),
  )
  map.initialize()
}
