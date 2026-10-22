import { useState } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CreateCommunityForm } from '@/features/community/components/create/CreateCommunityForm'
import { ExploreCommunitiesSection } from '@/features/community/components/sections/ExploreCommunitiesSection'
import { MyCommunitiesSection } from '@/features/community/components/sections/MyCommunitiesSection'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'


export default function CommunitiesPage() {
  const [isCreateCommunityFormOpen, setIsCreateCommunityFormOpen] = useState(false)

  return (
    <section className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-10 py-10 sm:py-15')}>
        <MyCommunitiesSection onCreateCommunity={() => setIsCreateCommunityFormOpen(true)} />
        <ExploreCommunitiesSection />
      </main>

      <CreateCommunityForm
        isOpen={isCreateCommunityFormOpen}
        onClose={() => setIsCreateCommunityFormOpen(false)}
      />
    </section>
  )
}
