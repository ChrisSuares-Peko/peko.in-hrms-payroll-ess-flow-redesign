import { useCallback, useEffect, useState } from 'react';

import saveAs from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getAllActivationCodes,
    getFileBufferSubscriptionCode,
    updateStatus,
} from '../../api/subscriptionCode';
import {
    AllSubscriptionCodeResponse,
    CodesFilterType,
    SubscriptionCode,
} from '../../types/subscriptionCodes';

const useGetCodes = (payload: CodesFilterType) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<SubscriptionCode[]>();

    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);

        const data: AllSubscriptionCodeResponse | false = await getAllActivationCodes({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, payload]);

    const updateActiveStatus = useCallback(
        async (rowId: number, status: boolean) => {
            setIsLoading(true);
            const data = await updateStatus({
                userId: id,
                userType: role,
                rowId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role]
    );
    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferSubscriptionCode({
            userId: id,
            userType: role,
            type,
            searchText: payload.searchText,
            page: payload.page,
            itemsPerPage: payload.page,
            sort: '',
            sortField: '',
        });
        if (data === false) {
            dispatch(
                showToast({
                    description: 'No data is available for export.',
                    variant: 'error',
                })
            );
        }
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Subscription Code.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Subscription Code.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Subscription Code.pdf`);
            }
        }
        setIsLoading(false);
    };
    useEffect(() => {
        getDataFromApi();
    }, [getDataFromApi, refresh]);

    return {
        isLoading,
        tableData,
        count,
        setRefresh,
        updateActiveStatus,
        downloadReport,
    };
};

export default useGetCodes;
