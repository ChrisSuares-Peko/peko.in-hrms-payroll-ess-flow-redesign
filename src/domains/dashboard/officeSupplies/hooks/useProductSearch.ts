import { useCallback, useEffect, useMemo, useState } from 'react';

import { debounce } from 'lodash';

import { useAppSelector } from '@src/hooks/store';

import { getProductList } from '../api/product';
import { ProductCardProps } from '../types/products';
import { mapProductsWithImages } from '../utils/mapProductCard';

/**
 * Debounced product-name search for the search-bar autocomplete dropdown.
 * Filters the stored city catalog — never fires ONDC /search.
 */
export function useProductSearch(city: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [suggestions, setSuggestions] = useState<ProductCardProps[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const run = useCallback(
        async (text: string) => {
            const q = text.trim();
            if (!q || !city) {
                setSuggestions([]);
                setIsSearching(false);
                return;
            }
            setIsSearching(true);
            const data = await getProductList({
                userId: id,
                userType: role,
                city,
                search: q,
                limit: 12,
                offset: 0,
            });
            if (data) setSuggestions(mapProductsWithImages(data.rows));
            else setSuggestions([]);
            setIsSearching(false);
        },
        [city, id, role]
    );

    const search = useMemo(() => debounce((text: string) => run(text), 400), [run]);

    useEffect(() => () => search.cancel(), [search]);

    return { suggestions, isSearching, search };
}
