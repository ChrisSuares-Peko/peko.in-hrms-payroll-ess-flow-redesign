import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBusCities } from '../api';

export type CityOption = {
    label: string;
    value: number;
    state: string;
    lowerLabel: string;
};

export default function useSearchCityApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<CityOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCities = useCallback(async () => {
        setIsLoading(true);
        const cities = await getBusCities({ userId: id, userType: role });
        if (cities) setOptions(cities.map(city => ({ label: city.name, value: city.id, state: city.state, lowerLabel: city.name.toLowerCase() })));
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchCities();
    }, [fetchCities]);

    return { isLoading, options };
}
