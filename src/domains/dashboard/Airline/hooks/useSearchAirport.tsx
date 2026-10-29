import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSearchAirport } from '../api/index';
import { AirportSearchResult, ISearchData } from '../types/searchAirports';

export const useGetSearchAirport = (loc: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [searchData, setSearchData] = useState<ISearchData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getAirportSearchHandler = useCallback(async () => {
        const data: AirportSearchResult | false = await getSearchAirport({
            userId: id,
            userType: role,
            loc,
        });

        if (data) {
            const { airports } = data;
            const arr = airports
                ?.map(item => ({
                    value: item.airportCode ?? '',
                    location: `${item.cityName}, ${item.countryName}`,
                    label: `${item.airportName}`,
                    countryCode: item.countryCode,
                }))
                .slice(0, 100);
            setSearchData(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, loc, role]);

    useEffect(() => {
        getAirportSearchHandler();
    }, [getAirportSearchHandler]);
    return { data: searchData, isLoading };
};
