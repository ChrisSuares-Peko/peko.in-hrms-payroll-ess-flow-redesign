import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getFareCalendarAPI } from '../api';

export type FareCalendarPriceMap = Record<string, { price: number; isLowest: boolean }>;

const buildPriceMap = (results: any[]): FareCalendarPriceMap => {
    const map: FareCalendarPriceMap = {};
    results.forEach((item: any) => {
        if (!item?.DepartureDate || item?.Fare == null) return;
        const dateKey = item.DepartureDate.split('T')[0]; // "YYYY-MM-DD"
        map[dateKey] = { price: item.Fare, isLowest: !!item.IsLowestFareOfMonth };
    });
    return map;
};

export const useFareCalendar = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [priceMap, setPriceMap] = useState<FareCalendarPriceMap>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchFareCalendar = async (reqData: any) => {
        setIsLoading(true);
        // getFareCalendarAPI returns res.data = { SearchResults: [...], Origin, Destination }
        const res = await getFareCalendarAPI({ userType: role, userId: id, reqData });
        const results = res?.SearchResults ?? res?.searchResults;
        if (Array.isArray(results)) {
            setPriceMap(buildPriceMap(results));
        }
        setIsLoading(false);
    };

    return { priceMap, isLoading, fetchFareCalendar };
};
