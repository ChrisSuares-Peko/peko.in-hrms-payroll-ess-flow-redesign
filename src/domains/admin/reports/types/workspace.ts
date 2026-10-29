export type TransactionInfo = {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: string | null;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: {
        planDetails: {
            id: number;
            name: string;
            price: string;
            billingCycle: string;
            description: string;
            highlights: string;
            logo: string;
            is_available: boolean;
            status: boolean;
        };
        bookingDetails: {
            id: number;
            name: string;
            monthlyPrice: string;
            yearlyPrice: string;
            address: string;
            latLng: string;
            logo: string;
            status: number;
            createdAt: string;
            updatedAt: string;
            planId: number;
            licenseType: string;
            tradeLicenseUrl: string;
            ownerVisUrl: string;
            companyName: string;
            expiryDate: string;
        };
    };
    paymentModeResponse: {
        orderReferenceNo: string;
        paymentReferenceNo: string;
        captureReferenceNo: string;
        amount: {
            currencyCode: string;
            value: number;
        };
        pgAmount: number;
    };
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus: any[]; // Assuming shipment status can be of any type
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
    serviceOperator: {
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
    credential: {
        name: string;
        email: string;
    };
};

export type TransactionInfoResp = {
    data: TransactionInfo[];
    recordsTotal: number;
};

export type UpdateStatusPayload = {
    id: string;
    workspaceOrderStatus: string;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};