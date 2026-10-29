export interface CommonPayload {
    userId: number;
    userType: string;
}

// ─── Domain & Hosting ─────────────────────────────────────────────────────────

export interface DomainSearchPayload extends CommonPayload {
    domainName: string;
}

export interface GetHostingPlansPayload extends CommonPayload {
    planType: string;
    serverLocation?: string;
}

export interface RegisterCustomerPayload extends CommonPayload {
    username: string;
    name: string;
    company: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    phoneCc: string;
    phone: string;
    langPref?: string;
}

export interface LoginCustomerPayload extends CommonPayload {
    username: string;
    passwd: string;
}

export interface DomainResult {
    domain: string;
    displayDomain?: string;
    available: boolean;
    classkey: string;
    price: number | null;
    registrationYears?: number;
    isPremium?: boolean;
}

export interface DomainSearchResults {
    searchTerm: string;
    exactMatch: DomainResult[];
    suggestions: DomainResult[];
    // Raw vendor premium-check object (e.g. { premium: "true" }) or null — not a domain list
    premium?: DomainResult[] | Record<string, unknown> | null;
    popularTlds?: string[];
}

export interface CustomerData {
    customerid?: string | number;
    userid?: string | number;
    id?: string | number;
    username?: string;
    name?: string;
    company?: string;
    [key: string]: string | number | boolean | undefined;
}

// ─── Service Cart ─────────────────────────────────────────────────────────────

export type CartItemType = 'domain' | 'vps_server' | 'hosting' | 'shared_hosting' | 'titan_email' | 'google_workspace' | 'backup';

export interface AddToCartPayload extends CommonPayload {
    itemType: CartItemType;
    productId: string;
    productName: string;
    productQuantity?: number;
    accounts?: number; // for titan_email
    seats?: number; // for google_workspace
    [key: string]: any;
}

export interface UpdateCartPayload extends CommonPayload {
    productId: string;
    planId?: string | null;
    billingCycle?: number;
    operation: 'increase' | 'decrease';
    productQuantity?: number;
}

export interface UpdateCartDetailsPayload extends CommonPayload {
    productId: string;
    planId?: string | null;
    productName?: string | null;
    domainName?: string;
    accounts?: number;
    seats?: number;
    billingCycle?: number;
}

export interface ValidBillingCycle {
    months: number;
    pricePerMonth: number;
}

export interface ValidYear {
    years: number;
    price: number;
}

export interface CartItem {
    productId: string;
    planId?: string;
    itemType: CartItemType;
    productName: string;
    productQuantity: number;
    unitPrice: number;
    addonUnitPrice?: number;
    totalPrice: number;
    accounts?: number;
    seats?: number;
    billingCycle?: number;
    domainName?: string;
    serverLocation?: string;
    os?: string;
    addons?: string[];
    addonQuantities?: Record<string, number>;
    availableAddons?: Record<string, number>;
    vpsProductId?: string;
    storageInGb?: number;
    validBillingCycles?: ValidBillingCycle[];
    validYears?: ValidYear[];
}

export interface CustomerDetails {
    customerid: string;
    name: string;
    company: string;
    useremail: string;
    username: string;
    address1: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    telnocc: string;
    telno: string;
    mobileno: string;
    mobilenocc: string;
    customerstatus: string;
    [key: string]: any;
}

export interface CartData {
    items: CartItem[];
    count: number;
    cartId: number;
    itemsTotalAmount: number;
    allowCheckout: boolean;
    customerDetails?: CustomerDetails;
}

// ─── Order History ─────────────────────────────────────────────────────────────

export interface OrderHistoryPayload extends CommonPayload {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    from?: string;
    to?: string;
}

export interface OrderItem {
    itemType: string;
    productId: string;
    productName: string;
    productQuantity: number;
    unitPrice: number;
    totalPrice: number;
    billingCycle?: number;
    os?: string;
    addons?: string[];
    controlPanel?: string;
    domainName?: string;
}

export interface ProvisionResult {
    itemType: string;
    domainName: string | null;
    status: 'SUCCESS' | 'FAILURE';
    result: Record<string, any>;
}

export interface Order {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    amount: number;
    surcharge: number;
    totalAmount: number;
    status: string;
    paymentMode: string;
    items: OrderItem[];
    provisionResults: ProvisionResult[];
}

export interface DeletePlanPayload extends CommonPayload {
    orderId: string | number;
    itemType: string;
    productId?: string;
    corporateTxnId?: string;
}

export interface OrderHistoryResponse {
    orders: Order[];
    totalRecords: number;
    page: number;
    itemsPerPage: number;
}
