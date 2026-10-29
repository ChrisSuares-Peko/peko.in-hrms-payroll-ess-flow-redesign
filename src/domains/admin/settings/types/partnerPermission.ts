export type activeResponse = {
    data: string;
};

export type Service = {
    label: string;
    hasAccess: boolean;
};
// Defines the structure of each permission group
export type Permission = {
    // Optional: real API responses omit this entirely for services with no
    // sub-services (e.g. "Verification Suite", "Peko Wallet") rather than sending `[]`.
    subServices?: Service[];
    hasAccess: boolean;
    label: string;
    // Unique per service and NOT derivable from `label` — two catalogue entries share
    // the label "Corporate Cards" (`corporate_card` / `peko_corporate_cards`). This is
    // the only stable identity, so keys and merges must use it.
    accessKey?: string;
    serviceProviderId?: number;
    alias?: string; // optional display-name override for the service
    enableMoreService?: boolean; // flat service that belongs to the "More Services" grouping
    // Service icon — a CDN URL, or SVG markup pasted into the editor. The WAF rejects
    // both inside a plain JSON body, so the API layer sends this as `peko_upld_icon`
    // (see serializeUploads); pekoUploadPrefix strips the prefix server-side.
    icon?: string;
};

// Defines the structure of the role with permissions
export type Role = {
    id: number;
    registeredBy: string | number;
    partnerName?: string;
    permissions: Permission[];
    status: boolean | number;
    createdAt: string;
    updatedAt: string;
};

export type Partner = {
    id: number;
    name: string;
    portalUrl: string;
    isActive?: boolean | number;
    createdAt?: string;
    updatedAt?: string;
};

export type userUpdateBody = {
    id?: number;
    name: string;
    username: string;
    email: string;
    mobileNo: string;
    registeredBy?: string;
    roleAndPermissionId: string;
    portalUrl: string;
    passwordProtection: number | boolean;
};

export type getAllRolesResp = {
    roles: {
        label: string;
        value: string;
    }[];
};
export type getPermissionsResp = {
    sidebarData: Permission[];
};

export type updateRole = {
    id?: number | undefined;
    registeredBy: string | number | undefined | null;
    permissions: Permission[] | undefined;
};

export type updateStatus = {
    id?: string | number;
    status: any;
};

export type getSystemUsers = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    type?: string;
    sort?: string;
    sortField?: string;
};

export type RolesResponse = {
    count: number;
    rows: Role[];
};

export type refresh = {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

export type getCorporateUsers = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    partnerId: string | number;
    type?: string;
    sort?: string;
    sortField?: string;
};

export type categorySearch = {
    searchText: string;
};

export type categoryResponse = {
    data: categoryData[];
};
export type categoryData = {
    id: number | string;
    username: string;
    name: string;
};
export type ClonePartner = {
    id: number;
    name: string;
    permissions: Permission[];
};
export type CloneResponse = {
    data: ClonePartner[];
};
export type PartnerItem = {
    id: number;
    name: string;
};
export type PartnerResponse = {
    data: PartnerItem[];
};
export type updateClonePartner = {
    partnerId: null | number;
    newPartnerId: null | number;
};
export type ClonePermissionPayload = {
    fromPartnerId: number | 'default';
    toPartnerId: number;
};
export type PermissionTreeSummary = {
    services: number;
    subServices: number;
    icons: number;
    iconBytes: number;
};
export type ClonePermissionResult = {
    fromPartnerId: number | 'default';
    toPartnerId: number;
    action: 'CREATED' | 'REPLACED';
    cloned: PermissionTreeSummary;
    replaced: PermissionTreeSummary | null;
};
export type CopyIconsResult = {
    fromPartnerId: number | 'default';
    toPartnerId: number;
    sourceIconCount: number;
    sourceIconBytes: number;
    copied: number;
    unchanged: number;
    unmatched: number;
};
export type CashbackItem = {
    serviceName: string;
    serviceCashBackAdded: boolean;
};
export type CashbackItemResponse = {
    data: CashbackItem[];
};
export type cashbackResponse = {
    recordId: number;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
