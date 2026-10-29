import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllInvoices } from '../../api/invoices';
import { InvoiceRow } from '../../types/invoice';

const ITEMS_PER_PAGE = 10;

const useSelectableInvoices = (enabled = false) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(1);

    const fetchData = useCallback(
        async (currentPage: number) => {
            setIsLoading(true);
            const data = await getAllInvoices({
                userId: id,
                userType: role,
                sort: 'DESC',
                sortField: 'createdAt',
                searchText: '',
                page: currentPage,
                status: 'Pending,Overdue',
                itemsPerPage: ITEMS_PER_PAGE,
                invoiceType: 'DOMESTIC',
            });
            if (!data) {
                dispatch(
                    showToast({
                        description: 'Something went wrong while fetching invoices.',
                        variant: 'error',
                    })
                );
            } else {
                setInvoices(data.invoiceData);
                setTotalRecords(data.recordsTotal);
            }
            setIsLoading(false);
        },
        [id, role, dispatch]
    );

    useEffect(() => {
        if (!enabled) return;
        fetchData(page);
    }, [enabled, page, fetchData]);

    useEffect(() => {
        if (!enabled) setPage(1);
    }, [enabled]);

    return { invoices, isLoading, totalRecords, page, setPage, itemsPerPage: ITEMS_PER_PAGE };
};

export default useSelectableInvoices;
