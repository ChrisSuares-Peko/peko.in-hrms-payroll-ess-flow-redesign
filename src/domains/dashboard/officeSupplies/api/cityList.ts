import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export type CitySearchPayload = {
    userId: number;
    userType: string;
    searchText: string;
};

/**
 * Google Places-backed city autocomplete, served by the purchase MS
 * (`purchase/ecommerce/cities`). Returns `{ label: cityName, value: placeId }[]`
 * or `false` on error. We only consume `label`; the std-code mapping happens
 * locally in `useCitySearch`.
 */
export const searchCities = async ({ userId, userType, searchText }: CitySearchPayload) => {
    try {
        const resp: SuccessGenericResponse<{ cities: DropDown }> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/cities`,
            { params: { searchText } }
        );
        return resp.data?.cities || [];
    } catch (err) {
        return false;
    }
};

export type PostcodePayload = {
    userId: number;
    userType: string;
    postcode: string;
};

/**
 * Resolve an Indian pincode to { city, state } via the purchase MS (India Post,
 * no key). Returns `false` on error / invalid pincode.
 */
export const lookupPostcode = async ({ userId, userType, postcode }: PostcodePayload) => {
    try {
        const resp: SuccessGenericResponse<{ city: string; state: string }> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/lookup-postcode`,
            { params: { postcode } }
        );
        return resp.data || false;
    } catch (err) {
        return false;
    }
};

/** Distinct seller (vendorName) list for the current listing (city + search/category). */
export const getEcommerceSellers = async ({
    userId,
    userType,
    city,
    search,
    localCategory,
}: {
    userId: number;
    userType: string;
    city: string;
    search?: string;
    localCategory?: string;
}) => {
    try {
        const resp: SuccessGenericResponse<{ sellers: string[] }> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/sellers`,
            { params: { city, search, localCategory } }
        );
        return resp.data?.sellers || [];
    } catch (err) {
        return [];
    }
};
