export type AdminOndcEasySplitSeller = {
    id: number;
    vendorName: string | null;
    bppId: string;
    providerId: string;
    cashfreeVendorId: string;
    cashfreeVendorStatus: string | null;
    splitEligible: boolean | null;
    ineligibleReason: string | null;
    vendorSyncedAt: string | null;
    pendingToSettle: number;
    pendingOrderCount: number;
    earliestPayoutDueAt: string | null;
};

export type OndcSellersQuery = {
    searchText?: string;
    page: number;
    itemsPerPage: number;
    sort?: string;
    sortField?: string;
};

export type OndcSellersResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    data: AdminOndcEasySplitSeller[];
};
