import { useCallback, useEffect, useState } from 'react';

import { Modal, TableProps } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { deleteInvoiceApi, getAllInvoices, getQuotationDashboardApi } from '../../api/invoices';
import { GetAllInvoicesResponse, InvoiceRow, QuotationDashboard } from '../../types/invoice';
import { getLastMonthDateRange } from '../../utils/helperFunctions';

const defaultDateRange = getLastMonthDateRange();

const useQuotationList = () => {
    const dispatch = useAppDispatch();
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        page: 1,
        itemsPerPage: 10,
        searchText: '',
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
        status: '',
    });
    const [statusFilter, setStatusFilter] = useState<string[]>([]);

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const [quotations, setQuotations] = useState<GetAllInvoicesResponse | null>(null);
    const [dashboard, setDashboard] = useState<QuotationDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);

    const fetchDashboard = useCallback(async () => {
        setIsDashboardLoading(true);
        const data = await getQuotationDashboardApi({ userId, userType: role });
        if (data) setDashboard(data as QuotationDashboard);
        setIsDashboardLoading(false);
    }, [userId, role]);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllInvoices({
            userId,
            userType: role,
            ...filters,
            documentType: 'QUOTATION',
        });
        if (data) setQuotations(data);
        setIsLoading(false);
    }, [userId, role, filters]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const handleDateRange = (_: any, [start, end]: [string, string]) => {
        setFilters(prev => ({ ...prev, startDate: start || '', endDate: end || '', page: 1 }));
    };

    const handlePageChange = (page: number, itemsPerPage: number) => {
        setFilters(prev => ({ ...prev, page, itemsPerPage }));
    };

    const handleTableChange: TableProps<InvoiceRow>['onChange'] = (_, tableFilters, sorter) => {
        const statusValues = tableFilters?.status as string[] | null;
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        setStatusFilter(statusValues ?? []);
        setFilters(prev => ({
            ...prev,
            status: statusValues?.join(',') || '',
            sortField: (s?.field as string) || '',
            sort: s?.order === 'ascend' ? 'ASC' : 'DESC',
            page: 1,
        }));
    };

    const handleView = (id: string) => {
        navigate(`/${paths.invoice.index}/${paths.invoice.quotationDetails.replace(':id', id)}`);
    };

    const handleCreate = () => {
        navigate(`/${paths.invoice.index}/${paths.invoice.quotationCreate}`);
    };

    const handleEdit = (id: string) => {
        navigate(`/${paths.invoice.index}/${paths.invoice.quotationEdit.replace(':id', id)}`);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: 'Delete Quotation',
            content: 'Are you sure you want to delete this quotation? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await deleteInvoiceApi({ userId, userType: role, invoiceId: id });
                dispatch(showToast({ description: 'Quotation deleted successfully', variant: 'success' }));
                fetchList();
                fetchDashboard();
            },
        });
    };

    return {
        quotations,
        dashboard,
        isLoading,
        isDashboardLoading,
        filters,
        statusFilter,
        searchText,
        updateSearchText,
        handleDateRange,
        handlePageChange,
        handleTableChange,
        handleView,
        handleCreate,
        handleEdit,
        handleDelete,
    };
};

export default useQuotationList;
