import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    deleteConnect,
    getConnectData,
    getFileBufferReport,
    updateConnectStatus,
} from '../api/connect';
import {
    ApiResponseConnect,
    ConnectBody,
    ConnectID,
    getConnect,
    updateConnectStatusPayload,
} from '../types/connect';

const useConnectData = (payload: getConnect) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<ConnectBody[]>();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseConnect | false = await getConnectData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, payload, role, refresh]);

    const updateActiveStatus = useCallback(
        async ({ connectId, status }: updateConnectStatusPayload) => {
            setIsLoading(true);
            const data: {} | false = await updateConnectStatus({
                userId: id,
                userType: role,
                connectId,
                status,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
    );

    const deleteConnectProvider = useCallback(
        async (connectId: ConnectID) => {
            setIsLoading(true);
            const response: {} | false = await deleteConnect({
                userId: id,
                userType: role,
                ...connectId,
            });
            setIsLoading(false);
            if (response) {
                dispatch(
                    showToast({
                        description: `Serivce provider deleted successfully`,
                        variant: 'success',
                    })
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
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Connect.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Connect.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Connect.pdf`);
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
        deleteConnectProvider,
        downloadReport,
    };
};

export default useConnectData;
