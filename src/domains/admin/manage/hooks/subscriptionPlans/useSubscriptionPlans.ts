import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getSubscriptionPlansData,
    deleteSubscriptionPlan,
    updateSubscriptionPlansStatus,
    getFileBufferReport,
} from '../../api/subscriptionPlans';
import {
    ApiResponseSubscriptionPlans,
    SubscriptionPlan,
    getSubscriptionPlans,
    updateSubscriptionPlanStatusPayload,
} from '../../types/subscriptionPlans';

const useSubscriptionData = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: getSubscriptionPlans) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<SubscriptionPlan[]>();
    const dispatch = useAppDispatch();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseSubscriptionPlans | false = await getSubscriptionPlansData({
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
    }, [id, itemsPerPage, page, role, searchText, sort, refresh]);

    const updateActiveStatus = useCallback(
        async ({ subscriptionId, status }: updateSubscriptionPlanStatusPayload) => {
            setIsLoading(true);
            const data: {} | false = await updateSubscriptionPlansStatus({
                userId: id,
                userType: role,
                subscriptionId,
                status,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
    );

    const deleteSubscriptionPlans = useCallback(
        async (subscriptionId: string | number) => {
            setIsLoading(true);
            const response: SuccessGenericResponse<{}> | false = await deleteSubscriptionPlan({
                userId: id,
                userType: role,
                subscriptionId,
            });
            setIsLoading(false);
            if (response) {
                if (response.status) {
                    dispatch(
                        showToast({
                            description: 'Plan deleted successfully',
                            variant: 'success',
                        })
                    );
                }
                handleRefresh();
            }
            return response;
        },
        [id, role, dispatch]
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
                saveAs(blob, `Software Plans.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Software Plans.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Software Plans.pdf`);
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
        deleteSubscriptionPlans,
        downloadReport,
    };
};

export default useSubscriptionData;
