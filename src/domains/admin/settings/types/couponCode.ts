export type getCoupon = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};

export type newCouponCode = {
    id?: number;
    couponCode: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discount: string | number;
    minimumPurchase: string | number;
    maximumDiscount?: string | number | null;
    validFrom: string;
    validTo: string;
    partnerId?: string | number | null;
    referralCodeId?: string | number | null;
    usageCount: string | number;
    couponType?: string;
    billingType?: 'MONTHLY' | 'ANNUALLY';
    packageId?: string | number | null;
    serviceOperatorIds?: (string | number)[] | null;
    serviceOperatorId?: string | number | null;
};

export type CouponData = {
    recordsTotal: number;
    data: Coupon[];
};

export type Coupon = {
    id: number;
    couponCode: string;
    discountType: string;
    discount: string;
    minimumPurchase: string;
    maximumDiscount?: string | null;
    validFrom: string;
    validTo: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
    partnerId?: string | number | null;
    partnerName?: string | null;
    referralCodeId?: string | number | null;
    referralCode?: string | null;
    usageCount?: string | number;
    couponType?: string;
    billingType?: 'MONTHLY' | 'ANNUALLY';
    packageId?: string | number | null;
    packageName?: string | null;
    serviceOperatorId?: string | number | null;
    serviceOperatorName: string | null;
};
export type updateStatus = {
    couponId?: string | number;
    status: any;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
