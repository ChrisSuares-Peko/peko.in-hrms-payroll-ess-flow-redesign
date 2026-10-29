import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getCartDetailsApi } from '../api/cart';
import { setData } from '../slices/cartSlice';
import { CartDetailsResponse } from '../types/cartTypes';

export function useCartDetailsApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(true);

    const getCartDetails = async () => {
        const data: CartDetailsResponse | false = await getCartDetailsApi({
            userId: id,
            userType: role,
        });
        if (data) {
            const categoriesData = data as CartDetailsResponse;

            dispatch(setData(categoriesData));

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    };

    return { isLoading, getCartDetails };
}
