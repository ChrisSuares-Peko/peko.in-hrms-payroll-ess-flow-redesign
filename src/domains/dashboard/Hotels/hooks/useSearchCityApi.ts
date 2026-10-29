import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchCityData } from '../Api';
import { City, CityData } from '../types/types';

export default function useSearchCityApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [cityOptions, setCityOptions] = useState<City[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const cityList = useCallback(
        async (CountryCode: string) => {
            setCityOptions([]);
            setIsLoading(true);

            try {
                const data: CityData | false = await fetchCityData({
                    userId: id,
                    userType: role,
                    CountryCode,
                });

                if (data) {
                    const cities = data.response.CityList as City[];
                    setCityOptions(cities);
                }
            } catch (error) {
                setCityOptions([]);
            } finally {
                setIsLoading(false);
            }
        },
        [id, role]
    );

    return { isLoading, cityList, cityOptions };
}
