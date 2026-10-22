import type { TranslationKey } from '@/i18n/translations/es'

/** Items del nav principal, compartidos por `Navigation` (desktop) y el drawer mobile del `SiteHeader`. */
/**
 * ¿Está activo este ítem en `pathname`? Además de la ruta exacta cuenta lo que
 * cuelga de ella (/messages/15 deja activo "Mensajes"); "/" solo es exacto.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))
}

export const NAV_ITEMS: { labelKey: TranslationKey; href: '/' | '/explore' | '/communities' | '/favorites' | '/messages' }[] = [
  { labelKey: 'nav.home', href: '/' },
  { labelKey: 'nav.explore', href: '/explore' },
  { labelKey: 'nav.communities', href: '/communities' },
  { labelKey: 'nav.favorites', href: '/favorites' },
  { labelKey: 'nav.messages', href: '/messages' },
]
