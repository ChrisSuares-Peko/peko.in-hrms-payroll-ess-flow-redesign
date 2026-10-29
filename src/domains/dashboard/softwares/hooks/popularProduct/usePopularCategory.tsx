import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { fetchPopularProducts } from '../../api';
import { setPopularProducts } from '../../slice/softwareSlice';

const usePopularCategory = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const cachedPopularProducts = useAppSelector(state => state.reducer.software.popularProducts);

    const [isLoading, setIsLoading] = useState(false);
    const [isProducts, setIsProducts] = useState(true);

    useEffect(() => {
        const getPopularProducts = async () => {
            setIsLoading(true);

            const data = await fetchPopularProducts({
                userId: id,
                userType: role,
            });

            if (data && data.products) {
                dispatch(setPopularProducts(data.products));
                setIsProducts(true);
            } else {
                setIsProducts(false);
            }

            setIsLoading(false);
        };

        if (id && role && cachedPopularProducts.length === 0) {
            getPopularProducts();
        }
    }, [id, role,cachedPopularProducts,dispatch]);

    return {
        popularProducts: cachedPopularProducts,
        isLoading,
        isProducts: cachedPopularProducts.length > 0 || isProducts,
        total: cachedPopularProducts.length,
    };
};

export default usePopularCategory;
