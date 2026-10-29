import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    AdminApplication,
    AdminApplicationsListResponse,
    CIFilters,
    getAllApplications,
    getApplicationDetail,
} from '../api/companyIncorporation';

const useCompanyIncorporationReport = (payload: CIFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<AdminApplication[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: AdminApplicationsListResponse | false = await getAllApplications({
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

    const fetchDetail = async (applicationId: string): Promise<AdminApplication | false> => {
        setDetailLoading(true);
        const data = await getApplicationDetail({ userId: id, userType: role, applicationId });
        setDetailLoading(false);
        return data ? (data as unknown as AdminApplication) : false;
    };

    return { isLoading, tableData, count, detailLoading, fetchDetail };
};

export default useCompanyIncorporationReport;
