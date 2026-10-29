import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deletePlan, getFileBufferReport, getPlanData, updatePlanStatus } from '../../api/plans';
import {
    ApiResponsePlan,
    PlanBody,
    PlanID,
    getPlan,
    updatePlanStatusPayload,
} from '../../types/plans';

const useGetPlan = ({ searchText, itemsPerPage, page, sort, sortField }: getPlan) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<PlanBody[]>();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponsePlan | false = await getPlanData({
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
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, itemsPerPage, page, role, searchText, sort, refresh, sortField]);

    const updateActiveStatus = useCallback(
        async ({ planId, status }: updatePlanStatusPayload) => {
            setIsLoading(true);
            const data: {} | false = await updatePlanStatus({
                userId: id,
                userType: role,
                planId,
                status,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
    );

    const deletePlanDetails = useCallback(
        async (vendorUpdatedData: PlanID) => {
            setIsLoading(true);
            const response: {} | false = await deletePlan({
                userId: id,
                userType: role,
                ...vendorUpdatedData,
            });
            setIsLoading(false);
            if (response) {
                dispatch(
                    showToast({ description: 'Plan deleted successfully', variant: 'success' })
                );
                handleRefresh();
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
            itemsPerPage,
            page,
            sort,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Office Address.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Office Address.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Office Address.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        handleRefresh,
        deletePlanDetails,
        downloadReport,
    };
};

export default useGetPlan;
