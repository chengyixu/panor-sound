import process from 'node:process'

const siteUrl = 'https://www.panor.tech/sound/'
const canonicalUrl = 'https://www.panor.tech/sound/'

async function request(url, options = {}) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'user-agent': 'panor-sound-cicd/1.0' },
    ...options,
  })
  return response
}

async function expectOk(url, label) {
  const response = await request(url)
  if (!response.ok) throw new Error(`${label} returned ${response.status}`)
  return response
}

async function main() {
  const releaseSha = process.argv[2] || ''
  if (!/^[0-9a-f]{40}$/.test(releaseSha)) throw new Error('production smoke requires the deployed commit SHA')
  const cacheBust = `deploy=${releaseSha}`
  const redirect = await request('https://www.panor.tech/sound', { redirect: 'manual' })
  if (![301, 308].includes(redirect.status) || new URL(redirect.headers.get('location'), siteUrl).href !== canonicalUrl) {
    throw new Error(`/sound redirect is invalid: ${redirect.status} ${redirect.headers.get('location') || ''}`)
  }

  const siteResponse = await expectOk(`${siteUrl}?${cacheBust}`, '/sound/')
  const requiredHeaders = {
    'strict-transport-security': 'max-age=',
    'content-security-policy': "default-src 'self'",
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'geolocation=()',
  }
  for (const [name, marker] of Object.entries(requiredHeaders)) {
    const value = siteResponse.headers.get(name) || ''
    if (!value.includes(marker)) throw new Error(`/sound/ is missing inherited security header ${name}`)
  }
  const html = await siteResponse.text()
  const requiredMarkers = [
    'https://www.panor.tech/sound/',
    '/public/cross-promo.js',
  ]
  for (const marker of requiredMarkers) {
    if (!html.includes(marker)) throw new Error(`/sound/ is missing required marker: ${marker}`)
  }
  const expectedVersionedAssets = [
    `./assets/styles.css?v=${releaseSha}`,
    `./site.config.js?v=${releaseSha}`,
    `./assets/main.js?v=${releaseSha}`,
  ]
  for (const asset of expectedVersionedAssets) {
    if (!html.includes(asset)) throw new Error(`/sound/ is missing release-versioned asset: ${asset}`)
  }
  if (html.includes('__PANOR_SOUND_RELEASE_SHA__')) throw new Error('/sound/ contains an unresolved release token')
  if (/adsbygoogle|pagead2\.googlesyndication\.com|ca-pub-/i.test(html)) {
    throw new Error('/sound/ contains a forbidden AdSense marker')
  }

  const assets = [...html.matchAll(/(?:src|href)=["'](\.\/(?:site\.config\.js|assets\/[^"']+))["']/g)].map(match => match[1])
  if (!assets.length) throw new Error('/sound/ does not reference any local assets')
  for (const asset of new Set(assets)) {
    const assetUrl = new URL(asset, siteUrl)
    assetUrl.searchParams.set('deploy', releaseSha)
    const response = await expectOk(assetUrl.href, `asset ${asset}`)
    const contentType = response.headers.get('content-type') || ''
    if (assetUrl.pathname.endsWith('.js') && !/javascript/.test(contentType)) throw new Error(`asset ${asset} returned ${contentType}`)
    if (assetUrl.pathname.endsWith('.css') && !/text\/css/.test(contentType)) throw new Error(`asset ${asset} returned ${contentType}`)
  }

  const moduleImports = new Map([
    ['./assets/main.js', ['./application/bootstrap.js']],
    ['./assets/application/bootstrap.js', ['../domain/soundscape.js', '../infrastructure/soundscape-api.js', '../ui/live-page.js']],
    ['./assets/infrastructure/soundscape-api.js', ['../domain/soundscape.js']],
  ])
  for (const [modulePath, imports] of moduleImports) {
    const source = await (await expectOk(`${siteUrl}${modulePath.slice(2)}?v=${releaseSha}&${cacheBust}`, `module ${modulePath}`)).text()
    if (source.includes('__PANOR_SOUND_RELEASE_SHA__')) throw new Error(`module ${modulePath} contains an unresolved release token`)
    for (const importedPath of imports) {
      if (!source.includes(`${importedPath}?v=${releaseSha}`)) {
        throw new Error(`module ${modulePath} is missing release-versioned import ${importedPath}`)
      }
    }
  }

  const homepage = await (await expectOk(`https://www.panor.tech/?${cacheBust}`, 'Panor homepage')).text()
  if (!homepage.includes('href="/sound/"')) throw new Error('Panor homepage does not register /sound/')

  const content = await (await expectOk(`https://www.panor.tech/api/content?${cacheBust}`, 'Panor content API')).text()
  if (!content.includes('"link":"/sound/"') && !content.includes('"link": "/sound/"')) {
    throw new Error('Panor content API does not register /sound/')
  }

  const crossPromo = await (await expectOk(`https://www.panor.tech/public/cross-promo.js?${cacheBust}`, 'Panor cross-promo')).text()
  if (!crossPromo.includes("path: '/sound/'")) throw new Error('Panor cross-promo does not register /sound/')

  const sitemap = await (await expectOk(`https://www.panor.tech/sitemap.xml?${cacheBust}`, 'Panor sitemap')).text()
  if (!sitemap.includes('<loc>https://www.panor.tech/sound/</loc>')) throw new Error('Panor sitemap does not register /sound/')

  const llms = await (await expectOk(`https://www.panor.tech/llms.txt?${cacheBust}`, 'Panor llms.txt')).text()
  if (!llms.includes('](https://www.panor.tech/sound/):')) throw new Error('Panor llms.txt does not register /sound/')

  await expectOk(`https://www.panor.tech/soundscape/?${cacheBust}`, '/soundscape/ isolation check')
  console.log('PASS production smoke checks')
}

main().catch(error => {
  console.error(`Production smoke failed: ${error.message}`)
  process.exitCode = 1
})
