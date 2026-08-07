import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'

const allowedCategories = new Set([
  'Personality & Psychology Tests',
  'AI Games & Simulators',
  'Professional & Career Tools',
  'Language & Translation',
  'Lifestyle, Travel & Creative',
])

function requiredArgument(name) {
  const index = process.argv.indexOf(name)
  const value = index === -1 ? '' : process.argv[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} is required`)
  return value
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function validateManifest(manifest) {
  const requiredStrings = ['slug', 'path', 'url', 'name', 'description', 'category', 'crossPromoTag', 'crossPromoDescription', 'homepageCollection', 'llmsDescription']
  for (const key of requiredStrings) {
    if (typeof manifest[key] !== 'string' || !manifest[key].trim()) throw new Error(`manifest.${key} is required`)
  }
  if (manifest.slug !== 'sound' || manifest.path !== '/sound/' || manifest.url !== 'https://www.panor.tech/sound/') {
    throw new Error('manifest must register the canonical /sound/ Panor URL')
  }
  if (!allowedCategories.has(manifest.category)) throw new Error(`unsupported manifest.category: ${manifest.category}`)
  if (!['services', 'projects'].includes(manifest.homepageCollection)) {
    throw new Error('manifest.homepageCollection must be services or projects')
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeSingleQuotedJs(value) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', ' ')
}

function replaceJsonLd(html, type, update) {
  let found = false
  const nextHtml = html.replace(/(<script\s+type=["']application\/ld\+json["']\s*>)([\s\S]*?)(<\/script>)/gi, (full, open, body, close) => {
    let data
    try {
      data = JSON.parse(body)
    } catch {
      return full
    }
    if (data?.['@type'] !== type) return full
    found = true
    return `${open}\n${JSON.stringify(update(data), null, 2)}\n${close}`
  })
  if (!found) throw new Error(`homepage is missing ${type} JSON-LD`)
  return nextHtml
}

function upsertHomepageJsonLd(html, manifest) {
  let nextHtml = replaceJsonLd(html, 'ItemList', data => {
    const items = Array.isArray(data.itemListElement) ? data.itemListElement : []
    const item = {
      '@type': 'ListItem',
      position: 0,
      name: manifest.name,
      url: manifest.url,
    }
    const existingIndex = items.findIndex(entry => entry?.url === manifest.url)
    if (existingIndex === -1) items.push(item)
    else items[existingIndex] = { ...items[existingIndex], ...item }
    data.itemListElement = items.map((entry, index) => ({ ...entry, position: index + 1 }))
    return data
  })

  nextHtml = replaceJsonLd(nextHtml, 'FAQPage', data => {
    const question = data.mainEntity?.find(entry => entry?.name === 'What products does Panor offer?')
    if (!question?.acceptedAnswer || typeof question.acceptedAnswer.text !== 'string') {
      throw new Error('FAQPage JSON-LD is missing the Panor products answer')
    }
    question.acceptedAnswer.text = upsertProductAnswer(question.acceptedAnswer.text, manifest, countItemListProducts(nextHtml))
    return data
  })
  return nextHtml
}

function countItemListProducts(html) {
  let count = 0
  html.replace(/<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi, (full, body) => {
    try {
      const data = JSON.parse(body)
      if (data?.['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) count = data.itemListElement.length
    } catch {
      // Other structured-data blocks may use non-JSON syntax; they are left untouched.
    }
    return full
  })
  if (!count) throw new Error('cannot count homepage ItemList products')
  return count
}

function upsertProductAnswer(answer, manifest, productCount) {
  const link = `<a href="${manifest.path}">${escapeHtml(manifest.name)}</a>`
  let nextAnswer = answer.replace(/Panor offers \d+ registered products:/, `Panor offers ${productCount} registered products:`)
  if (nextAnswer.includes(`href="${manifest.path}"`)) {
    const linkPattern = new RegExp(`<a href="${escapeRegExp(manifest.path)}">[\\s\\S]*?<\\/a>`)
    return nextAnswer.replace(linkPattern, link)
  }
  const punctuation = nextAnswer.endsWith('.') ? '.' : ''
  if (punctuation) nextAnswer = nextAnswer.slice(0, -1)
  return `${nextAnswer}, ${link}${punctuation}`
}

function upsertFeaturedProduct(html, manifest) {
  const category = escapeHtml(manifest.category)
  const blockPattern = new RegExp(`(<div class="product-category">\\s*<h4>${escapeRegExp(category)}<\\/h4>\\s*<ul>)([\\s\\S]*?)(<\\/ul>)`)
  const match = html.match(blockPattern)
  if (!match) throw new Error(`homepage is missing featured category: ${manifest.category}`)
  const item = `<li><a href="${manifest.path}">${escapeHtml(manifest.name)}</a></li>`
  let listBody = match[2]
  const existingPattern = new RegExp(`\\s*<li><a href="${escapeRegExp(manifest.path)}">[\\s\\S]*?<\\/a><\\/li>`)
  if (existingPattern.test(listBody)) listBody = listBody.replace(existingPattern, `\n                    ${item}`)
  else listBody = `${listBody.replace(/\s*$/, '')}\n                    ${item}\n                `
  return html.replace(blockPattern, `${match[1]}${listBody}${match[3]}`)
}

function upsertVisibleFaq(html, manifest) {
  const articlePattern = /(<article class="faq-item">\s*<h3>What products does Panor offer\?<\/h3>\s*<p>)([\s\S]*?)(<\/p>\s*<\/article>)/
  const match = html.match(articlePattern)
  if (!match) throw new Error('homepage is missing the visible Panor products FAQ')
  const answer = upsertProductAnswer(match[2], manifest, countItemListProducts(html))
  return html.replace(articlePattern, `${match[1]}${answer}${match[3]}`)
}

function updateHomepage(html, manifest) {
  const withJsonLd = upsertHomepageJsonLd(html, manifest)
  const withFeaturedProduct = upsertFeaturedProduct(withJsonLd, manifest)
  return upsertVisibleFaq(withFeaturedProduct, manifest)
}

function updateDataJson(data, manifest) {
  const collection = data[manifest.homepageCollection]
  if (!Array.isArray(collection)) throw new Error(`server/data.json is missing ${manifest.homepageCollection}[]`)
  const entry = { title: manifest.name, description: manifest.description, link: manifest.path }
  const existingIndex = collection.findIndex(item => item?.link === manifest.path)
  if (existingIndex === -1) collection.push(entry)
  else collection[existingIndex] = { ...collection[existingIndex], ...entry }
  return `${JSON.stringify(data, null, 2)}\n`
}

function updateCrossPromo(source, manifest) {
  const entry = `{ path: '${escapeSingleQuotedJs(manifest.path)}', name: '${escapeSingleQuotedJs(manifest.name)}', desc: '${escapeSingleQuotedJs(manifest.crossPromoDescription)}', tag: '${escapeSingleQuotedJs(manifest.crossPromoTag)}' }`
  const existingPattern = new RegExp(`^\\s*\\{\\s*path:\\s*'${escapeRegExp(manifest.path)}'[\\s\\S]*?\\},?\\s*$`, 'm')
  if (existingPattern.test(source)) return source.replace(existingPattern, `        ${entry},`)
  const marker = /var SERVICES = \[\s*\n/
  if (!marker.test(source)) throw new Error('cross-promo.js is missing the SERVICES array')
  return source.replace(marker, match => `${match}        ${entry},\n`)
}

function updateSitemap(source, manifest, releaseDate) {
  const urlBlock = `  <url><loc>${manifest.url}</loc><lastmod>${releaseDate}</lastmod></url>`
  const existingPattern = new RegExp(`\\s*<url>\\s*<loc>${escapeRegExp(manifest.url)}<\\/loc>\\s*<lastmod>[^<]+<\\/lastmod>\\s*<\\/url>`)
  if (existingPattern.test(source)) return source.replace(existingPattern, `\n${urlBlock}`)
  if (!source.includes('</urlset>')) throw new Error('sitemap.xml is missing </urlset>')
  return source.replace(/\s*<\/urlset>\s*$/, `\n${urlBlock}\n</urlset>\n`)
}

function updateLlms(source, manifest) {
  const line = `- [${manifest.name}](${manifest.url}): ${manifest.llmsDescription}`
  const existingPattern = new RegExp(`^- \\[.*?\\]\\(${escapeRegExp(manifest.url)}\\):.*$`, 'm')
  if (existingPattern.test(source)) return source.replace(existingPattern, line)
  const heading = `## ${manifest.category}`
  const headingIndex = source.indexOf(heading)
  if (headingIndex === -1) throw new Error(`llms.txt is missing category: ${manifest.category}`)
  const nextHeadingIndex = source.indexOf('\n## ', headingIndex + heading.length)
  const insertionIndex = nextHeadingIndex === -1 ? source.length : nextHeadingIndex
  return `${source.slice(0, insertionIndex).replace(/\s*$/, '')}\n${line}\n\n${source.slice(insertionIndex).replace(/^\s*/, '')}`
}

