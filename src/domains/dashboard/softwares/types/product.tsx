interface INameWeburl {
    name: string;
    weburl: string;
}

interface INameOnly {
    name: string;
}
export interface IPricingPlan {
    plan: string;
    amount: number;
    currency: string;
    period: string;
    entity: string;
    description: string[];
    isPlanFree: boolean;
    amountInConvertedCurrency: string;
}

interface IRatings {
    overall_rating: number;
    total_reviews: number;
    ease_of_implementation: number;
    ease_of_use: number;
    value_for_money: number;
    breadth_of_features: number;
    customer_support: number;
}

export interface IPurchaseOption {
    sku: ISku;
    plan: IPlan;
}

interface ISku {
    planId: string;
    code: string;
    region: string;
    pricingOption: IPricingOption;
    purchaseConstraints: IPurchaseConstraints;
    activationTimeline: string;
}

export interface IPricingOption {
    billingCycle: string;
    amount: string;
    currency: string;
    entity: string;
    ratePeriod: string;
    discountPercentage: string;
    discountedAmount: string;
    amountInConvertedCurrency: string;
    discountedAmountInConvertedCurrency: string;
}

interface IPurchaseConstraints {
    minUnits: number;
    maxUnits: number | 'unlimited';
}

interface IPlan {
    name: string;
    planType: string;
}

export interface IProduct {
    weburl: string;
    parent_categories: INameWeburl[];
    company: string;
    feature_overview: string;
    features: INameOnly[];
    integrations: any[];
    languages: {
        name: string;
        symbol: string;
    }[];
    logo_url: string;
    other_features: string[];
    overview: string;
    pricing: IPricingPlan[];
    pricing_overview: string;
    product_name: string;
    ratings: IRatings;
    reviews_strengths: string[];
    reviews_weakness: string[];
    snapshots: any[];
    social_links: Record<string, string>;
    usp: string;
    videos: string[];
    website: string;
    hasPurchaseOptions: boolean;
    purchaseOptions?: IPurchaseOption[];
    // calendlyLink:string
}

export interface ICategoryProductsResponse {
    products: IProductCard[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ISearchProductRequestPayload {
    userId: number;
    userType: string;
    query: string;
    parentCategorySlug?: string;
}

export interface IProductCard {
    weburl: string;
    logo_url: string;
    product_name: string;
    company: string;
    website: string;
    overview: string;
    ratings: IRatings;
    matchPercentage?: number;
    pricing?: IPricingPlan[] | null;
    hasPurchaseOptions: boolean;
}
export type ISearchProductResponse = { products: IProductCard[] };

export interface IProductDetailsRequestPayload {
    userId: number;
    userType: string;
    weburl: string;
}

export interface IProductDetailsResponse {
    product: IProduct;
}

export type FiltersType = {
    page: number;
    limit: number;
    filter?: string;
    sort?: string;
};

export interface IGetAssistanceRequestPayload {
    userId: number;
    userType: string;
    productName: string;
}

export interface IGetAssistanceResponse {
    message: string;
}

export interface IPurchaseItem {
    key: string;
    purchasedOn: string;
    productName: string;
    planName: string;
    orderId: string;
    paymentMode: string;
    totalAmount: string;
    status: 'PURCHASED' | 'PENDING' | 'FAILURE';
}

export interface IFetchOrderDetailsPayload {
    userId: number;
    userType: string;
    from: string | null;
    to: string | null;
    searchText: string;
    page: number;
    limit: number;
}
export interface IFetchOrderDetailsResponse {
    orderDetails: IPurchaseItem[];
    totalData: number;
}

export interface ICancelPlanPayload {
    userId: number;
    userType: string;
    orderId: string;
}

export interface IFetchOneOrderPayload {
    userId: number;
    userType: string;
    orderId: string;
}

export interface ISubscriptionPlan {
    billingCycle: string;
    order: { amountInINR: string; paymentMode: string };
    productName: string;
    purchaseType: string | null;
    status: string;
    subscriptionEndDate: string;
    subscriptionStartDate: string;
    isCancelled: boolean;
}

export interface IFetchOneOrderResponse {
    orderDetails: ISubscriptionPlan;
}
