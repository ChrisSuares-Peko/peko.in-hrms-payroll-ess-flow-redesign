import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ChargeTerms,
    PaymentLinkCharge,
    PaymentLinkChargeRow,
    PaymentLinkChargesFilters,
    PaymentLinkChargesResponse,
} from '../types/thirdPartyConfiguration';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/third-party-configuration/payment-links`;

export const getPaymentLinkCharges = async (payload: UserPayload & PaymentLinkChargesFilters) => {
    try {
        const { userId, userType, ...filters } = payload;
        const resp: SuccessGenericResponse<PaymentLinkChargesResponse> = await ApiClient.get(
            base({ userId, userType }),
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const putDefaultPaymentLinkCharge = async (payload: UserPayload & ChargeTerms) => {
    try {
        const { userId, userType, percentage, fixed } = payload;
        const resp: SuccessGenericResponse<{ defaultCharge: PaymentLinkCharge }> =
            await ApiClient.put(`${base({ userId, userType })}/default`, { percentage, fixed });
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const putCorporatePaymentLinkCharge = async (
    payload: UserPayload & ChargeTerms & { credentialId: number }
) => {
    try {
        const { userId, userType, credentialId, percentage, fixed } = payload;
        const resp: SuccessGenericResponse<
            Pick<PaymentLinkChargeRow, 'credentialId' | 'corporate' | 'charge'>
        > = await ApiClient.put(`${base({ userId, userType })}/corporates/${credentialId}`, {
            percentage,
            fixed,
        });
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const deleteCorporatePaymentLinkCharge = async (
    payload: UserPayload & { credentialId: number }
) => {
    try {
        const { userId, userType, credentialId } = payload;
        const resp: SuccessGenericResponse<{ credentialId: number }> = await ApiClient.delete(
            `${base({ userId, userType })}/corporates/${credentialId}`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
