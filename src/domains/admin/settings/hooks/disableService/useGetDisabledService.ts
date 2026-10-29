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
} from '../../api/disabledService';
import {
    Service,
    ServiceData,
    activeResponse,
    getData,
    updateStatus,
} from '../../types/disabledTypes';

const useGetDisabledService = ({ searchText, itemsPerPage, page, sort }: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Service[]>();
    const dispatch = useDispatch();
    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: ServiceData | false = await getAllData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort]);

    const updateActiveStatus = useCallback(
        async ({ serviceId, serviceStatus }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                serviceId,
                serviceStatus,
            });
            if (data) {
                setRefresh(true);
            }
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
                        description: `Disable service deleted successfully`,
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
                saveAs(blob, `Disable Services.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Disable Services.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Disable Services.pdf`);
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

export default useGetDisabledService;
