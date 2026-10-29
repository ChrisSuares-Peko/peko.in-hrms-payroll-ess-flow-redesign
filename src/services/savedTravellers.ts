import { SavedTraveller, SavedTravellerPayload } from '@customtypes/savedTraveller';

import { ApiClient } from './config';

interface UserScope {
    userType: string;
    userId: number;
}

export const getSavedTravellers = async ({
    userType,
    userId,
    type,
    searchText,
}: UserScope & { type: string; searchText?: string }): Promise<
    { travellers: SavedTraveller[]; limit: number } | false
> => {
    try {
        const resp: any = await ApiClient.get(`${userType}/${userId}/others/saved-travellers`, {
            params: { type, searchText },
        });
        return {
            travellers: resp.data ?? [],
            limit:
                resp.limit == null || !Number.isFinite(Number(resp.limit))
                    ? Infinity
                    : Number(resp.limit),
        };
    } catch (err) {
        return false;
    }
};

export interface SavedTravellerPostResponse {
    status: boolean;
    data?: SavedTraveller;
    message?: string;
    responseCode?: string;
}

export const postSavedTraveller = async (
    userType: string,
    userId: number,
    payload: SavedTravellerPayload & { type: string }
): Promise<SavedTravellerPostResponse | null> => {
    try {
        const resp: any = await ApiClient.post(
            `${userType}/${userId}/others/saved-travellers`,
            payload
        );
        return resp as SavedTravellerPostResponse;
    } catch (err) {
        return null;
    }
};

export const putSavedTraveller = async (
    userType: string,
    userId: number,
    id: number,
    payload: SavedTravellerPayload
): Promise<SavedTraveller | false> => {
    try {
        const resp: any = await ApiClient.put(
            `${userType}/${userId}/others/saved-travellers/${id}`,
            payload
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const deleteSavedTraveller = async (
    userType: string,
    userId: number,
    id: number
): Promise<boolean> => {
    try {
        await ApiClient.delete(`${userType}/${userId}/others/saved-travellers/${id}`);
        return true;
    } catch (err) {
        return false;
    }
};
