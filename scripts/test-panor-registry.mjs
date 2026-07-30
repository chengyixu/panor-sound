import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const repoRoot = path.resolve(import.meta.dirname, '..')
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'panor-registry-'))
fs.mkdirSync(path.join(fixtureRoot, 'server'), { recursive: true })
fs.mkdirSync(path.join(fixtureRoot, 'public'), { recursive: true })

fs.writeFileSync(path.join(fixtureRoot, 'server/data.json'), JSON.stringify({ services: [], projects: [] }, null, 2))
fs.writeFileSync(path.join(fixtureRoot, 'public/cross-promo.js'), "var SERVICES = [\n    { path: '/existing/', name: 'Existing', desc: 'Existing product', tag: 'Tool' },\n];\n")
fs.writeFileSync(path.join(fixtureRoot, 'sitemap.xml'), '<?xml version="1.0"?><urlset>\n</urlset>\n')
fs.writeFileSync(path.join(fixtureRoot, 'llms.txt'), '# Panor\n\n## Lifestyle, Travel & Creative\n\n- [Existing](https://www.panor.tech/existing/): Existing product.\n\n## API\n')
fs.writeFileSync(path.join(fixtureRoot, 'index.html'), `<!doctype html>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"ItemList","itemListElement":[{"@type":"ListItem","position":1,"name":"Existing","url":"https://www.panor.tech/existing/"}]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What products does Panor offer?","acceptedAnswer":{"@type":"Answer","text":"Panor offers 1 registered products: <a href=\\"/existing/\\">Existing</a>."}}]}
</script>
<div class="product-category">
  <h4>Lifestyle, Travel &amp; Creative</h4>
  <ul><li><a href="/existing/">Existing</a></li></ul>
</div>
<article class="faq-item">
  <h3>What products does Panor offer?</h3>
  <p>Panor offers 1 registered products: <a href="/existing/">Existing</a>.</p>
</article>
`)

const updateArgs = [
  path.join(repoRoot, 'deploy/update-panor-registry.mjs'),
  '--root', fixtureRoot,
  '--manifest', path.join(repoRoot, 'panor/product.json'),
  '--date', '2026-07-30',
  '--apply',
]
execFileSync(process.execPath, updateArgs, { stdio: 'inherit' })
execFileSync(process.execPath, updateArgs, { stdio: 'inherit' })

const data = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'server/data.json'), 'utf8'))
assert.equal(data.services.filter(entry => entry.link === '/sound/').length, 1)

const homepage = fs.readFileSync(path.join(fixtureRoot, 'index.html'), 'utf8')
assert.equal((homepage.match(/https:\/\/www\.panor\.tech\/sound\//g) || []).length, 1)
assert.equal((homepage.match(/href="\/sound\//g) || []).length, 2)
assert.match(homepage, /Panor offers 2 registered products:/)

const crossPromo = fs.readFileSync(path.join(fixtureRoot, 'public/cross-promo.js'), 'utf8')
assert.equal((crossPromo.match(/path: '\/sound\/'/g) || []).length, 1)

const sitemap = fs.readFileSync(path.join(fixtureRoot, 'sitemap.xml'), 'utf8')
assert.equal((sitemap.match(/https:\/\/www\.panor\.tech\/sound\//g) || []).length, 1)
assert.match(sitemap, /<lastmod>2026-07-30<\/lastmod>/)

const llms = fs.readFileSync(path.join(fixtureRoot, 'llms.txt'), 'utf8')
assert.equal((llms.match(/https:\/\/www\.panor\.tech\/sound\//g) || []).length, 1)

console.log('PASS Panor registry updater is deterministic and idempotent')
