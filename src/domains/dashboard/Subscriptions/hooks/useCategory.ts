import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCategories } from '../api/index';
import { categories, categoryResponse } from '../types/types';

export function useGetCategories() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [category, setCategories] = useState<categories[]>([]);
    const [Loading, setIsLoading] = useState(true);

    const getCategoryList = useCallback(async () => {
        const data: categoryResponse | false = await getCategories({
            userId: id,
            userType: role,
        });

        if (data) {
            setCategories(data.categoryData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getCategoryList();
    }, [getCategoryList]);

    return { CategoryData: category, Loading };
}
