import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AdminPayoutOnboardingRecord,
    PayoutOnboardingListPayload,
    PayoutOnboardingListResponse,
    UpdatePayoutOnboardingStatusPayload,
} from '../types/payoutOnboarding';

export const getPayoutOnboardingList = async (
    payload: UserPayload & PayoutOnboardingListPayload
) => {
    try {
        const resp: SuccessGenericResponse<PayoutOnboardingListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/payment-links/onboarding/admin/list`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updatePayoutOnboardingStatus = async ({
    userType,
    userId,
    onboardingId,
    ...rest
}: UserPayload & UpdatePayoutOnboardingStatusPayload) => {
    try {
        const resp: SuccessGenericResponse<AdminPayoutOnboardingRecord> = await ApiClient.put(
            `${userType}/${userId}/payment/payment-links/onboarding/admin/status/${onboardingId}`,
            rest
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
