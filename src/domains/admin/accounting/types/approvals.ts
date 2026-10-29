import { AccountingServiceTab } from '../config/servicePaths';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export type ApprovalStatusFilter = 'awaiting' | 'pending' | 'approved' | 'rejected' | 'all';

export type ChecklistStatus = 'pass' | 'fail' | 'warn' | 'info';

export type ApprovalFixScreen =
    | 'service_without_plans'
    | 'service_with_plans'
    | 'chart_of_accounts'
    | 'whitelabel_partners'
    | 'peko_subscriptions';

export interface ApprovalFix {
    screen: ApprovalFixScreen;
    accessKey?: string;
    tab?: AccountingServiceTab;
    partnerId?: string;
}

export interface ApprovalReadiness {
    passed: number;
    total: number;
    blocking: string[];
    warnings: string[];
}

export interface ApprovalDriftField {
    field: string;
    label: string;
    before: unknown;
    after: unknown;
}

export interface ApprovalDrift {
    changed: boolean;
    fields: ApprovalDriftField[];
}

export interface ApprovalEvidence {
    successOrders: number;
    recorded: number;
    failed: number;
    skipped: number;
    notRecorded: number;
    internal: number;
    lastOrderAt: string | null;
    lastRecordedAt: string | null;
}

export interface ApprovalCounts {
    services: number;
    switchedOn: number;
    awaiting: number;
    approved: number;
    rejected: number;
    pending: number;
    drifted: number;
}

export interface ApprovalPartner {
    partnerPermissionId: number;
    registeredBy: string | null;
    partnerName: string | null;
    treeStatus: boolean;
    counts: ApprovalCounts;
}

export interface ApprovalGate {
    enabled: boolean;
    reason: string | null;
    setById: number | null;
    setByName: string | null;
    setAt: string | null;
}

export interface ApprovalRow {
    partnerPermissionId: number;
    partnerName: string | null;
    nodeKey: string;
    accessKey: string;
    label: string;
    path: string[];
    group: string | null;
    order: number;
    switchedOn: boolean;
    status: ApprovalStatus;
    decidedById: number | null;
    decidedByName: string | null;
    decidedAt: string | null;
    note: string | null;
    readiness: ApprovalReadiness | null;
    drift: ApprovalDrift | null;
    evidence: ApprovalEvidence | null;
}

export interface ApprovalPartnersResponse {
    partners: ApprovalPartner[];
    totals: ApprovalCounts;
    gate: ApprovalGate;
}

export interface ApprovalRowsFilters {
    status: ApprovalStatusFilter;
    searchText: string;
}

export interface ApprovalRowsResponse {
    partner: ApprovalPartner;
    rows: ApprovalRow[];
    gate: ApprovalGate;
}

export interface ApprovalChecklistItem {
    key: string;
    label: string;
    required: boolean;
    status: ChecklistStatus;
    detail: string;
    fix: ApprovalFix | null;
}

export type ApprovalJournalState = 'recorded' | 'failed' | 'skipped' | 'notRecorded';

export interface ApprovalEvidenceOrder {
    id: number;
    corporateTxnId: string | null;
    status: string;
    transactionDate: string;
    amountInINR: number | null;
    journalState: ApprovalJournalState;
    journalNote?: string | null;
    journalDetail?: string | null;
    internal: boolean;
}

export interface ApprovalHistoryItem {
    id: number;
    action: 'APPROVED' | 'REJECTED' | 'GRANDFATHERED';
    fromStatus: ApprovalStatus | null;
    actorName: string | null;
    note: string | null;
    createdAt: string;
}

export interface ApprovalReview {
    row: ApprovalRow;
    partner: ApprovalPartner;
    checklist: ApprovalChecklistItem[];
    evidence: (ApprovalEvidence & { recentOrders: ApprovalEvidenceOrder[] }) | null;
    history: ApprovalHistoryItem[];
    siblings: ApprovalRow[];
}

export interface ApprovalDecisionPayload {
    nodeKey: string;
    partnerPermissionIds: number[];
    decision: ApprovalDecision;
    note?: string;
}

export type ApprovalDecisionCode = 'BLOCKED' | 'STALE' | 'UNCHANGED' | 'NOT_FOUND';

export interface ApprovalDecisionResultItem {
    partnerPermissionId: number;
    ok: boolean;
    status?: ApprovalStatus;
    code?: ApprovalDecisionCode;
    blocking?: { key: string; label: string; detail: string }[];
}

export interface ApprovalDecisionResult {
    results: ApprovalDecisionResultItem[];
    decided: number;
    skipped: number;
}
