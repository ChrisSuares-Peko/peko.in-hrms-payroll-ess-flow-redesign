import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getCorporateCardTransaction,
    getCorporateCardTransactions,
    getTransactedCorporates,
} from '../api/corporateCardTransactions';
import {
    CorporateCardTransactionDetail,
    CorporateCardTransactionFilters,
    CorporateCardTransactionRow,
    TransactedCorporateOption,
} from '../types/corporateCardTransactions';

const useCorporateCardTransactions = (filters: CorporateCardTransactionFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(false);
    const [tableData, setTableData] = useState<CorporateCardTransactionRow[]>([]);
    const [total, setTotal] = useState(0);
    const [corporates, setCorporates] = useState<TransactedCorporateOption[]>([]);
    const [viewRecord, setViewRecord] = useState<CorporateCardTransactionDetail | null>(null);
    const [viewLoadingId, setViewLoadingId] = useState<number | null>(null);

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data = await getCorporateCardTransactions({ userId: id, userType: role, ...filters });
        if (data) {
            setTableData(data.rows);
            setTotal(data.count);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        id,
        role,
        filters.corporateId,
        filters.cardLast4,
        filters.decision,
        filters.internalStatus,
        filters.transactionType,
        filters.category,
        filters.dateFrom,
        filters.dateTo,
        filters.searchText,
        filters.page,
        filters.itemsPerPage,
    ]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    useEffect(() => {
        const loadCorporates = async () => {
            const rows = await getTransactedCorporates(role, id);
            if (rows) setCorporates(rows);
        };
        loadCorporates();
    }, [role, id]);

    const openTransaction = useCallback(
        async (transactionId: number) => {
            setViewLoadingId(transactionId);
            const detail = await getCorporateCardTransaction(role, id, transactionId);
            setViewLoadingId(null);
            if (!detail) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Could not load the transaction. Please try again.',
                    })
                );
                return;
            }
            setViewRecord(detail);
        },
        [role, id, dispatch]
    );

    const closeTransaction = useCallback(() => setViewRecord(null), []);

    return {
        isLoading,
        tableData,
        total,
        corporates,
        viewRecord,
        viewLoadingId,
        openTransaction,
        closeTransaction,
    };
};

export default useCorporateCardTransactions;
