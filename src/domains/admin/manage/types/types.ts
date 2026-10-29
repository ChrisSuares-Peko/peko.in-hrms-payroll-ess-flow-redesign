export type getData = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    from?: string;
    to?: string;
};

export type DemoRequestsData = {
    id: number;
    storeName: string;
    businessCategory: string;
    contactPerson: string;
    mobileNumber: string;
    email: string;
    city: string;
    preferredLanguage: string;
    updatedAt: string;
    createdAt: string;
};
export type DemoRequestsDataResponse = {
    data: DemoRequestsData[];
    recordsTotal: number;
    recordsFiltered: number;
};

export type Denominations = number[];
