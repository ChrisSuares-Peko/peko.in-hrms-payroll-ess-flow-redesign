import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deletePlan, getPlanData, updatePlanStatus } from '../api/plans';
import {
    ApiResponsePlan,
    PlanBody,
    PlanID,
    getPlan,
    updatePlanStatusPayload,
} from '../types/plans';

const useGetPlan = ({ searchText, itemsPerPage, page, sort }: getPlan) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<PlanBody[]>();

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponsePlan | false = await getPlanData({
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
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, itemsPerPage, page, role, searchText, sort, refresh]);

    const updateActiveStatus = useCallback(
        async ({ planId, status }: updatePlanStatusPayload) => {
            setIsLoading(true);
            const data: {} | false = await updatePlanStatus({
                userId: id,
                userType: role,
                planId,
                status,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
    );

    const deletePlanDetails = useCallback(
        async (vendorUpdatedData: PlanID) => {
            setIsLoading(true);
            const response: {} | false = await deletePlan({
                userId: id,
                userType: role,
                ...vendorUpdatedData,
            });
            setIsLoading(false);
            if (response) {
                handleRefresh();
            }
            return response;
        },
        [id, role]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, updateActiveStatus, handleRefresh, deletePlanDetails };
};

export default useGetPlan;
