import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCategoryList } from '../api/product';
import { Category, CategoryListResponse } from '../types/category';

export function useCategoriesApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getCategories = useCallback(async () => {
        const data: CategoryListResponse | false = await getCategoryList({
            userId: id,
            userType: role,
        });
        if (data) {
            setCategories(data.data);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    return { data: categories, isLoading };
}
