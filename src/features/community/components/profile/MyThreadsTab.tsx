import { useMyForumPosts } from '@/features/community/hooks/useForumQueries'
import { ProfilePostCard } from '../cards/ProfilePostCard'
import { ProfileFeedFrame } from './ProfileFeedFrame'

/** Pestaña "Hilos" del perfil: los posts del usuario, GET /forums/me (más recientes primero). */
export function MyThreadsTab() {
  const query = useMyForumPosts()
  const posts = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <ProfileFeedFrame
      query={query}
      isEmpty={posts.length === 0}
      emptyTitle="profile.tabs.threadsEmptyTitle"
      emptySubtitle="profile.tabs.threadsEmptySubtitle"
    >
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id}>
            <ProfilePostCard post={post} />
          </li>
        ))}
      </ul>
    </ProfileFeedFrame>
  )
}
