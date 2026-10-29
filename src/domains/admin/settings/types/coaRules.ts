export type newCoaRules = {
    id?: number;
    accountName: string;
    accountType: string;
    entityType: string;
    prefix: string;
    description: string;
    parentAccId?: string;
};

export type updateStatusRule = {
    ruleId?: string | number;
    status: any;
};

export type COArules = {
    id: number;
    accountName: string;
    accountType: string;
    entityType: string;
    prefix: string;
    description: string;
    parentAccountId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type getChartOfAccountsRules = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};
