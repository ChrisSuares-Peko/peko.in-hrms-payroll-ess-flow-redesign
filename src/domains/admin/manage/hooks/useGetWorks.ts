import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteWork, getAllData, getUpdateStatus, getFileBufferReport } from '../api/works';
import { WorkResponse, WorkData, activeResponse, getData, updateStatus } from '../types/works';

const useGetWorks = ({ searchText, itemsPerPage, page, sort, sortField, partnerId }: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<WorkData[]>();
    const dispatch = useAppDispatch();

    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: WorkResponse | false = await getAllData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
            partnerId,
        });
        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort, sortField, partnerId]);

    const updateActiveStatus = useCallback(
        async ({ workId, status }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                workId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
        },
        [id, role]
    );

    const deleteDoc = useCallback(
        async (workId: number) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await deleteWork({
                userId: id,
                userType: role,
                id: workId,
            });
            if (data) {
                if (data.status) {
                    dispatch(
                        showToast({
                            description: `Work deleted successfully`,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                }
            }
            setRefresh(true);
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
                saveAs(blob, `Peko Works.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Peko Works.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Peko Works.pdf`);
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

export default useGetWorks;
