import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getSingleSubscriptionDetails } from '../api/index';
import { SubscriptionDetailsResponse } from '../types/types';

export default function GetSingleSubscriptionDetails(subscriptionID: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [connectDetails, setConnectDetails] = useState<SubscriptionDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getConnectDetails = useCallback(async () => {
        const data: SubscriptionDetailsResponse | false = await getSingleSubscriptionDetails({
            userId: id,
            userType: role,
            subscriptionID,
        });
        if (data) {
            const connectDetailData = data as SubscriptionDetailsResponse;
            setConnectDetails(connectDetailData);
            setIsLoading(false);
        } else {
            navigate(`/${paths.subscriptions.index}`);
            dispatch(
                showToast({
                    description: 'Product not found',
                    variant: 'error',
                })
            );
            setIsLoading(false);
        }
    }, [dispatch, id, navigate, role, subscriptionID]);

    useEffect(() => {
        getConnectDetails();
    }, [getConnectDetails]);

    return { data: connectDetails, isLoading };
}
