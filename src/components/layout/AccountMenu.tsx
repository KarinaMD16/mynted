import { ChevronDown, LogOut01, Settings01, User01 } from '@untitledui/icons'
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from 'react-aria-components'
import { useLanguage } from '@/i18n/LanguageContext'
import { GooseIcon } from '../ui/GooseIcon'
import { popoverAnimationClass } from '@/utils/popoverAnimation'
import { MenuItem } from './menuPrimitives'
import { useAccountActions } from './useAccountActions'

export function AccountMenu({ userName }: { userName: string }) {
  const { t } = useLanguage()
  const { logout, goToProfile, isLoggingOut } = useAccountActions()

  return (
    <AriaDialogTrigger>
      <AriaButton className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-mynted-border bg-mynted-orange py-1.5 pr-3.5 pl-1.5 outline-none transition-colors hover:bg-mynted-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:bg-mynted-orange-hover">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-mynted-white/25">
          <GooseIcon className="size-[22px] text-mynted-white" />
        </span>
        <span className="text-sm font-semibold whitespace-nowrap text-mynted-white">{userName}</span>
        <ChevronDown className="size-3.5 shrink-0 text-mynted-white/80" aria-hidden="true" />
      </AriaButton>

      <AriaPopover placement="bottom right" offset={8} className={popoverAnimationClass}>
        <AriaDialog className="w-56 rounded-xl border border-mynted-border bg-mynted-white p-1.5 shadow-lg outline-none">
          <MenuItem icon={User01} label={t('header.myProfile')} onPress={goToProfile} />
          <MenuItem icon={Settings01} label={t('header.settings')} />
          <div className="my-1 border-t border-mynted-border" />
          <MenuItem
            icon={LogOut01}
            label={isLoggingOut ? t('header.loggingOut') : t('header.logout')}
            tone="danger"
            disabled={isLoggingOut}
            onPress={() => void logout()}
          />
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}
