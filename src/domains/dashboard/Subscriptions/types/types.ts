import { DropDown } from '@customtypes/general';

export interface DataType {
    key: string;
    text: string;
}

export interface planProps {
    title: string;
    period: string;
    amount: number;
    monthlyCost: string;
    features: string[];
}

export interface AddressCardProps {
    id: string;
    title: string;
    period: string;
    amount: string;
    monthlyCost: string;
    offer?: string;
    features: string;
    noOfUser: number;
}

export interface CardProps {
    id?: number;
    image: string;
    title: string;
    description: string;
    discount: string;
}

export interface filterOption {
    value: string;
    label: string;
}

export type GetSubscriptionListPayload = {
    userId: number;
    userType: string;
};
export type SubscriptionPayload = {
    userId: number;
    userType: string;
    searchText: string;
    page: number;
    category: string;
    length: number;
    selectedCategory: number | null;
};

export type SubscriptionListResponse = {
    data: Subscription[];
    recordsTotal: number;
};

export type Subscription = {
    id: number;
    brand: null;
    name: string;
    description: string;
    highlights: string;
    SKUCode: null;
    productImage: string;
    price: string;
    quantity: number;
    status: boolean;
    discountType: string;
    discount: string;
    actualPrice: null;
    GST: string;
    gstType: string;
    vendors: null;
    warranty: null;
    createdAt: Date;
    updatedAt: Date;
    categoryId: number;
    category: Category;
    image: string | null;
};
export type Category = {
    id: number;
    categoryName: string;
};

export type SubscriptionTableData = {
    id: number;
    image: string;
    name: string;
    badge: string;
    description: string;
}[];

export type transactionType = {
    date: string;
    transactionID: number;
    category: string;
    operator: string;
    amount: number;
    paymentMode: string;
    status: string;
    download: string;
    cashback: string;
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
export interface OrderHistoryDatatype {
    order: Order;
}
export type OrderResponse = {
    subscriptionDetails: {
        id: number;
        name: string;
        price: string;
        validity: string;
        description: string;
        status: number;
        includes: string;
        subscriptionType: string;
        isUserRequired: number;
        features: string[];
        createdAt: string;
        updatedAt: string;
        productId: number;
        product: {
            id: number;
            brand: string | null;
            name: string;
            description: string;
            highlights: string;
            SKUCode: string;
            productImage: string;
            price: string;
            quantity: number;
            status: number;
            discountType: string;
            discount: string;
            actualPrice: string;
            GST: string;
            gstType: string;
            vendors: string | null;
            warranty: string | null;
            features: string[];
            createdAt: string;
            updatedAt: string;
            categoryId: number;
        };
    };
    formDetails: {
        companyName: string;
        domainName: string;
        adminEmail: string;
        address: string;
        country: string;
    };
};
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
export type OrderHistoryListResponse = {
    result: OrderHistoryDatatype[];
    totalData: number;
};

export type OrderHistoryTableData = {
    transactionId: string;
    dateandtime: string;
    paymentMode: string;
    status: string;
    subscriptionName: string;
    plan: string;
    amount: string;
};
export type filterState = {
    search: string;
    draw: number;
    start: number;
    length: number;
    from: string;
    to: string;
};
export type SubscriptionDetailsPayload = GetSubscriptionListPayload & {
    subscriptionID: string;
};
export type SubscriptionDetailsResponse = {
    data: SubscriptionDetails;
};
export type SubscriptionDetails = {
    id: number;
    name: string;
    description: string;
    highlights: string;
    productImage: string;
    features: string;
    image: string;
    typeOfOrder: string;
    discount: any;
};
export type PlanDetailsResponse = {
    planDatas: PlanDetails[];
};
export type PlanDetails = {
    id?: string;
    name?: string;
    price?: string;
    validity?: string;
    features?: string;
    subscriptionType?: string;
    noOfUsers: number;
    software: {
        id: number;
        name: string;
    };
};
export type PlanDetailsTable = {
    id: string;
    title: string;
    period: string;
    amount: string;
    monthlyCost: string;
    offer?: string;
    features: string;
    noOfUsers: number;
}[];
export type PlanDetailsPayload = GetSubscriptionListPayload & {
    planId: string;
};
export type SelectedPlanDetailsResponse = {
    data: PlanDetails;
};

export type PaymentRequestPayload = {
    amount?: string;
    planId?: string;
    userId?: number;
    userType?: string;
    formDetails: {
        companyName: string;
        domainName: string;
        adminEmail: string;
        address: string;
        country: string;
    };
};
export type PaymentRequestResponse = {
    status: boolean;
    message: string;
    data: {};
    responseCode: string;
};

export type SubscriptionFormData = {
    companyName: string;
    domainName: string;
    adminEmail: string;
};
export type SubscriptionDetailsSlice = {
    subscriptionDetails: {
        id: number;
        name: string;
        description: string;
        highlights: string;
        productImage: string;
    };
};
export type WalletBalanceResponse = {
    balance: string;
    credentialId: number;
    name: string;
    role: string;
};

export type CountriesResponse = {
    countries: DropDown;
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
    mobileNo: string;
};
export type categoryPayload = {
    userId: number;
    userType: string;
};

export type categoryResponse = {
    categoryData: categories[];
};
export type categories = {
    id: number;
    categoryName: string;
    categoryImage: string;
    categoryStatus: string;
    createdAt: string;
    updatedAt: string;
    vendorId: number;
    vendor: {
        id: number;
        vendorName: string;
    };
};
