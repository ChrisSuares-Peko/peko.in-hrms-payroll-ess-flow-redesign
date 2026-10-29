export type AuditSource = 'ACCOUNTING_PORTAL' | 'ADMIN_PANEL';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditChange {
    field: string;
    from: unknown;
    to: unknown;
}

export interface AuditEntry {
    id: number;
    createdAt: string;
    actorId: number | null;
    actorName: string | null;
    source: AuditSource;
    configType: string;
    action: AuditAction;
    targetTable: string;
    targetId: number | null;
    targetLabel: string | null;
    partnerName: string | null;
    ipAddress?: string | null;
    changes: AuditChange[];
}

export interface AuditTrailResponse {
    entries: AuditEntry[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
}

export interface AuditTrailFilters {
    page: number;
    itemsPerPage: number;
    searchText: string;
    configType?: string;
    source?: AuditSource;
    partnerName?: string;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    from?: string;
    to?: string;
}
