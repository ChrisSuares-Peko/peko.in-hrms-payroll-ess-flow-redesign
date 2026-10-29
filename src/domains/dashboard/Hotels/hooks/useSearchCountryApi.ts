import { useCallback, useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';

import { fetchCountryData } from '../Api';
import { country } from '../types/types';

export default function useSearchCountryApi() {
    const location = useLocation();
    const { key } = location.state || {};
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [countryOptions, setCountryOptions] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(true);

    const countryList = useCallback(
        async (searchCountry?: string) => {
            const data: any | false = await fetchCountryData({
                userId: id,
                userType: role,
                searchText: searchCountry || '',
            });

            if (data) {
                const countriesInfo = data.response.CountryList as country[];
                setCountryOptions(countriesInfo);
            }
        },
        [id, role]
    );
    useEffect(() => {
        if (key) {
            countryList();
        }
    }, [countryList, key]);

    return { isLoading, countryList, countryOptions };
}
