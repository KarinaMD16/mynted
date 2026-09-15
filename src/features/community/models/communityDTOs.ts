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
