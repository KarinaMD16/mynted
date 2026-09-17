import type { TranslationKey } from '@/i18n/translations/es'

/** Items del nav principal, compartidos por `Navigation` (desktop) y el drawer mobile del `SiteHeader`. */
export const NAV_ITEMS: { labelKey: TranslationKey; href: '/' | '/explore' | '/communities' | '/favorites' | '/messages' }[] = [
  { labelKey: 'nav.home', href: '/' },
  { labelKey: 'nav.explore', href: '/explore' },
  { labelKey: 'nav.communities', href: '/communities' },
  { labelKey: 'nav.favorites', href: '/favorites' },
  { labelKey: 'nav.messages', href: '/messages' },
]
