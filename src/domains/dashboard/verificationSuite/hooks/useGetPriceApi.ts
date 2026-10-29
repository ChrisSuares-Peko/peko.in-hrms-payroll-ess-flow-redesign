import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllPrices } from '../api';
import { VerificationPrices } from '../types';

export default function useGetAllPrice() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [priceData, setPriceData] = useState<any>();

    const getPrice = useCallback(async () => {
        setIsLoading(true);
        const data: VerificationPrices | false = await getAllPrices({
            userId: id,
            userType: role,
        });

        if (data) {
            setPriceData(data);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getPrice();
    }, [getPrice, refresh]);

    return { priceData, loading: isLoading };
}
