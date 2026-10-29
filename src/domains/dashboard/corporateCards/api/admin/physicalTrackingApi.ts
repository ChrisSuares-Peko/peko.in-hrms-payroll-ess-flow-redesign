import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/** One courier movement the issuer pushed for a physical card. */
export interface DispatchApiRecord {
    awbNumber: string | null;
    courierPartnerName: string | null;
    courierPartnerId: number | null;
    /** As the issuer sent it — no timezone. */
    dispatchedOn: string | null;
    /** The same instant, zone-resolved server-side. Prefer this for formatting. */
    dispatchedAtUtc: string | null;
    origin: string | null;
    receivedAt: string | null;
}

export interface PhysicalTrackingApiRow {
    key: string;
    cardIssuanceId: number;
    orderedOn: string;
    holderId: string | number | null;
    holder: string | null;
    department: string | null;
    maskedCardNumber: string | null;
    last4: string | null;
    nameOnCard: string | null;
    shippingAddress: string | null;
    referenceNumber: string | null;
    status: string;
    dispatches: DispatchApiRecord[];
    dispatchCount: number;
}

export interface PhysicalTrackingApiResponse {
    count: number;
    page: number;
    itemsPerPage: number;
    rows: PhysicalTrackingApiRow[];
}

export const getPhysicalTracking = async (
    userType: string,
    userId: number,
    page: number,
    itemsPerPage: number,
    status?: string
) => {
    try {
        const res: SuccessGenericResponse<PhysicalTrackingApiResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cards/physical-tracking`,
            { params: { page, itemsPerPage, ...(status ? { status } : {}) } }
        );
        return res;
    } catch {
        return false;
    }
};
