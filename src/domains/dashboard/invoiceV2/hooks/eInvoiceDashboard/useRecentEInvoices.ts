import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEInvoiceAllApi } from '../../api/eInvoice';
import { RecentEInvoiceRow } from '../../types/eInvoice';
import { formatAmount } from '../../utils/helperFunctions';

const useRecentEInvoices = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<RecentEInvoiceRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRecent = useCallback(async () => {
        setIsLoading(true);
        const data = await getEInvoiceAllApi({
            userId: id,
            userType: role,
            params: {
                page: 1,
                itemsPerPage: 5,
                sort: 'DESC',
                sortField: 'id',
                from: '',
                to: '',
            },
        });
        setIsLoading(false);
        if (!data) return;

        setRows(
            data.eInvoices.map(item => ({
                id: String(item.id),
                invoiceId: item.prefix ? `${item.prefix}${item.docNo}` : item.docNo,
                date: item.docDate,
                buyerName: item.buyerDetails.legalName,
                buyerGstin: item.buyerDetails.gstin,
                supply: item.supplyType,
                amount: formatAmount(item.totalAmount),
                status: item.status === 'ACTIVE' ? 'Active' : 'Cancelled',
            }))
        );
    }, [id, role]);

    useEffect(() => {
        fetchRecent();
    }, [fetchRecent]);

    return { rows, isLoading };
};

export default useRecentEInvoices;
