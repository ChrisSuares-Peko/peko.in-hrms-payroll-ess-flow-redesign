export type PaymentMethodType = 'PAYMENT_GATEWAY' | 'WALLET' | 'CORPORATE_CARD';

export type PaymentMethodStatusFilter = '' | 'true' | 'false';

export type FilterType = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    sortField?: string;
    partnerId?: string | number;
    pgProvider?: string;
    paymentMethod?: PaymentMethodType | '';
    isActive?: PaymentMethodStatusFilter;
};

export type PaymentMethodFilterKey = 'partnerId' | 'pgProvider' | 'paymentMethod' | 'isActive';

export type PaymentMethodsState = {
    isGatewayPaymentAvailable: boolean;
    isWalletPaymentAvailable: boolean;
    // Absent until the backend that serves the corporate card leg is deployed.
    isCorporateCardPaymentAvailable?: boolean;
    isCouponApplicable: boolean;
};

export type PaymentMethodLimits = {
    limitPerTransaction: number;
    limitPerDay: number;
    limitPerMonth: number;
};

export type PaymentMethodLimitKey = keyof PaymentMethodLimits;

// Operator accessKey of the gateway a PAYMENT_GATEWAY row routes to (cashfree_pg / ccavenue_pg / razorpay_pg)
export type GatewayProvider = {
    pgProvider: string;
    name: string;
};

export type PaymentMethod = {
    id: number;
    partnerId: number | null;
    name: string | null;
    paymentMethod: PaymentMethodType;
    pgProvider: string | null;
    pgProviderName: string | null;
    isActive: boolean;
    hasOtherActiveGateway: boolean;
    createdAt: string;
    updatedAt: string;
    limits: Partial<Record<PaymentMethodLimitKey, number | string>> | null;
    serviceList: number[];
};

export type PaymentMethodsResponse = {
    paymentMethods: PaymentMethodsState;
    data: {
        recordsFiltered: number;
        recordsTotal: number;
        rows: PaymentMethod[];
    };
};

export type PaymentMethodFormValues = {
    partnerId: string | number;
    paymentMethod: PaymentMethodType | '';
    pgProvider: string;
    services: string[];
} & Record<PaymentMethodLimitKey, string>;

export type CreatePGMethodsByService = {
    partnerId: number | null;
    paymentMethod: PaymentMethodType;
    services: number[];
    pgProvider?: string | null;
} & PaymentMethodLimits;

export type CreatePGMethodsByServiceResponse = {
    id: number;
    partnerId: null | number;
    paymentMethod: PaymentMethodType;
    updatedAt: string;
    createdAt: string;
};

export type EditPGMethodsByService = {
    rowIdToUpdate: number;
    partnerId: number | null;
    paymentMethod: PaymentMethodType;
    pgProvider?: string | null;
    services: number[];
    limits: PaymentMethodLimits;
};

export type PaymentGateway = {
    pgProvider: string;
    name: string;
};

export type UpdatePaymentMethodStatus = {
    paymentMethodId: number;
    isActive: boolean;
};

export type SelectOption = {
    value: string | number;
    label: string;
};
