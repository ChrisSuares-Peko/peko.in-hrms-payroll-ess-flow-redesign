import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';

import {
    ApproveRequestPayload,
    CardRequestItem,
    approveRequest,
    listRequests,
    rejectRequest,
} from '../../api/admin/requestsApi';

/**
 * Admin approval queue for a single request type (CARD_ISSUANCE | LIMIT_INCREASE). Lists the requests
 * and exposes approve/reject that decide a request then silently refetch the list in place.
 */
export interface ApprovalRequestFilters {
    cardIssuanceId?: number;
    cardholder?: string;
    searchText?: string;
    dateFrom?: string;
    dateTo?: string;
    /** Narrow the queue to one status, for a tab that only ever acts on what is still open. */
    status?: string;
}

export const useApprovalRequestsApi = (
    requestType: string,
    page: number,
    pageSize: number,
    cardType?: string,
    filters: ApprovalRequestFilters = {}
) => {
    const { cardIssuanceId, cardholder, dateFrom, dateTo, searchText, status } = filters;
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<CardRequestItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [approvingIds, setApprovingIds] = useState<number[]>([]);
    const [rejectingIds, setRejectingIds] = useState<number[]>([]);

    const debouncedSearch = useDebounce(searchText ?? '', 500);
    const effectiveSearch = searchText ? debouncedSearch : '';

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        const res = await listRequests(role, id, {
            requestType,
            cardType,
            cardIssuanceId,
            cardholder,
            dateFrom,
            dateTo,
            status,
            ...(effectiveSearch ? { searchText: effectiveSearch } : {}),
            page,
            itemsPerPage: pageSize,
        });
        if (res) {
            setRows(res.data?.rows ?? []);
            setTotal(res.data?.count ?? 0);
        }
        setIsLoading(false);
    }, [
        role,
        id,
        requestType,
        cardType,
        cardIssuanceId,
        dateFrom,
        dateTo,
        cardholder,
        status,
        effectiveSearch,
        page,
        pageSize,
    ]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const approve = useCallback(
        async (requestId: number, payload?: ApproveRequestPayload) => {
            setApprovingIds(prev => [...prev, requestId]);
            const res = await approveRequest(role, id, requestId, payload);
            setApprovingIds(prev => prev.filter(x => x !== requestId));
            if (res) await fetchRequests();
            return res;
        },
        [role, id, fetchRequests]
    );

    const reject = useCallback(
        async (requestId: number, note?: string) => {
            setRejectingIds(prev => [...prev, requestId]);
            const res = await rejectRequest(role, id, requestId, note);
            setRejectingIds(prev => prev.filter(x => x !== requestId));
            if (res) await fetchRequests();
            return res;
        },
        [role, id, fetchRequests]
    );

    return {
        rows,
        total,
        isLoading,
        approvingIds,
        rejectingIds,
        approve,
        reject,
        refetch: fetchRequests,
    };
};
