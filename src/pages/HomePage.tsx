import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { TalkFeed } from '@/features/community/components/sections/TalkFeed'
import { ShopFeed } from '@/features/products/components/ShopFeed'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { SiteHeader } from '../components/layout/SiteHeader'

type HomeTab = 'shop' | 'talk'

const HOME_TABS: { id: HomeTab; labelKey: TranslationKey }[] = [
  { id: 'shop', labelKey: 'shop.tab.shop' },
  { id: 'talk', labelKey: 'shop.tab.talk' },
]

/**
 * Home: pestaña "Shop" (productos agrupados por tag, con scroll infinito, visible
 * también sin sesión) y pestaña "Talk" (el feed de publicaciones de todas las
 * comunidades públicas, que sí pide sesión).
 */
export default function HomePage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<HomeTab>('shop')

  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        <ScrollReveal><div role="tablist" className="flex items-center gap-2">
          {HOME_TABS.map(({ id, labelKey }) => {
            const isActive = activeTab === id
            return (
              <Button
                key={id}
                variant="ghost"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={`rounded-[10px] px-[18px] text-[15px] ${
                  isActive
                    ? 'bg-[#ffdfd1] font-semibold text-mynted-orange hover:bg-[#ffdfd1] hover:text-mynted-orange'
                    : 'bg-[#f3f3f2] font-medium text-mynted-gray hover:text-mynted-ink'
                }`}
              >
                {t(labelKey)}
              </Button>
            )
          })}
        </div></ScrollReveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'talk' ? <TalkFeed /> : <ShopFeed />}
          </motion.div>
        </AnimatePresence>
      </main>

      <motion.div
        className="fixed right-6 bottom-6"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.4 }}
      >
        <Link
          to="/messages"
          aria-label={t('shop.chat')}
          className="flex size-[60px] items-center justify-center rounded-full bg-mynted-blue text-white shadow-[0_6px_18px_-2px_rgba(47,95,255,0.35)]"
        >
          <MessageCircle className="size-[26px]" aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  )
}
