import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTransactions, TransactionsQuery, TransactionsTotals } from '../api/transactions';

const EMPTY_TOTALS: TransactionsTotals = {
    count: 0,
    totalAmount: 0,
    totalDiscount: 0,
    totalNetGmv: 0,
};

export default function useTransactions(filters: TransactionsQuery) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [tableData, setTableData] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const [totals, setTotals] = useState<TransactionsTotals>(EMPTY_TOTALS);

    const fetchRows = useCallback(async () => {
        setIsLoading(true);
        const data = await getTransactions({ userId: id, userType: role, ...filters });
        if (data) {
            setTableData(data.result || []);
            setCount(data.totalData || 0);
            setTotals(data.totals || EMPTY_TOTALS);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    return { isLoading, tableData, count, totals, refetch: fetchRows };
}
