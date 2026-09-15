
export interface Community {
  id: number
  name: string
  description: string
  slug: string
  isActive: boolean
  isPrivate: boolean
  createdAt: Date
  imageUrl: string | null
  bannerUrl: string | null
  categoryId: number
  communityTags: number[]
  rules: string[]
}


export interface Category {
  categoryId: number
  name: string
  communities: Community[]
  tags: Tag[]
}

export interface Tag{
  tagId: number
  name: string
  categoryId: number
  category: Category
  isInterest: boolean
  communityTags: CommunityTag[]
  userTags: UserTag[]
}

export interface CommunityTag {
  communityTagId: number
  communityId: number
  tagId: number
  community: Community
  tag: Tag
}

export interface UserTag {
  userTagId: number
  userId: string
  tagId: number
 // user: User
  tag: Tag
}