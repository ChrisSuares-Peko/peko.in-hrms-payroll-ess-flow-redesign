import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVerificationAddOns } from '../api';

export default function useGetVerificationAddOns() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [addOnsData, setAddOnsData] = useState<any>();

    const getAddOns = useCallback(async () => {
        setIsLoading(true);
        const data = await getVerificationAddOns({
            userId: id,
            userType: role,
        });

        if (data) {
            setAddOnsData(data);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getAddOns();
    }, [getAddOns]);

    return { addOnsData, loading: isLoading, refresh: getAddOns };
}
