import { useEffect, useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchWhatsappDetails } from '../api';
import { WhatsappDetailsResponse } from '../types';

const useWhatsAppDetails = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [subscriptionDetails, setSubscriptionDetails] = useState<WhatsappDetailsResponse>({
        isPurchased: false,
        previousSubscription: null,
    });

    const getWhatsAppPlanDetails = useCallback(async () => {
        const resp = await fetchWhatsappDetails({
            userId: id,
            userType: role,
        });
        if (resp) {
            setSubscriptionDetails(resp);
        }
    }, [id, role]);

    useEffect(() => {
        getWhatsAppPlanDetails();
    }, [getWhatsAppPlanDetails]);

    return {
        subscriptionDetails,
    };
};

export default useWhatsAppDetails;
