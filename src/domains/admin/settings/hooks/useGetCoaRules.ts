import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllRules, updateRuleStatus } from '../api/chartOfAccount';
import { updateStatusRule, getChartOfAccountsRules } from '../types/coaRules';

const useGetRules = (payload: getChartOfAccountsRules) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();
    const getCoaRules = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllRules({
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
        async ({ ruleId, status }: updateStatusRule) => {
            setIsLoading(true);
            const data = await updateRuleStatus({
                userId: id,
                userType: role,
                ruleId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    useEffect(() => {
        getCoaRules();
    }, [getCoaRules, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        setRefresh,
    };
};

export default useGetRules;
