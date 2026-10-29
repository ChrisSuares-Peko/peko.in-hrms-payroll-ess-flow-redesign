import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { accessKeys } from '@utils/accessKeys';

import { getDashboardData } from '../api/index';
import { resetAll, setpaymentLinkKybDetails } from '../slices/InvoicesSlices';
import { DashboardApiResponse } from '../types/index';

export default function useDashboard() {
    const { id, role } = useAppSelector(store => store.reducer.auth);
    const { paymentLinks } = accessKeys;
    useServiceAccess(paymentLinks);

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardApiResponse>();
    const dispatch = useAppDispatch();

    const dashboardData = useCallback(async () => {
        const response: DashboardApiResponse | false = await getDashboardData({
            userId: id,
            userType: role,
        });

        if (response) {
            dispatch(setpaymentLinkKybDetails(response.paymentLinkKYB));
            setData(response);
            setIsLoading(false);
        }
    }, [dispatch, id, role]);

    // useEffect(() => {
    //     const alreadyKybPageShowed = sessionStorage.getItem('isFirstCollectorLoading') === 'true';
    //     if (isPurchased && kybStatus === 'PENDING' && !alreadyKybPageShowed) {
    //         sessionStorage.setItem('isFirstCollectorLoading', 'true');
    //         navigate(paths.invoice.kybPage);
    //         return;
    //     }
    //     if (
    //         isPurchased &&
    //         (kybStatus === 'INITIATED' || kybStatus === 'REJECTED') &&
    //         !alreadyKybPageShowed
    //     ) {
    //         sessionStorage.setItem('isFirstCollectorLoading', 'true');
    //         navigate(`${paths.invoice.kybPage}/${paths.invoice.kybDocumentPage}`);
    //     }
    // }, [kybStatus, navigate, isPurchased]);

    useEffect(() => {
        dashboardData();
        dispatch(resetAll());
    }, [dashboardData, dispatch]);

    return { data, isLoading };
}
