/*
 * Panor Sound marketing page at /sound/
 * Minimalist black & white, immersive listening aesthetic.
 */
window.SOUND_SITE_CONFIG = {
  publish: {
    ready: true,
  },
  site: {
    name: 'Panor Sound',
    basePath: '/sound/',
    title: 'Panor Sound — Immersive City Soundscapes',
    description:
      'Experience the world through sound. AI-powered immersive soundscapes anchored in real locations. Record, share, and discover the sonic texture of cities.',
    locale: 'en',
  },
  navigation: [
    { label: 'Featured', href: '#featured' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Hall of Fame', href: '#hall-of-fame' },
  ],
  hero: {
    eyebrow: 'Panor Sound',
    heading: 'The World Has a Soundtrack.',
    body: 'Real locations, real sounds, transformed by AI into immersive soundscapes. Step into the sonic texture of cities — record your corner of the world, or lose yourself in someone else\'s.',
    actions: [
      { label: 'Try Soundscape', href: 'https://www.panor.tech/soundscape/' },
      { label: 'Explore Gallery', href: '#gallery' },
    ],
  },
  sections: [
    {
      type: 'featured',
      heading: 'Selected Featured',
      rows: [
        {
          label: 'Editor\'s Picks',
          description: 'Curated by our team — standout soundscapes that define the art of listening.',
          items: [
            { title: 'Mong Kok Footbridge', location: 'Mong Kok, Hong Kong', cover: './assets/covers/80c3ec82c7324720a279bc3bc7c8aa10.png', story: 'A rainy evening on one of Hong Kong\'s most iconic pedestrian bridges. Layers of footsteps, distant traffic, and Cantonese street calls weave together.' },
            { title: 'Wong Tai Sin Temple', location: 'Wong Tai Sin, Hong Kong', cover: './assets/covers/df88a9aea3d1475b80a4bc099685b429.png', story: 'Incense, prayer chants, and the soft shuffle of worshippers. A spiritual sanctuary captured in sound.' },
            { title: 'Victoria Park Dawn', location: 'Causeway Bay, Hong Kong', cover: './assets/covers/ae0dd34b0bd04bdfae046dc63554f05b.png', story: 'Tai chi practitioners, birdsong, and the city waking up. The quiet side of Hong Kong\'s busiest district.' },
            { title: 'Sham Shui Po Wet Market', location: 'Sham Shui Po, Hong Kong', cover: './assets/covers/cf99bfb5ec15414a8b4a9e250feb132e.png', story: 'Vendors calling prices, cleavers on wooden blocks, the dense hum of commerce. A market that never learned to whisper.' },
            { title: 'Star Ferry Terminal', location: 'Tsim Sha Tsui, Hong Kong', cover: './assets/covers/0d35e9451bdd46b8a73c3cbd8c4b4428.png', story: 'The groan of wooden gangways, the ferry horn, water lapping against the pier. A commute that feels like a voyage.' },
          ],
        },
        {
          label: 'Popular This Week',
          description: 'What the community is listening to right now.',
          items: [
            { title: 'KFC TEST', location: 'Bao\'an District, Shenzhen', cover: './assets/covers/cf99bfb5ec15414a8b4a9e250feb132e.png', story: 'A bustling fast-food corner — fryer sizzle, chatter, the rhythm of an ordinary moment made extraordinary.', plays: '22' },
            { title: '创芯北门闲步拾声', location: 'Bao\'an, Shenzhen', cover: './assets/covers/0d35e9451bdd46b8a73c3cbd8c4b4428.png', story: 'An afternoon walk at the northern gate of the innovation campus. Footsteps, wind, and fragments of conversation.', plays: '2' },
            { title: '风穿街巷半闲时', location: 'Fuyong, Bao\'an', cover: './assets/covers/80c3ec82c7324720a279bc3bc7c8aa10.png', story: 'Wind threading through narrow alleys. A half-leisurely moment caught between buildings.', plays: '2' },
            { title: '龙华巷里烟火喧', location: 'Xuhui, Shanghai', cover: './assets/covers/c4278a6141114a1882bec01470aacd0d.png', story: 'Alleyway life in Longhua — cooking smoke, neighbor calls, the intimate noise of community.', plays: '7' },
            { title: '九巷风藏旧语声', location: 'Yantian, Bao\'an', cover: './assets/covers/8d5250afc2f94dfc8803d207214ebe30.png', story: 'Old voices carried by the wind in Lane 9. Memory embedded in urban geometry.', plays: '2' },
          ],
        },
      ],
    },
    {
      type: 'map',
      heading: 'Sound Gallery',
      body: 'Every marker is a doorway to a different corner of the world. Click to listen.',
    },
    {
      type: 'halloffame',
      heading: 'Hall of Fame',
      contributors: {
        heading: 'Contributors & Credits',
        body: 'The voices, ears, and minds that make Panor Sound possible.',
        people: [
          { name: 'Prof. PerMagnus Lindborg', role: 'Soundscape Research Lead', affiliation: 'MMHK, City University of Hong Kong', contribution: '20+ field recording sites across Hong Kong. Foundational research in urban soundscape perception.' },
          { name: 'Yvonne', role: 'Co-Founder & Research Director', affiliation: 'City University of Hong Kong', contribution: 'Soundscape heritage framework, community research, and platform vision.' },
          { name: 'Wilson', role: 'Co-Founder & Technical Lead', affiliation: 'Panor Tech', contribution: 'Full-stack platform architecture, AI pipeline, and product design.' },
        ],
        libraries: [
          { name: 'MMHK Research Archive', description: 'Academic field recordings from 20+ Hong Kong locations, collected under rigorous methodology.' },
          { name: 'Freesound Community', description: 'Open-licensed environmental sounds contributed by field recordists worldwide.' },
          { name: 'Community Uploads', description: 'User-contributed recordings that grow our shared sonic library every day.' },
        ],
      },
      team: {
        heading: 'Team & Contact',
        body: 'Panor Sound is built by a cross-disciplinary team of researchers, engineers, and designers who believe sound changes how we experience place. We\'re always open to collaboration.',
        contact: { label: 'Contact Us', href: 'mailto:hello@panor.tech' },
      },
      events: {
        heading: 'Events & Workshops',
        items: [
          { title: 'Sound Walk: Mong Kok After Dark', date: 'Coming Soon', description: 'A guided group recording walk through Mong Kok\'s nighttime soundscape. Open to all. Equipment provided.' },
          { title: 'Workshop: Intro to Field Recording', date: 'Coming Soon', description: 'Learn the basics of capturing high-quality environmental audio. Techniques, gear, and listening exercises.' },
          { title: 'Soundpocket Collaboration', date: 'TBA', description: 'Partnering with Hong Kong\'s sound art organization for community listening sessions and exhibitions.' },
        ],
      },
    },
  ],
  footer: {
    text: 'Panor Sound — Listen Deeper.',
    links: [
      { label: 'Soundscape App', href: 'https://www.panor.tech/soundscape/' },
      { label: 'GitHub', href: 'https://github.com/chengyixu/panor-sound', external: true },
    ],
  },
}
