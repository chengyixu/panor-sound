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
  'AGENTS.md',
  'README.md',
]
const failures = []
const pass = message => console.log(`PASS ${message}`)
const fail = message => {
  failures.push(message)
  console.error(`FAIL ${message}`)
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

const renderer = fs.readFileSync(path.join(root, 'assets/main.js'), 'utf8')
if (renderer.includes('textContent')) pass('renderer uses textContent for configured copy')
else fail('renderer must use textContent for configured copy')

const nginxTemplate = fs.readFileSync(path.join(root, 'deploy/nginx-site.conf.template'), 'utf8')
if (nginxTemplate.includes('{{SITE_BASE_PATH}}') && nginxTemplate.includes('{{SITE_WEB_PARENT}}')) pass('Nginx template uses deployment placeholders')
else fail('Nginx template is missing deployment placeholders')

if (process.argv.includes('--production')) {
  if (/ready:\s*true/.test(config)) pass('publish readiness enabled')
  else fail('production verification requires publish.ready: true')
  if (/Replace with|placeholder|Draft marketing site/i.test(config)) fail('production configuration still has placeholders')
  else pass('production configuration has no scaffold placeholders')
}

if (failures.length) process.exitCode = 1
