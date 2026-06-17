import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'EN', country: 'gb' },
  { code: 'tr', label: 'TR', country: 'tr' },
  { code: 'fr', label: 'FR', country: 'fr' },
  { code: 'de', label: 'DE', country: 'de' },
]

export default function LanguageSelector({ className = '' }) {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage || 'en'

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
          style={current === lang.code
            ? { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <img
            src={`https://flagcdn.com/20x15/${lang.country}.png`}
            width={20}
            height={15}
            alt={lang.label}
            style={{ borderRadius: 2, display: 'block' }}
          />
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  )
}
