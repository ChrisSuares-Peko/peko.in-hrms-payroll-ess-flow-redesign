import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOrderDetails } from '../api/index';
import { EsimOrderDetails } from '../types/orderDetails';

export default function useGetOrderDetails(
    iccid: string,
    planId: string,
    customerUid?: string,
    country?: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [details, setDetails] = useState<EsimOrderDetails>({
        countryName: '',
        dataBal: '',
        esim: '',
        networks: '',
        newTopupData: '',
        validity: '',
        planName: '',
        activationMode: '',
        activatedAt: null,
        expiresAt: null,
        lastSeen: null,
        esimState: '',
        installationUrl: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const sessionData = JSON.parse(sessionStorage.getItem('ESIM') || '{}');

    const sessionIccid = sessionData.iccid || '';
    const sessionPlanId = sessionData.planId || '';
    const sessionCustomerUid = sessionData.customerUid || '';

    const memoizedIccid = useMemo(() => iccid || sessionIccid, [iccid, sessionIccid]);
    const memoizedPlanId = useMemo(() => planId || sessionPlanId, [planId, sessionPlanId]);
    const memoizedCustomerUid = useMemo(
        () => customerUid || sessionCustomerUid,
        [customerUid, sessionCustomerUid]
    );
    const memoizedCountry = useMemo(() => country, [country]);

    const getOrders = useCallback(async () => {
        if (!memoizedIccid || !memoizedPlanId) {
            setIsLoading(false);
            return;
        }
        const data: EsimOrderDetails | false = await getOrderDetails({
            userId: id,
            userType: role,
            iccid: memoizedIccid,
            planId: memoizedPlanId,
            customerUid: memoizedCustomerUid,
            country: memoizedCountry,
        });

        if (data) {
            setDetails(data);
        }
        setIsLoading(false);
    }, [memoizedIccid, memoizedPlanId, id, role, memoizedCustomerUid, memoizedCountry]);

    useEffect(() => {
        getOrders();
    }, [getOrders]);

    return { data: details, isLoading };
}
