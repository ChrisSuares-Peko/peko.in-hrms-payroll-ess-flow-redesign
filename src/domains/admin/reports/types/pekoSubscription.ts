export type Subscription = {
    id: number;
    corporateName: string;
    packageName: string;
    packageType: string;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
    subscriptionPaymentRefId: string;
    subscriptionPrice: string;
    subscriptionAmountPaid: string;
    discount: string | null;
    status: string;
    billingAddress: any;
    packageId: number;
    corporateUserId: number;
    billingType: string;
    paymentMode: 'PG' | 'ACTIVATION_CODE';
    voucherCode: string;
};

export type subscriptionResponse = {
    rows: Subscription[];
    count: number;
};
