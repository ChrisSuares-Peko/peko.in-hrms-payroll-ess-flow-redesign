import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getFileBufferReport,
    getEmailDomainPlans,
    updateActiveStatusEmailDomainPlans,
    deleteEmailDomainPlanApi,
} from '../../api/emailDomainPlans';

export default function useGetAllEmailDomainPlans({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: any) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();

    const handleRefresh = () => {
        setRefresh(prev => !prev);
    };

    const getAllEmailDomainPlans = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getEmailDomainPlans({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });

        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, searchText, itemsPerPage, page, sort, sortField]);

    const updateStatusEmailDomainPlans = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: any | false = await updateActiveStatusEmailDomainPlans({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    const deleteEmailDomainPlan = useCallback(
        async (planId: any) => {
            setIsLoading(true);
            const response: any | false = await deleteEmailDomainPlanApi({
                userId: id,
                userType: role,
                planId,
            });

            setIsLoading(false);
            if (response) {
                handleRefresh();
                if (response.status) {
                    dispatch(
                        showToast({
                            description: 'Business Email plan deleted successfully',
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
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            searchText,
            sort,
            sortField,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Business Emails Plans.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Business Emails Plans.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Business Emails Plans.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getAllEmailDomainPlans();
    }, [getAllEmailDomainPlans, refresh]);

    return {
        tableData,
        loading: isLoading,
        count,
        setRefresh,
        updateStatusEmailDomainPlans,
        downloadReport,
        deleteEmailDomainPlan,
    };
}
