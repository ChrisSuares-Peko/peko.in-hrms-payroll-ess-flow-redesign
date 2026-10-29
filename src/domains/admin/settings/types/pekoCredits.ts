export type getCoupon = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
    partnerId?: string;
};

export type newCouponCode = {
    id?: number;
    code: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discount: string | number;
    expiryDays: string;
    packageId?: number;
    partnerId: string | number | null;
    referralCodeId: string | number | null;
    couponType: 'SUBSCRIPTION' | 'SERVICES';
    billingType?: 'MONTHLY' | 'ANNUALLY';
    serviceOperatorId?: number;
    minimumPurchase: number;
    maximumDiscount?: number | null;
};

export type CouponData = {
    recordsTotal: number;
    data: Coupon[];
};

export type Coupon = {
    id: number;
    code: string;
    discountType: string;
    discount: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    expiryDays: string;
    partnerId: string;
    minimumPurchase: string;
    maximumDiscount: string;
    packageId: number;
    serviceOperatorId: number;
    couponType: 'SUBSCRIPTION' | 'SERVICES';
    billingType: 'MONTHLY' | 'ANNUALLY';
    packageName: string;
    partnerName: string;
    serviceProvider: string;
    validUntil: string;
    referralCodeId: number;
};

export type updateStatus = {
    couponId?: string | number;
    status: any;
};

export type PekoCreditStatus = 'ACTIVE' | 'DISABLED';

export type bulkUpdateStatus = {
    status: PekoCreditStatus;
};

export type BulkUpdateStatusResponse = {
    updatedCount: number;
    status: PekoCreditStatus;
};

export type DeleteCouponPayload = {
    couponId: number;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
