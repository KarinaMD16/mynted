import { SiteHeader } from '@/components/layout/SiteHeader'
import { CreateCommunityForm } from '@/features/community/components/CreateCommunityForm';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';

export default function CommunitiesPage() {
  const { t } = useLanguage()
  const [isCreateCommunityFormOpen, setIsCreateCommunityFormOpen] = useState(false);

  const handleCreateCommunity = () => {
    setIsCreateCommunityFormOpen(true);
  }

  return (
      <section className="min-h-svh bg-mynted-bg">
         <div className="px-4 pt-5 sm:px-6">
           <SiteHeader />
         </div>

        <main className="gap-3 px-14 py-15">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{t('communities.myCommunities')}</h1>
            <button className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80"
             onClick={() => {
              handleCreateCommunity();
            }}>
              {t('communities.createCommunity')}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          </div>
        </main>
     <CreateCommunityForm
         isOpen={isCreateCommunityFormOpen}
          onClose={() => {
           setIsCreateCommunityFormOpen(false);
          }}
      />
    </section>

  )

}

