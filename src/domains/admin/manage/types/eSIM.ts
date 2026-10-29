export type EsimPlan = {
    id?: number;
    name: string;
    country: string;
    provider?: string;
    dataMBs: string;
    periodDays: string;
    coverageId?: string;
    status: boolean;
    amount: number;
    totalCommission?: number;
    planId: string;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
};

export type ApiResponseEsimPlans = {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: EsimPlan[];
};

export type getEsimPlans = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
};

export type updatePlanStatusPayload = {
    status: boolean;
    planId?: number;
};

export type ConnectID = Omit<updatePlanStatusPayload, 'status'>;

export type updateStatus = {
    id?: string | number;
    status: any;
};

export type country = {
    label: string;
    countries: any;
    id: string;
    name: string;
};

export interface BulkESIMUploadResponse {
    successfulPlans: [];
}

export type ESIMBulkExcelTemplateResponse = {
    esimTemplateUrl: string;
};

export type countryDtls = {
    coverageId: string;
    label: string;
    countryIso2: string;
    indicator: string;
};
export type Country = {
    name: string;
    iso2: string;
    indicator: string;
    operators: [];
};

export type DropDown = {
    label: string;
    value: string;
    network?: number;
    provider: string; // the label coming from the api response is stored in provider
    countryIso2?: string;
    indicator?: string;
    countries?: Country[];
}[];
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
