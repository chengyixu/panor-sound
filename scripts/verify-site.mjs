import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(import.meta.dirname, '..')
const requiredFiles = [
  'index.html',
  'site.config.js',
  'package.json',
  'package-lock.json',
  'assets/main.js',
  'assets/application/bootstrap.js',
  'assets/domain/soundscape.js',
  'assets/infrastructure/soundscape-api.js',
  'assets/ui/live-page.js',
  'assets/styles.css',
  'assets/vendor/leaflet/leaflet.js',
  'assets/vendor/leaflet/leaflet.css',
  'assets/vendor/leaflet/LICENSE',
  'scripts/repo-guards.sh',
  'deploy/nginx-site.conf.template',
  'deploy/render-nginx-config.mjs',
  'deploy/publish-static.sh',
  'deploy/update-panor-registry.mjs',
  'panor/product.json',
  'AGENTS.md',
  'README.md',
  'CONTEXT.md',
  'HOW-IT-WORKS.md',
  'DESIGN.md',
  'docs/adr/0001-live-backend-contract.md',
  'docs/adr/0002-two-deck-turntable-player.md',
  'bug-regression-catalog/catalog.yaml',
  '.sectormap.json',
]
const failures = []
const pass = message => console.log(`PASS ${message}`)
const fail = message => {
  failures.push(message)
  console.error(`FAIL ${message}`)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function requirePattern(content, pattern, message) {
  if (pattern.test(content)) pass(message)
  else fail(message)
}

for (const relativePath of requiredFiles) {
  if (fs.existsSync(path.join(root, relativePath))) pass(`required file: ${relativePath}`)
  else fail(`missing required file: ${relativePath}`)
}

const html = read('index.html')
const config = read('site.config.js')
const main = read('assets/main.js')
const bootstrap = read('assets/application/bootstrap.js')
const domain = read('assets/domain/soundscape.js')
const api = read('assets/infrastructure/soundscape-api.js')
const ui = read('assets/ui/live-page.js')
const nginxTemplate = read('deploy/nginx-site.conf.template')

requirePattern(config, /basePath:\s*['"]\/sound\/['"]/, 'production base path is /sound/')
requirePattern(config, /publish:\s*\{\s*ready:\s*(true|false)/s, 'publish readiness is explicit')
requirePattern(config, /soundscapesEndpoint:\s*['"]\/soundscape\/api\/soundscapes\?scope=explore['"]/, 'live soundscapes endpoint is canonical')
requirePattern(config, /rankingsEndpoint:\s*['"]\/soundscape\/api\/rankings['"]/, 'live rankings endpoint is canonical')
requirePattern(config, /href:\s*['"]https:\/\/www\.panor\.tech\/soundscape\/['"]/, 'CTA hands off to the existing Soundscape app')
requirePattern(main, /import ['"]\.\/application\/bootstrap\.js\?v=__PANOR_SOUND_RELEASE_SHA__['"]/, 'entry point delegates through a release-versioned application module')
requirePattern(bootstrap, /Promise|api\.load\(\)/, 'application layer loads live data')
requirePattern(api, /method:\s*['"]POST['"][\s\S]*listened_sec/, 'anonymous play telemetry uses the backend contract')
requirePattern(ui, /textContent/, 'renderer uses textContent for configured and backend copy')
requirePattern(ui, /L\.circleMarker|window\.L\.circleMarker/, 'renderer creates real map markers')
requirePattern(domain, /NON_PRODUCTION_TITLE/, 'domain rejects explicit test and demo records')
requirePattern(html, /\.\/assets\/styles\.css\?v=__PANOR_SOUND_RELEASE_SHA__/, 'stylesheet uses the deployment release token')
requirePattern(html, /\.\/site\.config\.js\?v=__PANOR_SOUND_RELEASE_SHA__/, 'configuration uses the deployment release token')
requirePattern(html, /\.\/assets\/main\.js\?v=__PANOR_SOUND_RELEASE_SHA__/, 'entry script uses the deployment release token')
requirePattern(bootstrap, /\.\.\/domain\/soundscape\.js\?v=__PANOR_SOUND_RELEASE_SHA__/, 'application domain import uses the deployment release token')
requirePattern(bootstrap, /\.\.\/infrastructure\/soundscape-api\.js\?v=__PANOR_SOUND_RELEASE_SHA__/, 'application infrastructure import uses the deployment release token')
requirePattern(bootstrap, /\.\.\/ui\/live-page\.js\?v=__PANOR_SOUND_RELEASE_SHA__/, 'application UI import uses the deployment release token')
requirePattern(api, /\.\.\/domain\/soundscape\.js\?v=__PANOR_SOUND_RELEASE_SHA__/, 'infrastructure domain import uses the deployment release token')

if (/\b(?:audio_url|play_count|save_count|created_at|author_name)\s*:/.test(config)) fail('site.config.js contains copied backend recording fields')
else pass('site.config.js contains no copied backend recording rows')

const configIndex = html.indexOf('./site.config.js')
const leafletIndex = html.indexOf('./assets/vendor/leaflet/leaflet.js')
const moduleIndex = html.indexOf('./assets/main.js')
if (configIndex >= 0 && leafletIndex > configIndex && moduleIndex > leafletIndex) pass('runtime scripts load in config → map → application order')
else fail('runtime scripts must load in config → map → application order')
requirePattern(html, /\.\/assets\/vendor\/leaflet\/leaflet\.css/, 'vendored map stylesheet is loaded')

if (nginxTemplate.includes('{{SITE_BASE_PATH}}') && nginxTemplate.includes('{{SITE_WEB_PARENT}}')) pass('Nginx template uses deployment variables')
else fail('Nginx template is missing deployment variables')

if (process.argv.includes('--production')) {
  const manifest = JSON.parse(read('panor/product.json'))
  if (/ready:\s*true/.test(config)) pass('publish readiness enabled')
  else fail('production verification requires publish.ready: true')
  if (/Replace with|Draft marketing site|_Required_/i.test(`${config}\n${JSON.stringify(manifest)}`)) fail('production configuration still has scaffold copy')
  else pass('production configuration has no scaffold copy')

  if (manifest.slug === 'sound' && manifest.path === '/sound/' && manifest.url === 'https://www.panor.tech/sound/') pass('Panor manifest uses the canonical /sound/ route')
  else fail('Panor manifest must use the canonical /sound/ route')
  if (['services', 'projects'].includes(manifest.homepageCollection)) pass('Panor homepage collection is explicit')
  else fail('Panor homepage collection must be services or projects')
  if (typeof manifest.description === 'string' && manifest.description.length >= 80 && manifest.description.length <= 180) pass('Panor product description has a useful length')
  else fail('Panor product description must be 80-180 characters')
  if (typeof manifest.crossPromoDescription === 'string' && manifest.crossPromoDescription.length >= 20 && manifest.crossPromoDescription.length <= 100) pass('Panor cross-promotion description is concise')
  else fail('Panor cross-promotion description must be 20-100 characters')

  requirePattern(html, /<title>[^<]*(Panor|Panoramic Intelligence|Soundscape)[^<]*<\/title>/i, 'title identifies Panor')
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] || ''
  if (description.length >= 140 && description.length <= 160) pass('meta description is 140-160 characters')
  else fail('meta description must be 140-160 characters')
  requirePattern(html, /<meta\s+name=["']robots["']\s+content=["']index, follow, max-image-preview:large, max-snippet:-1["']/i, 'robots metadata permits rich indexing')
  requirePattern(html, /<link\s+rel=["']canonical["']\s+href=["']https:\/\/www\.panor\.tech\/sound\/["']/i, 'canonical URL is correct')

  for (const property of ['og:title', 'og:description', 'og:image', 'og:url', 'og:site_name', 'og:locale']) {
    requirePattern(html, new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["'][^"']+["']`, 'i'), `${property} metadata exists`)
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    requirePattern(html, new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["'][^"']+["']`, 'i'), `${name} metadata exists`)
  }
  requirePattern(html, /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"(SoftwareApplication|VideoGame)"[\s\S]*?<\/script>/i, 'product JSON-LD exists')
  requirePattern(html, /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"BreadcrumbList"[\s\S]*?<\/script>/i, 'breadcrumb JSON-LD exists')
  requirePattern(html, /"@type"\s*:\s*"Organization"|"@id"\s*:\s*"https:\/\/www\.panor\.tech\/#organization"/i, 'organization structured-data reference exists')

  const noscript = html.match(/<noscript[^>]*>([\s\S]*?)<\/noscript>/i)?.[1] || ''
  const noscriptWords = noscript.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  if (noscriptWords >= 150 && noscriptWords <= 300) pass('noscript fallback contains 150-300 words')
  else fail('noscript fallback must contain 150-300 words')

  requirePattern(html, /<script\s+src=["']\/public\/cross-promo\.js["']\s+defer><\/script>/i, 'Panor cross-promotion script is installed')
  if (/adsbygoogle|pagead2\.googlesyndication\.com|ca-pub-/i.test(html)) fail('AdSense markers are absent')
  else pass('AdSense markers are absent')

  if (/add_header/i.test(nginxTemplate)) fail('route-level add_header would suppress inherited Panor security headers')
  else pass('Nginx route inherits the Panor security policy')
}

if (failures.length) process.exitCode = 1
