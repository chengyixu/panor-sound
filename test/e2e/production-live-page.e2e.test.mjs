import assert from 'node:assert/strict'
import fs from 'node:fs'
import process from 'node:process'
import vm from 'node:vm'

import { chromium } from 'playwright'

import { buildLiveModel } from '../../assets/domain/soundscape.js'

const siteUrl = process.argv[2] || 'https://www.panor.tech/sound/'
const configSource = fs.readFileSync(new URL('../../site.config.js', import.meta.url), 'utf8')
const sandbox = { window: {} }
vm.runInNewContext(configSource, sandbox)
const config = sandbox.window.SOUND_SITE_CONFIG

const launchOptions = process.platform === 'darwin'
  ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
  : {}
const browser = await chromium.launch({ headless: true, ...launchOptions })

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const apiPayloads = new Map()
  let resolveTileLoaded
  const tileLoaded = new Promise(resolve => {
    resolveTileLoaded = resolve
  })

  page.on('response', async response => {
    const url = new URL(response.url())
    if (url.pathname === '/soundscape/api/soundscapes' || url.pathname === '/soundscape/api/rankings') {
      apiPayloads.set(url.pathname, await response.json())
    }
    if (url.hostname.endsWith('basemaps.cartocdn.com') && response.status() === 200) resolveTileLoaded()
  })

  await page.goto(`${siteUrl}?live-proof=${Date.now()}`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.sound-card')
  await page.waitForFunction(() => [...document.querySelectorAll('.leaflet-interactive')]
    .every(marker => marker.getAttribute('d') !== 'M0 0'))

  const soundscapes = apiPayloads.get('/soundscape/api/soundscapes')
  const rankings = apiPayloads.get('/soundscape/api/rankings')
  assert.ok(soundscapes, 'production page did not request the live soundscapes API')
  assert.ok(rankings, 'production page did not request the live rankings API')

  const model = buildLiveModel(soundscapes, rankings, config.data)
  const expectedTitles = [...model.featured, ...model.popular].map(item => item.title)
  const renderedTitles = await page.locator('.sound-card-title').allInnerTexts()
  assert.deepEqual(renderedTitles, expectedTitles)
  assert.equal(await page.locator('.leaflet-interactive').count(), model.mapItems.length)
  await Promise.race([
    tileLoaded,
    new Promise((_, reject) => setTimeout(() => reject(new Error('production map did not load a real tile')), 15000)),
  ])

  const bodyText = await page.locator('body').innerText()
  assert.doesNotMatch(bodyText, /(?:^|\s)(?:test|demo|sample|placeholder|tba)(?:\s|$)/i)
  const recordingStat = page.locator('.archive-stat').first()
  const expectedRecordingCount = await page.evaluate(value => new Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value), model.stats.recordings)
  assert.equal(await recordingStat.locator('strong').innerText(), expectedRecordingCount)
  assert.equal(await recordingStat.locator('span').innerText(), 'published recordings')

  await page.locator('.sound-card').first().click()
  await page.waitForSelector('#live-player:not([hidden])')
  assert.equal(await page.locator('#live-player-title').innerText(), model.featured[0].title)
  assert.equal(new URL(await page.locator('#live-player-audio').getAttribute('src'), siteUrl).pathname, model.featured[0].audioUrl)

  console.log('PASS production live-data browser proof')
} finally {
  await browser.close()
}
