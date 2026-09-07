/**
 * ─────────────────────────────────────────────────────────────
 *  PERSONAL CONTENT LIVES HERE.
 *  Change the name, age, captions, photos, scrapbook pages and
 *  the final message in this one file. Nothing else needs to change.
 * ─────────────────────────────────────────────────────────────
 *
 *  Asset paths are relative to /public. Drop your own files in:
 *    public/images/photos/photo-XX.webp      (portrait or square, ~100–300 KB)
 *    public/images/scrapbook/page-XX.webp    (collage pages, ~300–800 KB)
 *    public/images/scrapbook/cover.webp      (optional cover art)
 *    public/audio/birthday.m4a | .mp3        (loops in the background)
 */

export const birthdayConfig = {
  /** Who is this for? */
  name: 'Zaara',

  /** Secure random token to deliver wishes to your Gmail without exposing your email address */
  emailToken: '0d19858ae644b5d66fffe4cb65acb4af',

  /** The age being celebrated. The counter climbs to age − 1, burns away, and this number rises from the embers. */
  age: 19,

  /**
   * Birth date + time (ISO). Powers the tiny live age ticker on the counting screen.
   * Set to null to hide the ticker.
   */
  birthDate: '2007-09-08T00:00:00',

  /** Small tracked label in the corner of the title page. */
  dateLabel: '08 SEPT',

  /** Line under the big title. */
  tagline: 'May this year bring you closer to everything you’re chasing.',

  /**
   * When true, visitors whose OS has "Reduce motion" turned on get a calmer version
   * (shorter fades, no balloons drifting, no photo trail). Off by default: this is a
   * one-off surprise and the motion is the point.
   */
  respectReducedMotion: false,

  music: {
    enabled: true,
    volume: 0.20, // Soft & pleasant, not too loud!
    currentIndex: 0,
    playlist: [
      {
        id: 'zaalima',
        title: 'Zaalima',
        artist: 'Arijit Singh & Harshdeep Kaur',
        source: '/audio/zaalima.mp3',
      },
    ],
    source: '/audio/zaalima.mp3',
  },

  /**
   * Used by the photo trail (title page), the polaroid wall and the flying photos at the end.
   * Captions show on the polaroids and under the flying photos — sweet, fun & crush-friendly!
   */
  photos: [
    { src: '/images/photos/hero-twilight.jpg',        alt: 'Cinematic Twilight & Silhouette',     caption: 'Main Character Energy 🌅' },
    { src: '/images/photos/cozy-chocolate.jpg',       alt: 'Cozy Chocolate & Warm Memories',       caption: 'Cake Thief In Action 🍰' },
    { src: '/images/photos/music-stars.jpg',          alt: 'Music & Stars Silhouette',             caption: 'Aux Cord Terrorist 🎧' },
    { src: '/images/photos/photo-birthday-cake.jpg',  alt: 'Birthday Cake & Candle',               caption: 'Make a Wish (for treats) 🎂' },
    { src: '/images/photos/photo-blossom-walk.jpg',   alt: 'Cherry Blossom Dusk Walk',             caption: 'Late to Everything 🌸' },
    { src: '/images/photos/photo-diary-desk.jpg',     alt: 'Sunlit Diary Desk',                    caption: 'Plotting World Domination 📖' },
    { src: '/images/photos/twilight-sparklers.jpg',   alt: 'Sparkler on Hillside',                 caption: 'Pure Chaos & Magic ✨' },
    { src: '/images/photos/cozy-window-rain.jpg',     alt: 'Rainy Window Nook',                    caption: '90% Drama, 10% Tea ☕' },
    { src: '/images/photos/stargazing-hill.jpg',      alt: 'Stargazing with Fireflies',            caption: 'Queen of Overthinking 🌙' },
    { src: '/images/photos/pastel-beach.jpg',         alt: 'Pastel Beach Shoreline',               caption: 'Peaceful for 30 Seconds 🌊' },
    { src: '/images/photos/vintage-lofi-music.jpg',   alt: 'Vintage Vinyl & Dried Flowers',        caption: 'Singing Off-Key with Passion 🎶' },
    { src: '/images/photos/cozy-cat-sunbeam.jpg',     alt: 'Sleeping Kitten on Windowsill',        caption: 'Professional Nap Expert 🐾' },
  ],

  /** The spiral-bound diary. Pages are shown two at a time and flip like a real book. */
  scrapbook: {
    cover: {
      image: null,          // Built-in leather journal with brass plaque & hero twilight photo paperclipped
      title: 'Diary',
      name: 'Zaara',
    },
    pages: [
      {
        image: '/images/photos/photo-diary-desk.jpg',
        title: 'Chapter 01 · First Impressions',
        text: '“The day we first talked, you acted so quiet and polite... Biggest scam in history! 😂 Turns out you’re 90% chaos, 10% sleep, and 100% trouble.”',
        mood: 'Mood: 😇 Fake Innocent',
      },
      {
        image: '/images/photos/twilight-sparklers.jpg',
        title: 'Chapter 02 · Unmatched Energy',
        text: '“Brings so much vibrant energy into the room that it’s impossible not to smile around you. 0% dull moments 💫”',
        mood: 'Mood: ⚡ Pure Sunshine',
      },
      {
        image: '/images/photos/photo-blossom-walk.jpg',
        title: 'Chapter 03 · Certified Drama',
        text: '“\'I literally have NOTHING to wear!\' — Zaara, while staring at a mountain of clothes on her bed. Oscar-worthy drama 24/7 🎭✨”',
        mood: 'Mood: 🎭 Drama Queen',
      },
      {
        image: '/images/photos/hero-twilight.jpg',
        title: 'Chapter 04 · Secret Softie',
        text: '“Loves to act cool and nonchalant, but secretly has the warmest, sweetest heart ever 🌸✨”',
        mood: 'Mood: 🌸 Secret Softie',
      },
      {
        image: '/images/photos/cozy-chocolate.jpg',
        title: 'Chapter 05 · That Sneaky Smile',
        text: '“That sneaky little smirk you give when you think you’re 100% right (even when you’re completely making things up). 100% confidence, 0% facts 😌💅”',
        mood: 'Mood: 💅 Always Right (allegedly)',
      },
      {
        image: '/images/photos/photo-birthday-cake.jpg',
        title: 'Chapter 06 · Officially 19!',
        text: '“Look who finally made it to 19! Officially one year closer to acting like a mature adult... but we both know that’s not happening anytime soon 😂🎂✨”',
        mood: 'Mood: 🎂 Officially 19!',
      },
    ],
  },

  /** The slow, quiet ending — shown over the flying photos. */
  finalMessage: {
    title: 'Happy 19th Birthday',
    lines: [
      'You truly bring the brightest energy everywhere you go.',
      'Here’s to another unforgettable chapter,',
      'filled with big dreams, pure happiness, and countless reasons to smile. ✨',
    ],
    signature: 'Always wishing you the absolute best ✨',
  },

  /** Performance budgets per device tier. Lower these if a phone struggles. */
  limits: {
    trail:     { desktop: 12,  tablet: 10,  mobile: 7 },   // photos on the title-page filmstrip
    polaroids: { desktop: 9,   tablet: 6,   mobile: 5 },
    balloons:  { desktop: 22,  tablet: 16,  mobile: 12 },
    flying:    { desktop: 10,  tablet: 8,   mobile: 6 },    // photos flying through the stars
    stars:     { desktop: 320, tablet: 220, mobile: 140 },
  },
};

export default birthdayConfig;
