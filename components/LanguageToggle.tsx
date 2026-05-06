'use client'

import { useLangStore } from '@/store/langStore'

export default function LanguageToggle() {
  const { locale, toggle } = useLangStore()

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
      aria-label="Toggle language"
    >
      {locale === 'fr' ? (
        <>🇫🇷 <span className="text-gray-600">FR</span></>
      ) : (
        <>🇬🇧 <span className="text-gray-600">EN</span></>
      )}
    </button>
  )
}
