import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import { getAllPaymentsReceivedApi } from '../../api/invoices';
import { GetAllPaymentsReceivedResponse } from '../../types/paymentsReceived';
import { getLastMonthDateRange } from '../../utils/helperFunctions';

const defaultDateRange = getLastMonthDateRange();

const usePaymentsReceivedList = () => {
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [filters, setFilters] = useState({
        page: 1,
        itemsPerPage: 10,
        searchText: '',
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
        mode: '',
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const [paymentsReceived, setPaymentsReceived] = useState<GetAllPaymentsReceivedResponse | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(false);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        try {
            const { searchText: customerName, ...rest } = filters;
            const data = await getAllPaymentsReceivedApi({
                userId,
                userType: role,
                ...rest,
                customerName,
            });
            if (data) setPaymentsReceived(data);
            else
                dispatch(
                    showToast({
                        description: 'Something went wrong. Please try again.',
                        variant: 'error',
                    })
                );
        } catch {
            dispatch(
                showToast({
                    description: 'Something went wrong. Please try again.',
                    variant: 'error',
                })
            );
        }
        setIsLoading(false);
    }, [userId, role, filters, dispatch]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const handleDateRange = (_: any, [start, end]: [string, string]) => {
        setFilters(prev => ({ ...prev, startDate: start || '', endDate: end || '', page: 1 }));
    };

    const handleModeChange = (mode: string) => {
        setFilters(prev => ({ ...prev, mode: mode || '', page: 1 }));
    };

    const handlePageChange = (page: number, itemsPerPage: number) => {
        setFilters(prev => ({ ...prev, page, itemsPerPage }));
    };

    return {
        paymentsReceived,
        isLoading,
        filters,
        searchText,
        updateSearchText,
        handleDateRange,
        handleModeChange,
        handlePageChange,
    };
};

export default usePaymentsReceivedList;
