export interface CreateCommunityPayload {
  name: string
  description: string
  slug: string
  isPrivate: boolean
  categoryId: number
  tagIds: number[]
  rules: string[]
}

export interface CategoryOption {
  categoryId: number
  name: string
}


export interface TagOption {
  tagId: number
  name: string
  categoryId: number | null
  isInterest: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CommunitiesQuery {
  search?: string
  categoryId?: number
  sort?: 'popularity'
  page?: number
  limit?: number
}

export interface CommunityListItem {
  id: number
  name: string
  description: string
  slug: string
  isPrivate: boolean
  imageUrl: string | null
  bannerUrl: string | null
  createdAt: string
  category: CategoryOption | null
  memberCount: number
  recentPostCount: number
  popularityScore: number
  membershipRole?: string | null
}

export interface CommunityTagItem {
  tagId: number
  name: string
}

export interface CommunityRuleItem {
  communityRuleId: number
  description: string
}

export interface ForumPostAuthor {
  communityProfileId: number
  displayName: string
  role: string
}

/** Post del foro que viene dentro del detalle de la comunidad. */
export interface ForumPost {
  id: number
  title: string
  body: string
  postedAt: string
  upVotes: number
  downVotes: number
  timesSaved: number
  author: ForumPostAuthor | null
}

export interface CommunityDetail {
  id: number
  name: string
  description: string
  slug: string
  isPrivate: boolean
  imageUrl: string | null
  bannerUrl: string | null
  createdAt: string
  category: CategoryOption | null
  tags: CommunityTagItem[]
  rules: CommunityRuleItem[]
  memberCount: number
  recentPostCount: number
  popularityScore: number
  isMember: boolean
  membershipRole: string | null
  forumPosts: ForumPost[]
}

export interface RecommendedCommunityListItem extends CommunityListItem {
  matchedInterestCount: number
}

export interface CommunityStats {
  communityId: number
  memberCount: number
  postCount: number
  recentPostCount: number
}
