export interface OrderDatatype {
    id: string;
    date: JSX.Element;
    productName: string;
    customer: string;
    amount: string;
    status: JSX.Element;
    action: JSX.Element;
    view: JSX.Element;
}

export type systemUserResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    data: { rows: User[] };
};
export type RolesResponse = {
    count: number;
    rows: Role[];
};
// Payload shape persisted to settings.initialServicePermissions from the Roles
// Initial Access page — the full 3-level tree (serviceCategory → category → service).
export type InitialServiceLeaf = {
    service: string;
    hasAccess: boolean;
    view: boolean;
    write: boolean;
    update: boolean;
};
export type InitialServiceCategory = {
    category: string;
    hasAccess: boolean;
    services: InitialServiceLeaf[];
};
export type InitialServicePermissionPayload = {
    serviceCategory: string;
    hasAccess: boolean;
    services: InitialServiceCategory[];
};


export type User = {
    id: number;
    email: string;
    mobileNo: string;
    isActive: number; // Consider using boolean if isActive represents a boolean value (0 or 1)
    portalUrl: string;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    roleAndPermissionId: number;
    credential: Credential;
    registeredBy?: string | null;
    roleAndPermission: RoleAndPermission;
};
interface RoleAndPermission {
    roleName: string;
}
interface Credential {
    username: string;
    role: string;
    name: string;
    createdAt: string;
    partnerId?: string;
    passwordProtection: number;
    registeredBy?: string;
}
export type getSystemUsers = {
    searchText: string;
    page: number;
    itemsPerPage: number;
    type?: string;
    sort?: string;
    sortField?: string;
};

// Defines the structure of each service within a permission
export type Service = {
    view: any;
    service?: string;
    hasAccess: boolean;
    services: SubService[];
    category?: string;
    // Some responses key this level by `label` instead of `category`/`service` —
    // kept optional so the seeding fallback (category || service || label) type-checks.
    label?: string;
};

export type SubService = {
    update: boolean | undefined;
    write: boolean | undefined;
    view: boolean | undefined;
    id: number;
    service: string;
    hasAccess: boolean;
};

// Defines the structure of each permission group
export type Permission = {
    services: Service[]; // This is an array of `Service` objects
    hasAccess: boolean;
    serviceCategory: string;
    view: boolean;
    write: boolean;
    update: boolean;
};

// Defines the structure of the role with permissions
export type Role = {
    id: number;
    roleName: string;
    permissions: Permission[];
    createdAt: string;
    updatedAt: string;
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
};

export type getAllRolesResp = {
    roles: {
        label: string;
        value: string;
    }[];
};
export type getPermissionsResp = {
    permissions: Permission[];
};

export type updateRole = {
    id?: number | undefined;
    roleName: string | undefined;
    permissions: Permission[] | undefined;
};
export type activeResponse = {
    data: string;
};
export type SystemPartnerData = {
    id: string;
};
export type UserDetails = {
    name: string;
    username: string;
    email: string;
    mobileNo: string;
    portalUrl: string;
};
export type Permissions = {
    subServices: Service[];
    hasAccess: boolean;
    label: string;
};
export type UserType = {
    id?: string;
    permissions: any[];
    userDetails: UserDetails;
};
export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};

/* ------------------------------------------------------------------ *
 * Service Access Configuration page — editable 3-level service tree.
 * Seeded from `permissionData` but kept in local state so items can be
 * added, deleted, renamed and reordered before being persisted to
 * settings.initialServicePermissions.
 *
 *   ServiceNode      → serviceCategory   (L1, top card)
 *     CategoryNode     → category        (L2, section within a card)
 *       LeafServiceNode  → service       (L3, leaf; carries view/write/update)
 * ------------------------------------------------------------------ */
export interface LeafServiceNode {
    id: string;
    label: string;
    hasAccess: boolean;
    // Preserved from the backend so a save round-trips without dropping flags.
    view: boolean;
    write: boolean;
    update: boolean;
}

export interface CategoryNode {
    id: string;
    label: string;
    hasAccess: boolean;
    services: LeafServiceNode[];
}

export interface ServiceNode {
    id: string;
    label: string;
    hasAccess: boolean;
    categories: CategoryNode[];
}

// react-dnd item types — one per level (reorder is scoped within a parent).
export const SERVICE_DND_TYPE = 'ROLES_INITIAL_SERVICE';
export const CATEGORY_DND_TYPE = 'ROLES_INITIAL_CATEGORY';
export const LEAF_DND_TYPE = 'ROLES_INITIAL_LEAF';

// Target of a pending delete, resolved by the shared confirmation modal.
export type DeleteTarget =
    | { kind: 'service'; serviceId: string; label: string }
    | { kind: 'category'; serviceId: string; categoryId: string; label: string }
    | {
          kind: 'leaf';
          serviceId: string;
          categoryId: string;
          leafId: string;
          label: string;
      }
    | null;

/* ------------------------------------------------------------------ *
 * Corporate User Configuration page — editable 2-level service tree.
 * Seeded from the partner-initial-sidebar (`Permission[]`) and persisted
 * to settings.partnerInitialAccessesibleServices.
 *
 *   CorpServiceNode    → service (L1 card; carries alias/icon/moreService)
 *     CorpSubServiceNode → sub-service (L2 chip)
 * ------------------------------------------------------------------ */
export interface CorpSubServiceNode {
    id: string;
    label: string;
    hasAccess: boolean;
    // Set when the node is backed by a service operator.
    serviceProviderId?: number;
    accessKey?: string;
     // Search metadata — persisted to settings.searchServices (see CorpSearchServiceEntry).
    pathKey?: string;
    tags?: string[];
}

export interface CorpServiceNode {
    id: string;
    label: string;
    hasAccess: boolean;
    // Preserved from the backend so a save round-trips without dropping fields.
    alias?: string;
    icon?: string;
    enableMoreService?: boolean;
    serviceProviderId?: number;
    accessKey?: string;
     // Search metadata — persisted to settings.searchServices (see CorpSearchServiceEntry).
    pathKey?: string;
    tags?: string[];
    subServices: CorpSubServiceNode[];
}

// A service-operator option for the corporate config drawers.
export type ServiceOperatorOption = {
    value: string; // operator id (as string, for the Select)
    label: string; // serviceProvider name
    accessKey: string;
};

// react-dnd item types for the corporate config tree.
export const CORP_SERVICE_DND_TYPE = 'CORP_INITIAL_SERVICE';
export const CORP_SUBSERVICE_DND_TYPE = 'CORP_INITIAL_SUBSERVICE';

export type CorpDeleteTarget =
    | { kind: 'service'; serviceId: string; label: string }
    | { kind: 'subService'; serviceId: string; subServiceId: string; label: string }
    | null;

// Payload persisted to settings.partnerInitialAccessesibleServices (matches the
// partner Permission shape the sidebar is read as).
export type CorpInitialSidebarSubService = {
    label: string;
    hasAccess: boolean;
    serviceProviderId?: number;
    accessKey?: string;
    pathKey?: string;
    tags?: string[];
};
export type CorpInitialSidebarNode = {
    label: string;
    hasAccess: boolean;
    alias?: string;
    icon?: string;
    enableMoreService?: boolean;
    serviceProviderId?: number;
    accessKey?: string;
    pathKey?: string;
    tags?: string[];
    subServices: CorpInitialSidebarSubService[];
};
export type CorpSearchServiceEntry = {
    name: string;
    tags: string[];
    pathKey: string;
};


