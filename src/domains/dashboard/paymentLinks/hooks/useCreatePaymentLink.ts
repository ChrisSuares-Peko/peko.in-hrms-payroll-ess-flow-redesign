import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    createNupayCollect,
} from '../api';
import { CreatePaymentLinkPayload, CreatePaymentLinkResponse } from '../types/paymentLinkTypes';

type CreatePaymentLinkInput = Omit<CreatePaymentLinkPayload, 'userId' | 'userType'>;

// NuPay returns payment_link without a scheme (e.g. "www.npay.biz/N?uid=..."); prefix https so
// it works as an href / clipboard / WhatsApp link.
const ensureProtocol = (link: string) =>
    !link || /^https?:\/\//i.test(link) ? link : `https://${link}`;

const getNormalizedPaymentLink = (response: CreatePaymentLinkResponse) =>
    ensureProtocol(
        response.paymentLink || response.providerResponse?.data?.upi_uris?.common_uri || ''
    );

export const useCreatePaymentLink = (accessKey:"invoice" | "payment_link") => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);

    const createLink = useCallback(
        async (payload: CreatePaymentLinkInput) => {
            setLoading(true);
            const response = await createNupayCollect({
                userId: id,
                userType: role,
                accessKey,
                ...payload,
            });
            setLoading(false);

            if (!response) {
                return false;
            }

            return {
                ...response,
                paymentLink: getNormalizedPaymentLink(response),
            } as CreatePaymentLinkResponse;
        },
        [accessKey, id, role]
    );

    return { loading, createLink };
};
