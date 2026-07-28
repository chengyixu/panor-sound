import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function validateBasePath(value) {
  if (!/^\/[a-z0-9][a-z0-9/-]*$/i.test(value) || value.includes('//') || value.endsWith('/')) {
    throw new Error('SITE_BASE_PATH must be one slash-prefixed path without a trailing slash, for example /sound')
  }
  return value
}

function validateWebParent(value) {
  if (!value.startsWith('/') || !/^[a-zA-Z0-9_./-]+$/.test(value) || value.includes('..')) {
    throw new Error('SITE_WEB_PARENT must be a safe absolute filesystem path')
  }
  return value.replace(/\/$/, '')
}

try {
  const basePath = validateBasePath(required('SITE_BASE_PATH'))
  const webParent = validateWebParent(required('SITE_WEB_PARENT'))
  const templatePath = path.join(import.meta.dirname, 'nginx-site.conf.template')
  const output = fs.readFileSync(templatePath, 'utf8')
    .replaceAll('{{SITE_BASE_PATH}}', basePath)
    .replaceAll('{{SITE_WEB_PARENT}}', webParent)
  process.stdout.write(output)
} catch (error) {
  console.error(`Cannot render Nginx config: ${error.message}`)
  process.exitCode = 1
}
