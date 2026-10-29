import { UserPayload } from '@customtypes/general';

export type CatalogItemApiData = {
    id: number;
    name: string;
    description: string;
    hsnCode: string | null;
    unitPrice: string;
    gstPercent: string;
    createdAt: string;
    updatedAt: string;
    corporateUserId: number;
    subCorporateUserId: number | null;
};

export type FetchCatalogPayload = UserPayload & {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    from?: string;
    to?: string;
};

export type FetchCatalogResponse = {
    count: number;
    rows: CatalogItemApiData[];
};

export type CreateCatalogPayload = UserPayload & {
    name: string;
    description: string;
    hsnCode?: string;
    unitPrice: string;
    gstPercent: string;
};

export type UpdateCatalogPayload = UserPayload & {
    catalogId: number;
    name: string;
    description: string;
    hsnCode?: string;
    unitPrice: string;
    gstPercent: string;
};
