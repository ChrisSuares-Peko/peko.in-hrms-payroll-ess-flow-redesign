import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getCategories } from '../api/order';
import { categoryResponse } from '../types/orders';

const useGetCategories = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [categoryDatas, setCategoryDatas] = useState<DropDown>();
    const getData = useCallback(async () => {
        setLoading(true);
        const data: categoryResponse | false = await getCategories({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            setCategoryDatas(data.category);
        }
        setLoading(false);
    }, [id, role, searchText]);

    useEffect(() => {
        getData();
    }, [getData]);

    return { categoryDatas, loading };
};

export default useGetCategories;
