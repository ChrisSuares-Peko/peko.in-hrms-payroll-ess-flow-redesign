import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEcommerceSellers } from '../api/cityList';

/** Distinct seller names for the current city catalog (+ optional listing query). */
export function useSellers(
    city: string | undefined,
    search?: string,
    localCategory?: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [sellers, setSellers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!city) {
            setSellers([]);
            return undefined;
        }
        let cancelled = false;
        setIsLoading(true);
        getEcommerceSellers({
            userId: id,
            userType: role,
            city,
            search,
            localCategory,
        })
            .then(list => {
                if (!cancelled) setSellers(list || []);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [city, search, localCategory, id, role]);

    return { sellers, isLoading };
}
