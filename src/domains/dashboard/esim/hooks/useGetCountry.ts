import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getCountriesApi } from '../api/index';

export default function useGetOrderDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [countryData, setCategoryData] = useState<DropDown>();

    const getAllCountries = useCallback(async () => {
        setIsLoading(true);
        const data = await getCountriesApi({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data
            .filter(item => item.code)
            .map(item => ({
              value: item.code as string,
              label: item.country,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
            setCategoryData(arr);
            setIsLoading(false);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getAllCountries();
    }, [getAllCountries]);

    return { isLoading, countryData };
}
