import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const config = fs.readFileSync(new URL('../../site.config.js', import.meta.url), 'utf8')
const renderer = fs.readFileSync(new URL('../../assets/ui/live-page.js', import.meta.url), 'utf8')
const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const main = fs.readFileSync(new URL('../../assets/main.js', import.meta.url), 'utf8')
const bootstrap = fs.readFileSync(new URL('../../assets/application/bootstrap.js', import.meta.url), 'utf8')
const api = fs.readFileSync(new URL('../../assets/infrastructure/soundscape-api.js', import.meta.url), 'utf8')
const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const deployWorkflow = fs.readFileSync(new URL('../../.github/workflows/deploy-production.yml', import.meta.url), 'utf8')
const productionSmoke = fs.readFileSync(new URL('../../scripts/smoke-production.mjs', import.meta.url), 'utf8')
const productionProof = fs.readFileSync(new URL('../e2e/production-live-page.e2e.test.mjs', import.meta.url), 'utf8')
const sandbox = { window: {} }
vm.runInNewContext(config, sandbox)

function collectKeys(value, keys = []) {
  if (!value || typeof value !== 'object') return keys
  for (const [key, child] of Object.entries(value)) {
    keys.push(key)
    collectKeys(child, keys)
  }
  return keys
}

test('production configuration contains endpoints, not copied soundscape rows', () => {
  assert.match(config, /soundscapesEndpoint:\s*['"]\/soundscape\/api\/soundscapes/)
  assert.match(config, /rankingsEndpoint:\s*['"]\/soundscape\/api\/rankings/)
  assert.doesNotMatch(config, /KFC TEST|Mong Kok Footbridge|plays:\s*['"]\d+/)

  const forbiddenKeys = new Set([
    'audio_url', 'audioUrl', 'author_name', 'cover', 'cover_url', 'coverUrl',
    'created_at', 'creator', 'duration_sec', 'events', 'full_play_count', 'items',
    'lat', 'libraries', 'lng', 'location', 'location_name', 'people', 'play_count',
    'plays', 'recorded_at', 'rows', 'save_count', 'saves', 'story',
  ])
  const copiedKeys = collectKeys(sandbox.window.SOUND_SITE_CONFIG).filter(key => forbiddenKeys.has(key))
  assert.deepEqual(copiedKeys, [])
})

test('renderer has no fake map or future-event placeholders', () => {
  assert.doesNotMatch(renderer, /map-placeholder|Coming Soon|TBA|const locations =|const coverPool =/)
})

test('production proof is isolated from pre-merge tests', () => {
  assert.doesNotMatch(packageJson.scripts.test, /e2e|production-live-page/)
  assert.match(packageJson.scripts['test:e2e'], /live-page\.e2e\.test\.mjs/)
  assert.match(packageJson.scripts['test:production'], /production-live-page\.e2e\.test\.mjs/)
  const verifyRelease = deployWorkflow.match(/verify-release:[\s\S]*?\n  deploy:/)?.[0] || ''
  assert.match(verifyRelease, /npx playwright install --with-deps chromium[\s\S]*npm run test:e2e/)
  assert.match(deployWorkflow, /id: browser[\s\S]*npx playwright install --with-deps chromium[\s\S]*npm run test:production/)
  assert.match(deployWorkflow, /steps\.browser\.outcome == 'failure'/)
})

test('production totals are asserted through semantic stat elements', () => {
  assert.match(productionProof, /locator\('\.archive-stat'\)\.first\(\)/)
  assert.match(productionProof, /recordingStat\.locator\('strong'\)/)
  assert.match(productionProof, /recordingStat\.locator\('span'\)/)
  assert.doesNotMatch(productionProof, /model\.stats\.recordings} published recordings/)
})

test('production map proof waits for a successful tile response', () => {
  assert.match(productionProof, /response\.status\(\) === 200\) resolveTileLoaded\(\)/)
  assert.match(productionProof, /Promise\.race\(\[\s*tileLoaded,/)
  assert.doesNotMatch(productionProof, /tileResponses\.some/)
})

test('mutable browser assets are versioned with the packaged release SHA', () => {
  const token = '__PANOR_SOUND_RELEASE_SHA__'
  const expectedReferences = [
    [html, './assets/styles.css'],
    [html, './site.config.js'],
    [html, './assets/main.js'],
    [main, './application/bootstrap.js'],
    [bootstrap, '../domain/soundscape.js'],
    [bootstrap, '../infrastructure/soundscape-api.js'],
    [bootstrap, '../ui/live-page.js'],
    [api, '../domain/soundscape.js'],
  ]
  for (const [source, reference] of expectedReferences) {
    assert.ok(source.includes(`${reference}?v=${token}`), `missing release version on ${reference}`)
  }
  assert.match(deployWorkflow, /sed -i "s\/\$release_token\/\$GITHUB_SHA\/g"/)
  assert.match(productionSmoke, /missing release-versioned asset/)
  assert.match(productionSmoke, /missing release-versioned import/)
})
