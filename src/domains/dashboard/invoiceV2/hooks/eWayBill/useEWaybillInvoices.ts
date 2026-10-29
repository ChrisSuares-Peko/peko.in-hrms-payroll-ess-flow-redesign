import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEInvoiceAllApi } from '../../api/eInvoice';
import { EligibleInvoice } from '../../types/eWaybill';
import { formatAmount } from '../../utils/helperFunctions';

const PAGE_SIZE = 10;

const useEWaybillInvoices = (searchText: string) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [invoices, setInvoices] = useState<EligibleInvoice[]>([]);
    const [recordsTotal, setRecordsTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const currentPage = useRef(1);

    const fetchInvoices = useCallback(
        async (page: number, append: boolean) => {
            setIsLoading(true);
            const data = await getEInvoiceAllApi({
                userId: id,
                userType: role,
                params: {
                    page,
                    itemsPerPage: PAGE_SIZE,
                    sort: 'DESC',
                    sortField: 'id',
                    from: '',
                    to: '',
                    status: 'ACTIVE',
                    hasEwaybill: false,
                    ...(searchText.trim() && { searchText: searchText.trim() }),
                },
            });
            setIsLoading(false);
            if (!data) return;

            setRecordsTotal(data.recordsTotal);
            const newItems: EligibleInvoice[] = data.eInvoices.map(item => ({
                id: String(item.id),
                invoiceNo: item.prefix ? `${item.prefix}${item.docNo}` : item.docNo,
                buyerName: item.buyerDetails.legalName,
                amount: formatAmount(item.totalAmount),
                date: item.docDate,
                irn: item.irn,
            }));

            setInvoices(prev => (append ? [...prev, ...newItems] : newItems));
        },
        [id, role, searchText]
    );

    useEffect(() => {
        currentPage.current = 1;
        fetchInvoices(1, false);
    }, [fetchInvoices]);

    const loadMore = useCallback(() => {
        if (isLoading) return;
        currentPage.current += 1;
        fetchInvoices(currentPage.current, true);
    }, [isLoading, fetchInvoices]);

    const hasMore = invoices.length < recordsTotal;

    return { invoices, recordsTotal, isLoading, hasMore, loadMore };
};

export default useEWaybillInvoices;
