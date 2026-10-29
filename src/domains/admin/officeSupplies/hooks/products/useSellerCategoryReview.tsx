import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getOndcCategoriesTree } from '../../api/ondcCategories';
import {
    decideSellerCategoryApi,
    getSellerCategoryApi,
    getSellerCategoryHistoryApi,
    getSellerCategoryProductsApi,
    setProductListingPositionApi,
    setProductPekoCategoryApi,
    setSellerCategoryProductsVisibilityApi,
} from '../../api/ondcSellerCategories';
import { OndcCategoryTreeRow } from '../../types/ondcCategory';
import {
    BulkVisibilityMode,
    ListingPosition,
    ProductVisibilityFilter,
    SellerCategory,
    SellerCategoryHistoryEntry,
    SellerCategoryProduct,
    SellerCategoryStatus,
} from '../../types/ondcSellerCategory';

export interface ProductFilters {
    visibility: ProductVisibilityFilter;
    searchText: string;
    page: number;
    itemsPerPage: number;
}

/**
 * Products → Review → one seller category: its header, decision, history and
 * products. Every write refetches what it can change (header counts,
 * products, history).
 */
const useSellerCategoryReview = (sellerCategoryId: number, productFilters: ProductFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const user = { userId: id, userType: role };

    const [category, setCategory] = useState<SellerCategory | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [history, setHistory] = useState<SellerCategoryHistoryEntry[]>([]);
    const [tree, setTree] = useState<OndcCategoryTreeRow[]>([]);
    const [products, setProducts] = useState<SellerCategoryProduct[]>([]);
    const [productTotal, setProductTotal] = useState(0);
    const [productsLoading, setProductsLoading] = useState(false);

    const toast = (ok: boolean, success: string, failure: string) =>
        dispatch(
            showToast({ variant: ok ? 'success' : 'error', description: ok ? success : failure })
        );

    const loadCategory = useCallback(async () => {
        const res = await getSellerCategoryApi({
            userId: id,
            userType: role,
            id: sellerCategoryId,
        });
        if (res) setCategory(res);
        else setNotFound(true);
    }, [id, role, sellerCategoryId]);

    const loadHistory = useCallback(async () => {
        const res = await getSellerCategoryHistoryApi({
            userId: id,
            userType: role,
            id: sellerCategoryId,
        });
        if (res) setHistory(res.data || []);
    }, [id, role, sellerCategoryId]);

    const loadProducts = useCallback(async () => {
        setProductsLoading(true);
        const res = await getSellerCategoryProductsApi({
            userId: id,
            userType: role,
            id: sellerCategoryId,
            ...productFilters,
        });
        if (res) {
            setProducts(res.data || []);
            setProductTotal(res.recordsTotal || 0);
        }
        setProductsLoading(false);
    }, [id, role, sellerCategoryId, productFilters]);

    useEffect(() => {
        if (!id || !sellerCategoryId) return;
        loadCategory();
        loadHistory();
        getOndcCategoriesTree({ userId: id, userType: role }).then(res => {
            if (res) setTree(res);
        });
    }, [id, role, sellerCategoryId, loadCategory, loadHistory]);

    useEffect(() => {
        if (!id || !sellerCategoryId) return;
        loadProducts();
    }, [id, sellerCategoryId, loadProducts]);

    const refreshAll = () => Promise.all([loadCategory(), loadHistory(), loadProducts()]);

    const saveDecision = async (
        status: SellerCategoryStatus,
        pekoCategoryId: number | null,
        listingPosition?: ListingPosition,
        hideKeywords?: string[]
    ) => {
        const res = await decideSellerCategoryApi({
            ...user,
            id: sellerCategoryId,
            status,
            pekoCategoryId,
            listingPosition,
            hideKeywords,
        });
        toast(!!res, 'Decision saved.', 'Could not save the decision.');
        if (res) await refreshAll();
        return !!res;
    };

    const setVisibility = async (mode: BulkVisibilityMode, productIds: number[]) => {
        const res = await setSellerCategoryProductsVisibilityApi({
            ...user,
            id: sellerCategoryId,
            mode,
            productIds,
        });
        toast(
            !!res,
            mode === 'approveNew' ? 'New products approved.' : 'Products updated.',
            'Could not update the products.'
        );
        if (res) await refreshAll();
        return !!res;
    };

    const setProductCategory = async (productId: number, pekoCategoryId: number | null) => {
        const res = await setProductPekoCategoryApi({ ...user, productId, pekoCategoryId });
        toast(
            !!res,
            pekoCategoryId === null
                ? 'Product follows the mapping again.'
                : 'Product category changed.',
            'Could not change the product category.'
        );
        if (res) await refreshAll();
        return !!res;
    };

    const setProductPosition = async (productId: number, listingPosition: ListingPosition | null) => {
        const res = await setProductListingPositionApi({ ...user, productId, listingPosition });
        toast(
            !!res,
            listingPosition === null
                ? "Product follows the seller category's position again."
                : 'Product position changed.',
            'Could not change the product position.'
        );
        if (res) await refreshAll();
        return !!res;
    };

    return {
        category,
        notFound,
        history,
        tree,
        products,
        productTotal,
        productsLoading,
        saveDecision,
        setVisibility,
        setProductCategory,
        setProductPosition,
    };
};

export default useSellerCategoryReview;
