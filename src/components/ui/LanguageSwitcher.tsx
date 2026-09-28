import { Check, ChevronDown, Globe01 } from '@untitledui/icons'
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from 'react-aria-components'
import { useLanguage } from '@/i18n/LanguageContext'
import { BlurAppear } from '@/components/ui/BlurAppear'
import { popoverAnimationClass } from '@/utils/popoverAnimation'
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES } from '@/utils/locale'

/**
 * Selector de idioma. Con seis idiomas ya no entran como botones sueltos en
 * el header, así que es un botón compacto (código del idioma actual) que
 * abre un popover con la lista — mismo patrón que AccountMenu y
 * NotificationsMenu. Cada idioma se muestra con su nombre en ese mismo idioma
 * (ver LANGUAGE_NATIVE_NAMES) y con `lang` para que el lector de pantalla lo
 * pronuncie bien.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <AriaDialogTrigger>
      <AriaButton
        aria-label={`${t('languageSwitcher.label')}: ${LANGUAGE_NATIVE_NAMES[language]}`}
        className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-mynted-border bg-mynted-bg py-1.5 pr-2.5 pl-2 text-xs font-semibold text-mynted-ink outline-none transition-colors hover:bg-mynted-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:bg-mynted-white ${className}`}
      >
        <Globe01 className="size-4 shrink-0 text-mynted-gray" aria-hidden="true" />
        <span className="uppercase">{language}</span>
        <ChevronDown className="size-3.5 shrink-0 text-mynted-gray" aria-hidden="true" />
      </AriaButton>

      <AriaPopover placement="bottom right" offset={8} className={popoverAnimationClass}>
        <AriaDialog
          aria-label={t('languageSwitcher.label')}
          className="w-48 rounded-xl border border-mynted-border bg-mynted-white p-1.5 shadow-lg outline-none"
        >
          {({ close }) => (
            <BlurAppear>
              <ul className="flex flex-col">
                {SUPPORTED_LANGUAGES.map((code) => {
                  const isActive = code === language
                  return (
                    <li key={code}>
                      <button
                        type="button"
                        lang={code}
                        aria-pressed={isActive}
                        onClick={() => {
                          setLanguage(code)
                          close()
                        }}
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors outline-none hover:bg-mynted-bg focus-visible:bg-mynted-bg ${
                          isActive ? 'text-mynted-orange' : 'text-mynted-ink'
                        }`}
                      >
                        <span className="w-6 shrink-0 text-xs font-semibold text-mynted-gray uppercase">{code}</span>
                        <span className="flex-1">{LANGUAGE_NATIVE_NAMES[code]}</span>
                        {isActive && <Check className="size-4 shrink-0" aria-hidden="true" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </BlurAppear>
          )}
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}
