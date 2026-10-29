import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllData, deleteCategory, getUpdateStatus, getFileBufferReport } from '../api/category';
import {
    CategoryResponse,
    CategoryData,
    activeResponse,
    getData,
    updateStatus,
} from '../types/category';

const useGetCategory = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<CategoryData[]>();
    const dispatch = useAppDispatch();
    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: CategoryResponse | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, payload]);

    const updateActiveStatus = useCallback(
        async ({ categoryId, categoryStatus }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                categoryId,
                categoryStatus,
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
            const data: SuccessGenericResponse<activeResponse> | false = await deleteCategory({
                userId: id,
                userType: role,
                id: serviceId,
            });
            if (data) {
                if (data.status) {
                    dispatch(
                        showToast({
                            description: `Category deleted successfully`,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                }
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
                saveAs(blob, `Categories.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Categories.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Categories.pdf`);
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

export default useGetCategory;
