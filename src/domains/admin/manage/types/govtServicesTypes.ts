export type CommissionMode = 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
export type CommissionType = 'PERCENTAGE' | 'FLAT';

export type GovtService = {
    id: number;
    vendorCatalogId: string;
    bid: string | null;
    serviceId: number | null;
    type: number | null;
    serviceName: string;
    variantName: string;
    description: string | null;
    price: string;
    currency: string | null;
    paymentType: string | null;
    about: string | null;
    amount: string | null;
    status: boolean;
    sortOrder: number;
    commissionMode: CommissionMode;
    commissionType: CommissionType;
    commission: string;
    fixedCommissionPerTransaction: string;
    isCommissionInclGST: boolean;
    totalCommission?: number;
    createdAt: string;
    updatedAt: string;
};

export type GovtServiceData = {
    recordsTotal: number;
    recordsFiltered: number;
    data: GovtService[];
};

export type GovtServiceFilters = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: string;
    sortField: string;
};

export type GovtServiceUpdatePayload = {
    id: number | string;
    amount?: number | string | null;
    status?: boolean;
    sortOrder?: number;
    commissionMode?: CommissionMode;
    commissionType?: CommissionType;
    commission?: number | string;
    fixedCommissionPerTransaction?: number | string;
    isCommissionInclGST?: boolean;
};

export type GovtServiceUpdateStatus = {
    id: number | string;
    status: boolean;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};

export type refreshState = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};
