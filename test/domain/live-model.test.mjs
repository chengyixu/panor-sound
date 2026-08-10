import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildLiveModel,
  normalizeSoundscape,
} from '../../assets/domain/soundscape.js'
import { rankingsFixture, soundscapesFixture } from '../fixtures/live-api.mjs'

test('normalizes a real backend row without inventing content', () => {
  const sound = normalizeSoundscape(soundscapesFixture[0])

  assert.equal(sound.id, 103)
  assert.equal(sound.title, 'Harbour Rain')
  assert.equal(sound.audioUrl, '/soundscape/uploads/audio/harbour-rain.m4a')
  assert.equal(sound.location, 'Hong Kong · Victoria Harbour')
  assert.equal(sound.plays, 81)
})

test('builds featured, popular, map, archive, and contributor data from API rows', () => {
  const model = buildLiveModel(soundscapesFixture, rankingsFixture, { featuredLimit: 2, popularLimit: 2 })

  assert.deepEqual(model.featured.map(item => item.id), [103, 102])
  assert.deepEqual(model.popular.map(item => item.id), [102, 103])
  assert.equal(model.mapItems.length, 3)
  assert.deepEqual(model.stats, {
    recordings: 3,
    places: 3,
    durationSeconds: 495,
    plays: 264,
  })
  assert.deepEqual(model.contributors.map(item => [item.name, item.recordings]), [['Ada', 2], ['Wilson', 1]])
})

test('excludes explicit backend test and demo records from every public surface', () => {
  const testRecording = {
    ...soundscapesFixture[0],
    id: 999,
    title: 'KFC TEST',
    play_count: 9999,
    created_at: '2026-08-10 09:00:00',
  }
  const model = buildLiveModel(
    [testRecording, ...soundscapesFixture],
    [{ category: '地方', items: [testRecording, ...rankingsFixture[0].items] }],
    { featuredLimit: 6, popularLimit: 6 },
  )

  assert.doesNotMatch(JSON.stringify(model), /KFC TEST/)
  assert.equal(model.stats.recordings, 3)
  assert.equal(model.stats.plays, 264)
})

test('rejects rows without a real playable recording', () => {
  assert.throws(
    () => normalizeSoundscape({ id: 1, title: 'Broken', audio_url: '' }),
    /audio_url/,
  )
})
