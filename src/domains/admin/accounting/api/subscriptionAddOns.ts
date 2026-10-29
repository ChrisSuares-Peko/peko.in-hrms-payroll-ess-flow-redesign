import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

// cashbackId is null until the package's add-on pricing is first saved.
export type SubscriptionAddOnRow = {
    packageId: number;
    cashbackId: number | null;
    packageName: string | null;
    serviceProvider: string | null;
    accessKey: string | null;
    serviceOperatorId: number;
    partnerId: number | string | null;
    partnerName: string | null;
    unitPrice: string | null;
    baseLimit: string | null;
    cashbackType: string | null;
    cashback: string | null;
    surchargeType: string | null;
    surcharge: string | null;
};

export type SubscriptionAddOnKind = 'addons' | 'others';

export type SubscriptionAddOnsQuery = {
    page: number;
    itemsPerPage: number;
    searchText?: string;
    partnerId?: string;
    kind?: SubscriptionAddOnKind;
};

export type SubscriptionAddOnsResponse = {
    data: SubscriptionAddOnRow[];
    recordsTotal: number;
};

// Some packages have duplicate cashback rows for the same service, so only cashbackId is safe to key on.
export const addonRowKey = (row: SubscriptionAddOnRow) =>
    row.cashbackId != null
        ? `cb-${row.cashbackId}`
        : `pkg-${row.packageId}-${row.serviceOperatorId}`;

export const getSubscriptionAddOns = async (payload: UserPayload & SubscriptionAddOnsQuery) => {
    try {
        const resp: SuccessGenericResponse<SubscriptionAddOnsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/cashback/subscription-add-ons`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    partnerId: payload.partnerId,
                    kind: payload.kind,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
