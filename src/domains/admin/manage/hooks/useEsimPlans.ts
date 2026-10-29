import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import {
    CommonFileBuffer,
    // CommonFileBuffer,
    DropDown,
} from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getEsimPlansData,
    updateEsimPlanStatus,
    deleteConnect,
    getFileBufferReport,
    // getFileBufferReport
} from '../api/eSIM';
import {
    ApiResponseEsimPlans,
    EsimPlan,
    ConnectID,
    getEsimPlans,
    updatePlanStatusPayload,
} from '../types/eSIM';

const useEsimPlansData = (payload: getEsimPlans) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<EsimPlan[]>();
    const [countryData] = useState<DropDown>();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseEsimPlans | false = await getEsimPlansData({
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
        async ({ planId, status }: updatePlanStatusPayload) => {
            setIsLoading(true);
            const data: {} | false = await updateEsimPlanStatus({
                userId: id,
                userType: role,
                id: planId,
                status,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
    );
    //
    const deleteConnectProvider = useCallback(
        async (planId: ConnectID) => {
            setIsLoading(true);
            const response: {} | false = await deleteConnect({
                userId: id,
                userType: role,
                ...planId,
                page: 0,
                searchText: '',
                itemsPerPage: 0,
                sort: 'ASC',
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
                saveAs(blob, `eSIM Plans.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `eSIM Plans.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `eSIM Plans.pdf`);
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
        countryData,
    };
};

export default useEsimPlansData;
