import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { formattedDateOnly } from '@utils/dateFormat';

import { GetTransactionsParams, getUserTransactions } from '../../api/user/transactionsApi';
import { TransactionRow } from '../../utils/types';

const PAGE_SIZE = 10;

export interface TransactionFilters {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    category?: string;
    searchText?: string;
    userId?: string;
    cardLast4?: string;
}

export const useUserTransactionsApi = (
    page: number,
    filters: TransactionFilters,
    refreshKey = 0
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [transactions, setTransactions] = useState<TransactionRow[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Debounce only while there is something to type. Without this, clearing the box waits the full
    // 500ms before the unfiltered list returns, which reads as the search being stuck.
    const debouncedSearch = useDebounce(filters.searchText ?? '', 500);
    const effectiveSearch = filters.searchText ? debouncedSearch : '';

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        const params: GetTransactionsParams = {
            page,
            itemsPerPage: PAGE_SIZE,
            ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
            ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.category ? { category: filters.category } : {}),
            ...(effectiveSearch ? { searchText: effectiveSearch } : {}),
            ...(filters.cardLast4 ? { cardLast4: filters.cardLast4 } : {}),
            // Only an admin narrows to a cardholder. An employee's own scope is derived server-side from
            // their session identity, so sending an id from here could only ever contradict it.
            ...(filters.userId ? { userId: String(filters.userId) } : {}),
        };
        const res = await getUserTransactions(role, id, params);
        if (res && res.data) {
            setTotal(res.data.count);
            setTransactions(
                res.data.rows.map(r => ({
                    key: String(r.id),
                    cardLast4: r.cardLast4 ? `**** **** **** ${r.cardLast4}` : '—',
                    date: r.date ? formattedDateOnly(new Date(r.date)) : '—',
                    // The column shows the day; the raw instant is kept so the cell can reveal the
                    // time on hover without a second request.
                    dateTime: r.date ?? null,
                    merchant: r.merchant,
                    member: r.member ?? '',
                    holderId: r.holderId ?? null,
                    status: r.status as TransactionRow['status'],
                    approval: (r.approval ?? 'Auto-approved') as TransactionRow['approval'],
                    declineReason: r.declineReason ?? null,
                    fee: r.fee ?? 0,
                    amount: r.amount,
                    transactionId: r.transactionId,
                    category: r.category,
                }))
            );
        } else {
            // A failed request must not leave the previous, unfiltered rows on screen — that is
            // indistinguishable from a search that ran and changed nothing. ApiClient already toasts.
            setTotal(0);
            setTransactions([]);
        }
        setIsLoading(false);
    }, [
        role,
        id,
        page,
        filters.dateFrom,
        filters.dateTo,
        filters.status,
        filters.category,
        effectiveSearch,
        filters.userId,
        filters.cardLast4,
    ]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions, refreshKey]);

    return { transactions, total, isLoading, pageSize: PAGE_SIZE };
};
