import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';

import { fetchParentCategories } from '../../api';
import { setCategoryList } from '../../slice/softwareSlice';

const useGetCategories = () => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const { categoryList } = useAppSelector(state => state.reducer.software);

    const getParentCategories = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchParentCategories({
            userId: id,
            userType: role,
        });

        if (data) {
            dispatch(setCategoryList(data.categoryList));
        }

        setIsLoading(false);
    }, [dispatch, id, role]);

    useEffect(() => {
        if (categoryList.length === 0) {
            getParentCategories();
        }
    }, [categoryList, getParentCategories]);

    return { categoryList, isLoading };
};

export default useGetCategories;
