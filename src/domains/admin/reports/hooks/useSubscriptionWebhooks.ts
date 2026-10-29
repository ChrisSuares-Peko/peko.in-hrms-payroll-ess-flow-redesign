import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { clearWebhookEvents, listWebhookEvents, retryWebhookEvent } from '../api/subscriptionWebhooks';
import { WebhookEvent, WebhookFilters } from '../types/subscriptionWebhook';

const useSubscriptionWebhooks = (filters: WebhookFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [tableData, setTableData] = useState<WebhookEvent[]>([]);
    const [total, setTotal] = useState(0);
    const [retryingId, setRetryingId] = useState<number | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data = await listWebhookEvents({ userId: id, userType: role, ...filters });
        if (data) {
            setTableData(data.data);
            setTotal(data.total);
        }
        setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, filters.status, filters.webhookContext, filters.vendorSubscriptionId, filters.fromDate, filters.toDate, filters.page, filters.limit, filters.sortOrder]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    const handleRetry = useCallback(
        async (webhookId: number) => {
            setRetryingId(webhookId);
            const result = await retryWebhookEvent({ userId: id, userType: role, webhookId });
            if (result && result.status) {
                dispatch(showToast({ variant: 'success', description: 'Webhook reprocessed successfully.' }));
                getAllTableData();
            } else {
                dispatch(showToast({ variant: 'error', description: 'Retry failed. Please try again.' }));
            }
            setRetryingId(null);
        },
        [id, role, dispatch, getAllTableData]
    );

    const handleClear = useCallback(
        async (status: string, olderThanDays?: number) => {
            setIsClearing(true);
            const result = await clearWebhookEvents({ userId: id, userType: role, status, olderThanDays });
            if (result && result.status) {
                dispatch(showToast({ variant: 'success', description: result.message }));
                getAllTableData();
            } else {
                dispatch(showToast({ variant: 'error', description: 'Failed to clear webhook events.' }));
            }
            setIsClearing(false);
        },
        [id, role, dispatch, getAllTableData]
    );

    return { isLoading, tableData, total, retryingId, handleRetry, isClearing, handleClear };
};

export default useSubscriptionWebhooks;
