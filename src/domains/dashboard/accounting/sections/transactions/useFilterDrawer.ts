import { useEffect, useState } from 'react';

import type { Dayjs } from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { FinancialAccount, getFinancialAccounts } from '../../api/transactions';
import { TransactionFilters } from '../../utils/transactionsData';

export const useFilterDrawer = (
    open: boolean,
    onClose: () => void,
    onApply: (filters: TransactionFilters) => void
) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [fromDate, setFromDate] = useState<Dayjs | null>(null);
    const [toDate, setToDate] = useState<Dayjs | null>(null);
    const [txnType, setTxnType] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [status, setStatus] = useState('');
    const [sources, setSources] = useState<string[]>([]);
    const [bankAccounts, setBankAccounts] = useState<string[]>([]);
    const [accounts, setAccounts] = useState<FinancialAccount[]>([]);

    useEffect(() => {
        if (!open) return;
        getFinancialAccounts({ userId, userType }).then(data => {
            if (!data) return;
            setAccounts(data);
            setBankAccounts(prev => prev.filter(id => data.some(a => String(a.id) === id)));
        });
    }, [open, userId, userType]);

    const handleReset = () => {
        setFromDate(null);
        setToDate(null);
        setTxnType('');
        setCategories([]);
        setStatus('');
        setSources([]);
        setBankAccounts([]);
        onApply({});
    };

    const handleApply = () => {
        onApply({
            type: txnType,
            categories,
            status,
            sources,
            bankAccounts,
            from: fromDate ? fromDate.format('YYYY-MM-DD') : null,
            to: toDate ? toDate.format('YYYY-MM-DD') : null,
        });
        onClose();
    };

    return {
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        txnType,
        setTxnType,
        categories,
        setCategories,
        status,
        setStatus,
        sources,
        setSources,
        bankAccounts,
        setBankAccounts,
        accounts,
        handleReset,
        handleApply,
    };
};
