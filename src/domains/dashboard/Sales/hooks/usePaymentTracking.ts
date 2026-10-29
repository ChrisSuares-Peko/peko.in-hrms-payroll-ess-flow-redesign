import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { exportPaymentTransactions, getPaymentLinkTransactions } from '../api/payments';
import { EXPORT_MIME, STATUS_MAP } from '../constants/payments';
import { PaymentTrackingFilters } from '../types/payments';
import { PaymentRow } from '../utils/table_column/paymentTrackingColumns';

const usePaymentTracking = (filters: PaymentTrackingFilters) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<PaymentRow[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [exportingType, setExportingType] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        const result = await getPaymentLinkTransactions({ userId, userType, ...filters });
        if (result) {
            setRows(
                result.transactions.map(item => ({
                    id: item.key,
                    paymentId: item.transactionId,
                    customer: item.customerName ?? '-',
                    invoiceRef:
                        item.prefix != null || item.invoiceNumber != null
                            ? `${item.prefix ?? ''}${item.invoiceNumber ?? ''}`
                            : item.reference,
                    amount: item.amount,
                    method: item.paymentMethod ?? '-',
                    date: item.dateTime,
                    status: (STATUS_MAP[item.status.toUpperCase()] ??
                        'PENDING') as PaymentRow['status'],
                    invoiceId: item.invoiceId,
                }))
            );
            setTotal(result.pagination.total);
        }
        setIsLoading(false);
    }, [userId, userType, filters]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleExport = async (type: 'excel' | 'csv' | 'pdf') => {
        setExportingType(type);
        const data = await exportPaymentTransactions({
            userId,
            userType,
            type,
            sortField: filters.sortField,
            startDate: filters.startDate,
            endDate: filters.endDate,
            status: filters.status,
            paymentMethod: filters.paymentMethod,
            searchText: filters.searchText,
            accessKey: 'invoice',
        });
        if (data) {
            const raw = data.pdfBuffer ?? data.buffer;
            let bufferData: number[] | null = null;
            if (Array.isArray(raw?.data)) {
                bufferData = raw.data;
            } else if (raw) {
                bufferData = Object.values(raw);
            }
            if (bufferData?.length) {
                const blob = new Blob([new Uint8Array(bufferData)], { type: EXPORT_MIME[type] });
                saveAs(blob, `payment-records.${type === 'excel' ? 'xlsx' : type}`);
            }
        }
        setExportingType(null);
    };

    return { rows, total, isLoading, exportingType, handleExport };
};

export default usePaymentTracking;
