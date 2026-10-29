import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { exportTransactionsReport, getTransactions } from '../api';
import { TransactionRecord } from '../types/paymentLinkTypes';

export default function useGetTransactions() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        const data = await getTransactions({
            userId: id,
            userType: role,
            page,
            limit: 10,
            status: statusFilter || undefined,
            search: search || undefined,
            paymentMethod: paymentMethodFilter || undefined,
        });
        setIsLoading(false);

        if (data) {
            setTransactions(data.transactions);
            setTotal(data.pagination.total);
        }
    }, [id, role, page, search, statusFilter, paymentMethodFilter]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const exportTransactions = useCallback(async () => {
        setIsExporting(true);
        const data: CommonFileBuffer | false = await exportTransactionsReport({
            userId: id,
            userType: role,
            type: 'excel',
            status: statusFilter || undefined,
            search: search || undefined,
        });

        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });
            saveAs(blob, 'Payment_Link_Transactions.xlsx');
        }

        setIsExporting(false);
    }, [id, role, search, statusFilter]);

    return {
        isLoading,
        isExporting,
        transactions,
        total,
        page,
        setPage,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        paymentMethodFilter,
        setPaymentMethodFilter,
        exportTransactions,
    };
}
