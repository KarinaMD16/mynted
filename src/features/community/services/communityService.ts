import myntedAPI from "@/api/apiConfig";
import type {
    CategoryOption,
    CommunityRuleItem,
    CommunitiesQuery,
    CommunityDetail,
    CommunityListItem,
    CommunityJoinRequest,
    CommunityStats,
    JoinCommunityResult,
    RecommendedCommunityListItem,
    PaginatedResponse,
    TagOption,
} from "../models/communityDTOs";

export const createCommunity = async (data: FormData) => {
    const response = await myntedAPI.post('/communities', data, {
        headers: { 'Content-Type': 'multipart/form-data', }, 
    });
    return response.data;
};

export const getCategories = async (): Promise<CategoryOption[]> => {
    const { data } = await myntedAPI.get<CategoryOption[]>('/categories');
    return data;
};

export const getTags = async (): Promise<TagOption[]> => {
    const { data } = await myntedAPI.get<PaginatedResponse<TagOption>>('/tags', {
        params: { limit: 100 },
    });
    return data.data;
};

export const getCommunities = async (
    query: CommunitiesQuery = {},
): Promise<PaginatedResponse<CommunityListItem>> => {
    const { data } = await myntedAPI.get<PaginatedResponse<CommunityListItem>>('/communities', {
        params: query,
    });
    return data;
};

export const getMyCommunities = async (
    query: CommunitiesQuery = {},
): Promise<PaginatedResponse<CommunityListItem>> => {
    const { data } = await myntedAPI.get<PaginatedResponse<CommunityListItem>>('/users/me/communities', {
        params: query,
    });
    return data;
};

export const getRecommendedCommunities = async (
    query: CommunitiesQuery = {},
): Promise<PaginatedResponse<RecommendedCommunityListItem>> => {
    const { data } = await myntedAPI.get<PaginatedResponse<RecommendedCommunityListItem>>(
        '/users/me/recommended-communities',
        { params: query },
    );
    return data;
};

export const joinCommunity = async (communityId: number): Promise<JoinCommunityResult> => {
    const { data } = await myntedAPI.post<JoinCommunityResult>(`/communities/${communityId}/join`);
    return data;
};

export const leaveCommunity = async (communityId: number) => {
    const { data } = await myntedAPI.delete(`/communities/${communityId}/leave`);
    return data;
};

export const getCommunityDetailBySlug = async (slug: string): Promise<CommunityDetail> => {
    const { data } = await myntedAPI.get<CommunityDetail>(`/communities/by-slug/${slug}`);
    return data;
};

// --------------------------------------------------------------------------
// Moderacion: reglas y ajustes de la comunidad. El backend valida el rol
// (ver assertCommunityRole): reglas y editar son de dueno y moderadores;
// privacidad y desactivar son solo del dueno.
// --------------------------------------------------------------------------

export const getCommunityRules = async (communityId: number): Promise<CommunityRuleItem[]> => {
    const { data } = await myntedAPI.get<CommunityRuleItem[]>(`/communities/${communityId}/rules`);
    return data;
};

export const createCommunityRules = async (communityId: number, descriptions: string[]) => {
    const { data } = await myntedAPI.post(`/communities/${communityId}/rules`, { description: descriptions });
    return data;
};

export const updateCommunityRule = async (communityId: number, ruleId: number, description: string) => {
    const { data } = await myntedAPI.patch(`/communities/${communityId}/rules/${ruleId}`, { description });
    return data;
};

export const deleteCommunityRule = async (communityId: number, ruleId: number) => {
    const { data } = await myntedAPI.delete(`/communities/${communityId}/rules/${ruleId}`);
    return data;
};

export const updateCommunity = async (communityId: number, data: FormData) => {
    const response = await myntedAPI.patch(`/communities/${communityId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const setCommunityPrivacy = async (communityId: number, isPrivate: boolean) => {
    const { data } = await myntedAPI.patch(`/communities/${communityId}/${isPrivate ? 'private' : 'public'}`);
    return data;
};

export const deactivateCommunity = async (communityId: number) => {
    const { data } = await myntedAPI.patch(`/communities/${communityId}/deactivate`);
    return data;
};

export const getCommunityStats = async (communityId: number): Promise<CommunityStats> => {
    const { data } = await myntedAPI.get<CommunityStats>(`/communities/${communityId}/stats`);
    return data;
};

export const getCommunityJoinRequests = async (communityId: number): Promise<CommunityJoinRequest[]> => {
    const { data } = await myntedAPI.get<CommunityJoinRequest[]>(`/communities/${communityId}/join-requests`);
    return data;
};

export const acceptCommunityJoinRequest = async (communityId: number, requestId: number) => {
    const { data } = await myntedAPI.patch(`/communities/${communityId}/join-requests/${requestId}/accept`);
    return data;
};

export const rejectCommunityJoinRequest = async (communityId: number, requestId: number) => {
    const { data } = await myntedAPI.patch(`/communities/${communityId}/join-requests/${requestId}/reject`);
    return data;
};
