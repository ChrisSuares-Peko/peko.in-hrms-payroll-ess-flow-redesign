import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getProductList, triggerCitySearch } from '../api/product';
import { ProductCardProps, ProductFilters, ProductListResponse, ProductSort } from '../types/products';
import {
    CATALOG_POLL_MS,
    getCityPollDeadline,
    startCityPoll,
} from '../utils/catalogSession';
import { mapProductsWithImages } from '../utils/mapProductCard';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const hasActiveFilters = (
    searchText: string,
    localCategory?: string,
    filters?: ProductFilters
) =>
    Boolean(
        (searchText || '').trim() ||
            localCategory ||
            filters?.priceMax ||
            filters?.minDiscount ||
            (filters?.sellers && filters.sellers.length)
    );

/**
 * Shared city catalog: GET stored products first. If the city has none,
 * POST /ondc/search so the backend can run ONDC /search. After a live search,
 * poll for ~2 min so later sellers appear.
 */
export function useProductsApi(
    city: string | undefined,
    currentPage: number,
    pageSize: number,
    searchText: string,
    localCategory?: string,
    filters?: ProductFilters,
    // Only reorders — deliberately not an "active filter" for the empty-city search below.
    sort?: ProductSort
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [products, setProducts] = useState<ProductCardProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCity, setIsFetchingCity] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [citySearchTick, setCitySearchTick] = useState(0);

    const userId = id;
    const userType = role;
    const filtersKey = JSON.stringify(filters || {});

    const paramsRef = useRef({ currentPage, pageSize, searchText, localCategory, filters, sort });
    paramsRef.current = { currentPage, pageSize, searchText, localCategory, filters, sort };

    const fetchOnce = useCallback(async () => {
        const {
            currentPage: page,
            pageSize: size,
            searchText: text,
            localCategory: category,
            filters: f,
            sort: order,
        } = paramsRef.current;
        return getProductList({
            userId,
            userType,
            city: city || '',
            limit: size,
            offset: (page - 1) * size,
            search: text || '',
            localCategory: category || undefined,
            priceMax: f?.priceMax,
            minDiscount: f?.minDiscount,
            sellers: f?.sellers?.length ? f.sellers.join(',') : undefined,
            sort: order,
        });
    }, [userId, userType, city]);

    const applyProductData = (data: ProductListResponse | false) => {
        if (data) {
            setProducts(mapProductsWithImages(data.rows));
            setCount(data.count || 0);
            return data.count || 0;
        }
        setProducts([]);
        setCount(0);
        return 0;
    };

    useEffect(() => {
        if (!city) {
            setProducts([]);
            setCount(0);
            setIsLoading(false);
            setIsFetchingCity(false);
            return undefined;
        }

        let cancelled = false;

        const pollUntilDeadline = async (): Promise<void> => {
            if (cancelled || Date.now() >= getCityPollDeadline(city)) return;
            await sleep(CATALOG_POLL_MS);
            if (cancelled) return;
            const next = await fetchOnce();
            if (cancelled) return;
            // A failed poll keeps what is on screen rather than blanking the grid.
            if (next && applyProductData(next) > 0) {
                setIsFetchingCity(false);
                setCitySearchTick(t => t + 1);
            }
            await pollUntilDeadline();
        };

        const run = async () => {
            setIsLoading(true);
            let data: ProductListResponse | false = false;
            try {
                data = await fetchOnce();
            } finally {
                if (!cancelled) setIsLoading(false);
            }
            if (cancelled) return;
            const firstCount = applyProductData(data);
            if (firstCount > 0) {
                setIsFetchingCity(false);
                setCitySearchTick(t => t + 1);
                await pollUntilDeadline();
                if (!cancelled) setIsFetchingCity(false);
                return;
            }

            if (hasActiveFilters(paramsRef.current.searchText, paramsRef.current.localCategory, paramsRef.current.filters)) {
                setIsFetchingCity(false);
                // A city search may still be running (started from the home page).
                await pollUntilDeadline();
                return;
            }

            setIsFetchingCity(true);
            const result = await triggerCitySearch({ userId, userType, city });
            if (cancelled) return;
            // A failed/timed-out trigger still polls: the listing GET already started the search server-side.
            if (!result || result.searched || result.reason === 'in_flight') {
                startCityPoll(city);
            }
            setCitySearchTick(t => t + 1);

            data = await fetchOnce();
            if (cancelled) return;
            if (data && data.count > 0) setIsFetchingCity(false);
            applyProductData(data);

            await pollUntilDeadline();
            if (!cancelled) {
                setIsFetchingCity(false);
                setCitySearchTick(t => t + 1);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [city, currentPage, pageSize, searchText, localCategory, filtersKey, sort, userId, userType, fetchOnce]);

    return { data: products, isLoading, isFetchingCity, count, citySearchTick };
}
