export type PaymentLinkOrder = {
    id: number;
    sentPayload: {
        email: string;
        items: Array<{
            quantity: number;
            totalPrice: {
                value: number;
                currencyCode: string;
            };
            description: string;
        }>;
        total: {
            value: string;
            currencyCode: string;
        };
        message: string;
        lastName: string;
        firstName: string;
        serviceId: string;
        corporateId: string;
        emailSubject: string;
        paymentAttempts: string;
        transactionType: string;
        invoiceExpiryDate: string;
    };
    client_url: string;
    status: string;
    updates: any[];
    paymobId: string | null;
    invoiceId: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential: {
        name: string;
        email: string;
        username: string;
    };
    amount: string;
};

export type AllPaymentLinkOrderResponse = {
    recordsTotal: number;
    data: PaymentLinkOrder[];
};
