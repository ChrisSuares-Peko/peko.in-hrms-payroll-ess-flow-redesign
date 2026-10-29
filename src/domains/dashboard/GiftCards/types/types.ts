import { SelectedEmployee } from './employee';

export type GetGiftcardListPayload = {
    userId: number;
    userType: string;
    accessKeys?: string[];
    searchText: string;
    page: number;
    limit: number;
    category: string;
    categoryFilter: string;
    offset: number;
};

export type DetailPayload = {
    userId: number;
    userType: string;
};
export type giftCardDetailPayload = DetailPayload & {
    cardID: string;
};

export interface ServiceOperator {
    accessKey: string;
}

export interface Giftcard {
    id: number;
    product_id: string;
    brand_code: string;
    name: string;
    image: string;
    min_price: string;
    max_price: string;
    is_open_denominnation: boolean;
    denominations: number[]; // Assuming denominations are always numbers
    activation_fee: string | null; // Activation fee can be null
    currency: string;
    description: string;
    redemption_instructions: string;
    status: number;
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    serviceOperator: ServiceOperator;
    product_name?: string;
    brand_name?: string;
    brand_logo?: string;
    quantityLimit?: number;
    priceType?: string;
    terms_and_condition?: string;
    usageType?: string;
    expiryAndValidity?: string;
    // Xoxoday getVouchers fields — 'realtime' or 'delayed'; tatInDays is the
    // vendor's turnaround time (in days), only meaningful when delayed.
    deliveryType?: string;
    tatInDays?: number | string | null;
}

export interface GiftcardListResponse {
    count: number;
    rows: Giftcard[];
}

export interface ApiResponse {
    status: boolean;
    data: GiftcardListResponse;
    message: string;
    responseCode: string;
}

export type GiftcardsTableData = {
    image: string;
    name: string;
    description: string;
    id: number;
    usageType?: string;
}[];

export type GiftCardDetailResponse = {
    mainGiftCard: Giftcard;
    relatedGiftCards: Giftcard[];
};

export interface walletPayload {
    userId?: number;
    userType?: string;
}

export type SurchargeResponse = {
    surcharge: string;
    corporateCashback: string;
};

export interface summaryTexts {
    key: string;
    value: string | number;
    isInput?: boolean;
}

export interface PaymentPayload {
    employee: SelectedEmployee[];
    cardId: string;
    receiverFirstName: string;
    receiverLastName: string;
    receiverEmail: string;
    receiverMobile: string;
    gender: string;
    amount: number;
    quantity: number;
    totalAmount: number;
    senderName: string;
    postcode: string;
    message: string;
    userType?: string;
    credentialId?: number;
}

export type OrderHistoryAddressDetails = {
    receiverFirstName: string;
    receiverEmail: string;
    senderName: string;
    message: string;
    employee: { receiverFirstName: string; receiverEmail: string; label: string }[];
};

export type OrderHistoryTableData = {
    txnId: string;
    date: string;
    paymentMode: string;
    status: string;
    giftCardName: string;
    amount: string;
    orderType: string;
    quantity: number;
    addressDetails?: OrderHistoryAddressDetails;
    formData?: Record<string, unknown>;
    productDetails?: Record<string, unknown>;
};
export type filterState = {
    search: string;
    draw: number;
    start: number;
    length: number;
    from: string;
    to: string;
};

interface Order {
    orderType: string;
    quantity: number;
    amountInINR: string;
    id: number;
    paymentMode: string;
    status: string;
    orderResponse: string;
    ecomOrderStatus: string;
    transactionDate: string;
    corporateTxnId: string;
}

export interface OrderHistoryDatatype {
    order: Order;
}

export type OrderHistoryTablePayload = {
    userId: number;
    userType: string;
    draw: number;
    start: number;
    length: number;
    search: string;
    from: string;
    to: string;
};

interface Order {
    id: number;
    amountInINR: string;
    paymentMode: string;
    status: string;
    orderResponse: string;
    ecomOrderStatus: string;
    transactionDate: string;
    corporateTxnId: string;
}

export type OrderHistoryListResponse = {
    result: OrderHistoryDatatype[];
    totalData: number;
};

export type UserDetailsPayload = {
    userId: number;
    userType: string;
};

export type userDetailsResponse = {
    addressId: number;
    addressLine1: string;
    addressLine2: string;
    userName: string;
    userEmail: string;
    userCountry: string;
};

export type PurchasePayload = PurchasePayloadData & {
    total_selling_price: number;
    items: PurchaseItem[];
};

export type ItemPayload = {
    total_selling_price: number;
    items: PurchaseItem[];
};
export interface PurchaseResponse {
    status: boolean;
    message: string;
    data: PurchaseItem;
}

export type WalletBalanceResponse = {
    balance: number;
    credentialId: number;
    'credential.name': string;
    'credential.role': string;
};

export type CodeIssueResponse = {
    corporateTxnId: string;
    brand_name: string;
    price: string;
    expiryDate: Date;
    code: number;
    pin: string;
    link: string;
};

export interface PurchaseItem {
    product_id: number;
    mrp: number;
    selling_price: number;
    qty: number;
}

export interface PurchasePayloadData {
    credentialId?: number;
    userType?: string;
}

export type XoxodayBalancePayload = {
    userId: number;
    userType: string;
    serviceOperatorId: number;
    amount: number;
};

export interface giftCardDetails {
    id: number;
    product_id: string;
    product_name: string;
    merchant_id: string;
    merchant_name: string;
    brand_name: string;
    brand_logo: string;
    mrp: string;
    selling_price: string;
    min_price: string;
    max_price: string;
    expiry: Date;
    is_open_denominnation: number;
    gv_type: string;
    terms_and_condition: string;
    how_to_redeem: string;
    status: number;
    createdAt: Date;
    updatedAt: Date;
}
