import { useState } from 'react';

const useUpiCollect = () => {
    const [isLoading, setIsLoading] = useState(false);

    const markAsReceived = (invoiceId: string, onSuccess: () => void) => {
        setIsLoading(true);
        // TODO: replace with real API call
        setTimeout(() => {
            setIsLoading(false);
            onSuccess();
        }, 1000);
    };

    return { markAsReceived, isLoading };
};

export default useUpiCollect;
