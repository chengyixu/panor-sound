import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import process from 'node:process'

import { chromium } from 'playwright'

import { rankingsFixture, soundscapesFixture } from '../fixtures/live-api.mjs'

const port = 4176
const baseUrl = `http://127.0.0.1:${port}`

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  throw new Error('short-landscape test server did not start')
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
  const page = await browser.newPage({ viewport: { width: 782, height: 472 } })

  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value() { return Promise.resolve() },
    })
  })

  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/soundscape/api/soundscapes') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(soundscapesFixture) })
      return
    }
    if (url.pathname === '/soundscape/api/rankings') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rankingsFixture) })
      return
    }
    if (url.pathname.startsWith('/soundscape/uploads/audio/')) {
      await route.fulfill({ status: 200, contentType: 'audio/mp4', body: '' })
      return
    }
    await route.continue()
  })

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.locator('.sound-card').first().click()
  await page.locator('#live-player-expand').click()
  await page.locator('#turntable-dialog').waitFor({ state: 'visible' })

  const geometry = await page.evaluate(() => {
    const rectangle = selector => document.querySelector(selector).getBoundingClientRect()
    const body = rectangle('.focused-turntable-body')
    const stage = rectangle('.focused-turntable-stage')
    const copy = rectangle('.focused-player-copy')
    const record = rectangle('.vinyl-record-focused')
    const tonearm = rectangle('#focused-player-tonearm')
    const overlap = (first, second) => Math.max(
      0,
      Math.min(first.right, second.right) - Math.max(first.left, second.left),
    ) * Math.max(
      0,
      Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top),
    )
    return {
      columns: getComputedStyle(document.querySelector('.focused-turntable-body')).gridTemplateColumns,
      copyAlignment: getComputedStyle(document.querySelector('.focused-player-copy')).alignContent,
      body,
      stage,
      copy,
      recordCopyOverlap: overlap(record, copy),
      tonearmCopyOverlap: overlap(tonearm, copy),
    }
  })

  assert.equal(geometry.columns.split(' ').length, 2, JSON.stringify(geometry))
  assert.equal(geometry.copyAlignment, 'center', JSON.stringify(geometry))
  assert.ok(geometry.stage.right <= geometry.copy.left, JSON.stringify(geometry))
  assert.equal(geometry.recordCopyOverlap, 0, JSON.stringify(geometry))
  assert.equal(geometry.tonearmCopyOverlap, 0, JSON.stringify(geometry))
  assert.ok(geometry.copy.height <= geometry.body.height, JSON.stringify(geometry))
  console.log('PASS focused turntable short-landscape contract')
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
