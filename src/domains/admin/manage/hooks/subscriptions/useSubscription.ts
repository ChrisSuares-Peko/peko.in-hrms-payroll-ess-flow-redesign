import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getSubscriptionData,
    deleteSubscription,
    updateSubscriptionStatus,
    getFileBufferReport,
} from '../../api/subscription';
import {
    ApiResponseSubscriptions,
    SubscriptionBody,
    getSubscription,
    updateSubscriptionStatusPayload,
} from '../../types/subscription';

const useSubscriptionData = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: getSubscription) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<SubscriptionBody[]>();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseSubscriptions | false = await getSubscriptionData({
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
        async ({ subscriptionId, status }: updateSubscriptionStatusPayload) => {
            setIsLoading(true);
            const data: {} | false = await updateSubscriptionStatus({
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

    const deleteSubscriptionRow = useCallback(
        async (subscriptionId: string | number) => {
            setIsLoading(true);
            const response: SuccessGenericResponse<{}> | false = await deleteSubscription({
                userId: id,
                userType: role,
                subscriptionId,
            });

            setIsLoading(false);
            if (response) {
                handleRefresh();
                if (response.status) {
                    dispatch(
                        showToast({
                            description: 'Software deleted successfully',
                            variant: 'success',
                        })
                    );
                }
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
                saveAs(blob, `Software Products.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Software Products.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Software Products.pdf`);
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
        deleteSubscriptionRow,
        downloadReport,
    };
};

export default useSubscriptionData;
