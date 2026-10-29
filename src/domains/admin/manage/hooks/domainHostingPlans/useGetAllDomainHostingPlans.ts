import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getDomainHostingPlans,
    updateDomainHostingPlanStatus,
    deleteDomainHostingPlanApi,
    getDomainHostingPlansReport,
} from '../../api/domainHostingPlans';

export default function useGetAllDomainHostingPlans({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
    planType,
}: any) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<any[]>([]);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getDomainHostingPlans({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
            planType,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, searchText, itemsPerPage, page, sort, sortField, planType]);

    const updateStatus = useCallback(
        async (payload: { id: number | string; status: boolean }) => {
            setIsLoading(true);
            const data: any | false = await updateDomainHostingPlanStatus({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) setRefresh(true);
            setIsLoading(false);
        },
        [id, role]
    );

    const deletePlan = useCallback(
        async (planId: number | string) => {
            setIsLoading(true);
            const response: any | false = await deleteDomainHostingPlanApi({
                userId: id,
                userType: role,
                planId,
            });
            setIsLoading(false);
            if (response) {
                setRefresh(prev => !prev);
                if (response.status) {
                    dispatch(
                        showToast({
                            description: 'Domain & Hosting plan deleted successfully',
                            variant: 'success',
                        })
                    );
                }
            }
            return response;
        },
        [dispatch, id, role]
    );

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getDomainHostingPlansReport({
            userId: id,
            userType: role,
            type,
            searchText,
            sort,
            sortField,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            if (type === 'excel') saveAs(blob, 'Domain & Hosting Plans.xlsx');
            else if (type === 'csv') saveAs(blob, 'Domain & Hosting Plans.csv');
            else if (type === 'pdf') saveAs(blob, 'Domain & Hosting Plans.pdf');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans, refresh]);

    return {
        tableData,
        loading: isLoading,
        count,
        setRefresh,
        updateStatus,
        deletePlan,
        downloadReport,
    };
}
