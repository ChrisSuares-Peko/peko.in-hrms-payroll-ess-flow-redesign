export type AccountType = {
    id: string;
    username: string;
    name: string;
};

export type ApiResponseAllAccounts = {
    allAccounts: AccountType[];
};

export type AddInternalAccountsPayload = {
    accounts: string[];
};

export type getInternalAccounts = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: 'ASC' | 'DESC';
    sortField?: string;
};

export type InternalAccount = {
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
};

export type ApiResponseInternalAccounts = {
    internalAccounts: InternalAccount[];
    recordsTotal: number;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
