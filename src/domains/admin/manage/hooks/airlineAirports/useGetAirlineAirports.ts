import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createAirlineAirport,
    getAirlineAirports,
    updateAirlineAirportPriority,
} from '../../api/airlineAirports';

export default function useGetAirlineAirports({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: {
    searchText: string;
    itemsPerPage: number;
    page: number;
    sort: string;
    sortField: string;
}) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<any[]>([]);

    const getAirportsData = useCallback(async () => {
        setIsLoading(true);
        const data = await getAirlineAirports({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.data ?? []);
            setCount(data.recordsTotal ?? 0);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, searchText, itemsPerPage, page, sort, sortField]);

    const addAirport = useCallback(
        async (
            payload: Omit<Parameters<typeof createAirlineAirport>[0], 'userId' | 'userType'>
        ) => {
            setIsLoading(true);
            const data = await createAirlineAirport({ userId: id, userType: role, ...payload });
            setIsLoading(false);
            if (data) {
                setRefresh(true);
                dispatch(
                    showToast({ description: 'Airport added successfully', variant: 'success' })
                );
            } else {
                dispatch(showToast({ description: 'Failed to add airport', variant: 'error' }));
            }
            return !!data;
        },
        [dispatch, id, role]
    );

    const updatePriority = useCallback(
        async (airportId: number | string, priority: number | null) => {
            setIsLoading(true);
            const data = await updateAirlineAirportPriority({
                userId: id,
                userType: role,
                id: airportId,
                priority,
            });
            setIsLoading(false);
            if (data) {
                setRefresh(true);
                dispatch(
                    showToast({
                        description: 'Airport priority updated successfully',
                        variant: 'success',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description: 'Failed to update airport priority',
                        variant: 'error',
                    })
                );
            }
        },
        [dispatch, id, role]
    );

    useEffect(() => {
        getAirportsData();
    }, [getAirportsData, refresh]);

    return {
        tableData,
        loading: isLoading,
        count,
        setRefresh,
        addAirport,
        updatePriority,
    };
}
