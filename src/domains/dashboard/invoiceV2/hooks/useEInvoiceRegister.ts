import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEInvoiceAllApi } from '../api/eInvoice';
import {
    EInvoiceRegisterFilters,
    EInvoiceRegisterRow,
    EInvoiceRegisterStats,
} from '../types/eInvoiceRegister';

const useEInvoiceRegister = (filters: EInvoiceRegisterFilters) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<EInvoiceRegisterRow[]>([]);
    const [stats, setStats] = useState<EInvoiceRegisterStats>({
        total: 0,
        active: 0,
        cancelled: 0,
        activeValue: '',
    });
    const [recordsTotal, setRecordsTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const data = await getEInvoiceAllApi({
            userId: id,
            userType: role,
            params: {
                page: filters.page,
                itemsPerPage: filters.itemsPerPage,
                sort: filters.sort,
                sortField: filters.sortField,
                from: filters.from,
                to: filters.to,
                ...(filters.searchText.trim() && { searchText: filters.searchText.trim() }),
                ...(filters.status && { status: filters.status }),
                ...(filters.supplyType && { supplyType: filters.supplyType }),
            },
        });
        setIsLoading(false);
        if (!data) return;

        setRecordsTotal(data.recordsTotal);
        setStats({
            total: data.activeCount + data.cancelledCount,
            active: data.activeCount,
            cancelled: data.cancelledCount,
            activeValue: '',
        });

        setRows(
            data.eInvoices.map(item => ({
                id: String(item.id),
                date: item.docDate,
                document: item.prefix ? `${item.prefix}${item.docNo}` : item.docNo,
                buyerName: item.buyerDetails.legalName,
                buyerGstin: item.buyerDetails.gstin,
                irnHash: item.irn,
                irnAck: `ACK: ${item.ackNo}`,
                supply: item.supplyType,
                amount: String(item.totalAmount),
                taxableAmount: String(item.totalTaxableValue),
                status: item.status === 'ACTIVE' ? 'Active' : 'Cancelled',
                ewb: item.eWaybillId ? String(item.eWaybillId) : '---',
            }))
        );
    }, [id, role, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { rows, stats, recordsTotal, isLoading };
};

export default useEInvoiceRegister;
