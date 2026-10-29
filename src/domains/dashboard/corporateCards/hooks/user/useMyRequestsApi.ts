import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { MyRequestItem, listMyRequests } from '../../api/user/cardsApi';

/**
 * The cardholder's own requests of a single type (CARD_ISSUANCE | LIMIT_INCREASE), for the "My Requests"
 * view. Refetch is exposed so a newly-submitted request can refresh the list in place.
 */
export const useMyRequestsApi = (requestType: string, cardType?: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<MyRequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        const res = await listMyRequests(role, id, requestType, cardType);
        if (res) setRows(res.data?.rows ?? []);
        setIsLoading(false);
    }, [role, id, requestType, cardType]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    return { rows, isLoading, refetch: fetchRequests };
};
