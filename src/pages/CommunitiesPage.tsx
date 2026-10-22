import { useState } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CreateCommunityForm } from '@/features/community/components/create/CreateCommunityForm'
import { ExploreCommunitiesSection } from '@/features/community/components/sections/ExploreCommunitiesSection'
import { MyCommunitiesSection } from '@/features/community/components/sections/MyCommunitiesSection'


export default function CommunitiesPage() {
  const [isCreateCommunityFormOpen, setIsCreateCommunityFormOpen] = useState(false)

  return (
    <section className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-4 py-10 sm:px-6 sm:py-15 lg:px-14">
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
