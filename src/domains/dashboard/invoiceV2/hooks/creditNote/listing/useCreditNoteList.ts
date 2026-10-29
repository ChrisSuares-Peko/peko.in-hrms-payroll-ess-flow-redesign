import { useCallback, useEffect, useState } from 'react';

import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';

import {
    getAllCreditNotesApi,
    getCreditNoteDashboardApi,
    updateCreditNoteStatusApi,
} from '../../../api/invoices';
import {
    CreditNoteDashboard,
    CreditNoteStatus,
    GetAllCreditNotesResponse,
} from '../../../types/creditNote';
import { getLastMonthDateRange } from '../../../utils/helperFunctions';

const defaultDateRange = getLastMonthDateRange();

const useCreditNoteList = () => {
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

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const [creditNotes, setCreditNotes] = useState<GetAllCreditNotesResponse | null>(null);
    const [dashboard, setDashboard] = useState<CreditNoteDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);

    const fetchDashboard = useCallback(async () => {
        setIsDashboardLoading(true);
        const data = await getCreditNoteDashboardApi({ userId, userType: role });
        if (data) setDashboard(data);
        setIsDashboardLoading(false);
    }, [userId, role]);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAllCreditNotesApi({ userId, userType: role, ...filters });
            if (data) setCreditNotes(data);
            else message.error('Something went wrong. Please try again.');
        } catch {
            message.error('Something went wrong. Please try again.');
        }
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

    const goToCreate = () => {
        navigate(`/${paths.invoice.index}/credit-notes/create`);
    };

    const updateStatus = useCallback(
        async (creditNoteId: string, status: CreditNoteStatus): Promise<boolean> => {
            const resp = await updateCreditNoteStatusApi({
                userId,
                userType: role,
                invoiceId: creditNoteId,
                status,
            });
            if (resp && resp.status) {
                fetchList();
                return true;
            }
            message.error((resp as any)?.message || 'Failed to update credit note status.');
            return false;
        },
        [userId, role, fetchList]
    );

    return {
        creditNotes,
        dashboard,
        isLoading,
        isDashboardLoading,
        filters,
        searchText,
        updateSearchText,
        handleDateRange,
        handlePageChange,
        goToCreate,
        updateStatus,
    };
};

export default useCreditNoteList;
