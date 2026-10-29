export type SubscriptionDetails = {
    id: number;
    name: string;
    price: string;
    validity: string;
    description: string;
    status: number;
    includes: string;
    subscriptionType: string;
    isUserRequired: number;
    createdAt: string;
    updatedAt: string;
    productId: number;
    product: {
        id: number;
        brand: any; // You might want to define the type more accurately if it's available
        name: string;
        description: string;
        highlights: string;
        SKUCode: any; // You might want to define the type more accurately if it's available
        productImage: string;
        price: string;
        vendorPrice: any; // You might want to define the type more accurately if it's available
        VAT: string;
        vatType: string;
        quantity: number;
        warranty: any; // You might want to define the type more accurately if it's available
        status: number;
        discountType: string;
        discount: string;
        actualPrice: any; // You might want to define the type more accurately if it's available
        vendors: any[]; // You might want to define the type more accurately if it's available
        createdAt: string;
        updatedAt: string;
        categoryId: number;
    };
};

export type FormDetails = {
    companyName: string;
    domainName: string;
    adminEmail: string;
    address: string;
    country: string;
};

export type Payment = {
    id: string;
    payment_intent_id: string;
    payment_source_id: string;
    sender_details: {
        account_number: string;
        iban: string;
        name: string | null;
        description: string | null;
        bank_transaction_description: string | null;
    };
    recipient_details: {
        account_number: string;
        iban: string;
        name: string;
    };
    amount: number;
    currency: string;
    description: string;
    reference: string | null;
    submission_timestamp: string;
    initiation_timestamp: string;
    status: string;
    granular_status_code: any; // You might want to define the type more accurately if it's available
    status_additional_details: any; // You might want to define the type more accurately if it's available
    display_info: any; // You might want to define the type more accurately if it's available
    bank_transaction_reference: string;
};

export type PaymentDestination = {
    id: string;
    bank_identifier: string;
    name: string;
    iban: string;
    display_name: string;
    account_number: string;
    swift_code: string;
    status: string;
    address: string;
    country: string;
    city: string;
    default: boolean;
    owner_type: string;
    ifsc: any; // You might want to define the type more accurately if it's available
    sort_code: any; // You might want to define the type more accurately if it's available
    routing_number: any; // You might want to define the type more accurately if it's available
    transit_code: any; // You might want to define the type more accurately if it's available
    branch_address: any; // You might want to define the type more accurately if it's available
    currency_iso_code: any; // You might want to define the type more accurately if it's available
    postal_code: any; // You might want to define the type more accurately if it's available
};

export type PaymentModeResponse = {
    orderReferenceNo: string;
    paymentReferenceNo: string;
    captureReferenceNo: string;
    amount: Amount;
    pgAmount: number;
};
interface Amount {
    currencyCode: string;
    value: number;
}

export type ServiceOperator = {
    id: number;
    serviceProvider: string;
    accessKey: string;
    serviceStatus: number;
    providerCommission: string;
    serviceImage: string;
    serviceCategory: string;
    remarks: string | null;
    countryName: string;
    countryCode: number;
    balanceMethod: number;
    commissionType: string;
    serviceType: string;
    isPlanAvailable: number;
    createdAt: string;
    updatedAt: string;
    vendorId: number;
};

export type Credential = {
    name: string;
    email: string;
};

export type CorporateTransaction = {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: any; // You might want to define the type more accurately if it's available
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: {
        subscriptionDetails: SubscriptionDetails;
        formDetails: FormDetails;
    };
    paymentModeResponse: PaymentModeResponse;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus: any[]; // You might want to define the type more accurately if it's available
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
    serviceOperator: ServiceOperator;
    credential: Credential;
};

export type subscriptionResponse = {
    recordsTotal: number;
    data: CorporateTransaction[];
};
