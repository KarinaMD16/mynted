import { ChevronDown, LayoutAlt01, LogOut01, Settings01, Package, ShoppingBag01, User01 } from '@untitledui/icons'
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from 'react-aria-components'
import { Sparkles } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { popoverAnimationClass } from '@/utils/popoverAnimation'
import { BlurAppear } from '@/components/ui/BlurAppear'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { SkinnedGoose } from '@/features/pro/components/SkinnedGoose'
import { MenuItem } from './menuPrimitives'
import { useAccountActions } from './useAccountActions'

export function AccountMenu({ userName }: { userName: string }) {
  const { t } = useLanguage()
  const { logout, goToProfile, goToSettings, goToMyProducts, goToCreateProduct, goToAdmin, goToPro, isLoggingOut } =
    useAccountActions()
  // Un superadmin no usa perfil ni ajustes de cuenta normal: su única opción
  // es el panel de administración (ver AdminPage).
  const user = useCurrentUser().data
  const role = user?.role
  const isSuperAdmin = role === 'superadmin'
  const isSeller = role === 'seller'

  return (
    <>
    <AriaDialogTrigger>
      <AriaButton className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-mynted-border bg-mynted-orange py-1.5 pr-3.5 pl-1.5 outline-none transition-colors hover:bg-mynted-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:bg-mynted-orange-hover">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-mynted-white/40">
          {/* El gansito con la skin que eligió la persona (ver /settings → Apariencia). */}
          <SkinnedGoose skin={user?.cosmetics?.gooseSkin} className="size-[26px]" />
        </span>
        <span className="text-sm font-semibold whitespace-nowrap text-mynted-ink">{userName}</span>
        <ChevronDown className="size-3.5 shrink-0 text-mynted-ink/70" aria-hidden="true" />
      </AriaButton>

      <AriaPopover placement="bottom right" offset={8} className={popoverAnimationClass}>
        <AriaDialog className="w-56 rounded-xl border border-mynted-border bg-mynted-white p-1.5 shadow-lg outline-none">
          {({ close }) => (
            <BlurAppear>
              {isSuperAdmin ? (
                <MenuItem icon={LayoutAlt01} label={t('admin.menu.open')} onPress={goToAdmin} />
              ) : (
                <>
                  <MenuItem icon={User01} label={t('header.myProfile')} onPress={goToProfile} />
                  
                  {isSeller && (
                    <MenuItem
                      icon={Package}
                      label={t('header.myProducts')}
                      onPress={() => {
                        close()
                        goToMyProducts()
                      }}
                    />
                  )}
                  {isSeller && (
                    <MenuItem
                      icon={ShoppingBag01}
                      label={t('header.sell')}
                      onPress={() => {
                        close()
                        goToCreateProduct()
                      }}
                    />
                  )}
                  <MenuItem
                    icon={Sparkles}
                    label={t('header.pro')}
                    onPress={() => {
                      close()
                      goToPro()
                    }}
                  />
                  <MenuItem
                    icon={Settings01}
                    label={t('header.settings')}
                    onPress={() => {
                      close()
                      goToSettings()
                    }}
                  />
                </>
              )}
              <div className="my-1 border-t border-mynted-border" />
              <MenuItem
                icon={LogOut01}
                label={isLoggingOut ? t('header.loggingOut') : t('header.logout')}
                tone="danger"
                disabled={isLoggingOut}
                onPress={() => void logout()}
              />
            </BlurAppear>
          )}
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
    </>
  )
}
