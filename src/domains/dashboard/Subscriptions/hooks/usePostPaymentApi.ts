import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { postPaymentRequest } from '../api/index';
import { PaymentRequestPayload, PaymentRequestResponse } from '../types/types';

export default function usePaymentRequest() {
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const handlePaymentRequest = async (payload: PaymentRequestPayload) => {
        const response: false | PaymentRequestResponse = await postPaymentRequest({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            navigate(`/${paths.subscriptions.index}/${paths.subscriptions.success}`);
        } else {
            navigate(`/${paths.subscriptions.index}/${paths.subscriptions.failed}`);
        }
    };
    return { handlePaymentRequest };
}
