import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deletePendingApplication, getPendingData } from '../api/globalBusinessSetup';
import { getData } from '../types/globalBusinessSetup';

const useGetPendingApplications = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, SetRefresh] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any>();
    const getAllPendingApplications = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getPendingData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            // setTableData(processedTableData);
            setTableData(data.companies);
            setCount(data.total);
        }
        SetRefresh(false);
        setIsLoading(false);
    }, [id, payload, role]);

    const handleDeleteApplication = useCallback(
        async (applicationId: string) => {
            const result = await deletePendingApplication({
                userId: id,
                userType: role,
                applicationId,
            });
            if (result) {
                SetRefresh(true);
            }
            return result;
        },
        [id, role]
    );

    useEffect(() => {
        getAllPendingApplications();
    }, [getAllPendingApplications, refresh]);

    return { isLoading, tableData, count, handleDeleteApplication };
};

export default useGetPendingApplications;
