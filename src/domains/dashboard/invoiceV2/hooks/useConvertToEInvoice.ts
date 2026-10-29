import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getAllInvoices, getInvoiceById } from '../api/invoices';
import { setPrefilledIrn } from '../slices/eInvoiceIrnSlice';
import { ConvertToEInvoiceRow } from '../types/convertToEInvoice';
import { InvoiceRow } from '../types/invoice';
import { mapInvoiceToIrn } from '../utils/mapInvoiceToIrn';

const ITEMS_PER_PAGE = 10;

const mapRow = (row: InvoiceRow): ConvertToEInvoiceRow => ({
    id: row.id,
    invoiceId: `${row.prefix}${row.invoiceNumber}`,
    date: row.invoiceDate,
    buyerName: row.name,
    buyerGstin: row.gstNumber || '_',
    amount: row.totalAmount,
    status: row.status,
});

const useConvertToEInvoice = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [rows, setRows] = useState<ConvertToEInvoiceRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRowLoading, setIsRowLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchData = useCallback(
        async (currentPage: number) => {
            setIsLoading(true);
            const data = await getAllInvoices({
                userId: id,
                userType: role,
                sort: 'DESC',
                sortField: 'createdAt',
                page: currentPage,
                itemsPerPage: ITEMS_PER_PAGE,
                hasEInvoice: false,
                invoiceType: 'DOMESTIC',
            });
            if (!data) {
                dispatch(
                    showToast({
                        description: 'Failed to fetch invoices.',
                        variant: 'error',
                    })
                );
            } else {
                setRows(data.invoiceData.map(mapRow));
                setTotalRecords(data.recordsTotal);
            }
            setIsLoading(false);
        },
        [id, role, dispatch]
    );

    useEffect(() => {
        fetchData(page);
    }, [page, fetchData]);

    const handleRowClick = useCallback(
        async (row: ConvertToEInvoiceRow) => {
            setIsRowLoading(true);
            const data = await getInvoiceById({ userId: id, userType: role, invoiceId: row.id });
            if (!data) {
                dispatch(showToast({ description: 'Failed to load invoice details.', variant: 'error' }));
            } else {
                dispatch(setPrefilledIrn(mapInvoiceToIrn(data)));
                navigate(`/${paths.invoice.index}/${paths.invoice.generateIrn}`);
            }
            setIsRowLoading(false);
        },
        [id, role, dispatch, navigate]
    );

    return {
        rows,
        isLoading,
        isRowLoading,
        totalRecords,
        page,
        setPage,
        itemsPerPage: ITEMS_PER_PAGE,
        selectedIds,
        setSelectedIds,
        handleRowClick,
    };
};

export default useConvertToEInvoice;
