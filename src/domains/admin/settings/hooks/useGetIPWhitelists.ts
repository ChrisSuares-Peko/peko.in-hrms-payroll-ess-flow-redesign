import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';
import { useDispatch } from 'react-redux';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getAllData,
    getUpdateStatus,
    deleteDocument,
    getFileBufferReport,
} from '../api/ipWhitelist';
import { ipWhitelistResponse, activeResponse } from '../types/ipWhitelist';

const useGetIPWhitelists = (payload: any) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Document[]>();
    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ipWhitelistResponse | false = await getAllData({
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
    }, [id, payload, role]);

    const updateActiveStatus = useCallback(
        async ({ ipId, status }: any) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                ipId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    const deleteDoc = useCallback(
        async (docId: number) => {
            setIsLoading(true);
            const data: any | false = await deleteDocument({
                userId: id,
                userType: role,
                docId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: `IP address deleted successfully`,
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
        },
        [id, role, dispatch]
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
                saveAs(blob, `IP_Whitelist.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `IP_Whitelist.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `IP_Whitelist.pdf`);
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
        deleteDoc,
        setRefresh,
        downloadReport,
    };
};

export default useGetIPWhitelists;
