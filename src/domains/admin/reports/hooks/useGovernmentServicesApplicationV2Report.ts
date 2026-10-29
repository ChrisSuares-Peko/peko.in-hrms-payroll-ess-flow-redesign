import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    GSV2AdminApplication,
    GSV2AdminListResponse,
    GSV2Filters,
    getAllApplications,
    getApplicationDetail,
} from '../api/governmentServicesApplicationV2';

const useGovernmentServicesApplicationV2Report = (payload: GSV2Filters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<GSV2AdminApplication[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: GSV2AdminListResponse | false = await getAllApplications({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.applications);
            setCount(data.total);
        }
        setIsLoading(false);
    }, [id, role, payload]);

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    const fetchDetail = async (applicationId: number | string): Promise<GSV2AdminApplication | false> => {
        setDetailLoading(true);
        const data = await getApplicationDetail({ userId: id, userType: role, id: applicationId });
        setDetailLoading(false);
        return data ? (data as unknown as GSV2AdminApplication) : false;
    };

    return { isLoading, tableData, count, detailLoading, fetchDetail, refetch: getAllTableData };
};

export default useGovernmentServicesApplicationV2Report;
