import {
  parseRankingsResponse,
  parseSoundscapesResponse,
} from '../domain/soundscape.js?v=__PANOR_SOUND_RELEASE_SHA__'

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`${url} returned ${response.status}`)
    return response.json()
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`${url} timed out`)
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export class SoundscapeApi {
  constructor(config) {
    this.soundscapesEndpoint = config.soundscapesEndpoint
    this.rankingsEndpoint = config.rankingsEndpoint
    this.requestTimeoutMs = config.requestTimeoutMs
  }

  async load() {
    const [soundscapes, rankings] = await Promise.all([
      fetchJson(this.soundscapesEndpoint, this.requestTimeoutMs),
      fetchJson(this.rankingsEndpoint, this.requestTimeoutMs),
    ])
    return {
      soundscapes: parseSoundscapesResponse(soundscapes),
      rankings: parseRankingsResponse(rankings),
    }
  }

  async recordPlay(id, listenedSeconds) {
    const response = await fetch(`/soundscape/api/soundscapes/${id}/play`, {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listened_sec: Math.max(0, Math.round(listenedSeconds)) }),
    })
    if (!response.ok) throw new Error(`play tracking returned ${response.status}`)
  }
}
