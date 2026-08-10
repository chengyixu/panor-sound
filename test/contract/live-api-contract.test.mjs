import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseRankingsResponse,
  parseSoundscapesResponse,
} from '../../assets/domain/soundscape.js'
import { rankingsFixture, soundscapesFixture } from '../fixtures/live-api.mjs'

test('accepts the public soundscape list contract', () => {
  const parsed = parseSoundscapesResponse(soundscapesFixture)
  assert.equal(parsed.length, 3)
  assert.equal(parsed[0].audioUrl, soundscapesFixture[0].audio_url)
})

test('accepts the public rankings contract and preserves backend order', () => {
  const parsed = parseRankingsResponse(rankingsFixture)
  assert.deepEqual(parsed.map(group => group.category), ['地方', '自然'])
  assert.deepEqual(parsed[0].items.map(item => item.id), [102, 103])
})

test('fails loudly when the backend contract drifts', () => {
  assert.throws(() => parseSoundscapesResponse({ items: [] }), /array/)
  assert.throws(() => parseRankingsResponse([{ category: '地方', items: 'wrong' }]), /items/)
})
