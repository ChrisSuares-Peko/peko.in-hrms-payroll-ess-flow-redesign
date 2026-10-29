import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { PackageFilters } from '@src/domains/admin/settings/types/package';
import { ApiClient } from '@src/services/config';

import { SubscriptionPackagesResponse, SubscriptionPricing } from '../types/catalog';

export const getSubscriptionPackages = async (payload: UserPayload & PackageFilters) => {
    try {
        const { userId, userType, page, searchText, itemsPerPage, sort, sortField, partnerId } =
            payload;
        const resp: SuccessGenericResponse<SubscriptionPackagesResponse> = await ApiClient.get(
            `${userType}/${userId}/others/package/accounting/subscriptions`,
            {
                params: {
                    page,
                    itemsPerPage,
                    searchText: searchText || undefined,
                    sort: sort || undefined,
                    sortField: sortField || undefined,
                    partnerId: partnerId || undefined,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export type PartnerTermsPayload = {
    id: number;
    sharePercentage?: number;
    gatewayCharge?: { percentage: number; fixed: number } | null;
};

export const patchPartnerShare = async (payload: UserPayload & PartnerTermsPayload) => {
    try {
        const { userId, userType, id, sharePercentage, gatewayCharge } = payload;
        const body = {
            ...(sharePercentage !== undefined && { sharePercentage }),
            ...(gatewayCharge !== undefined && { gatewayCharge }),
        };
        const resp: SuccessGenericResponse<Omit<PartnerTermsPayload, 'id'> & { id: number }> =
            await ApiClient.patch(`${userType}/${userId}/others/branding/${id}/share`, body);
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const patchSubscriptionPricing = async (
    payload: UserPayload & { id: number } & SubscriptionPricing
) => {
    try {
        const { userId, userType, id, packagePrices, discount } = payload;
        const resp: SuccessGenericResponse<{ id: number } & SubscriptionPricing> =
            await ApiClient.patch(`${userType}/${userId}/others/package/${id}/accounting`, {
                packagePrices,
                discount,
            });
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const patchSubscriptionPricingBulk = async (
    payload: UserPayload & { ids: number[] } & SubscriptionPricing
) => {
    try {
        const { userId, userType, ids, packagePrices, discount } = payload;
        const resp: SuccessGenericResponse<{ ids: number[] } & SubscriptionPricing> =
            await ApiClient.patch(`${userType}/${userId}/others/package/accounting/bulk`, {
                ids,
                packagePrices,
                discount,
            });
        return resp.data;
    } catch (err) {
        return false;
    }
};
