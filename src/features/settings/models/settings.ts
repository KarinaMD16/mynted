/** Pestañas de /settings, en el orden en que se muestran. */
export const SETTINGS_TABS = ['account', 'profile', 'privacy', 'notifications'] as const

export type SettingsTab = (typeof SETTINGS_TABS)[number]

export function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === 'string' && (SETTINGS_TABS as readonly string[]).includes(value)
}
