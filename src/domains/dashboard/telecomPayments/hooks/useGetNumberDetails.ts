import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getNumberDetails } from '../api/index';

export default function useGetNumberDetails(number: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [numberData, setNumberData] = useState<any>();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const getNumberData = useCallback(async () => {
        setIsLoading(true);
        const data = await getNumberDetails({
            userType: role,
            userId: id,
            number,
        });

        if (data) {
            setNumberData(data);
        }
        setIsLoading(false);
    }, [role, id, number]);

    return { isLoading, getNumberData, numberData };
}
