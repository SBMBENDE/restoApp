import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Locale, translations } from '@/lib/i18n'

interface LangState {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggle: () => void
}

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'fr'
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      locale: 'fr',
      setLocale: (locale) => set({ locale }),
      toggle: () =>
        set((state) => ({
          locale: state.locale === 'fr' ? 'en' : 'fr',
        })),
    }),
    {
      name: 'lekira-lang',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const saved = localStorage.getItem('lekira-lang')
        if (!saved) {
          state.setLocale(detectLocale())
        }
      },
    }
  )
)

// Derive t from locale at call time — never stale
export function useT() {
  const locale = useLangStore((s) => s.locale)
  return translations[locale]
}
