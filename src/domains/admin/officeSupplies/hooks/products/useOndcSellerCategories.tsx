import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getSellerCategoriesApi,
    markSellerCategoriesReviewedApi,
} from '../../api/ondcSellerCategories';
import {
    SellerCategoriesQuery,
    SellerCategory,
    SellerCategoryCounts,
} from '../../types/ondcSellerCategory';

const EMPTY_COUNTS: SellerCategoryCounts = { unmapped: 0, mapped: 0, excluded: 0, all: 0 };

/** Products → Review tab: seller categories of one status tab + every tab's count. */
const useOndcSellerCategories = (filters: SellerCategoriesQuery) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<SellerCategory[]>([]);
    const [total, setTotal] = useState(0);
    const [counts, setCounts] = useState<SellerCategoryCounts>(EMPTY_COUNTS);

    const fetchList = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const res = await getSellerCategoriesApi({ userId: id, userType: role, ...filters });
        if (res) {
            setRows(res.data || []);
            setTotal(res.recordsTotal || 0);
            setCounts(res.counts || EMPTY_COUNTS);
        } else {
            setRows([]);
            setTotal(0);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const markAllReviewed = async () => {
        const res = await markSellerCategoriesReviewedApi({ userId: id, userType: role });
        dispatch(
            showToast({
                variant: res ? 'success' : 'error',
                description: res
                    ? `${res.updated} ${res.updated === 1 ? 'category' : 'categories'} marked as reviewed.`
                    : 'Could not mark categories as reviewed.',
            })
        );
        if (res) await fetchList();
        return !!res;
    };

    return { isLoading, rows, total, counts, markAllReviewed, refetch: fetchList };
};

export default useOndcSellerCategories;
