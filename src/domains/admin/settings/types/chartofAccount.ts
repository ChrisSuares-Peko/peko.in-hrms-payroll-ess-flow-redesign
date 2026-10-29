export type newChartofAccount = {
    id?: number;
    accountName: string;
    accountType: string;
    accountCode: string | number;
    description: string;
    parentAccId?: string;
};

export type getChartOfAccounts = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};

export type ChartofAccountData = {
    recordsTotal: number;
    data: ChartofAccount[];
};

export type SyncStatus =
    | 'CREATE_PENDING'
    | 'CREATE_FAILED'
    | 'CREATE_SUCCESS'
    | 'UPDATE_PENDING'
    | 'UPDATE_FAILED'
    | 'UPDATE_SUCCESS';

export type ChartofAccount = {
    id: number;
    provider_account_id: string;
    account_name: string;
    account_type: string;
    account_code: string;
    description: string;
    parent_account_id: string;
    parent_account_name: string;
    createdBy: string;
    syncStatus: SyncStatus;
    createdAt: string;
    updatedAt: string;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
