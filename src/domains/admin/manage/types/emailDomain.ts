export type getEmailDomain = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    type?: string;
    sortField?: string;
};

export type EmailDomain = {
    name: string;
    type: string;
    image: string | null; // Can be 'N/A' or a valid image URL
    status: boolean;
    peko_key: string;
    vendorId: number;
    pekoEmail: [];
    offersText: string;
    sendInternalMail: boolean;
    sendVendorMail: boolean;
};

export type EmailDomainData = {
    count: number;
    rows: EmailDomain[];
};

export type EmailDomainPayload = {
    id?: number;
    name: string;
    type: string;
    offersText: string;
    sendInternalMail: boolean;
    sendVendorMail: boolean;
    image: string | null;
    peko_key: string;
    vendorId: number;
    pekoEmail: [];
    status: boolean;
};

export type DropDown = {
    value: number | string;
    label: string;
}[];

type VendorResponse = {
    id: number;
    vendorName: string;
};

export type VendorApiResponse = {
    result: VendorResponse[];
};

export type updateEmailDomainStatusPayload = {
    status: boolean;
    id: string | number;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
