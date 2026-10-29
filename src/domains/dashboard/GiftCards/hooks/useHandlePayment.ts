import { useState } from 'react';

import useCodeIssueApi from './useCodeIssueApi';
import usePaymentRequest from './usePaymentRequest';

const useHandlePayment = () => {
    const { handlePaymentRequest } = usePaymentRequest();
    const getCodeData = useCodeIssueApi();
    const [paymentSuccessful, setPaymentSuccessful] = useState<boolean>(false);

    const handleSubmit = async (data: any) => {
        const payStatus = await handlePaymentRequest(data);
        setPaymentSuccessful(payStatus);

        if (payStatus) {
            setTimeout(() => {
                getCodeData(data.id);
            }, 10000);
        }
    };

    return { handleSubmit, paymentSuccessful };
};

export default useHandlePayment;
