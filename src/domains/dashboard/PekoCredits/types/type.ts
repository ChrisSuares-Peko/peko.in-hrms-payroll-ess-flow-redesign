export type CouponCode = {
    serviceName: string;
    isClaimed: boolean;
    discountType: string;
    discount: number;
    couponCode: string;
    validity: string;
    minimumPurchase: number;
    maximumDiscount: number;
    billingType: string;
    couponType: 'SUBSCRIPTION' | 'SERVICES';
};

export type PekoCreditsResponse = {
    status: boolean;
    message: string;
    responseCode: string;
    data: {
        couponCodes: CouponCode[];
        pekoCredits: number;
        isPekoCreditActive: boolean;
        recordsTotal: number;
    };
};

export type PekoCreditsListPayload = {
    userId: number;
    userType: string;
    page: number;
    length: number;
    accessKey?: string;
    packageId?: number | string;
    billingType?: string;
};
