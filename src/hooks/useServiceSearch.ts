import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { getServiceSearchHistory, getServiceSearchList, setSearch } from '@src/services/userInfo';

export default function useServiceSearch(search: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [services, setServices] = useState<any[]>([]);
    const [histories, setHistories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const searchServices = useCallback(
        async (query: string) => {
            setIsLoading(true);

            const servicesData = await getServiceSearchList({
                userId: id,
                userType: role,
                search: query,
            });
            if (servicesData) {
                setServices(servicesData);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    const getHistories = useCallback(async () => {
        const searchHistoryData = await getServiceSearchHistory({
            userId: id,
            userType: role,
        });
        if (searchHistoryData && searchHistoryData.length) {
            setHistories(searchHistoryData.slice(0, 7));
        }
    }, [id, role]);

    const saveSearch = useCallback(
        async (query: string) => {
            setIsLoading(true);

            const servicesData: any = await setSearch({
                userId: id,
                userType: role,
                search: query,
            });
            if (servicesData?.status) {
                getHistories();
            }

            setIsLoading(false);
        },
        [getHistories, id, role]
    );

    useEffect(() => {
        getHistories();
    }, [getHistories]);

    useEffect(() => {
        // Show the loader immediately on typing, not only once the debounced request starts.
        setIsLoading(true);
        const debounceTimeout = setTimeout(() => {
            searchServices(search);
        }, 500); // 300ms debounce

        return () => clearTimeout(debounceTimeout);
    }, [search, searchServices]);

    return { services, histories, isLoading, getHistories, saveSearch };
}
