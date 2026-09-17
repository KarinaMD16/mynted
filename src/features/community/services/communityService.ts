import myntedAPI from "@/api/apiConfig";
import type {
    CategoryOption,
    CommunitiesQuery,
    CommunityDetail,
    CommunityListItem,
    PaginatedResponse,
    TagOption,
} from "../models/communityDTOs";

export const createCommunity = async (data: FormData) => {
    try {
        const response = await myntedAPI.post('/communities', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating community:', error);
        throw error;
    }
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

export const getCommunityDetail = async (communityId: number): Promise<CommunityDetail> => {
    const { data } = await myntedAPI.get<CommunityDetail>(`/communities/${communityId}`);
    return data;
};

export const joinCommunity = async (communityId: number) => {
    const { data } = await myntedAPI.post(`/communities/${communityId}/join`);
    return data;
};

export const leaveCommunity = async (communityId: number) => {
    const { data } = await myntedAPI.delete(`/communities/${communityId}/leave`);
    return data;
};
