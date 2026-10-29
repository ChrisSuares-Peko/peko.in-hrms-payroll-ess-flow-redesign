import { useAppSelector } from '@src/hooks/store';

import { makePayment } from '../api/index';
import { PaymentPayload } from '../types/types';

export default function usePaymentRequest() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const handlePaymentRequest = async (payload: PaymentPayload): Promise<boolean> => {
        const response = await makePayment({
            ...payload,
            credentialId: id,
            userType: role,
        });

        return response;
    };

    return { handlePaymentRequest };
}
