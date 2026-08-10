import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import process from 'node:process'

import { chromium } from 'playwright'

import { rankingsFixture, soundscapesFixture } from '../fixtures/live-api.mjs'

const port = 4173
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
  throw new Error('local test server did not start')
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
  const apiRequests = []
  const playRequests = []
  let resolvePlayRequest
  const playRequestSeen = new Promise(resolve => {
    resolvePlayRequest = resolve
  })

  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.hostname === 'quge5.com' || url.pathname === '/public/cross-promo.js') {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
      return
    }
    if (url.pathname === '/soundscape/api/soundscapes') {
      apiRequests.push(url.pathname)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(soundscapesFixture) })
      return
    }
    if (url.pathname === '/soundscape/api/rankings') {
      apiRequests.push(url.pathname)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rankingsFixture) })
      return
    }
    if (url.pathname === '/soundscape/api/soundscapes/103/play') {
      playRequests.push(JSON.parse(route.request().postData() || '{}'))
      resolvePlayRequest()
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
    await route.continue()
  })

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.sound-card')
  await page.locator('.leaflet-interactive').first().waitFor({ state: 'attached' })

  assert.deepEqual(apiRequests.sort(), ['/soundscape/api/rankings', '/soundscape/api/soundscapes'])
  assert.equal(await page.locator('.sound-card').count(), 6)
  assert.equal(await page.locator('.leaflet-interactive').count(), 3)
  const markerBoxes = await page.locator('.leaflet-interactive').evaluateAll(markers => markers.map(marker => {
    const box = marker.getBoundingClientRect()
    return { width: box.width, height: box.height, path: marker.getAttribute('d') }
  }))
  assert.ok(markerBoxes.every(box => box.width > 0 && box.height > 0 && box.path !== 'M0 0'))
  assert.equal(await page.locator('.sound-card').first().evaluate(element => element.tagName), 'BUTTON')
  assert.equal(await page.locator('.sound-card').first().getAttribute('type'), 'button')

  const bodyText = await page.locator('body').innerText()
  assert.match(bodyText, /Harbour Rain/)
  assert.match(bodyText, /Market Closing Bell/)
  assert.doesNotMatch(bodyText, /KFC TEST|Mong Kok Footbridge|Coming Soon|TBA/)

  await page.locator('.sound-card').first().click()
  await page.waitForSelector('#live-player:not([hidden])')
  assert.equal(await page.locator('#live-player-title').innerText(), 'Harbour Rain')
  assert.match(await page.locator('#live-player-audio').getAttribute('src'), /harbour-rain\.m4a$/)

  await page.locator('#live-player-audio').evaluate(audio => {
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 12 })
  })
  await page.locator('#live-player-close').click()
  await page.locator('#live-player').waitFor({ state: 'hidden', timeout: 750 })
  await playRequestSeen
  assert.equal(await page.locator('#live-player').getAttribute('hidden'), '')
  assert.deepEqual(playRequests, [{ listened_sec: 12 }])

  const failurePage = await browser.newPage()
  await failurePage.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.hostname === 'quge5.com' || url.pathname === '/public/cross-promo.js') {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
      return
    }
    if (url.pathname.startsWith('/soundscape/api/')) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"unavailable"}' })
      return
    }
    await route.continue()
  })
  await failurePage.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await failurePage.waitForSelector('.error-state')
  assert.match(await failurePage.locator('.error-state').innerText(), /live archive is unavailable/i)

  console.log('PASS live page browser contract')
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
