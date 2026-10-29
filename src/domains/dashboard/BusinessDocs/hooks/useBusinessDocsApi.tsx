import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBusinessDocs } from '../api/index';
import { ICategoryResponse, categoryCard } from '../types/type';

export const useBusinessDocsApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [categoryData, setCategoryData] = useState<categoryCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getBusinessDocsCategory = useCallback(async () => {
        const res: ICategoryResponse | false = await getBusinessDocs({
            userId: id,
            userType: role,
        });

        if (res) {
            const categoryRes = res;
            const arr = categoryRes?.categoryDataWithCounts?.map(item => ({
                icon: item.categoryImage ?? '',
                category: item.categoryName ?? '',
                size: item.documentCount ?? '',
            }));
            setCategoryData(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getBusinessDocsCategory();
    }, [getBusinessDocsCategory]);

    return { data: categoryData, isLoading };
};
