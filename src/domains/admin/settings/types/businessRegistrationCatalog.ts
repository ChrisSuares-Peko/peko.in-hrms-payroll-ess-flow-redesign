export type CommissionMode = 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
export type CommissionType = 'PERCENTAGE' | 'FLAT';

export type CatalogRow = {
    id: number;
    vendorCatalogId: string;
    serviceId: number | null;
    serviceName: string;
    variantName: string;
    vendorPrice: string;
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

export type CatalogListResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    data: CatalogRow[];
};

export type CatalogGetParams = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    sortField?: string;
};

export type CatalogUpdatePayload = {
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

export type CatalogStatusPayload = {
    id: number | string;
    status: boolean;
};
