import { useCallback, useEffect, useState } from 'react';

import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { updateWorkPlan, getAllWorksApi, createWorkPlan } from '../../api/workPlan';
import { WorkPlanData, getWorks, getAllWorksResponse, newWorkPlan } from '../../types/workPlan';

const useUpdateCategory = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [categoryData, setCategoryData] = useState<DropDown>();
    const getAllCategories = useCallback(async () => {
        setIsLoading(true);
        const data: getAllWorksResponse | false = await getAllWorksApi({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            const arr = data.result.map((item: getWorks) => ({
                value: item.id.toString(),
                label: item.name,
            }));
            setCategoryData(arr);
        }
        setIsLoading(false);
    }, [id, role, searchText]);

    const updateCurrentWorkPlan = useCallback(
        async (payload: newWorkPlan) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<WorkPlanData> | false = await updateWorkPlan({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    const createNewWorkPlan = useCallback(
        async (payload: newWorkPlan) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<WorkPlanData> | false = await createWorkPlan({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    useEffect(() => {
        getAllCategories();
    }, [getAllCategories]);

    return { isLoading, createNewWorkPlan, updateCurrentWorkPlan, categoryData };
};

export default useUpdateCategory;
