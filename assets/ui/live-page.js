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

function createSoundCard(sound, queue, queueLabel, onListen) {
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
  card.addEventListener('click', () => onListen(sound, queue, queueLabel))
  return card
}

function renderCarousel(container, items, queueLabel, onListen) {
  const carousel = el('div', 'sound-carousel')
  for (const sound of items) carousel.append(createSoundCard(sound, items, queueLabel, onListen))
  container.append(carousel)
}

function renderFeatured(config, model, onListen) {
  const section = el('section', 'content-section', { id: 'featured' })
  section.append(el('h2', '', { textContent: config.sections.featured.heading }))

  const latest = el('div', 'featured-row')
  latest.append(el('p', 'section-kicker', { textContent: config.sections.featured.latestLabel }))
  latest.append(el('p', 'section-body', { textContent: config.sections.featured.latestDescription }))
  renderCarousel(latest, model.featured, 'Latest', onListen)
  section.append(latest)

  const popular = el('div', 'featured-row')
  popular.append(el('p', 'section-kicker', { textContent: config.sections.featured.popularLabel }))
  popular.append(el('p', 'section-body', { textContent: config.sections.featured.popularDescription }))
  renderCarousel(popular, model.popular, 'Popular', onListen)
  section.append(popular)
  return section
}

function popupContent(sound, queue, onListen) {
  const content = el('div', 'map-popup')
  content.append(el('strong', '', { textContent: sound.title }))
  content.append(el('span', '', { textContent: sound.location }))
  const listen = el('button', 'map-popup-listen', { type: 'button', textContent: 'Listen' })
  listen.addEventListener('click', () => onListen(sound, queue, 'Map'))
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
        }).addTo(map).bindPopup(popupContent(sound, model.mapItems, onListen))
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
  const dialog = byId('turntable-dialog')
  const decks = [byId('live-player-audio'), byId('live-player-audio-standby')].map(audio => ({
    audio,
    sound: null,
    listenGeneration: 0,
    trackedGeneration: -1,
  }))
  const title = byId('live-player-title')
  const location = byId('live-player-location')
  const source = byId('live-player-source')
  const compactPreview = byId('live-player-compact-preview')
  const focusedTitle = byId('focused-player-title')
  const focusedLocation = byId('focused-player-location')
  const focusedDescription = byId('focused-player-description')
  const focusedSource = byId('focused-player-source')
  const focusedState = byId('focused-player-state')
  const candidates = byId('turntable-candidates')
  const announcer = byId('live-player-announcer')
  const appLink = byId('live-player-app-link')
  const expand = byId('live-player-expand')
  const choose = byId('live-player-choose')
  const focusedChoose = byId('focused-player-choose')
  const compactTonearm = byId('live-player-tonearm')
  const focusedTonearm = byId('focused-player-tonearm')
  const collapse = byId('focused-player-collapse')
  const close = byId('live-player-close')
  let activeSound = null
  let activeDeckIndex = 0
  let activeQueue = []
  let activeQueueLabel = ''
  let activeQueueIndex = 0
  let parked = false
  let browseOffset = 0
  let browsing = false
  let chooserOpen = false
  let switching = false
  let transitionGeneration = 0
  let volumeAnimationGeneration = 0

  appLink.href = appUrl

  function safeCurrentTime(audio) {
    return Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0
  }

  async function trackDeck(deck) {
    const sound = deck.sound
    const listenedSeconds = safeCurrentTime(deck.audio)
    if (!sound || listenedSeconds <= 0 || deck.trackedGeneration === deck.listenGeneration) return
    deck.trackedGeneration = deck.listenGeneration
    try {
      await api.recordPlay(sound.id, listenedSeconds)
    } catch (error) {
      console.warn('[soundscape-play-tracking]', error)
    }
  }

  function activeDeck() {
    return decks[activeDeckIndex]
  }

  function standbyDeck() {
    return decks[activeDeckIndex === 0 ? 1 : 0]
  }

  async function tryPlay(audio) {
    try {
      await audio.play()
      return true
    } catch {
      return false
    }
  }

  function stopDeck(deck, clearSource = true) {
    deck.audio.pause()
    deck.audio.volume = 0
    if (clearSource) {
      deck.audio.removeAttribute('src')
      deck.audio.load()
      deck.sound = null
    }
  }

  function prepareDeck(deck, sound, volume) {
    stopDeck(deck)
    deck.sound = sound
    deck.listenGeneration += 1
    deck.audio.src = sound.audioUrl
    deck.audio.volume = volume
    deck.audio.dataset.soundId = String(sound.id)
  }

  function uniquePlayableQueue(queue, sound) {
    const seen = new Set()
    const playable = []
    for (const item of Array.isArray(queue) ? queue : []) {
      if (!item?.audioUrl || seen.has(item.id)) continue
      seen.add(item.id)
      playable.push(item)
    }
    if (sound?.audioUrl && !seen.has(sound.id)) playable.unshift(sound)
    return playable
  }

  function wrappedIndex(index) {
    if (!activeQueue.length) return 0
    return ((index % activeQueue.length) + activeQueue.length) % activeQueue.length
  }

  function candidateAt(offset) {
    return activeQueue[wrappedIndex(activeQueueIndex + offset)] || activeSound
  }

  function setTonearmVisual(progress, offset = 0) {
    const clamped = Math.max(0, Math.min(1, progress))
    for (const surface of [player, dialog]) {
      surface.style.setProperty('--tonearm-angle', `${-18 + clamped * 30}deg`)
      surface.style.setProperty('--tonearm-lift', `${offset * -3}px`)
    }
  }

  function setDeckActivity() {
    decks.forEach((deck, index) => {
      deck.audio.dataset.active = String(index === activeDeckIndex)
    })
  }

  function setPlayerState() {
    const stateText = switching
      ? 'Changing recording'
      : parked
        ? 'Needle parked · paused'
        : 'Needle on record · playing'
    player.dataset.parked = String(parked)
    player.dataset.browsing = String(browsing)
    player.dataset.switching = String(switching)
    dialog.dataset.parked = String(parked)
    dialog.dataset.browsing = String(browsing)
    dialog.dataset.switching = String(switching)
    focusedState.textContent = stateText
    for (const tonearm of [compactTonearm, focusedTonearm]) {
      tonearm.disabled = switching
      tonearm.setAttribute('aria-pressed', String(!parked))
      tonearm.setAttribute('aria-label', parked
        ? 'Place tonearm on record to resume. Drag vertically to browse recordings.'
        : 'Park tonearm to pause. Drag vertically to browse recordings.')
    }
    choose.disabled = activeQueue.length < 2 || switching
    focusedChoose.disabled = activeQueue.length < 2 || switching
    expand.setAttribute('aria-label', activeSound ? `Open focused turntable for ${activeSound.title}` : 'Open focused turntable')
  }

  function updateMetadata(sound) {
    if (!sound) return
    title.textContent = sound.title
    location.textContent = sound.location
    source.textContent = `${activeQueueLabel} queue`
    focusedTitle.textContent = sound.title
    focusedLocation.textContent = sound.location
    focusedDescription.textContent = sound.description
    focusedSource.textContent = `${activeQueueLabel} queue`
    compactPreview.textContent = browsing ? candidateAt(browseOffset)?.title || sound.title : ''
  }

  function renderCandidates() {
    candidates.replaceChildren()
    if (!activeSound || activeQueue.length < 2 || (!browsing && !chooserOpen)) {
      candidates.hidden = true
      return
    }
    for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
      const relativeOffset = browseOffset + rowOffset
      const sound = candidateAt(relativeOffset)
      const button = el('button', 'turntable-candidate', {
        type: 'button',
        'data-row-offset': String(rowOffset),
        'aria-label': rowOffset === 0 ? `Selected recording: ${sound.title}` : `Choose ${sound.title}`,
      })
      if (rowOffset === 0) button.dataset.selected = 'true'
      button.append(el('span', 'candidate-mark', { 'aria-hidden': 'true' }))
      const copy = el('span', 'candidate-copy')
      copy.append(el('strong', '', { textContent: sound.title }))
      copy.append(el('span', '', { textContent: sound.location }))
      button.append(copy)
      button.addEventListener('click', () => {
        void selectCandidate(sound)
      })
      candidates.append(button)
    }
    candidates.hidden = false
  }

  function updateBrowsePreview() {
    const preview = candidateAt(browseOffset)
    compactPreview.textContent = browsing && preview ? preview.title : ''
    if (browsing && preview) announcer.textContent = `Previewing ${preview.title}`
    setTonearmVisual(parked ? 1 : 0, browseOffset)
    renderCandidates()
  }

  function cancelVolumeAnimations() {
    volumeAnimationGeneration += 1
  }

  function rampVolume(audio, target, durationMs) {
    const generation = ++volumeAnimationGeneration
    const startedAt = performance.now()
    const startVolume = audio.volume
    const tick = () => {
      if (generation !== volumeAnimationGeneration) return
      const progress = Math.min(1, (performance.now() - startedAt) / durationMs)
      audio.volume = startVolume + (target - startVolume) * progress
      if (progress < 1) setTimeout(tick, 16)
    }
    tick()
  }

  function setBrowsing(nextBrowsing) {
    browsing = nextBrowsing
    if (browsing) rampVolume(activeDeck().audio, 0.25, 150)
    else rampVolume(activeDeck().audio, 1, 150)
    setPlayerState()
    updateBrowsePreview()
  }

  function normalizeAfterInterruptedTransition() {
    transitionGeneration += 1
    cancelVolumeAnimations()
    const current = activeDeck()
    current.audio.volume = 1
    for (const deck of decks) {
      if (deck !== current && deck.sound) {
        void trackDeck(deck)
        stopDeck(deck)
      }
    }
    switching = false
    setDeckActivity()
    setPlayerState()
  }

  function animateCrossfade(outgoing, incoming, durationMs, generation) {
    cancelVolumeAnimations()
    const startedAt = performance.now()
    const outgoingStart = outgoing.audio.volume
    return new Promise(resolve => {
      const tick = now => {
        if (generation !== transitionGeneration) {
          resolve(false)
          return
        }
        const progress = Math.min(1, (now - startedAt) / durationMs)
        outgoing.audio.volume = outgoingStart * Math.cos(progress * Math.PI / 2)
        incoming.audio.volume = Math.sin(progress * Math.PI / 2)
        if (progress < 1) requestAnimationFrame(tick)
        else resolve(true)
      }
      requestAnimationFrame(tick)
    })
  }

  async function selectCandidate(sound, options = {}) {
    if (!sound?.audioUrl) return
    if (switching) normalizeAfterInterruptedTransition()
    const nextQueue = uniquePlayableQueue(options.queue || activeQueue, sound)
    const nextQueueLabel = options.queueLabel || activeQueueLabel || 'Selected'
    const nextIndex = Math.max(0, nextQueue.findIndex(item => item.id === sound.id))
    const crossfade = options.crossfade !== false
    browseOffset = 0
    chooserOpen = false
    if (activeSound?.id === sound.id) {
      activeQueue = nextQueue
      activeQueueLabel = nextQueueLabel
      activeQueueIndex = nextIndex
      parked = false
      setBrowsing(false)
      void tryPlay(activeDeck().audio)
      updateMetadata(activeSound)
      renderCandidates()
      return
    }

    cancelVolumeAnimations()
    const outgoing = activeDeck()
    const incoming = standbyDeck()
    const generation = ++transitionGeneration
    const previousParked = parked
    switching = true
    prepareDeck(incoming, sound, 0)
    setPlayerState()
    const started = await tryPlay(incoming.audio)
    if (generation !== transitionGeneration) return
    if (!started) {
      stopDeck(incoming)
      parked = previousParked
      switching = false
      rampVolume(outgoing.audio, 1, 150)
      setTonearmVisual(previousParked ? 1 : 0)
      setPlayerState()
      announcer.textContent = `Could not play ${sound.title}. ${activeSound.title} remains selected.`
      return
    }

    activeSound = sound
    activeQueue = nextQueue
    activeQueueLabel = nextQueueLabel
    activeQueueIndex = nextIndex
    activeDeckIndex = decks.indexOf(incoming)
    parked = false
    setDeckActivity()
    updateMetadata(sound)
    renderCandidates()

    if (crossfade && outgoing.sound) {
      const completed = await animateCrossfade(outgoing, incoming, 700, generation)
      if (!completed) return
    } else {
      incoming.audio.volume = 1
    }

    if (generation !== transitionGeneration) return
    void trackDeck(outgoing)
    stopDeck(outgoing)
    player.dataset.soundId = String(sound.id)
    switching = false
    setPlayerState()
    announcer.textContent = `Now playing ${sound.title}`
  }

  function open(sound, queue = [sound], queueLabel = 'Selected') {
    player.hidden = false
    player.dataset.playerActive = 'true'
    if (!activeSound) {
      activeQueue = uniquePlayableQueue(queue, sound)
      activeQueueLabel = queueLabel
      activeQueueIndex = Math.max(0, activeQueue.findIndex(item => item.id === sound.id))
      activeSound = sound
      parked = false
      player.dataset.soundId = String(sound.id)
      prepareDeck(activeDeck(), sound, 1)
      setDeckActivity()
      updateMetadata(sound)
      setTonearmVisual(0)
      setPlayerState()
      void tryPlay(activeDeck().audio).then(started => {
        if (started || activeSound?.id !== sound.id) return
        parked = true
        setTonearmVisual(1)
        setPlayerState()
        announcer.textContent = `Playback could not start for ${sound.title}. Place the needle to try again.`
      })
      return
    }
    if (activeSound.id === sound.id) {
      activeQueue = uniquePlayableQueue(queue, sound)
      activeQueueLabel = queueLabel
      activeQueueIndex = Math.max(0, activeQueue.findIndex(item => item.id === sound.id))
      parked = false
      updateMetadata(sound)
      setTonearmVisual(0)
      setPlayerState()
      void tryPlay(activeDeck().audio)
      return
    }
    void selectCandidate(sound, { queue, queueLabel })
  }

  function dismiss() {
    normalizeAfterInterruptedTransition()
    for (const deck of decks) {
      void trackDeck(deck)
      stopDeck(deck)
    }
    player.hidden = true
    if (dialog.open) dialog.close()
    player.removeAttribute('data-player-active')
    player.removeAttribute('data-sound-id')
    activeSound = null
    activeQueue = []
    activeQueueLabel = ''
    browseOffset = 0
    parked = false
    chooserOpen = false
    document.body.classList.remove('turntable-modal-open')
  }

  function expandFocused(showChooser = false) {
    if (!activeSound || dialog.open) return
    chooserOpen = showChooser
    renderCandidates()
    dialog.showModal()
    document.body.classList.add('turntable-modal-open')
    collapse.focus()
  }

  function collapseFocused() {
    if (!dialog.open) return
    document.body.classList.remove('turntable-modal-open')
    dialog.close()
  }

  function toggleParked() {
    if (!activeSound || switching) return
    parked = !parked
    setTonearmVisual(parked ? 1 : 0)
    if (parked) activeDeck().audio.pause()
    else {
      activeDeck().audio.volume = 1
      void tryPlay(activeDeck().audio)
    }
    setPlayerState()
    announcer.textContent = parked ? 'Playback paused. Needle parked.' : `Playback resumed. ${activeSound.title}`
  }

  function attachTonearmGesture(control) {
    let gesture = null

    control.addEventListener('pointerdown', event => {
      if (switching || !activeSound) return
      gesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startsParked: parked,
        mode: null,
        progress: parked ? 1 : 0,
      }
      control.setPointerCapture(event.pointerId)
    })

    control.addEventListener('pointermove', event => {
      if (!gesture || gesture.pointerId !== event.pointerId) return
      const deltaX = event.clientX - gesture.startX
      const deltaY = event.clientY - gesture.startY
      if (!gesture.mode && Math.hypot(deltaX, deltaY) >= 11) {
        gesture.mode = Math.abs(deltaY) > Math.abs(deltaX) * 1.15 ? 'browse' : 'park'
        if (gesture.mode === 'browse') {
          browseOffset = 0
          setBrowsing(true)
        }
      }
      if (gesture.mode === 'browse') {
        browseOffset = Math.round(-deltaY / 58)
        setTonearmVisual(0, browseOffset)
        updateBrowsePreview()
      } else if (gesture.mode === 'park') {
        const initial = gesture.startsParked ? 1 : 0
        gesture.progress = Math.max(0, Math.min(1, initial + (deltaX + deltaY * 0.16) / 78))
        setTonearmVisual(gesture.progress)
      }
    })

    const finishGesture = event => {
      if (!gesture || gesture.pointerId !== event.pointerId) return
      const completedGesture = gesture
      gesture = null
      if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId)
      if (completedGesture.mode === 'browse') {
        const selected = candidateAt(browseOffset)
        const changed = browseOffset !== 0 && selected?.id !== activeSound?.id
        const initialParked = completedGesture.startsParked
        if (changed) {
          browsing = false
          compactPreview.textContent = ''
          void selectCandidate(selected)
        } else {
          browseOffset = 0
          parked = initialParked
          setBrowsing(false)
          setTonearmVisual(parked ? 1 : 0)
        }
      } else if (completedGesture.mode === 'park') {
        parked = completedGesture.progress >= 0.52
        setTonearmVisual(parked ? 1 : 0)
        if (parked) activeDeck().audio.pause()
        else {
          activeDeck().audio.volume = 1
          void tryPlay(activeDeck().audio)
        }
        setPlayerState()
      } else {
        toggleParked()
      }
    }

    const cancelGesture = event => {
      if (!gesture || gesture.pointerId !== event.pointerId) return
      const cancelledGesture = gesture
      gesture = null
      if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId)
      browseOffset = 0
      parked = cancelledGesture.startsParked
      if (browsing) setBrowsing(false)
      else setPlayerState()
      setTonearmVisual(parked ? 1 : 0)
    }

    control.addEventListener('pointerup', finishGesture)
    control.addEventListener('pointercancel', cancelGesture)
    control.addEventListener('click', event => {
      if (event.detail === 0) toggleParked()
    })
    control.addEventListener('keydown', event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      event.preventDefault()
      const offset = event.key === 'ArrowUp' ? -1 : 1
      const candidate = candidateAt(offset)
      if (candidate?.id !== activeSound?.id) void selectCandidate(candidate)
    })
  }

  for (const deck of decks) {
    deck.audio.addEventListener('ended', () => {
      if (deck !== activeDeck() || !deck.sound) return
      void trackDeck(deck)
      deck.listenGeneration += 1
      deck.audio.currentTime = 0
      void tryPlay(deck.audio)
    })
  }

  attachTonearmGesture(compactTonearm)
  attachTonearmGesture(focusedTonearm)
  expand.addEventListener('click', () => expandFocused())
  choose.addEventListener('click', () => expandFocused(true))
  focusedChoose.addEventListener('click', () => {
    chooserOpen = !chooserOpen
    renderCandidates()
  })
  collapse.addEventListener('click', collapseFocused)
  dialog.addEventListener('cancel', event => {
    event.preventDefault()
    collapseFocused()
  })
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled])')]
      .filter(element => !element.hidden && element.getClientRects().length > 0)
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  })
  dialog.addEventListener('close', () => {
    chooserOpen = false
    browseOffset = 0
    if (browsing) {
      browsing = false
      rampVolume(activeDeck().audio, 1, 150)
      setTonearmVisual(parked ? 1 : 0)
      setPlayerState()
    }
    candidates.hidden = true
    document.body.classList.remove('turntable-modal-open')
    if (!player.hidden) expand.focus()
  })
  close.addEventListener('click', dismiss)
  window.addEventListener('pagehide', () => {
    for (const deck of decks) void trackDeck(deck)
  })
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
