import { useQuery } from "@tanstack/react-query"
import {
  getCategories,
  getCommunities,
  getCommunityDetailBySlug,
  getCommunityJoinRequests,
  getCommunityStats,
  getRecommendedCommunities,
  getMyCommunities,
  getTags,
} from "../services/communityService"
import type { CommunitiesQuery } from "../models/communityDTOs"

export const communityKeys = {
  all: ['communities'] as const,
  list: (query: CommunitiesQuery) => ['communities', 'list', query] as const,
  mine: (query: CommunitiesQuery) => ['communities', 'mine', query] as const,
  detailBySlug: (slug: string) => ['communities', 'detail', 'slug', slug] as const,
  recommended: (query: CommunitiesQuery) => ['communities', 'recommended', query] as const,
  stats: (communityId: number) => ['communities', 'stats', communityId] as const,
  joinRequests: (communityId: number) => ['communities', 'join-requests', communityId] as const,
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
  })
}

export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
    staleTime: 1000 * 60 * 10,
  })
}

export const useCommunities = (query: CommunitiesQuery = {}, enabled = true) => {
  return useQuery({
    queryKey: communityKeys.list(query),
    queryFn: () => getCommunities(query),
    enabled,
  })
}

export const useMyCommunities = (query: CommunitiesQuery = {}, enabled = true) => {
  return useQuery({
    queryKey: communityKeys.mine(query),
    queryFn: () => getMyCommunities(query),
    enabled,
  })
}

export const useCommunityDetailBySlug = (slug: string, enabled = true) => {
  return useQuery({
    queryKey: communityKeys.detailBySlug(slug),
    queryFn: () => getCommunityDetailBySlug(slug),
    enabled: enabled && slug.length > 0,
  })
}

export const useRecommendedCommunities = (query: CommunitiesQuery = {}, enabled = true) => {
  return useQuery({
    queryKey: communityKeys.recommended(query),
    queryFn: () => getRecommendedCommunities(query),
    enabled,
  })
}

export const useCommunityStats = (communityId: number | undefined, enabled = true) => {
  return useQuery({
    queryKey: communityKeys.stats(communityId ?? 0),
    queryFn: () => getCommunityStats(communityId as number),
    enabled: enabled && typeof communityId === 'number' && communityId > 0,
  })
}

export const useCommunityJoinRequests = (communityId: number, enabled = true) => {
  return useQuery({
    queryKey: communityKeys.joinRequests(communityId),
    queryFn: () => getCommunityJoinRequests(communityId),
    enabled: enabled && communityId > 0,
  })
}
