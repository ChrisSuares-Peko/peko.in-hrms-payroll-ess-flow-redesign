import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getAdminComplianceListApi,
    getAdminComplianceDetailApi,
    updateAdminComplianceStatusApi,
} from '../../api/compliance';
import {
    AdminComplianceListFilters,
    AdminComplianceRecord,
    AdminComplianceUpdatePayload,
} from '../../types/compliance';

export default function useAdminComplianceList(filters: AdminComplianceListFilters) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tableData, setTableData] = useState<AdminComplianceRecord[]>([]);
    const [count, setCount] = useState(0);

    const handleRefresh = () => setRefresh(prev => !prev);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data = await getAdminComplianceListApi({ userId: id, userType: role }, filters);
        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, filters]);

    const fetchDetail = useCallback(
        async (recordId: number): Promise<AdminComplianceRecord | null> => {
            const data = await getAdminComplianceDetailApi(
                { userId: id, userType: role },
                recordId
            );
            return data || null;
        },
        [id, role]
    );

    const updateStatus = useCallback(
        async (payload: AdminComplianceUpdatePayload): Promise<boolean> => {
            const success = await updateAdminComplianceStatusApi(
                { userId: id, userType: role },
                payload
            );
            if (success) handleRefresh();
            return success;
        },
        [id, role]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, fetchDetail, updateStatus, handleRefresh };
}
