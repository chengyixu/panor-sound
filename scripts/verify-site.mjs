import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(import.meta.dirname, '..')
const requiredFiles = [
  'index.html',
  'site.config.js',
  'assets/main.js',
  'assets/styles.css',
  'deploy/nginx-site.conf.template',
  'deploy/render-nginx-config.mjs',
  'deploy/publish-static.sh',
  'deploy/update-panor-registry.mjs',
  'panor/product.json',
  'AGENTS.md',
  'README.md',
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
  const target = path.join(root, relativePath)
  if (fs.existsSync(target)) pass(`required file: ${relativePath}`)
  else fail(`missing required file: ${relativePath}`)
}

const configPath = path.join(root, 'site.config.js')
const config = fs.readFileSync(configPath, 'utf8')
if (/basePath:\s*['"]\/sound\/['"]/.test(config)) pass('production base path is /sound/')
else fail('site.config.js must set site.basePath to /sound/')

if (/publish:\s*\{\s*ready:\s*(true|false)/s.test(config)) pass('publish readiness is explicit')
else fail('site.config.js must declare publish.ready')

const filesToInspect = ['index.html', 'site.config.js', 'assets/main.js', 'assets/styles.css', 'deploy/nginx-site.conf.template']
for (const relativePath of filesToInspect) {
  const content = fs.readFileSync(path.join(root, relativePath), 'utf8')
  if (content.includes('/soundscape/')) fail(`${relativePath} still references legacy /soundscape/`)
}

const renderer = read('assets/main.js')
if (renderer.includes('textContent')) pass('renderer uses textContent for configured copy')
else fail('renderer must use textContent for configured copy')

const nginxTemplate = read('deploy/nginx-site.conf.template')
if (nginxTemplate.includes('{{SITE_BASE_PATH}}') && nginxTemplate.includes('{{SITE_WEB_PARENT}}')) pass('Nginx template uses deployment placeholders')
else fail('Nginx template is missing deployment placeholders')

if (process.argv.includes('--production')) {
  const html = read('index.html')
  const manifest = JSON.parse(read('panor/product.json'))
  if (/ready:\s*true/.test(config)) pass('publish readiness enabled')
  else fail('production verification requires publish.ready: true')
  if (/Replace with|placeholder|Draft marketing site|_Required_/i.test(`${config}\n${JSON.stringify(manifest)}`)) fail('production configuration still has placeholders')
  else pass('production configuration has no scaffold placeholders')

  if (manifest.slug === 'sound' && manifest.path === '/sound/' && manifest.url === 'https://www.panor.tech/sound/') pass('Panor manifest uses the canonical /sound/ route')
  else fail('Panor manifest must use the canonical /sound/ route')
  if (['services', 'projects'].includes(manifest.homepageCollection)) pass('Panor homepage collection is explicit')
  else fail('Panor homepage collection must be services or projects')
  if (typeof manifest.description === 'string' && manifest.description.length >= 80 && manifest.description.length <= 180) pass('Panor product description has a useful length')
  else fail('Panor product description must be 80-180 characters')
  if (typeof manifest.crossPromoDescription === 'string' && manifest.crossPromoDescription.length >= 20 && manifest.crossPromoDescription.length <= 100) pass('Panor cross-promotion description is concise')
  else fail('Panor cross-promotion description must be 20-100 characters')

  requirePattern(html, /<title>[^<]*(Panor|Panoramic Intelligence)[^<]*<\/title>/i, 'title identifies Panor')
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

  requirePattern(html, /<script\s+src=["']https:\/\/quge5\.com\/88\/tag\.min\.js["']\s+data-zone=["']264769["']\s+async\s+data-cfasync=["']false["']><\/script>/i, 'approved Monetag MultiTag is installed')
  requirePattern(html, /<script\s+src=["']\/public\/cross-promo\.js["']\s+defer><\/script>/i, 'Panor cross-promotion script is installed')
  if (/adsbygoogle|pagead2\.googlesyndication\.com|ca-pub-/i.test(html)) fail('AdSense is forbidden by the Monetag-only decision')
  else pass('AdSense markers are absent')

  if (/add_header/i.test(nginxTemplate)) fail('route-level add_header would suppress inherited Panor security headers')
  else pass('Nginx route inherits the Panor security policy')
}

if (failures.length) process.exitCode = 1
