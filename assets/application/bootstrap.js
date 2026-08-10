import { buildLiveModel } from '../domain/soundscape.js'
import { SoundscapeApi } from '../infrastructure/soundscape-api.js'
import {
  createPlayer,
  renderError,
  renderLiveSections,
  renderLoading,
  renderStaticChrome,
} from '../ui/live-page.js'

const config = window.SOUND_SITE_CONFIG
if (!config?.site || !config?.hero || !config?.footer || !config?.data) {
  throw new Error('Missing required SOUND_SITE_CONFIG fields.')
}

const api = new SoundscapeApi(config.data)
const player = createPlayer(api, config.hero.actions[0].href)

async function load() {
  renderLoading()
  try {
    const { soundscapes, rankings } = await api.load()
    const model = buildLiveModel(soundscapes, rankings, config.data)
    if (!model.featured.length) throw new Error('The backend returned no playable public recordings.')
    renderLiveSections(config, model, player.open)
  } catch (error) {
    console.error('[soundscape-live-data]', error)
    renderError(error.message, () => void load())
  }
}

renderStaticChrome(config)
void load()
