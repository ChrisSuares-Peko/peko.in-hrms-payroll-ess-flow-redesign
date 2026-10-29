export type PlanPeriodCommission = {
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType: string;
    commission: string | number;
    fixedCommissionPerTransaction?: string | number;
    isCommissionInclGST?: boolean;
};

export type Packages = {
    id: number;
    packageName: string;
    packagePrices: {
        monthly: string;
        annually: string;
        monthlyTotalCommission?: number;
        annuallyTotalCommission?: number;
    };
    description: string;
    serviceList: string;
    partnerId: string | null;
    discount?: {
        monthly: string;
        annually: string;
    };
    packageType?: 'INDIVIDUAL' | 'GROUP';
    accessCode?: string;
    status: boolean | number;
    partnerName: string;
    packageLogo: string;
    priorityLevel: number | null;
    externalId?: string;
    type: string;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number | string;
    fixedCommissionPerTransaction?: number | string;
    isCommissionInclGST?: boolean;
    planCommissions?: {
        monthly: PlanPeriodCommission;
        annually: PlanPeriodCommission;
    } | null;
};

export type PackageWithoutID = {
    id?: number;
    packageName: string;
    packagePrices: {
        monthly: string;
        annually: string;
    };
    description: string;
    serviceList: string;
    partnerId: string | null;
    discount?: {
        monthly: string;
        annually: string;
    };
    packageType?: 'INDIVIDUAL' | 'GROUP';
    accessCode?: string;
    packageLogo: string;
    priorityLevel: number | null;
    type: string;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number | string;
    fixedCommissionPerTransaction?: number | string;
    isCommissionInclGST?: boolean;
    planCommissions?: {
        monthly: PlanPeriodCommission;
        annually: PlanPeriodCommission;
    } | null;
};

export type ApiResponsePackage = {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: Packages[];
};

export type updatePackageStatus = {
    status: boolean;
    packageId: string | number;
};

export type PackageID = Omit<updatePackageStatus, 'status'>;

export type PackageFilters = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    type?: string;
    sortField?: string;
    partnerId: string;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
