import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOndcOfficeSupplyCategories } from '../api/ondcCategories';
import {
    ALL_PRODUCTS_CATEGORY,
    mapStorefrontTreeToCategories,
    OfficeCategory,
} from '../utils/officeSupplyCategories';

/** Enabled ONDC category tree for the corporate browse UI (category bar + URL filters). */
export function useOfficeSupplyCategories() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [categories, setCategories] = useState<OfficeCategory[]>([ALL_PRODUCTS_CATEGORY]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await getOndcOfficeSupplyCategories({ userId: id, userType: role });
        if (data) setCategories(mapStorefrontTreeToCategories(data));
        else setCategories([ALL_PRODUCTS_CATEGORY]);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        load();
    }, [load]);

    return { categories, isLoading, reload: load };
}
