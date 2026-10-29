export const PLAN_TYPES = [
    'vps_server',
    'shared_hosting',
    'titan_email',
    'google_workspace',
    'backup',
] as const;

export type PlanType = (typeof PLAN_TYPES)[number];

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
    vps_server: 'VPS Server',
    shared_hosting: 'Shared Hosting',
    titan_email: 'Titan Email',
    google_workspace: 'Google Workspace',
    backup: 'Backup',
};

export const PLAN_TYPE_COLORS: Record<PlanType, string> = {
    vps_server: 'purple',
    shared_hosting: 'blue',
    titan_email: 'orange',
    google_workspace: 'green',
    backup: 'cyan',
};

export const PLAN_TYPE_OPTIONS = PLAN_TYPES.map(value => ({
    value,
    label: PLAN_TYPE_LABELS[value],
}));

export type DomainHostingPlan = {
    id?: number;
    planType: PlanType;
    planName: string;
    productId: string;
    planId?: string | null;
    billingCycle?: number | null;
    description?: string | null;
    features?: string | null;
    status: boolean;
    currentPrice?: number | null;
    createdAt?: string;
    commissionMode?: 'MARGIN' | 'AGENT_MARKUP' | 'PRINCIPAL_MARKUP';
    commissionType?: 'PERCENTAGE' | 'FLAT';
    commission?: number;
    fixedCommissionPerTransaction?: number;
    isCommissionInclGST?: boolean;
};

export type DomainHostingPlansData = {
    recordsTotal: number;
    recordsFiltered: number;
    data: DomainHostingPlan[];
};

export type GetDomainHostingPlansParams = {
    page: number;
    searchText: string;
    itemsPerPage: number;
    sort: string;
    sortField?: string;
    planType?: string;
};

export type UpdateDomainHostingPlanStatusPayload = {
    status: boolean;
    id: string | number;
};

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
