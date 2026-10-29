import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCarReportOrderDetail } from '../api/index';
import { ReportOrderDetail } from '../types/index';

// Single order for the order-detail screen, resolved from the `?orderId=` query.
const useReportOrderDetail = (orderId?: string | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [order, setOrder] = useState<ReportOrderDetail | undefined>();
    // Starts false with no orderId: the page redirects to the list in that case, and a
    // true here would flash a skeleton on the way out.
    const [isLoading, setIsLoading] = useState(!!orderId);
    const [isError, setIsError] = useState(false);

    const fetchOrder = useCallback(
        async (isStale: () => boolean = () => false) => {
            if (!orderId) {
                setOrder(undefined);
                setIsLoading(false);
                return false;
            }
            setIsLoading(true);
            const resp = await getCarReportOrderDetail({ userId: id, userType: role, orderId });
            if (isStale()) return resp;
            // `false` means the request failed or the order isn't this corporate's; the
            // page's existing empty state covers both.
            setOrder(resp || undefined);
            setIsError(!resp);
            setIsLoading(false);
            return resp;
        },
        [id, role, orderId]
    );

    useEffect(() => {
        let active = true;
        fetchOrder(() => !active);
        return () => {
            active = false;
        };
    }, [fetchOrder]);

    return { order, isLoading, isError, refetch: () => fetchOrder() };
};

export default useReportOrderDetail;
