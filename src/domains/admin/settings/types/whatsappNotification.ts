export type numbers = {
    status: boolean;
    whatsappNumber: string;
};
export type whatsappResponseWithPagination = {
    numbers: numbers[];
    totalCount: number;
    currentPage: string;
    itemsPerPage: string;
};
export type whatsappResponse = {
    numbers: numbers[];
};

export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    type?: string;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
