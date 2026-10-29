/** Manage > Products > Review (purchase `/ondc/seller-categories/*`). */

export type SellerCategoryStatus = 'unmapped' | 'mapped' | 'excluded';
export type SellerCategoryTab = SellerCategoryStatus | 'all';

/** Storefront listing position: core first … low last. */
export type ListingPosition = 'core' | 'useful' | 'accessory' | 'low';

export interface PekoCategoryRef {
    id: number | null;
    name: string;
    parentName: string | null;
}

export interface SellerCategory {
    id: number;
    label: string;
    categoryKey: string;
    ondcDomain: string;
    status: SellerCategoryStatus;
    isNew: boolean;
    pekoCategory: PekoCategoryRef | null;
    listingPosition: ListingPosition;
    /** "Hide products containing" words, normalised */
    hideKeywords: string[];
    productCount: number;
    visibleCount: number;
    hiddenCount: number;
    /** products new since the last review — hidden until an admin approves them */
    newProductCount: number;
    /** up to three vendor names */
    sellers: string[];
    sellerCount: number;
    /** seller NP names (via) */
    sellerNps: string[];
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    decidedAt: string | null;
    decidedByName: string | null;
}

export interface SellerCategoryCounts {
    /** the To review tab: unmapped, plus mapped ones with new products */
    unmapped: number;
    mapped: number;
    excluded: number;
    all: number;
}

export interface SellerCategoriesResponse {
    recordsTotal: number;
    data: SellerCategory[];
    counts: SellerCategoryCounts;
}

export interface SellerCategoriesQuery {
    status: SellerCategoryTab;
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: string;
    sortField: string;
}

/** Why the system hides a product (first failing rule); null = passes. */
export type HiddenReason =
    | 'sellerNp'
    | 'domain'
    | 'seller'
    | 'keyword'
    | 'excluded'
    | 'unmapped'
    | 'categoryWord'
    | 'categoryOff'
    | 'pending'
    | null;

export interface SellerCategoryProduct {
    id: number;
    name: string;
    vendorName: string | null;
    price: number | null;
    maxPrice: number | null;
    image: string | null;
    inStock: boolean;
    /** the admin switch */
    visibleOnPeko: boolean;
    /** arrived since the last review; hidden until shown or hidden by an admin */
    isNew: boolean;
    hiddenReason: HiddenReason;
    hiddenDetail: string | null;
    /** true when the product has its own Peko category instead of following the mapping */
    overridden: boolean;
    pekoCategory: PekoCategoryRef | null;
    /** the product's own listing position; null follows the seller category */
    listingPosition: ListingPosition | null;
}

export type ProductVisibilityFilter = 'all' | 'visible' | 'hidden' | 'new';

export interface SellerCategoryHistoryEntry {
    id: number;
    action: string;
    detail: Record<string, unknown> | null;
    actorName: string | null;
    createdAt: string;
}

/** `approveNew` shows every new product of the seller category (no ids needed). */
export type BulkVisibilityMode = 'hide' | 'show' | 'only' | 'approveNew';
