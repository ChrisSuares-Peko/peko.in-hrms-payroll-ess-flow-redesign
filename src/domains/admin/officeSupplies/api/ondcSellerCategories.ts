import { UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    BulkVisibilityMode,
    ListingPosition,
    ProductVisibilityFilter,
    SellerCategoriesQuery,
    SellerCategoriesResponse,
    SellerCategory,
    SellerCategoryHistoryEntry,
    SellerCategoryProduct,
    SellerCategoryStatus,
} from '../types/ondcSellerCategory';

/** Manage > Products > Review. Every call resolves to `false` on failure. */

const base = (p: UserPayload) => `${p.userType}/${p.userId}/purchase/ecommerce/ondc`;

// The response interceptor already unwraps axios' `data`, leaving the server body.
const unwrap = <T>(resp: any): T => resp?.data ?? resp;

const request = async <T>(label: string, run: () => Promise<any>): Promise<T | false> => {
    try {
        return unwrap<T>(await run());
    } catch (err) {
        console.error(`${label} failed:`, err);
        return false;
    }
};

export const getSellerCategoriesApi = (p: UserPayload & SellerCategoriesQuery) =>
    request<SellerCategoriesResponse>('getSellerCategories', () =>
        ApiClient.get(`${base(p)}/seller-categories`, {
            params: {
                status: p.status,
                search: p.searchText || undefined,
                page: p.page,
                itemsPerPage: p.itemsPerPage,
                sort: p.sort,
                sortField: p.sortField || undefined,
                _ts: Date.now(),
            },
        })
    );

export const getSellerCategoryApi = (p: UserPayload & { id: number }) =>
    request<SellerCategory>('getSellerCategory', () =>
        ApiClient.get(`${base(p)}/seller-categories/${p.id}`, { params: { _ts: Date.now() } })
    );

export const getSellerCategoryProductsApi = (
    p: UserPayload & {
        id: number;
        visibility: ProductVisibilityFilter;
        searchText: string;
        page: number;
        itemsPerPage: number;
    }
) =>
    request<{ recordsTotal: number; data: SellerCategoryProduct[] }>(
        'getSellerCategoryProducts',
        () =>
            ApiClient.get(`${base(p)}/seller-categories/${p.id}/products`, {
                params: {
                    visibility: p.visibility,
                    search: p.searchText || undefined,
                    page: p.page,
                    itemsPerPage: p.itemsPerPage,
                    _ts: Date.now(),
                },
            })
    );

export const getSellerCategoryHistoryApi = (p: UserPayload & { id: number }) =>
    request<{ recordsTotal: number; data: SellerCategoryHistoryEntry[] }>(
        'getSellerCategoryHistory',
        () =>
            ApiClient.get(`${base(p)}/seller-categories/${p.id}/history`, {
                params: { _ts: Date.now() },
            })
    );

export const decideSellerCategoryApi = (
    p: UserPayload & {
        id: number;
        status: SellerCategoryStatus;
        pekoCategoryId?: number | null;
        listingPosition?: ListingPosition;
        hideKeywords?: string[];
    }
) =>
    request<SellerCategory>('decideSellerCategory', () =>
        ApiClient.put(`${base(p)}/seller-categories/${p.id}/decision`, {
            status: p.status,
            pekoCategoryId: p.pekoCategoryId ?? undefined,
            listingPosition: p.listingPosition,
            hideKeywords: p.hideKeywords,
        })
    );

export const markSellerCategoriesReviewedApi = (p: UserPayload & { ids?: number[] }) =>
    request<{ updated: number }>('markSellerCategoriesReviewed', () =>
        ApiClient.post(`${base(p)}/seller-categories/mark-reviewed`, p.ids ? { ids: p.ids } : {})
    );

export const setSellerCategoryProductsVisibilityApi = (
    p: UserPayload & { id: number; mode: BulkVisibilityMode; productIds: number[] }
) =>
    request<{ shown: number; hidden: number }>('setSellerCategoryProductsVisibility', () =>
        ApiClient.post(`${base(p)}/seller-categories/${p.id}/products/visibility`, {
            mode: p.mode,
            productIds: p.productIds,
        })
    );

export const setProductPekoCategoryApi = (
    p: UserPayload & { productId: number; pekoCategoryId: number | null }
) =>
    request<{ id: number; pekoCategoryId: number | null }>('setProductPekoCategory', () =>
        ApiClient.patch(`${base(p)}/products/${p.productId}/category`, {
            pekoCategoryId: p.pekoCategoryId,
        })
    );

/** A product's own listing position, or `null` to follow its seller category. */
export const setProductListingPositionApi = (
    p: UserPayload & { productId: number; listingPosition: ListingPosition | null }
) =>
    request<{ id: number; listingPosition: ListingPosition | null }>(
        'setProductListingPosition',
        () =>
            ApiClient.patch(`${base(p)}/products/${p.productId}/position`, {
                listingPosition: p.listingPosition,
            })
    );
