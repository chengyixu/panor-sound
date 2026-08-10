function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
  return value
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string`)
  }
  return value.trim()
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function optionalCoordinate(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function createdTimestamp(value) {
  if (typeof value !== 'string' || value.trim() === '') return 0
  const timestamp = Date.parse(value.replace(' ', 'T') + 'Z')
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function normalizeSoundscape(raw) {
  const row = requireObject(raw, 'soundscape')
  const id = finiteNumber(row.id, NaN)
  if (!Number.isInteger(id) || id <= 0) throw new TypeError('soundscape.id must be a positive integer')

  return {
    id,
    title: requireString(row.title, 'soundscape.title'),
    description: typeof row.description === 'string' ? row.description.trim() : '',
    audioUrl: requireString(row.audio_url, 'soundscape.audio_url'),
    coverUrl: typeof row.cover_url === 'string' && row.cover_url.trim() ? row.cover_url.trim() : null,
    latitude: optionalCoordinate(row.lat),
    longitude: optionalCoordinate(row.lng),
    location: typeof row.location_name === 'string' && row.location_name.trim()
      ? row.location_name.trim()
      : 'Location not recorded',
    category: typeof row.category === 'string' && row.category.trim() ? row.category.trim() : '声景',
    durationSeconds: Math.max(0, Math.round(finiteNumber(row.duration_sec))),
    plays: Math.max(0, Math.round(finiteNumber(row.play_count))),
    saves: Math.max(0, Math.round(finiteNumber(row.save_count))),
    fullPlays: Math.max(0, Math.round(finiteNumber(row.full_play_count))),
    creator: typeof row.author_name === 'string' && row.author_name.trim()
      ? row.author_name.trim()
      : 'Anonymous recordist',
    isPublic: row.is_public === undefined ? true : Boolean(Number(row.is_public)),
    createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    createdTimestamp: createdTimestamp(row.created_at),
  }
}

export function parseSoundscapesResponse(payload) {
  if (!Array.isArray(payload)) throw new TypeError('soundscapes response must be an array')
  return payload.map(normalizeSoundscape)
}

export function parseRankingsResponse(payload) {
  if (!Array.isArray(payload)) throw new TypeError('rankings response must be an array')
  return payload.map((rawGroup, index) => {
    const group = requireObject(rawGroup, `rankings[${index}]`)
    if (!Array.isArray(group.items)) throw new TypeError(`rankings[${index}].items must be an array`)
    return {
      category: requireString(group.category, `rankings[${index}].category`),
      items: group.items.map(normalizeSoundscape),
    }
  })
}

function uniqueById(items) {
  const seen = new Set()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function popularityScore(item) {
  return item.plays + item.saves * 3
}

const NON_PRODUCTION_TITLE = /(?:^|[\s_-])(?:test|demo|sample|placeholder|tba)(?:$|[\s_-])/i

function isPublicRecording(item) {
  return item.isPublic !== false && !NON_PRODUCTION_TITLE.test(item.title)
}

export function buildLiveModel(soundscapesPayload, rankingsPayload, options = {}) {
  const featuredLimit = Math.max(1, Math.round(finiteNumber(options.featuredLimit, 6)))
  const popularLimit = Math.max(1, Math.round(finiteNumber(options.popularLimit, 6)))
  const parsedSoundscapes = Array.isArray(soundscapesPayload) && soundscapesPayload.every(item => item?.audioUrl)
    ? soundscapesPayload
    : parseSoundscapesResponse(soundscapesPayload)
  const parsedRankings = Array.isArray(rankingsPayload) && rankingsPayload.every(group => group?.items?.every(item => item?.audioUrl))
    ? rankingsPayload
    : parseRankingsResponse(rankingsPayload)
  const soundscapes = uniqueById(parsedSoundscapes.filter(isPublicRecording))
  const rankings = parsedRankings.map(group => ({
    ...group,
    items: group.items.filter(isPublicRecording),
  }))

  const featured = [...soundscapes]
    .sort((left, right) => right.createdTimestamp - left.createdTimestamp || right.id - left.id)
    .slice(0, featuredLimit)

  const rankedItems = uniqueById(rankings.flatMap(group => group.items))
    .sort((left, right) => popularityScore(right) - popularityScore(left) || right.id - left.id)
  const popular = (rankedItems.length ? rankedItems : [...soundscapes].sort((left, right) => popularityScore(right) - popularityScore(left)))
    .slice(0, popularLimit)

  const mapItems = soundscapes.filter(item => item.latitude !== null && item.longitude !== null)
  const places = new Set(soundscapes.map(item => item.location).filter(Boolean))
  const contributors = new Map()
  for (const item of soundscapes) {
    const current = contributors.get(item.creator) || { name: item.creator, recordings: 0, plays: 0 }
    current.recordings += 1
    current.plays += item.plays
    contributors.set(item.creator, current)
  }

  return {
    featured,
    popular,
    mapItems,
    stats: {
      recordings: soundscapes.length,
      places: places.size,
      durationSeconds: soundscapes.reduce((total, item) => total + item.durationSeconds, 0),
      plays: soundscapes.reduce((total, item) => total + item.plays, 0),
    },
    contributors: [...contributors.values()]
      .sort((left, right) => right.recordings - left.recordings || right.plays - left.plays || left.name.localeCompare(right.name))
      .slice(0, 8),
  }
}