function updateFiles(root, manifest, releaseDate) {
  const filePaths = {
    data: path.join(root, 'server/data.json'),
    homepage: path.join(root, 'index.html'),
    crossPromo: path.join(root, 'public/cross-promo.js'),
    sitemap: path.join(root, 'sitemap.xml'),
    llms: path.join(root, 'llms.txt'),
  }
  for (const [name, filePath] of Object.entries(filePaths)) {
    if (!fs.existsSync(filePath)) throw new Error(`missing Panor ${name} file: ${filePath}`)
  }
  return new Map([
    [filePaths.data, updateDataJson(readJson(filePaths.data), manifest)],
    [filePaths.homepage, updateHomepage(fs.readFileSync(filePaths.homepage, 'utf8'), manifest)],
    [filePaths.crossPromo, updateCrossPromo(fs.readFileSync(filePaths.crossPromo, 'utf8'), manifest)],
    [filePaths.sitemap, updateSitemap(fs.readFileSync(filePaths.sitemap, 'utf8'), manifest, releaseDate)],
    [filePaths.llms, updateLlms(fs.readFileSync(filePaths.llms, 'utf8'), manifest)],
  ])
}

function main() {
  // Self-update the release script if bundled
  const newReleaseScript = path.join(__dirname, '..', 'assets', '.panor-sound-release')
  if (fs.existsSync(newReleaseScript)) {
    execSync(`install -o root -g root -m 0755 '${newReleaseScript}' /usr/local/sbin/panor-sound-release`, { stdio: 'inherit' })
    console.log('Release script self-updated')
  }
  const root = path.resolve(requiredArgument('--root'))
  const manifestPath = path.resolve(requiredArgument('--manifest'))
  const releaseDate = process.argv.includes('--date') ? requiredArgument('--date') : new Date().toISOString().slice(0, 10)
  const apply = process.argv.includes('--apply')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) throw new Error('--date must use YYYY-MM-DD')
  const manifest = readJson(manifestPath)
  validateManifest(manifest)
  const updates = updateFiles(root, manifest, releaseDate)
  for (const [filePath, content] of updates) {
    if (apply) fs.writeFileSync(filePath, content)
    console.log(`${apply ? 'UPDATED' : 'VALID'} ${path.relative(root, filePath)}`)
  }
}

try {
  main()
} catch (error) {
  console.error(`Panor registry update failed: ${error.message}`)
  process.exitCode = 1
}
