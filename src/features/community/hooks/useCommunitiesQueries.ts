import { useQuery } from "@tanstack/react-query"
import {
  getCategories,
  getCommunities,
  getCommunityDetail,
  getMyCommunities,
  getTags,
} from "../services/communityService"
import type { CommunitiesQuery } from "../models/communityDTOs"

export const communityKeys = {
  all: ['communities'] as const,
  list: (query: CommunitiesQuery) => ['communities', 'list', query] as const,
  mine: (query: CommunitiesQuery) => ['communities', 'mine', query] as const,
  detail: (communityId: number) => ['communities', 'detail', communityId] as const,
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

export const useCommunities = (query: CommunitiesQuery = {}) => {
  return useQuery({
    queryKey: communityKeys.list(query),
    queryFn: () => getCommunities(query),
  })
}

export const useMyCommunities = (query: CommunitiesQuery = {}, enabled = true) => {
  return useQuery({
    queryKey: communityKeys.mine(query),
    queryFn: () => getMyCommunities(query),
    enabled,
  })
}

export const useCommunityDetail = (communityId: number, enabled = true) => {
  return useQuery({
    queryKey: communityKeys.detail(communityId),
    queryFn: () => getCommunityDetail(communityId),
    enabled: enabled && Number.isFinite(communityId) && communityId > 0,
  })
}
