import { useCallback, useEffect, useState } from 'react';

import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createCategory, getVendorsApi, updateCategory } from '../api/category';
import { CategoryData, getVendors, getVendorsResponse, newCategory } from '../types/category';

const useUpdateCategory = (searchText: string) => {
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
            const arr = data.data.map((item: getVendors) => ({
                value: item.id.toString(),
                label: item.vendorName,
            }));
            setCategoryData(arr);
        }
        setIsLoading(false);
    }, [id, role, searchText]);

    const updateCurrentCategory = useCallback(
        async (payload: newCategory) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<CategoryData> | false = await updateCategory({
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
    const createNewCategory = useCallback(
        async (payload: newCategory) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<CategoryData> | false = await createCategory({
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

    return { isLoading, createNewCategory, updateCurrentCategory, categoryData };
};

export default useUpdateCategory;
