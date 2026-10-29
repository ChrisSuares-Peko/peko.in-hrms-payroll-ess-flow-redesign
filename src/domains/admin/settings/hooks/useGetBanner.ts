import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';
import { useDispatch } from 'react-redux';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllData, deleteDocument, getUpdateStatus, getFileBufferReport } from '../api/banners';
import { Banner, BannerData, activeResponse, getData, updateStatus } from '../types/banners';

const useGetBanner = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Banner[]>();
    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: BannerData | false = await getAllData({
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
        async ({ bannerId, status }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                bannerId,
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
        async (serviceId: number) => {
            setIsLoading(true);
            const data: activeResponse | false = await deleteDocument({
                userId: id,
                userType: role,
                id: serviceId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: `Banner deleted successfully`,
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
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
                saveAs(blob, `Banners.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Banners.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Banners.pdf`);
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
        updateActiveStatus,
        deleteDoc,
        setRefresh,
        downloadReport,
    };
};

export default useGetBanner;
