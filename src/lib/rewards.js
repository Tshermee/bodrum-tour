// Shared reward definitions for the player's Rewards modal and the admin editor.
// Rewards are stored in app_config under key 'rewards' as { items: [...] }.
// Each item: { id, emoji, points, code, link, title:{lang:..}, desc:{lang:..} }.
// title/desc are per-language; emoji/points/code/link are shared across languages.

export const REWARD_LANGS = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'tr', label: '🇹🇷 Turkish' },
  { code: 'fr', label: '🇫🇷 French' },
]

export const DEFAULT_REWARDS = [
  { id: 'coffee',     emoji: '☕',  points: 100, code: '', link: '', title: { en: 'Free Coffee' },       desc: { en: 'One free coffee at any partner café in Bodrum' } },
  { id: 'drink',      emoji: '🍹', points: 200, code: '', link: '', title: { en: 'Welcome Drink' },      desc: { en: 'One free welcome drink at partner bars' } },
  { id: 'discount10', emoji: '🍽️', points: 350, code: '', link: '', title: { en: '10% Dining Discount' }, desc: { en: 'At partner restaurants in Bodrum' } },
  { id: 'discount15', emoji: '🥂', points: 500, code: '', link: '', title: { en: '15% Dining Discount' }, desc: { en: 'At premium partner restaurants' } },
  { id: 'tour_free',  emoji: '🗺️', points: 800, code: '', link: '', title: { en: 'Free Tour' },          desc: { en: 'Unlock another Bodrum tour for free' } },
]

// Resolve a per-language string with sensible fallbacks.
export function pickLang(obj, lang) {
  if (!obj) return ''
  return obj[lang] || obj.en || Object.values(obj).find(Boolean) || ''
}
