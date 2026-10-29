import { UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { StorefrontCategoryTreeRow } from '../utils/officeSupplyCategories';

export const getOndcOfficeSupplyCategories = async (payload: UserPayload) => {
    try {
        const resp: unknown = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/categories`
        );
        const data = Array.isArray(resp) ? resp : (resp as { data?: unknown })?.data;
        return Array.isArray(data) ? (data as StorefrontCategoryTreeRow[]) : [];
    } catch (err) {
        console.error('getOndcOfficeSupplyCategories failed:', err);
        return false;
    }
};
