/*
 * Approved presentation and live-data contract for /sound/.
 * Product records, rankings, locations, creators, counts, and audio always come
 * from the public Soundscape API. No copied recording data belongs in this file.
 */
window.SOUND_SITE_CONFIG = {
  publish: { ready: true },
  site: {
    name: 'Soundscape',
    basePath: '/sound/',
    title: 'Soundscape — Live Recordings from Real Places',
    description: 'Listen to live community field recordings from real places, explore every published location on an interactive map, and enter Soundscape to record your own.',
    locale: 'en',
  },
  data: {
    soundscapesEndpoint: '/soundscape/api/soundscapes?scope=explore',
    rankingsEndpoint: '/soundscape/api/rankings',
    requestTimeoutMs: 12000,
    featuredLimit: 6,
    popularLimit: 6,
  },
  map: {
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  navigation: [
    { label: 'Featured', href: '#featured' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Live Archive', href: '#archive' },
  ],
  hero: {
    eyebrow: 'Soundscape · Live Archive',
    heading: 'The World Has a Soundtrack.',
    body: 'Every card below is a published field recording from the live Soundscape archive. Listen here, explore its real location, or enter the app to record and share your own.',
    actions: [
      { label: 'Open Soundscape', href: 'https://www.panor.tech/soundscape/' },
      { label: 'Explore Live Map', href: '#gallery' },
    ],
  },
  sections: {
    featured: {
      heading: 'Live Recordings',
      latestLabel: 'Latest Published',
      latestDescription: 'The newest public recordings, loaded directly from Soundscape.',
      popularLabel: 'Popular Now',
      popularDescription: 'Current ranking data from the live archive. Counts update as people listen.',
    },
    gallery: {
      heading: 'Sound Gallery',
      body: 'Every marker is a published recording with real coordinates. Select a marker or card to listen.',
    },
    archive: {
      heading: 'Live Archive',
      body: 'These totals and contributor rankings are calculated from the public recordings currently available in Soundscape.',
      contributorsLabel: 'Community Recordists',
      contactBody: 'Want to contribute a field recording, research collection, or collaboration?',
      contact: { label: 'Contact Us', href: 'mailto:hello@panor.tech' },
    },
  },
  footer: {
    text: 'Soundscape — live recordings from real places.',
    links: [
      { label: 'Soundscape App', href: 'https://www.panor.tech/soundscape/' },
      { label: 'GitHub', href: 'https://github.com/chengyixu/panor-sound', external: true },
    ],
  },
}
