export type ProductCardProps = {
    image: string;
    name: string;
    price: string;
    actualPrice: string;
    savePrice: string;
    id: number;
    ondcProductId: string;
    quantity?: number;
    /** Seller minimum order quantity — "Add to Cart" adds this many (default 1). */
    minQuantity?: number | null;
    category?: string;
    /** Seller store name, e.g. "BizSupply Co" (from OndcProduct.vendorName). */
    soldBy?: string;
};

/**
 * One ONDC office-supply product row as returned by
 * GET .../purchase/ecommerce/products (source = "OFFICE_SUPPLIES").
 * `id` is a row id that changes on every catalog refresh — use `ondcProductId`
 * as the stable identifier for navigation/detail lookups.
 */
export type OndcProduct = {
    id: number;
    transactionId: string;
    ondcProductId: string;
    ondcVendorId: string;
    vendorName: string;
    name: string;
    symbol: string;
    shortDesc: string;
    longDesc: string;
    images: string[] | null;
    uom: string;
    measureValue: string;
    availableQuantity: number;
    maxQuantity: number;
    /** Seller minimum order quantity (quantity.minimum.count), null when not declared. */
    minQuantity?: number | null;
    price: string;
    maxPrice: string;
    /** @ondc/org/returnable */
    returnable?: boolean | null;
    /** @ondc/org/cancellable */
    cancellable?: boolean | null;
    /** @ondc/org/return_window — ISO-8601 duration, e.g. "P2D" */
    returnWindow?: string | null;
    /** @ondc/org/time_to_ship — ISO-8601 duration, e.g. "PT4H" */
    timeToShip?: string | null;
    /** @ondc/org/contact_details_consumer_care — raw "name,email,phone" string */
    consumerCare?: string | null;
    categoryId: string;
    localCategory: string;
    ondcDomain: string;
    /** ONDC city codes this product is available in, e.g. ["std:080","std:022"] */
    city: string[] | null;
    bppUri: string;
    bppId: string;
    /** raw ONDC item tags, e.g. [{ code:"attribute", list:[{code:"brand",value:"Canon"}] }] */
    tags?: OndcTag[] | null;
    createdAt: string;
    updatedAt: string;
};

export type OndcTag = {
    code: string;
    list: { code: string; value: string }[];
};

export type DeliveryEstimatePayload = {
    userId: number;
    userType: string;
    ondcProductId: string;
    quantity: number;
    /** ONDC city code of the selected delivery location, e.g. "std:080" */
    city: string;
    /** optional "lat,lng" from the browser — the precise delivery point */
    gps?: string;
    /** 6-digit Indian PIN — ONDC /select `address.area_code` */
    pincode?: string;
};

export type DeliveryEstimateResponse = {
    /** whether the seller deemed the delivery location serviceable */
    serviceable: boolean;
    /** raw ONDC TAT duration (e.g. "P1DT1H"), null when the seller didn't declare one */
    deliveryTat: string | null;
    /** resolved absolute delivery estimate (ISO) — null when unavailable, never fabricated */
    expectedDeliveryDate: string | null;
};

export type ProductListPayload = {
    userId: number;
    userType: string;
    offset: number;
    limit: number;
    search: string;
    /** ONDC city code, e.g. "std:080" */
    city: string;
    /** optional comma-separated categoryId keywords, e.g. "Computer,Accessor,Cable" — free-text LIKE search, superseded by localCategory below for the category bar */
    categoryId?: string;
    /** exact-match classified subcategory (or comma-separated list of several, matched via Op.in) — see classifyProductCategory, purchase's utils/ondc_helper.js */
    localCategory?: string;
    /** price ceiling (e.g. 200 for "Under ₹200") */
    priceMax?: number;
    /** minimum discount percent (e.g. 10 for "10% off or more") */
    minDiscount?: number;
    /** comma-separated seller (vendorName) values */
    sellers?: string;
    /**
     * Comma-joined transaction ids from the /ondc/search that produced this
     * catalog. Scopes the list to that one search instead of everything the
     * backend has cached; omitted for an unscoped browse.
     */
    transactionId?: string;
    /** grid order — omitted (or `relevance`) keeps the server's default order */
    sort?: ProductSort;
};

/** "Sort by" choice on the product results page; sorted server-side (the grid is paginated). */
export type ProductSort = 'relevance' | 'price_asc' | 'price_desc' | 'discount' | 'newest';

/** Office Supplies grid filters (Filters sidebar). */
export type ProductFilters = {
    priceMax?: number;
    minDiscount?: number;
    sellers?: string[];
};

export type CitySearchPayload = {
    userId: number;
    userType: string;
    /** ONDC city code, e.g. "std:080" */
    city: string;
};

/** What POST /ondc/search answers with. `searched` is false when the city catalog was reused. */
export type CitySearchResult = {
    city: string;
    transactionIds: string[];
    received: boolean;
    searched?: boolean;
    reason?: string;
};

export type ProductListResponse = {
    count: number;
    rows: OndcProduct[];
};
export type useFilterCommon = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId?: string | number;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    from?: string;
    to?: string;
    corporateId?: string | number;
    category?: string | number;
};
export type filterState = {
    type?: string;
    title?: string;
    searchText: string;
    category: string;
    sort: string;
    page: number;
    itemsPerPage: number;
    filter: string;
    from: string;
    to: string;
    sortField: string;
}
export type SectionsPayload = {
    userId: number;
    userType: string;
    /** ONDC city code, e.g. "std:080" */
    city: string;
    /** size of each curated row (default 12 on the backend) */
    limit?: number;
};

/**
 * Combined storefront sections from
 * GET .../purchase/ecommerce/products/sections.
 * `topRated` is unused (always []). `frequentlyBought` is a stub until
 * order data exists.
 */
export type OfficeSupplySectionsResponse = {
    topDeals: OndcProduct[];
    topRated: OndcProduct[];
    frequentlyBought: OndcProduct[];
    allProducts: ProductListResponse;
};
