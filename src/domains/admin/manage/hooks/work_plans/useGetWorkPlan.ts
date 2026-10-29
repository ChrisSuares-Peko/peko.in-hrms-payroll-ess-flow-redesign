import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getAllData,
    getUpdateStatus,
    deleteWorkPlan,
    getFileBufferReport,
} from '../../api/workPlan';
import {
    WorkPlanResponse,
    WorkPlanData,
    activeResponse,
    getData,
    updateStatus,
} from '../../types/workPlan';

const useGetCategory = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
    partnerId,
}: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<WorkPlanData[]>();
    const dispatch = useAppDispatch();
    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: WorkPlanResponse | false = await getAllData({
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
        async ({ planId, status }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                planId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
            setRefresh(true);
        },
        [id, role]
    );

    const deleteDoc = useCallback(
        async (serviceId: number) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await deleteWorkPlan({
                userId: id,
                userType: role,
                id: serviceId,
            });
            if (data) {
                if (data.status) {
                    dispatch(
                        showToast({
                            description: `Work plan deleted successfully`,
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
            searchText,
            itemsPerPage,
            page,
            sort,
            partnerId,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Work Plans.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Work Plans.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Work Plans.pdf`);
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
