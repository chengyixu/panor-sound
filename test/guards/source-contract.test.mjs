import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const config = fs.readFileSync(new URL('../../site.config.js', import.meta.url), 'utf8')
const renderer = fs.readFileSync(new URL('../../assets/ui/live-page.js', import.meta.url), 'utf8')
const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const deployWorkflow = fs.readFileSync(new URL('../../.github/workflows/deploy-production.yml', import.meta.url), 'utf8')
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
