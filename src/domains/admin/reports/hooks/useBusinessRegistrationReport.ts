import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    BRAdminApplication,
    BRAdminListResponse,
    BRFilters,
    getAllApplications,
    getApplicationDetail,
} from '../api/businessRegistration';

const useBusinessRegistrationReport = (payload: BRFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<BRAdminApplication[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: BRAdminListResponse | false = await getAllApplications({
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

    const fetchDetail = async (applicationId: string): Promise<BRAdminApplication | false> => {
        setDetailLoading(true);
        const data = await getApplicationDetail({ userId: id, userType: role, applicationId });
        setDetailLoading(false);
        return data ? (data as unknown as BRAdminApplication) : false;
    };

    return { isLoading, tableData, count, detailLoading, fetchDetail };
};

export default useBusinessRegistrationReport;
