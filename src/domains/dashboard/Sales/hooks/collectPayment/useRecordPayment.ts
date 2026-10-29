import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllDocuments } from '../../api/documents';
import { DocumentRow } from '../../types/documents';

const ITEMS_PER_PAGE = 10;

const useRecordPayment = (open: boolean) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [invoices, setInvoices] = useState<DocumentRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async (currentPage: number) => {
        setIsLoading(true);
        const data = await getAllDocuments({
            userId: id,
            userType: role,
            sort: 'DESC',
            sortField: 'createdAt',
            searchText: '',
            page: currentPage,
            status: 'Pending,Overdue',
            itemsPerPage: ITEMS_PER_PAGE,
            documentType: 'INVOICE',
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
            setInvoices(
                data.invoiceData.map(row => ({
                    id: row.id,
                    prefix: row.prefix,
                    documentNumber: row.invoiceNumber,
                    name: row.name,
                    phoneNumber: row.phoneNumber,
                    createdAt: row.createdAt,
                    totalAmount: row.totalAmount,
                    transactionType: row.invoiceType,
                    documentType: row.documentType,
                    status: row.status,
                    documentDate: row.invoiceDate,
                    dueDate: row.dueDate,
                    amountDue: row.amountDue,
                }))
            );
            setTotalRecords(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, role, dispatch]);

    useEffect(() => {
        if (!open) return;
        fetchData(page);
    }, [open, page, fetchData]);

    useEffect(() => {
        if (!open) setPage(1);
    }, [open]);

    return { invoices, isLoading, totalRecords, page, setPage, itemsPerPage: ITEMS_PER_PAGE };
};

export default useRecordPayment;
