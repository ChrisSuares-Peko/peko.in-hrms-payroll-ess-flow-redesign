import { useCallback, useEffect, useState } from 'react';

import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createWork, getVendorsApi, updateWork } from '../api/works';
import { WorkData, getVendors, getVendorsResponse, newWork } from '../types/works';

const useUpdateWorks = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [categoryData, setCategoryData] = useState<DropDown>();
    const getAllCategories = useCallback(async () => {
        setIsLoading(true);
        const data: getVendorsResponse | false = await getVendorsApi({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            const arr = data.result.map((item: getVendors) => ({
                value: item.id.toString(),
                label: item.vendorName,
            }));
            setCategoryData(arr);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, [id, role, searchText]);

    const updateCurrentWork = useCallback(
        async (payload: newWork) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<WorkData> | false = await updateWork({
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
    const createNewWork = useCallback(
        async (payload: newWork) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<WorkData> | false = await createWork({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                setIsLoading(false);
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

    return { isLoading, createNewWork, updateCurrentWork, categoryData };
};

export default useUpdateWorks;
