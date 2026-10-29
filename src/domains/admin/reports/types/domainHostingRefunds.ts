export type DomainHostingRefund = {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    amountInINR: string;
    status: string;
    paymentMode: string;
    message: string;
    orderResponse: string;
    credential: {
        id: number;
        username: string;
        name: string;
    };
    serviceOperator: {
        id: number;
        serviceProvider: string;
    };
};

export type AllDomainHostingRefundsResponse = {
    recordsTotal: number;
    data: DomainHostingRefund[];
};
