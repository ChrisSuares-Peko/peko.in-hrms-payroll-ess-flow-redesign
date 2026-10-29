export type AdminOndcSellerNp = {
    id: number;
    bppId: string;
    bppUri: string | null;
    npName: string | null;
    domain: string | null;
    enabled: boolean;
    /** products of this NP currently stored */
    productCount: number;
    lastSeenAt: string | null;
    lastTransactionId: string | null;
    createdAt?: string;
    updatedAt?: string;
};

/** What disabling an NP does to its stored products. */
export type SellerNpProductAction = 'delete' | 'disable';

export type SellerNpToggleResult = {
    id: number;
    enabled: boolean;
    productAction: SellerNpProductAction | null;
    deletedCount: number;
    switchedOff: number;
    switchedOn: number;
};

export type OndcSellerNpsQuery = {
    searchText?: string;
    page: number;
    itemsPerPage: number;
    sort?: string;
    sortField?: string;
};

export type OndcSellerNpsResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    data: AdminOndcSellerNp[];
};
