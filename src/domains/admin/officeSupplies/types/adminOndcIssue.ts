/**
 * Admin-side ONDC IGM issue shapes — extends the customer-facing OndcIssue
 * (dashboard/officeSupplies/types/ondcIssue.ts) with the corporate/seller
 * context an ops list/detail view needs that a buyer's own view doesn't.
 */
export type AdminIssueStatus =
    | 'OPEN'
    | 'ACKNOWLEDGED'
    | 'INFO_REQUESTED'
    | 'RESPONSE_RECEIVED'
    | 'RESOLVED'
    | 'REJECTED'
    | 'ESCALATED'
    | 'CLOSED';

/** The subset of statuses an admin can pick when responding to an issue. */
export const ADMIN_RESPONSE_ACTIONS: AdminIssueStatus[] = [
    'ACKNOWLEDGED',
    'INFO_REQUESTED',
    'RESOLVED',
    'REJECTED',
];

export type AdminIssueEvent = {
    eventType: AdminIssueStatus | string;
    actorType: 'COMPLAINANT' | 'RESPONDENT' | 'SYSTEM';
    actorName: string;
    message: string;
    images?: string[];
    occurredAt: string;
};

/** One row of the Issues tab list. */
export type AdminIssueRow = {
    id: number;
    displayId: string;
    ondcOrderId: number | null;
    orderId: string | null;
    category: string;
    subCategory: string;
    status: AdminIssueStatus | string;
    corporateName: string;
    vendorName: string;
    createdAt: string;
};

/** Full single-issue detail (the View page). */
export type AdminIssueDetail = {
    id: number;
    displayId: string;
    createdAt?: string;
    orderId: string | null;
    /** numeric ondcOrders.id — links the Order card to /manage/orders/details/:id */
    ondcOrderId?: number | null;
    category: string;
    subCategory: string;
    status: AdminIssueStatus | string;
    corporateName: string;
    corporateCode?: string | null;
    vendorName: string;
    orderTotal?: string | null;
    orderCurrency?: string | null;
    events: AdminIssueEvent[];
};

export type AdminIssuesListResponse = {
    recordsTotal: number;
    recordsFiltered: number;
    data: AdminIssueRow[];
};

export type AdminIssuesListPayload = {
    userId: number;
    userType: string;
    page: number;
    itemsPerPage: number;
    searchText?: string;
    status?: string;
    category?: string;
    from?: string;
    to?: string;
    sort?: string;
    sortField?: string;
    needsAttention?: boolean;
};

export type RespondToIssuePayload = {
    userId: number;
    userType: string;
    id: number;
    message: string;
    action: AdminIssueStatus;
    clientRequestId: string;
};
