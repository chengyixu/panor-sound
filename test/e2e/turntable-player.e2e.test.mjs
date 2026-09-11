import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import process from 'node:process'

import { chromium } from 'playwright'

import { rankingsFixture, soundscapesFixture } from '../fixtures/live-api.mjs'

const port = 4175
const baseUrl = `http://127.0.0.1:${port}`
const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+4xM2WQAAAABJRU5ErkJggg==', 'base64')

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  throw new Error('local turntable test server did not start')
}

const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  cwd: new URL('../../', import.meta.url),
  stdio: 'ignore',
})

let browser
try {
  await waitForServer()
  const launchOptions = process.platform === 'darwin'
    ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
    : {}
  browser = await chromium.launch({ headless: true, ...launchOptions })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const playRequests = []

  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value() {
        this.dataset.playState = 'playing'
        this.dataset.playCalls = String(Number(this.dataset.playCalls || 0) + 1)
        return Promise.resolve()
      },
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value() {
        this.dataset.playState = 'paused'
      },
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      configurable: true,
      value() {},
    })
  })

  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/public/cross-promo.js') {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
      return
    }
    if (url.pathname === '/soundscape/api/soundscapes') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(soundscapesFixture) })
      return
    }
    if (url.pathname === '/soundscape/api/rankings') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rankingsFixture) })
      return
    }
    const playMatch = url.pathname.match(/^\/soundscape\/api\/soundscapes\/(\d+)\/play$/)
    if (playMatch) {
      playRequests.push({ id: Number(playMatch[1]), ...JSON.parse(route.request().postData() || '{}') })
      await new Promise(resolve => setTimeout(resolve, 1500))
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
      return
    }
    if (url.hostname.endsWith('basemaps.cartocdn.com')) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: transparentPng })
      return
    }
    if (url.pathname.startsWith('/soundscape/uploads/audio/')) {
      await route.fulfill({ status: 200, contentType: 'audio/mp4', body: '' })
      return
    }
    if (url.pathname.startsWith('/soundscape/uploads/covers/')) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: transparentPng })
      return
    }
    await route.continue()
  })

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.sound-card')
  await page.locator('.sound-card').first().click()
  const player = page.locator('#live-player')
  const activeAudio = page.locator('.audio-player-deck[data-active="true"]')
  await player.waitFor({ state: 'visible' })

  assert.equal(await player.getAttribute('data-sound-id'), '103')
  assert.equal(await page.locator('#live-player-title').innerText(), 'Harbour Rain')
  assert.equal(await page.locator('#live-player-source').textContent(), 'Latest queue')
  assert.equal(await player.evaluate(element => getComputedStyle(element).position), 'fixed')
  assert.equal(await page.locator('#live-player-expand').getAttribute('aria-haspopup'), 'dialog')
  assert.equal(await page.locator('#live-player-expand').evaluate(element => element.tagName), 'BUTTON')
  assert.equal(await page.locator('#live-player-expand').evaluate(element => getComputedStyle(element.querySelector('.vinyl-record')).animationName), 'vinyl-spin')
  assert.equal(await activeAudio.getAttribute('data-play-state'), 'playing')

  const compactTonearmBox = await page.locator('#live-player-tonearm').boundingBox()
  assert.ok(compactTonearmBox.width >= 44 && compactTonearmBox.height >= 44)
  assert.equal(await page.locator('#live-player-tonearm').evaluate(element => getComputedStyle(element).touchAction), 'none')

  await page.locator('#live-player-expand').click()
  const dialog = page.locator('#turntable-dialog')
  await dialog.waitFor({ state: 'visible' })
  assert.equal(await dialog.evaluate(element => element.open && element.matches(':modal')), true)
  assert.equal(await page.locator('body').evaluate(element => getComputedStyle(element).overflow), 'hidden')
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'focused-player-collapse')
  assert.equal(await page.locator('#focused-player-title').innerText(), 'Harbour Rain')
  assert.equal(await page.locator('#focused-player-creator').innerText(), 'Ada')
  assert.equal(await page.locator('#focused-player-source').textContent(), 'Latest queue')
  const focusedGeometry = await page.evaluate(() => {
    const rectangle = selector => document.querySelector(selector).getBoundingClientRect()
    const overlapArea = (first, second) => {
      const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
      const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
      return Math.round(width * height)
    }
    const record = rectangle('.vinyl-record-focused')
    const tonearm = rectangle('#focused-player-tonearm')
    const copy = rectangle('.focused-player-copy')
    return {
      noHorizontalOverflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
      recordCopyOverlap: overlapArea(record, copy),
      tonearmCopyOverlap: overlapArea(tonearm, copy),
      connectedTonearm: Boolean(document.querySelector('#focused-player-tonearm .tonearm-pivot > .tonearm-moving .tonearm-arm > .tonearm-head > .tonearm-needle')),
    }
  })
  assert.equal(focusedGeometry.noHorizontalOverflow, true)
  assert.equal(focusedGeometry.recordCopyOverlap, 0)
  assert.equal(focusedGeometry.tonearmCopyOverlap, 0)
  assert.equal(focusedGeometry.connectedTonearm, true)
  await page.keyboard.press('Shift+Tab')
  assert.equal(await page.evaluate(() => document.activeElement?.closest('#turntable-dialog')?.id), 'turntable-dialog')

  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('#turntable-dialog').open)
  assert.equal(await player.isVisible(), true)
  assert.equal(await activeAudio.getAttribute('data-play-state'), 'playing')
  assert.notEqual(await page.locator('body').evaluate(element => getComputedStyle(element).overflow), 'hidden')

  await activeAudio.evaluate(audio => {
    Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 18 })
  })
  await page.locator('#live-player-tonearm').click()
  assert.equal(await player.getAttribute('data-parked'), 'true')
  assert.equal(await activeAudio.getAttribute('data-play-state'), 'paused')
  assert.equal(await activeAudio.evaluate(audio => audio.currentTime), 18)
  assert.equal(await page.locator('.compact-vinyl-button .vinyl-record').evaluate(element => getComputedStyle(element).animationPlayState), 'paused')
  await page.locator('#live-player-tonearm').click()
  assert.equal(await player.getAttribute('data-parked'), 'false')
  assert.equal(await activeAudio.getAttribute('data-play-state'), 'playing')
  assert.equal(await activeAudio.evaluate(audio => audio.currentTime), 18)

  await page.locator('#live-player-tonearm').focus()
  await page.keyboard.press('Space')
  assert.equal(await player.getAttribute('data-parked'), 'true')
  await page.keyboard.press('Space')
  assert.equal(await player.getAttribute('data-parked'), 'false')

  await page.locator('#live-player-choose').click()
  await dialog.waitFor({ state: 'visible' })
  assert.equal(await page.locator('.turntable-candidate').count(), 5)
  const chooserTitles = await page.locator('.turntable-candidate .candidate-copy strong').allInnerTexts()
  assert.ok(chooserTitles.every(candidateTitle => ['Harbour Rain', 'Market Closing Bell', 'Station Platform Hum'].includes(candidateTitle)))
  const chooserGeometry = await page.evaluate(() => {
    const record = document.querySelector('.vinyl-record-focused').getBoundingClientRect()
    const tonearm = document.querySelector('#focused-player-tonearm').getBoundingClientRect()
    const candidates = [...document.querySelectorAll('.turntable-candidate')].map(element => ({
      offset: Number(element.dataset.rowOffset),
      rectangle: element.getBoundingClientRect(),
      transform: getComputedStyle(element).transform,
    }))
    const overlaps = (first, second) => (
      Math.min(first.right, second.right) > Math.max(first.left, second.left)
      && Math.min(first.bottom, second.bottom) > Math.max(first.top, second.top)
    )
    return {
      onRecord: candidates.every(candidate => candidate.rectangle.left >= record.left && candidate.rectangle.left <= record.right),
      clearOfTonearm: candidates.every(candidate => !overlaps(candidate.rectangle, tonearm)),
      curved: candidates[0].rectangle.left < candidates[1].rectangle.left
        && candidates[1].rectangle.left < candidates[2].rectangle.left
        && candidates[2].rectangle.left > candidates[3].rectangle.left
        && candidates[3].rectangle.left > candidates[4].rectangle.left,
      rotated: candidates.filter(candidate => candidate.offset !== 0).every(candidate => candidate.transform !== 'none'),
      record: record.toJSON(),
      tonearm: tonearm.toJSON(),
      candidates: candidates.map(candidate => ({ offset: candidate.offset, rectangle: candidate.rectangle.toJSON() })),
    }
  })
  const chooserGeometryMessage = JSON.stringify(chooserGeometry)
  assert.equal(chooserGeometry.onRecord, true, chooserGeometryMessage)
  assert.equal(chooserGeometry.clearOfTonearm, true, chooserGeometryMessage)
  assert.equal(chooserGeometry.curved, true, chooserGeometryMessage)
  assert.equal(chooserGeometry.rotated, true, chooserGeometryMessage)

  await activeAudio.evaluate(audio => {
    Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 9 })
  })
  await page.locator('.turntable-candidate[data-row-offset="1"]').click()
  await page.waitForFunction(() => document.querySelector('#live-player-title').textContent === 'Market Closing Bell')
  await page.waitForTimeout(180)
  const overlappingDecks = await page.locator('.audio-player-deck').evaluateAll(decks => decks.map(deck => ({
    active: deck.dataset.active,
    src: deck.getAttribute('src'),
    volume: deck.volume,
  })))
  assert.equal(overlappingDecks.filter(deck => deck.src).length, 2)
  assert.ok(overlappingDecks.every(deck => deck.src && deck.volume > 0 && deck.volume < 1))
  await page.waitForFunction(() => document.querySelector('#live-player').dataset.switching === 'false')
  assert.equal(await player.getAttribute('data-sound-id'), '102')
  assert.equal(await page.locator('.audio-player-deck[src]').count(), 1)
  assert.match(await page.locator('.audio-player-deck[data-active="true"]').getAttribute('src'), /market-bell\.m4a$/)
  assert.equal(await page.locator('#live-player-source').textContent(), 'Latest queue')

  await page.locator('#focused-player-collapse').click()
  await page.waitForFunction(() => !document.querySelector('#turntable-dialog').open)
  const compactTonearm = page.locator('#live-player-tonearm')
  const tonearmBox = await compactTonearm.boundingBox()
  await page.mouse.move(tonearmBox.x + tonearmBox.width / 2, tonearmBox.y + tonearmBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(tonearmBox.x + tonearmBox.width / 2, tonearmBox.y + tonearmBox.height / 2 - 48, { steps: 8 })
  await page.waitForFunction(() => document.querySelector('#live-player').dataset.browsing === 'true')
  assert.equal(await page.locator('#live-player-compact-preview').innerText(), 'Station Platform Hum')
  assert.equal(await dialog.isVisible(), false)
  await page.waitForTimeout(180)
  const duckedVolume = await page.locator('.audio-player-deck[data-active="true"]').evaluate(audio => audio.volume)
  assert.ok(duckedVolume >= 0.2 && duckedVolume <= 0.3)
  await page.mouse.up()
  await page.waitForFunction(() => document.querySelector('#live-player').dataset.soundId === '101')
  await page.waitForFunction(() => document.querySelector('#live-player').dataset.switching === 'false')
  assert.equal(await page.locator('#live-player-title').innerText(), 'Station Platform Hum')

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  assert.ok(await page.evaluate(() => window.scrollY > 0))
  const scrolledPlayerBox = await player.boundingBox()
  assert.ok(scrolledPlayerBox.y + scrolledPlayerBox.height <= 900)

  const loopingAudio = page.locator('.audio-player-deck[data-active="true"]')
  const playCallsBeforeLoop = Number(await loopingAudio.getAttribute('data-play-calls'))
  await loopingAudio.evaluate(audio => {
    Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 23 })
    audio.dispatchEvent(new Event('ended'))
  })
  await page.waitForFunction(previousCalls => Number(document.querySelector('.audio-player-deck[data-active="true"]').dataset.playCalls) > previousCalls, playCallsBeforeLoop)
  assert.equal(await player.getAttribute('data-sound-id'), '101')
  assert.equal(await loopingAudio.evaluate(audio => audio.currentTime), 0)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('.compact-vinyl-button .vinyl-record').evaluate(element => getComputedStyle(element).animationName), 'none')

  await loopingAudio.evaluate(audio => {
    Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 12 })
  })
  const closeStartedAt = Date.now()
  await page.locator('#live-player-close').click()
  await player.waitFor({ state: 'hidden', timeout: 750 })
  assert.ok(Date.now() - closeStartedAt < 750)
  assert.equal(await page.locator('.audio-player-deck[src]').count(), 0)
  await page.waitForTimeout(50)
  assert.ok(playRequests.some(request => request.id === 101 && request.listened_sec === 12))

  await page.locator('.sound-card').nth(3).click()
  await player.waitFor({ state: 'visible' })
  assert.equal(await page.locator('#live-player-source').textContent(), 'Popular queue')
  assert.equal(await player.getAttribute('data-sound-id'), '102')

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await mobilePage.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value() { return Promise.resolve() },
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value() {},
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      configurable: true,
      value() {},
    })
  })
  await mobilePage.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/public/cross-promo.js') {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
      return
    }
    if (url.pathname === '/soundscape/api/soundscapes') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(soundscapesFixture) })
      return
    }
    if (url.pathname === '/soundscape/api/rankings') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rankingsFixture) })
      return
    }
    if (url.hostname.endsWith('basemaps.cartocdn.com')) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: transparentPng })
      return
    }
    if (url.pathname.startsWith('/soundscape/uploads/')) {
      await route.fulfill({
        status: 200,
        contentType: url.pathname.includes('/audio/') ? 'audio/mp4' : 'image/png',
        body: url.pathname.includes('/audio/') ? '' : transparentPng,
      })
      return
    }
    if (url.pathname.endsWith('/play')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
      return
    }
    await route.continue()
  })
  await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForSelector('.sound-card')
  await mobilePage.locator('.sound-card').first().tap()
  await mobilePage.locator('#live-player:not([hidden])').waitFor()
  const compactMobileGeometry = await mobilePage.evaluate(() => {
    const playerRectangle = document.querySelector('#live-player').getBoundingClientRect()
    return {
      noHorizontalOverflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
      inViewport: playerRectangle.left >= 0
        && playerRectangle.right <= innerWidth
        && playerRectangle.bottom <= innerHeight,
    }
  })
  assert.equal(compactMobileGeometry.noHorizontalOverflow, true)
  assert.equal(compactMobileGeometry.inViewport, true)
  const mobileExpandBox = await mobilePage.locator('#live-player-expand').boundingBox()
  await mobilePage.touchscreen.tap(
    mobileExpandBox.x + mobileExpandBox.width / 2,
    mobileExpandBox.y + mobileExpandBox.height / 2,
  )
  await mobilePage.locator('#turntable-dialog[open]').waitFor()
  assert.equal(await mobilePage.locator('#focused-player-title').innerText(), 'Harbour Rain')
  assert.equal(await mobilePage.locator('#focused-player-creator').innerText(), 'Ada')
  assert.equal(await mobilePage.locator('#focused-player-choose').isVisible(), true)
  const mobileFocusedGeometry = await mobilePage.evaluate(() => {
    const rectangle = selector => document.querySelector(selector).getBoundingClientRect()
    const overlapArea = (first, second) => {
      const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
      const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
      return Math.round(width * height)
    }
    const tonearm = rectangle('#focused-player-tonearm')
    const copy = rectangle('.focused-player-copy')
    const record = rectangle('.vinyl-record-focused')
    return {
      noHorizontalOverflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
      tonearmCopyOverlap: overlapArea(tonearm, copy),
      recordCopyOverlap: overlapArea(record, copy),
    }
  })
  assert.equal(mobileFocusedGeometry.noHorizontalOverflow, true)
  assert.equal(mobileFocusedGeometry.tonearmCopyOverlap, 0)
  assert.equal(mobileFocusedGeometry.recordCopyOverlap, 0)
  await mobilePage.locator('#focused-player-choose').tap()
  const mobileChooserGeometry = await mobilePage.evaluate(() => {
    const record = document.querySelector('.vinyl-record-focused').getBoundingClientRect()
    const tonearm = document.querySelector('#focused-player-tonearm').getBoundingClientRect()
    const candidates = [...document.querySelectorAll('.turntable-candidate')].map(element => element.getBoundingClientRect())
    const overlaps = (first, second) => (
      Math.min(first.right, second.right) > Math.max(first.left, second.left)
      && Math.min(first.bottom, second.bottom) > Math.max(first.top, second.top)
    )
    return {
      inViewport: candidates.every(candidate => candidate.left >= 0 && candidate.right <= innerWidth && candidate.top >= 0 && candidate.bottom <= innerHeight),
      onRecord: candidates.every(candidate => candidate.left >= record.left && candidate.left <= record.right),
      clearOfTonearm: candidates.every(candidate => !overlaps(candidate, tonearm)),
    }
  })
  assert.equal(mobileChooserGeometry.inViewport, true)
  assert.equal(mobileChooserGeometry.onRecord, true)
  assert.equal(mobileChooserGeometry.clearOfTonearm, true)
  await mobilePage.close()

  console.log('PASS turntable player browser contract')
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
