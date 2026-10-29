import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { formattedDateTime } from '@utils/dateFormat';

import { getTransactionDetail, TransactionDetailItem } from '../../api/user/transactionsApi';
import { formatRupeesDecimal } from '../../utils/helpers';
import { DetailSection, TransactionDetail } from '../../utils/types';

/** Map the API detail row to the TransactionSummaryCard view-model. */
const toDetail = (t: TransactionDetailItem): TransactionDetail => {
    const sections: DetailSection[] = [];

    if (t.cardholder) {
        sections.push({
            title: 'Cardholder Details',
            fields: [
                { label: 'Name', value: t.cardholder.name || '—' },
                { label: 'Email', value: t.cardholder.email || '—' },
                { label: 'Role', value: t.cardholder.role || '—' },
                { label: 'Team', value: t.cardholder.team || '—' },
            ],
        });
    }

    const transactionFields = [
        { label: 'Transaction ID', value: t.displayId || '—' },
        { label: 'Status', value: t.status || '—' },
        { label: 'Category', value: t.category || '—' },
        { label: 'Merchant', value: t.merchantName || '—' },
        { label: 'City', value: t.merchantCity || '—' },
    ];
    if (t.declineReason)
        transactionFields.push({ label: 'Decline reason', value: t.declineReason });
    sections.push({ title: 'Transaction Details', fields: transactionFields });

    return {
        merchantName: t.merchantName || 'Transaction',
        maskedCardNumber: t.maskedCardNumber ?? null,
        timestamp: t.createdAt ? formattedDateTime(new Date(t.createdAt)) : '',
        transactionAmount: formatRupeesDecimal(t.transactionAmount),
        internationalFee: formatRupeesDecimal(0),
        totalCharged: formatRupeesDecimal(t.transactionAmount),
        sections,
    };
};

export const useTransactionDetailApi = (transactionId: string | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [detail, setDetail] = useState<TransactionDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDetail = useCallback(async () => {
        if (!transactionId) return;
        setIsLoading(true);
        const res = await getTransactionDetail(role, id, transactionId);
        if (res && res.data?.transaction) setDetail(toDetail(res.data.transaction));
        setIsLoading(false);
    }, [role, id, transactionId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return { detail, isLoading };
};
