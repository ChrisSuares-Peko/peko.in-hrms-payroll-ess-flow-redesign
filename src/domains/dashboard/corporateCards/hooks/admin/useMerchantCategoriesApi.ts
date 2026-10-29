import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getMerchantCategories } from '../../api/admin/cardLimitsApi';
import { MERCHANT_CATEGORIES_FALLBACK } from '../../utils/issueCardData';
import { MerchantCategory } from '../../utils/types';

/**
 * Canonical restricted-category list (name + real MCC codes), shared by IssueCardDrawer and
 * ManageCardModal so both render the same checkboxes the server actually understands. Seeded with
 * MERCHANT_CATEGORIES_FALLBACK so the checkboxes aren't empty for the one render before the fetch
 * resolves, and kept on a failed fetch rather than clearing the list.
 */
export const useMerchantCategoriesApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [categories, setCategories] = useState<MerchantCategory[]>(MERCHANT_CATEGORIES_FALLBACK);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetch = async () => {
            setIsLoading(true);
            const res = await getMerchantCategories(role, id);
            if (!cancelled) {
                if (res && res.data?.categories?.length) {
                    setCategories(res.data.categories);
                }
                setIsLoading(false);
            }
        };
        fetch();
        return () => {
            cancelled = true;
        };
    }, [role, id]);

    return { categories, isLoading };
};
