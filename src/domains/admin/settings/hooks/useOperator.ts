import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import {
    getFileBufferReport,
    getServiceOperatorsData,
    putUpdateOperatorStatus,
} from '../api/serviceOperator';
import {
    ApiResponseOperator,
    getOperators,
    serviceOperator,
    updateOperatorStatus,
} from '../types/serviceOperator';

const useOperatorData = (payload: getOperators) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<serviceOperator[]>();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseOperator | false = await getServiceOperatorsData({
            userId: id,
            userType: role,
            ...payload,
            deviceType: 'WEB',
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, payload, refresh]);

    const updateActiveStatus = useCallback(
        async ({ operatorId, serviceStatus }: updateOperatorStatus) => {
            setIsLoading(true);
            const data: {} | false = await putUpdateOperatorStatus({
                userId: id,
                userType: role,
                operatorId,
                serviceStatus,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
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
                saveAs(blob, `Service Operator.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Service Operator.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Service Operator.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, handleRefresh, updateActiveStatus, downloadReport };
};

export default useOperatorData;
