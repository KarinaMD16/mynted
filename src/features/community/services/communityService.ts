import myntedAPI from "@/api/apiConfig";
import type { CategoryOption, PaginatedResponse, TagOption } from "../models/communityDTOs";

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
