const config = window.SOUND_SITE_CONFIG

if (!config?.site || !config?.hero || !config?.footer) {
  throw new Error('Missing required SOUND_SITE_CONFIG fields.')
}

const byId = id => document.getElementById(id)

function safeHref(value) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const href = value.trim()
  if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../') || href.startsWith('#')) return href
  try {
    const url = new URL(href)
    return url.protocol === 'https:' || url.protocol === 'mailto:' ? href : null
  } catch {
    return null
  }
}

function addLink(container, item, className = '') {
  const href = safeHref(item?.href)
  if (!href || typeof item?.label !== 'string' || item.label.trim() === '') return
  const link = document.createElement('a')
  link.className = className
  link.href = href
  link.textContent = item.label
  if (item.external) {
    link.target = '_blank'
    link.rel = 'noreferrer'
  }
  container.append(link)
}

function renderNavigation() {
  const nav = byId('primary-nav')
  for (const item of config.navigation || []) {
    const entry = document.createElement('li')
    addLink(entry, item)
    if (entry.childNodes.length) nav.append(entry)
  }
}

function renderHero() {
  byId('hero-eyebrow').textContent = config.hero.eyebrow || ''
  byId('hero-heading').textContent = config.hero.heading || config.site.name
  byId('hero-body').textContent = config.hero.body || ''
  const actions = byId('hero-actions')
  for (const action of config.hero.actions || []) addLink(actions, action, 'button-link')
}

function renderSections() {
  const container = byId('sections')
  for (const section of config.sections || []) {
    if (typeof section?.heading !== 'string' || section.heading.trim() === '') continue
    const element = document.createElement('section')
    element.className = 'content-section'
    const heading = document.createElement('h2')
    heading.textContent = section.heading
    element.append(heading)
    if (typeof section.body === 'string' && section.body.trim()) {
      const body = document.createElement('p')
      body.textContent = section.body
      element.append(body)
    }
    const actions = document.createElement('div')
    actions.className = 'cta-row'
    for (const action of section.actions || []) addLink(actions, action, 'button-link')
    if (actions.childNodes.length) element.append(actions)
    container.append(element)
  }
}

function renderFooter() {
  byId('footer-text').textContent = config.footer.text || ''
  const links = byId('footer-links')
  for (const item of config.footer.links || []) {
    const entry = document.createElement('li')
    addLink(entry, item)
    if (entry.childNodes.length) links.append(entry)
  }
}

document.documentElement.lang = config.site.locale || 'en'
document.title = config.site.title || config.site.name
document.querySelector('meta[name="description"]')?.setAttribute('content', config.site.description || '')
byId('brand').textContent = config.site.name
byId('brand').setAttribute('aria-label', `${config.site.name} home`)

renderNavigation()
renderHero()
renderSections()
renderFooter()
