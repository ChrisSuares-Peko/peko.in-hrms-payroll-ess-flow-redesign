export type DashboardMetricKey =
    | 'journalEntries'
    | 'transactionEntries'
    | 'refundEntries'
    | 'cashbackEntries'
    | 'cashbackReversalEntries'
    | 'adminRefundEntries'
    | 'failedEntries'
    | 'skippedEntries'
    | 'notRecordedEntries'
    | 'transactionsCount'
    | 'gmv'
    | 'discounts'
    | 'netGmv'
    | 'commission'
    | 'platformFee'
    | 'subscriptions'
    | 'subscriptionsMonthly'
    | 'subscriptionsAnnually'
    | 'otherSales'
    | 'otherSalesCount'
    | 'thirdPartySales'
    | 'thirdPartySalesCount';

export type DashboardMetrics = Record<DashboardMetricKey, number>;

export type DashboardSectionKey = 'today' | 'monthly';

export interface DashboardDateRange {
    from: string;
    to: string;
}

export type DashboardSection = Partial<DashboardMetrics> & {
    range?: DashboardDateRange;
    internal?: Partial<DashboardMetrics>;
};

export type DashboardSections = Record<DashboardSectionKey, DashboardSection>;

export type DashboardAlertType =
    | 'go_live_not_set'
    | 'journal_recording_off'
    | 'failed_journals_today'
    | 'failures_share_reason'
    | 'journals_not_recorded'
    | 'journals_held_back_today'
    | 'refunds_waiting_for_sale'
    | 'services_without_commission'
    | 'platform_fee_missing_without_plans'
    | 'partners_without_share'
    | 'partners_without_gateway_charge'
    | 'vendors_without_gst'
    | 'chart_of_accounts_issues'
    | 'chart_of_accounts_pending'
    | 'plans_missing_commission'
    | 'platform_fee_missing_with_plans'
    | 'peko_packages_without_pricing'
    | 'approval_gate_off'
    | 'services_awaiting_approval'
    | 'approvals_drifted'
    | 'vendor_balance_low'
    | 'partner_payable_overdue'
    | 'gateway_settlements_short'
    | 'opening_balances_missing'
    | 'ledger_entries_not_in_books';

export interface DashboardAlertNote {
    note: string;
    count: number;
}

export type DashboardAlertSeverity = 'error' | 'warning';

export interface DashboardAlertMeta {
    missing?: number;
    unsynced?: number;
    misclassified?: number;
    catalogues?: Record<string, number>;
    undecided?: number;
    rejected?: number;
    partners?: number;
    setByName?: string | null;
    setAt?: string | null;
    vendors?: number;
    gateways?: number;
    deleted?: number;
    services?: number;
    paused?: boolean;
    notes?: DashboardAlertNote[];
    total?: number;
    share?: number;
    threshold?: number;
    negative?: number;
    days?: number;
    shortfall?: number;
}

export type ChartOfAccountsIssue = 'missing' | 'unsynced' | 'misclassified';

export type LedgerEntryKind =
    | 'deposit'
    | 'opening'
    | 'credit_note'
    | 'commission'
    | 'cost_of_sales'
    | 'payout'
    | 'debit_note'
    | 'receipt'
    | 'fee';

export interface DashboardAlertItem {
    label: string;
    corporateTxnId?: string;
    journalKey?: string;
    journalLabel?: string;
    service?: string | null;
    amount?: number;
    orderDate?: string | null;
    reason?: string | null;
    accessKey?: string | null;
    partnerId?: string | null;
    planType?: 'with_plans' | 'without_plans';
    packageName?: string | null;
    issue?: ChartOfAccountsIssue;
    accountName?: string;
    accountType?: string | null;
    syncStatus?: string | null;
    catalogue?: string;
    planId?: number | string;
    partnerPermissionId?: number;
    partnerName?: string | null;
    serviceLabel?: string;
    status?: string;
    ledger?: 'vendors' | 'partners' | 'gateways';
    entryKind?: LedgerEntryKind;
    profileId?: number | string | null;
    profileName?: string | null;
    date?: string | null;
    deleted?: boolean;
    kind?: 'global' | 'service';
    setByName?: string | null;
    setAt?: string | null;
    note?: string;
    count?: number;
    since?: string | null;
    changes?: string[];
    vendorId?: number | string;
    services?: string[];
    missing?: string[];
    packageId?: number | string;
    accessCode?: string | null;
    ownService?: boolean;
    available?: number;
    threshold?: number;
    negative?: boolean;
    owed?: number;
    lastPayout?: string | null;
    settlementId?: number | string;
    gatewayAccountId?: string;
    gatewayName?: string | null;
    expectedAmount?: number;
    shortfall?: number;
    reference?: string | null;
    orders?: number;
}

export interface DashboardAlert {
    type: DashboardAlertType;
    severity: DashboardAlertSeverity;
    count: number;
    items: DashboardAlertItem[];
    meta?: DashboardAlertMeta;
}

export type DashboardRankingKey = 'services' | 'vendors' | 'partners';

export interface DashboardRankingRow {
    id: number | null;
    name: string | null;
    amount: number;
    orders: number;
}

export type DashboardRankings = Record<DashboardRankingKey, DashboardRankingRow[]>;

export interface AccountingDashboardData {
    generatedAt: string;
    cached: boolean;
    sections: DashboardSections;
    alerts: DashboardAlert[];
    rankings?: DashboardRankings | null;
}
