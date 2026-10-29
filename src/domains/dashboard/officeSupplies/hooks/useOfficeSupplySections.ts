import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOfficeSupplySections } from '../api/product';
import { OfficeSupplySectionsResponse, ProductCardProps } from '../types/products';
import { mapProductsWithImages } from '../utils/mapProductCard';

const EMPTY: ProductCardProps[] = [];

/**
 * Fetch the curated storefront rows (Top Deals / Top Rated / Frequently Bought)
 * for a city in one call. `topRated` and `frequentlyBought` are empty until the
 * backend has rating / order data — callers should hide an empty section.
 *
 * All Products is intentionally NOT handled here: that grid keeps using
 * `useProductsApi` so its ONDC city-search trigger, pagination, search and
 * category filtering stay intact.
 *
 * `isLoading` is true until this `city` has a completed fetch, so the home
 * page can stay on its skeleton until Top Deals are ready. Later refetches
 * (after the city catalog poll) update in place without returning to loading.
 */
export function useOfficeSupplySections(city: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [topDeals, setTopDeals] = useState<ProductCardProps[]>(EMPTY);
    const [topRated, setTopRated] = useState<ProductCardProps[]>(EMPTY);
    const [frequentlyBought, setFrequentlyBought] = useState<ProductCardProps[]>(EMPTY);
    const [fetchedCity, setFetchedCity] = useState<string | undefined>();

    const applySections = (data: OfficeSupplySectionsResponse | false) => {
        if (data) {
            setTopDeals(mapProductsWithImages(data.topDeals));
            setTopRated(mapProductsWithImages(data.topRated));
            setFrequentlyBought(mapProductsWithImages(data.frequentlyBought));
            return;
        }
        setTopDeals(EMPTY);
        setTopRated(EMPTY);
        setFrequentlyBought(EMPTY);
    };

    useEffect(() => {
        if (!city) {
            applySections(false);
            setFetchedCity(undefined);
            return undefined;
        }

        let cancelled = false;
        (async () => {
            const data: OfficeSupplySectionsResponse | false = await getOfficeSupplySections({
                userId: id,
                userType: role,
                city,
            });
            if (cancelled) return;
            applySections(data);
            setFetchedCity(city);
        })();

        return () => {
            cancelled = true;
        };
    }, [city, id, role]);

    const refetch = useCallback(async () => {
        if (!city) return;
        const data: OfficeSupplySectionsResponse | false = await getOfficeSupplySections({
            userId: id,
            userType: role,
            city,
        });
        applySections(data);
    }, [city, id, role]);

    return {
        topDeals,
        topRated,
        frequentlyBought,
        isLoading: Boolean(city) && fetchedCity !== city,
        refetch,
    };
}
