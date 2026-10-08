import { useMyContent } from '@/features/community/hooks/useForumQueries'
import { ContentBentoGrid } from '../feed/ContentBentoGrid'
import { ProfileFeedFrame } from './ProfileFeedFrame'

/**
 * Pestaña "Publicaciones" del perfil: lo que el usuario ha publicado en
 * total — posts y productos mezclados por fecha — con GET /posts/me,
 * dispuesto en bento grid.
 */
export function MyPublicationsTab() {
  const query = useMyContent()
  const entries = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <ProfileFeedFrame
      query={query}
      isEmpty={entries.length === 0}
      emptyTitle="profile.tabs.postsEmptyTitle"
      emptySubtitle="profile.tabs.postsEmptySubtitle"
    >
      <ContentBentoGrid entries={entries} />
    </ProfileFeedFrame>
  )
}
