import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getWalletDenomination } from '../api';
import { Denominations } from '../types';

export default function useGetwalletDenominations() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [denominations, setDenominations] = useState<Denominations>();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchWalletDenominations = async () => {
            setIsLoading(true);
            const data: Denominations | false = (await getWalletDenomination({
                userId: id,
                userType: role,
            })) as Denominations | false;
            if (data) {
                setDenominations(data);
            }
            setIsLoading(false);
        };
        fetchWalletDenominations();
    }, [id, role]);

    return { denominations, isLoading };
}
