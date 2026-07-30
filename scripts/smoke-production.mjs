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
  const cacheBust = `deploy=${encodeURIComponent(process.argv[2] || Date.now().toString())}`
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
    'https://quge5.com/88/tag.min.js',
    'data-zone="264769"',
    '/public/cross-promo.js',
  ]
  for (const marker of requiredMarkers) {
    if (!html.includes(marker)) throw new Error(`/sound/ is missing required marker: ${marker}`)
  }
  if (/adsbygoogle|pagead2\.googlesyndication\.com|ca-pub-/i.test(html)) {
    throw new Error('/sound/ contains a forbidden AdSense marker')
  }

  const assets = [...html.matchAll(/(?:src|href)=["'](\.\/assets\/[^"']+)["']/g)].map(match => match[1])
  if (!assets.length) throw new Error('/sound/ does not reference any local assets')
  for (const asset of new Set(assets)) {
    const response = await expectOk(new URL(asset, siteUrl).href + `?${cacheBust}`, `asset ${asset}`)
    const contentType = response.headers.get('content-type') || ''
    if (asset.endsWith('.js') && !/javascript/.test(contentType)) throw new Error(`asset ${asset} returned ${contentType}`)
    if (asset.endsWith('.css') && !/text\/css/.test(contentType)) throw new Error(`asset ${asset} returned ${contentType}`)
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
