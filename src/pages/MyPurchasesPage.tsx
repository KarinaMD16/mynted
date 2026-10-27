import { SignedOutState } from '@/components/errors/QueryErrorState'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { MyPurchasesTab } from '@/features/payments/components/MyPurchasesTab'
import { useLanguage } from '@/i18n/LanguageContext'
import { SiteHeader } from '../components/layout/SiteHeader'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

/**
 * "Mis compras" a pantalla completa (/compras). Es la misma lista que la
 * pestaña del perfil: acá tiene URL propia, para poder enlazarla desde el
 * recibo y desde el menú de la cuenta.
 */
export default function MyPurchasesPage() {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading } = useCurrentUser()

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-6 py-10 sm:py-12')}>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">{t('purchases.title')}</h1>
          <p className="text-sm text-mynted-gray">{t('purchases.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="h-72 animate-pulse rounded-2xl bg-white" aria-busy="true" />
        ) : isLoggedIn ? (
          <MyPurchasesTab />
        ) : (
          <SignedOutState description={t('purchases.signedOut')} />
        )}
      </main>
    </div>
  )
}
