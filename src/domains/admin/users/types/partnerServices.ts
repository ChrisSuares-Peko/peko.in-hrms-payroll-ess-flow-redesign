export type PartnerOption = {
    value: number;
    label: string;
};

export type PartnerServiceAccessRow = {
    id: number;
    partnerId: number;
    permissions: any[];
    status: boolean | number;
    createdAt: string;
    updatedAt: string;
    credential?: { name: string | null };
};

export type PartnerServiceAccessList = {
    rows: PartnerServiceAccessRow[];
    count: number;
};

export type PartnerServicesFilters = {
    page: number;
    itemsPerPage: number;
    searchText: string;
};
