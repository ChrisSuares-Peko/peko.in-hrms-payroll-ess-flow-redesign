import { ReactNode } from 'react';

import {
    AuditOutlined,
    BankOutlined,
    BookOutlined,
    CalendarOutlined,
    FileUnknownOutlined,
    FundOutlined,
    GiftOutlined,
    LinkOutlined,
    MinusCircleOutlined,
    NumberOutlined,
    PercentageOutlined,
    RollbackOutlined,
    ScheduleOutlined,
    ShopOutlined,
    SwapOutlined,
    SyncOutlined,
    TagsOutlined,
    UndoOutlined,
    WalletOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { withAccountScope } from './accountScope';
import { approvalsPath } from './approvals';
import { formatInr } from './commission';
import { describeItems, joinNames, plural } from './text';
import { LEDGER_TABS, LedgerKind, LedgerTabKey, accountingLedgerPath } from '../config/ledgerPaths';
import { manualJournalPath, manualOperationsPath } from '../config/manualOperations';
import {
    ACCOUNTING_SERVICE_TABS,
    SERVICE_PARTNER_PARAM,
    accountingLeafPath,
    accountingServicePath,
} from '../config/servicePaths';
import {
    DashboardAlert,
    DashboardAlertItem,
    DashboardAlertType,
    DashboardMetricKey,
    DashboardSection,
    DashboardSectionKey,
    DashboardSections,
} from '../types/dashboard';
import { THIRD_PARTY_SALE_KINDS } from '../types/thirdPartySales';

export type KpiTone = 'default' | 'danger' | 'warning';

export type AccountingKpi = {
    key: string;
    title: string;
    shortTitle?: string;
    action?: string;
    value: string;
    icon: ReactNode;
    tone?: KpiTone;
    to?: string;
};

export type JournalCounts = {
    recorded: number;
    failed: number;
    skipped: number;
    notRecorded: number;
};

export type JournalHealthTone = 'success' | 'warning' | 'error' | 'neutral';

export type JournalHealth = {
    percent: number | null;
    tone: JournalHealthTone;
    label: string;
};

export type AccountingJournalSummary = {
    total: AccountingKpi;
    kinds: AccountingKpi[];
    statuses: AccountingKpi[];
    attention: AccountingKpi[];
    counts: JournalCounts;
    attempted: number;
    health: JournalHealth;
};

export type AccountingKpiSection = {
    key: string;
    title: string;
    journal: AccountingJournalSummary;
    kpis: AccountingKpi[];
    internalKpis: AccountingKpi[];
};

export type AlertTone = 'error' | 'warning';

export type AccountingAlertIssue = {
    key: string;
    label: string;
    detail?: string;
    action: string;
    to: string;
};

export type AccountingAlert = {
    key: string;
    tone: AlertTone;
    title: string;
    body: string;
    action: string;
    to: string;
    issues: AccountingAlertIssue[];
    hidden: number;
};

type KpiCardDefinition = {
    key: string;
    title: string;
    icon: ReactNode;
    shortTitle?: string;
    action?: string;
    kind: 'count' | 'amount';
    metricKey: DashboardMetricKey;
    tone?: KpiTone;
    // Only cards that should navigate somewhere define this — most are plain figures.
    buildTo?: (section: DashboardSection) => string | undefined;
};

// The dashboard's own range is a full IST datetime ("...00:00:00"); Other Sales' own date
// picker only works in plain YYYY-MM-DD, so only the date portion carries over.
const otherSalesLink = (section: DashboardSection): string | undefined => {
    if (!section.range) return undefined;
    const from = section.range.from.slice(0, 10);
    const to = section.range.to.slice(0, 10);
    return `${accountingLeafPath(paths.accountingAdmin.otherSales)}?from=${from}&to=${to}`;
};

const thirdPartySalesLink = (section: DashboardSection): string | undefined => {
    if (!section.range) return undefined;
    const from = section.range.from.slice(0, 10);
    const to = section.range.to.slice(0, 10);
    return `${accountingLeafPath(paths.accountingAdmin.thirdPartySales)}/${THIRD_PARTY_SALE_KINDS.paymentLinks}?from=${from}&to=${to}`;
};

// Transaction Entries, Transactions Count, Total GMV, Total Discount and Net GMV are all
// defined as "payment status = SUCCESS" over the same date range — a lighter, payment-centric
// page than Order Journals (no journal-status machinery at all), so all five share this one
// link, and the page carries the same three order-value figures per record.
const transactionsLink = (section: DashboardSection): string | undefined => {
    if (!section.range) return undefined;
    const from = section.range.from.slice(0, 10);
    const to = section.range.to.slice(0, 10);
    return `${accountingLeafPath(paths.accountingAdmin.transactions)}?from=${from}&to=${to}&status=SUCCESS`;
};

// Commission and Platform Fee each drill into their own dedicated details page, one shared
// component switched by feeType — same date range the card was computed from.
const feeDetailsLink =
    (feeType: 'commission' | 'platformFee') =>
    (section: DashboardSection): string | undefined => {
        if (!section.range) return undefined;
        const from = section.range.from.slice(0, 10);
        const to = section.range.to.slice(0, 10);
        const path =
            feeType === 'commission'
                ? paths.accountingAdmin.commissionDetails
                : paths.accountingAdmin.platformFeeDetails;
        return `${accountingLeafPath(path)}?from=${from}&to=${to}`;
    };

// All 3 Subscriptions cards share one page — Monthly/Annual just seed billingType.
const subscriptionDetailsLink =
    (billingType?: 'MONTHLY' | 'ANNUALLY') =>
    (section: DashboardSection): string | undefined => {
        if (!section.range) return undefined;
        const from = section.range.from.slice(0, 10);
        const to = section.range.to.slice(0, 10);
        const billing = billingType ? `&billingType=${billingType}` : '';
        return `${accountingLeafPath(paths.accountingAdmin.subscriptionDetails)}?from=${from}&to=${to}${billing}`;
    };

type OrderJournalKey =
    'transaction' | 'refund' | 'cashback' | 'cashbackReversal' | 'adminRefund' | 'any';

// journalKey scopes both the date filter (that key's own event date, not the order's original
// purchase date — same fix as the KPI counts themselves) and the status filter (that key's own
// recorded/failed/skipped, not always "transaction") on the Order Journals page. Omitting it
// keeps the page's original transaction-only behavior.
const orderJournalsLink =
    (
        journalKey?: OrderJournalKey,
        journalStatus?: 'success' | 'failed' | 'skipped' | 'notRecorded'
    ) =>
    (section: DashboardSection): string | undefined => {
        if (!section.range) return undefined;
        const from = section.range.from.slice(0, 10);
        const to = section.range.to.slice(0, 10);
        const key = journalKey ? `&journalKey=${journalKey}` : '';
        const status = journalStatus ? `&status=${journalStatus}` : '';
        return `${accountingLeafPath(paths.accountingAdmin.orderJournals)}?from=${from}&to=${to}${key}${status}`;
    };

const KPI_CARDS: KpiCardDefinition[] = [
    {
        key: 'journal-entries',
        title: 'Journal Entries',
        icon: <BookOutlined />,
        kind: 'count',
        metricKey: 'journalEntries',
        buildTo: orderJournalsLink(),
    },
    {
        key: 'transaction-entries',
        title: 'Transaction Entries',
        shortTitle: 'Sales',
        icon: <SwapOutlined />,
        kind: 'count',
        metricKey: 'transactionEntries',
        buildTo: transactionsLink,
    },
    {
        key: 'refund-entries',
        title: 'Refund Entries',
        shortTitle: 'Refunds',
        icon: <RollbackOutlined />,
        kind: 'count',
        metricKey: 'refundEntries',
        buildTo: orderJournalsLink('refund', 'success'),
    },
    {
        key: 'cashback-entries',
        title: 'Cashback Entries',
        shortTitle: 'Cashback',
        icon: <GiftOutlined />,
        kind: 'count',
        metricKey: 'cashbackEntries',
        buildTo: orderJournalsLink('cashback', 'success'),
    },
    {
        key: 'cashback-reversal-entries',
        title: 'Cashback Reversal Entries',
        shortTitle: 'Reversals',
        icon: <UndoOutlined />,
        kind: 'count',
        metricKey: 'cashbackReversalEntries',
        buildTo: orderJournalsLink('cashbackReversal', 'success'),
    },
    {
        key: 'admin-refund-entries',
        title: 'Admin Triggered Refund Entries',
        shortTitle: 'Admin refunds',
        icon: <AuditOutlined />,
        kind: 'count',
        metricKey: 'adminRefundEntries',
        buildTo: orderJournalsLink('adminRefund', 'success'),
    },
    {
        key: 'failed-entries',
        title: 'Failed Entries',
        shortTitle: 'Failed',
        action: 'Retry',
        icon: <WarningOutlined />,
        kind: 'count',
        metricKey: 'failedEntries',
        tone: 'danger',
        buildTo: orderJournalsLink('any', 'failed'),
    },
    {
        key: 'skipped-entries',
        title: 'Skipped Entries',
        shortTitle: 'Skipped',
        action: 'Review',
        icon: <MinusCircleOutlined />,
        kind: 'count',
        metricKey: 'skippedEntries',
        tone: 'warning',
        buildTo: orderJournalsLink('any', 'skipped'),
    },
    {
        key: 'not-recorded-entries',
        title: 'Not Recorded Entries',
        shortTitle: 'Not recorded',
        action: 'Record',
        icon: <FileUnknownOutlined />,
        kind: 'count',
        metricKey: 'notRecordedEntries',
        tone: 'warning',
        buildTo: orderJournalsLink('any', 'notRecorded'),
    },
    {
        key: 'transactions-count',
        title: 'Transactions Count',
        icon: <NumberOutlined />,
        kind: 'count',
        metricKey: 'transactionsCount',
        buildTo: transactionsLink,
    },
    {
        key: 'gmv',
        title: 'Total GMV',
        icon: <BankOutlined />,
        kind: 'amount',
        metricKey: 'gmv',
        buildTo: transactionsLink,
    },
    {
        key: 'discounts',
        title: 'Total Discount',
        icon: <TagsOutlined />,
        kind: 'amount',
        metricKey: 'discounts',
        buildTo: transactionsLink,
    },
    {
        key: 'net-gmv',
        title: 'Net GMV',
        icon: <FundOutlined />,
        kind: 'amount',
        metricKey: 'netGmv',
        buildTo: transactionsLink,
    },
    {
        key: 'commission',
        title: 'Commission (excl. GST)',
        icon: <PercentageOutlined />,
        kind: 'amount',
        metricKey: 'commission',
        buildTo: feeDetailsLink('commission'),
    },
    {
        key: 'platform-fee',
        title: 'Platform Fee (excl. GST)',
        icon: <WalletOutlined />,
        kind: 'amount',
        metricKey: 'platformFee',
        buildTo: feeDetailsLink('platformFee'),
    },
    {
        key: 'subscriptions',
        title: 'Total Subscriptions',
        icon: <SyncOutlined />,
        kind: 'amount',
        metricKey: 'subscriptions',
        buildTo: subscriptionDetailsLink(),
    },
    {
        key: 'subscriptions-monthly',
        title: 'Subscriptions (Monthly)',
        icon: <CalendarOutlined />,
        kind: 'amount',
        metricKey: 'subscriptionsMonthly',
        buildTo: subscriptionDetailsLink('MONTHLY'),
    },
    {
        key: 'subscriptions-annual',
        title: 'Subscriptions (Annual)',
        icon: <ScheduleOutlined />,
        kind: 'amount',
        metricKey: 'subscriptionsAnnually',
        buildTo: subscriptionDetailsLink('ANNUALLY'),
    },
    {
        key: 'other-sales',
        title: 'Other Sales',
        icon: <ShopOutlined />,
        kind: 'amount',
        metricKey: 'otherSales',
        buildTo: otherSalesLink,
    },
    {
        key: 'third-party-sales',
        title: 'Third-Party Sales',
        icon: <LinkOutlined />,
        kind: 'amount',
        metricKey: 'thirdPartySales',
        buildTo: thirdPartySalesLink,
    },
];

export const KPI_CARD_TITLES = KPI_CARDS.map(card => card.title);

export const KPI_SECTIONS: { key: DashboardSectionKey; title: string }[] = [
    { key: 'today', title: "Today's Statistics" },
    { key: 'monthly', title: 'Monthly Statistics' },
];

const formatValue = (kind: KpiCardDefinition['kind'], value: number) =>
    kind === 'amount' ? formatInr(value) : formatNumberWithLocalString(value, 0, 0);

const JOURNAL_TOTAL_KEY = 'journal-entries';
const JOURNAL_KIND_KEYS = [
    'transaction-entries',
    'refund-entries',
    'cashback-entries',
    'cashback-reversal-entries',
    'admin-refund-entries',
];
const JOURNAL_STATUS_KEYS = ['failed-entries', 'skipped-entries', 'not-recorded-entries'];
const JOURNAL_KEYS = new Set([JOURNAL_TOTAL_KEY, ...JOURNAL_KIND_KEYS, ...JOURNAL_STATUS_KEYS]);

export const INTERNAL_KPI_CARDS = KPI_CARDS.filter(
    card => !JOURNAL_KEYS.has(card.key) && card.key !== 'platform-fee'
);

export const INTERNAL_KPI_CARD_TITLES = INTERNAL_KPI_CARDS.map(card => card.title);

export const INTERNAL_ROW_TITLE = 'Internal purchase accounts';

export const INTERNAL_ROW_NOTE =
    'The same figures for orders placed by the accounts listed under Settings › Internal Accounts, for the same window. Platform fee has no card here because it is always nil on those orders.';

const metricOf = (metrics: DashboardSection, key: DashboardMetricKey) => Number(metrics[key]) || 0;

const JOURNAL_STATUS_COUNT: Record<string, keyof JournalCounts> = {
    'failed-entries': 'failed',
    'skipped-entries': 'skipped',
    'not-recorded-entries': 'notRecorded',
};

export const journalHealthOf = (counts: JournalCounts): JournalHealth => {
    const attempted = counts.recorded + counts.failed + counts.skipped + counts.notRecorded;
    if (attempted <= 0) return { percent: null, tone: 'neutral', label: 'No entries yet' };
    const percent =
        counts.recorded === attempted ? 100 : Math.floor((counts.recorded / attempted) * 100);
    if (counts.failed > 0) return { percent, tone: 'error', label: 'Entries refused' };
    if (counts.skipped + counts.notRecorded > 0) {
        return { percent, tone: 'warning', label: 'Needs attention' };
    }
    return { percent, tone: 'success', label: 'All in the books' };
};

export const buildSections = (sections?: Partial<DashboardSections>): AccountingKpiSection[] =>
    KPI_SECTIONS.map(section => {
        const metrics = sections?.[section.key] ?? {};
        const internal: DashboardSection = { ...(metrics.internal ?? {}), range: metrics.range };
        const cards = KPI_CARDS.map(card => ({
            cardKey: card.key,
            kpi: {
                key: `${section.key}-${card.key}`,
                title: card.title,
                shortTitle: card.shortTitle,
                action: card.action,
                icon: card.icon,
                tone: card.tone,
                value: formatValue(card.kind, metricOf(metrics, card.metricKey)),
                to: card.buildTo?.(metrics),
            },
        }));
        const kpiOf = (cardKey: string) => cards.find(entry => entry.cardKey === cardKey)!.kpi;
        const counts: JournalCounts = {
            recorded: metricOf(metrics, 'journalEntries'),
            failed: metricOf(metrics, 'failedEntries'),
            skipped: metricOf(metrics, 'skippedEntries'),
            notRecorded: metricOf(metrics, 'notRecordedEntries'),
        };
        return {
            key: section.key,
            title: section.title,
            journal: {
                total: kpiOf(JOURNAL_TOTAL_KEY),
                kinds: JOURNAL_KIND_KEYS.map(kpiOf),
                statuses: JOURNAL_STATUS_KEYS.map(kpiOf),
                attention: JOURNAL_STATUS_KEYS.filter(
                    key => counts[JOURNAL_STATUS_COUNT[key]] > 0
                ).map(kpiOf),
                counts,
                attempted: counts.recorded + counts.failed + counts.skipped + counts.notRecorded,
                health: journalHealthOf(counts),
            },
            kpis: cards.filter(entry => !JOURNAL_KEYS.has(entry.cardKey)).map(entry => entry.kpi),
            internalKpis: INTERNAL_KPI_CARDS.map(card => ({
                key: `${section.key}-internal-${card.key}`,
                title: card.title,
                shortTitle: card.shortTitle,
                action: card.action,
                icon: card.icon,
                tone: card.tone,
                value: formatValue(card.kind, metricOf(internal, card.metricKey)),
                to: withAccountScope(card.buildTo?.(internal), 'internal'),
            })),
        };
    });

const CATALOGUE_LABELS: Record<string, string> = {
    packages: 'Service packages',
    plans: 'Plans',
    work_plans: 'Work plans',
    businessRegistrationCatalogs: 'Business registration',
    esimPlans: 'eSIM plans',
    giftCards: 'Gift cards',
    hikes: 'Hikes',
    softwares_subscriptions_plans: 'Software subscriptions',
    govtServicesCatalogs: 'Government services',
    settings: 'Add-ons',
};

export const ALERT_TITLES_BY_TYPE: Record<DashboardAlertType, string> = {
    go_live_not_set: 'Go-live date not set',
    journal_recording_off: 'Journal recording off',
    failed_journals_today: 'Failed journal entries',
    failures_share_reason: 'Failures share one reason',
    journals_not_recorded: 'Journals not recorded',
    journals_held_back_today: 'Entries held back today',
    refunds_waiting_for_sale: 'Refunds waiting for the sale',
    services_without_commission: 'Services without commission',
    platform_fee_missing_without_plans: 'Platform fee not set (without plans)',
    partners_without_share: 'Partners without share',
    partners_without_gateway_charge: 'Partners without gateway charge',
    vendors_without_gst: 'Vendors without GST details',
    chart_of_accounts_issues: 'Chart of accounts issues',
    chart_of_accounts_pending: 'Chart of accounts stuck pending',
    plans_missing_commission: 'Plans missing commission',
    platform_fee_missing_with_plans: 'Platform fee not set (with plans)',
    peko_packages_without_pricing: 'Peko packages without pricing',
    approval_gate_off: 'Approval gate off',
    services_awaiting_approval: 'Services awaiting approval',
    approvals_drifted: 'Approved services drifted',
    vendor_balance_low: 'Vendor advance running low',
    partner_payable_overdue: 'Partner payable overdue',
    gateway_settlements_short: 'Gateway settlements short',
    opening_balances_missing: 'Opening balances missing',
    ledger_entries_not_in_books: 'Entries not in books',
};

const PENDING_SYNC_LABELS: Record<string, string> = {
    CREATE_PENDING: 'Create pending',
    UPDATE_PENDING: 'Update pending',
};

const SERVICE_KIND_OF = (item: DashboardAlertItem): 'with_plans' | 'without_plans' =>
    item.planType ?? 'without_plans';

const LEDGER_LIST_PATH = {
    vendors: accountingLeafPath(paths.accountingAdmin.vendors),
    partners: accountingLeafPath(paths.accountingAdmin.partners),
    payment_gateways: accountingLeafPath(paths.accountingAdmin.paymentGateways),
};

const PEKO_SUBSCRIPTIONS_PATH = accountingLeafPath(paths.accountingAdmin.pekoSubscriptions);
const ORDER_JOURNALS_PATH = accountingLeafPath(paths.accountingAdmin.orderJournals);
const GO_LIVE_PATH = `${paths.systemUser.accounting}?setGoLive=1`;

const partnerLabelOf = (item: DashboardAlertItem) =>
    item.partnerName ?? (item.partnerId ? `Partner ${item.partnerId}` : 'Peko (Default)');

export const ALERT_TITLES = Object.values(ALERT_TITLES_BY_TYPE);

const SYNC_STATUS_LABELS: Record<string, string> = {
    CREATE_FAILED: 'Create failed',
    UPDATE_FAILED: 'Update failed',
};

const LEDGER_KIND_OF: Record<NonNullable<DashboardAlertItem['ledger']>, LedgerKind> = {
    vendors: 'vendors',
    partners: 'partners',
    gateways: 'payment_gateways',
};

const ledgerEntryTab = (item: DashboardAlertItem): LedgerTabKey => {
    if (item.entryKind === 'credit_note') return LEDGER_TABS.creditNotes;
    if (item.entryKind === 'commission') return LEDGER_TABS.commissions;
    if (item.entryKind === 'cost_of_sales') return LEDGER_TABS.costOfSales;
    if (item.entryKind === 'debit_note') return LEDGER_TABS.debitNotes;
    if (item.ledger === 'vendors') return LEDGER_TABS.deposits;
    if (item.ledger === 'partners') return LEDGER_TABS.payments;
    return LEDGER_TABS.receivedAndBills;
};

const joinDetail = (parts: (string | number | null | undefined)[]) =>
    parts
        .filter(part => part !== null && part !== undefined && part !== '')
        .map(String)
        .join(' · ') || undefined;

const formatDay = (value?: string | null) =>
    value ? dayjs(value.slice(0, 10)).format('DD MMM YYYY') : null;

const amountOf = (value?: number) => (typeof value === 'number' ? formatInr(value) : null);

const withQuery = (path: string, params: Record<string, string | null | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });
    const text = query.toString();
    return text ? `${path}?${text}` : path;
};

const orderJournalIssueLink = (item: DashboardAlertItem) =>
    withQuery(accountingLeafPath(paths.accountingAdmin.orderJournals), {
        from: item.orderDate,
        to: item.orderDate,
        journalKey: item.journalKey,
        status: 'failed',
        search: item.corporateTxnId,
        open: item.corporateTxnId,
    });

const SERVICE_LIST_PATH: Record<'with_plans' | 'without_plans', string> = {
    with_plans: accountingLeafPath(paths.accountingAdmin.serviceWithPlans),
    without_plans: accountingLeafPath(paths.accountingAdmin.serviceWithoutPlans),
};

const platformFeeIssue =
    (planType: 'with_plans' | 'without_plans') =>
    (item: DashboardAlertItem): AccountingAlertIssue => {
        const kind = item.planType ?? planType;
        return {
            key: `${item.accessKey ?? item.label}:${item.partnerId ?? ''}:${item.packageName ?? ''}`,
            label: item.label,
            detail:
                item.partnerName ??
                (item.partnerId ? `Partner ${item.partnerId}` : 'Peko (Default)'),
            action: 'Set platform fee',
            to: item.accessKey
                ? withQuery(
                      accountingServicePath(
                          kind,
                          item.accessKey,
                          ACCOUNTING_SERVICE_TABS.platformFee
                      ),
                      { [SERVICE_PARTNER_PARAM]: item.partnerId, search: item.packageName }
                  )
                : SERVICE_LIST_PATH[kind],
        };
    };

const platformFeeCopy =
    (planType: 'with_plans' | 'without_plans') =>
    ({ count, meta }: DashboardAlert): AlertCopy => {
        const services = Number(meta?.services) || 0;
        const scope = services
            ? ` across ${services} ${plural(services, 'service', 'services')} ${planType === 'with_plans' ? 'with' : 'without'} plans`
            : ` of ${planType === 'with_plans' ? 'services with plans' : 'services without plans'}`;
        return {
            body: `${count} linked ${plural(count, 'package', 'packages')}${scope} ${plural(count, 'has', 'have')} no platform fee configured.`,
            action: 'Open services',
            to: SERVICE_LIST_PATH[planType],
        };
    };

const orderEntryLink = (
    item: DashboardAlertItem,
    status: 'failed' | 'skipped' | undefined,
    journalKey?: string
) =>
    withQuery(ORDER_JOURNALS_PATH, {
        from: item.orderDate,
        to: item.orderDate,
        journalKey: journalKey ?? item.journalKey,
        status,
        search: item.corporateTxnId,
        open: item.corporateTxnId,
    });

const heldBackIssue = (item: DashboardAlertItem): AccountingAlertIssue => {
    const base = {
        key: `${item.corporateTxnId ?? item.label}:${item.journalKey ?? ''}`,
        label: item.corporateTxnId ?? item.label,
        detail: joinDetail([
            item.journalLabel,
            item.service,
            amountOf(item.amount),
            item.note ?? item.reason,
        ]),
    };
    const kind = SERVICE_KIND_OF(item);
    if (item.note === 'Commission not configured' && item.accessKey) {
        return {
            ...base,
            action: 'Set commission',
            to: accountingServicePath(
                kind,
                item.accessKey,
                kind === 'with_plans'
                    ? ACCOUNTING_SERVICE_TABS.plans
                    : ACCOUNTING_SERVICE_TABS.commission
            ),
        };
    }
    if (item.note === 'Platform fee not configured' && item.accessKey) {
        return {
            ...base,
            action: 'Set platform fee',
            to: accountingServicePath(kind, item.accessKey, ACCOUNTING_SERVICE_TABS.platformFee),
        };
    }
    if (item.note === 'Waiting for the sale entry') {
        return {
            ...base,
            action: 'Post the sale',
            to: orderEntryLink(item, undefined, 'transaction'),
        };
    }
    return { ...base, action: 'Open entry', to: orderEntryLink(item, 'skipped') };
};

const OPENING_TAB_OF: Record<NonNullable<DashboardAlertItem['ledger']>, LedgerTabKey> = {
    vendors: LEDGER_TABS.deposits,
    partners: LEDGER_TABS.payments,
    gateways: LEDGER_TABS.receivedAndBills,
};

const LEDGER_NOUN_OF: Record<NonNullable<DashboardAlertItem['ledger']>, string> = {
    vendors: 'Vendor',
    partners: 'Partner',
    gateways: 'Payment gateway',
};

const ledgerProfileLink = (
    ledger: DashboardAlertItem['ledger'],
    profileId: DashboardAlertItem['profileId']
) => {
    if (!ledger || profileId === null || profileId === undefined) return manualOperationsPath();
    return accountingLedgerPath(LEDGER_KIND_OF[ledger], String(profileId), OPENING_TAB_OF[ledger]);
};

const ISSUE_OF: Record<DashboardAlertType, (item: DashboardAlertItem) => AccountingAlertIssue> = {
    go_live_not_set: item => ({
        key: 'go-live',
        label: item.label,
        action: 'Set go-live date',
        to: GO_LIVE_PATH,
    }),
    journal_recording_off: item =>
        item.kind === 'global'
            ? {
                  key: 'global',
                  label: item.label,
                  detail: joinDetail([
                      item.setByName ? `Paused by ${item.setByName}` : null,
                      item.setAt ? dayjs(item.setAt).format('DD MMM YYYY, HH:mm') : null,
                  ]),
                  action: 'See held-back entries',
                  to: withQuery(ORDER_JOURNALS_PATH, { status: 'skipped' }),
              }
            : {
                  key: item.accessKey ?? item.label,
                  label: item.label,
                  detail: 'Set not to post. Switch journal recording on in Settings › Service Operators.',
                  action: 'Open service',
                  to: item.accessKey
                      ? accountingServicePath(SERVICE_KIND_OF(item), item.accessKey)
                      : SERVICE_LIST_PATH[SERVICE_KIND_OF(item)],
              },
    failures_share_reason: item => ({
        key: item.reason ?? item.label,
        label: item.label,
        detail: `${item.count ?? 0} ${plural(item.count ?? 0, 'entry', 'entries')} today`,
        action: 'See failed entries',
        to: withQuery(ORDER_JOURNALS_PATH, { status: 'failed' }),
    }),
    journals_held_back_today: heldBackIssue,
    refunds_waiting_for_sale: item => ({
        key: `${item.corporateTxnId ?? item.label}:${item.journalKey ?? ''}`,
        label: item.corporateTxnId ?? item.label,
        detail: joinDetail([item.journalLabel, item.service, amountOf(item.amount)]),
        action: 'Post the sale',
        to: orderEntryLink(item, undefined, 'transaction'),
    }),
    partners_without_gateway_charge: item => ({
        key: item.partnerId ?? item.label,
        label: item.label,
        detail:
            item.partnerId && item.partnerId !== item.label
                ? `Partner ID ${item.partnerId}`
                : undefined,
        action: 'Set charge terms',
        to: withQuery(accountingLeafPath(paths.accountingAdmin.whitelabelPartners), {
            search: item.partnerId,
            configure: item.partnerId,
        }),
    }),
    vendors_without_gst: item => ({
        key: String(item.vendorId ?? item.label),
        label: item.label,
        detail: joinDetail([
            item.missing?.length ? `Missing ${joinNames(item.missing)}` : null,
            item.services?.length ? item.services.join(', ') : null,
        ]),
        action: 'Edit vendor',
        to: item.accessKey
            ? accountingServicePath(
                  SERVICE_KIND_OF(item),
                  item.accessKey,
                  ACCOUNTING_SERVICE_TABS.vendor
              )
            : LEDGER_LIST_PATH.vendors,
    }),
    chart_of_accounts_pending: item => ({
        key: `pending:${item.accountName ?? item.label}`,
        label: item.label,
        detail: joinDetail([
            item.syncStatus ? (PENDING_SYNC_LABELS[item.syncStatus] ?? item.syncStatus) : null,
            item.since ? `since ${dayjs(item.since).format('DD MMM YYYY')}` : null,
        ]),
        action: 'Open account',
        to: withQuery(accountingLeafPath(paths.accountingAdmin.chartOfAccounts), {
            search: item.accountName ?? item.label,
        }),
    }),
    peko_packages_without_pricing: item => ({
        key: String(item.packageId ?? item.label),
        label: item.label,
        detail: joinDetail([
            item.ownService ? 'Peko service package' : 'Subscription plan',
            partnerLabelOf(item),
        ]),
        action: 'Set pricing',
        to: withQuery(PEKO_SUBSCRIPTIONS_PATH, {
            tab: 'plans',
            search: item.packageName ?? item.label,
        }),
    }),
    approvals_drifted: item => ({
        key: `${item.partnerPermissionId ?? ''}:${item.accessKey ?? item.label}`,
        label: item.serviceLabel ?? item.label,
        detail: joinDetail([
            item.partnerName ?? (item.partnerPermissionId ? 'Peko (Default)' : null),
            item.changes?.length ? `Changed: ${item.changes.join(', ')}` : null,
        ]),
        action: 'Review',
        to: approvalsPath(item.partnerPermissionId, 'approved', item.serviceLabel),
    }),
    vendor_balance_low: item => ({
        key: String(item.vendorId ?? item.label),
        label: item.label,
        detail: joinDetail([
            item.negative ? 'Advance exhausted' : 'Advance low',
            `Available ${amountOf(item.available) ?? '—'}`,
            typeof item.threshold === 'number' ? `threshold ${formatInr(item.threshold)}` : null,
        ]),
        action: 'Record deposit',
        to:
            item.vendorId !== undefined && item.vendorId !== null
                ? accountingLedgerPath('vendors', String(item.vendorId), LEDGER_TABS.deposits)
                : LEDGER_LIST_PATH.vendors,
    }),
    partner_payable_overdue: item => ({
        key: item.partnerId ?? item.label,
        label: item.label,
        detail: joinDetail([
            `Owed ${amountOf(item.owed) ?? '—'}`,
            item.lastPayout ? `last payout ${formatDay(item.lastPayout)}` : 'no payout recorded',
        ]),
        action: 'Record payout',
        to: item.partnerId
            ? accountingLedgerPath('partners', item.partnerId, LEDGER_TABS.payments)
            : LEDGER_LIST_PATH.partners,
    }),
    gateway_settlements_short: item => ({
        key: String(item.settlementId ?? item.label),
        label: item.label,
        detail: joinDetail([
            `Received ${amountOf(item.amount) ?? '—'} of ${amountOf(item.expectedAmount) ?? '—'}`,
            `short ${amountOf(item.shortfall) ?? '—'}`,
            item.reference,
        ]),
        action: 'Record fee',
        to: item.gatewayAccountId
            ? accountingLedgerPath(
                  'payment_gateways',
                  item.gatewayAccountId,
                  LEDGER_TABS.receivedAndBills
              )
            : LEDGER_LIST_PATH.payment_gateways,
    }),
    opening_balances_missing: item => ({
        key: `${item.ledger ?? ''}:${item.profileId ?? item.label}`,
        label: item.label,
        detail: joinDetail([
            item.ledger ? LEDGER_NOUN_OF[item.ledger] : 'Vendor',
            typeof item.orders === 'number'
                ? `${item.orders} ${plural(item.orders, 'order', 'orders')} before go-live`
                : null,
        ]),
        action: 'Set opening balance',
        to: ledgerProfileLink(item.ledger, item.profileId),
    }),
    failed_journals_today: item => ({
        key: `${item.corporateTxnId ?? item.label}:${item.journalKey ?? ''}`,
        label: item.corporateTxnId ?? item.label,
        detail: joinDetail([item.journalLabel, item.service, amountOf(item.amount), item.reason]),
        action: 'Retry entry',
        to: orderJournalIssueLink(item),
    }),
    journals_not_recorded: item => ({
        key: item.corporateTxnId ?? item.label,
        label: item.corporateTxnId ?? item.label,
        detail: joinDetail([item.service, amountOf(item.amount)]),
        action: 'Record journal',
        to: item.corporateTxnId
            ? manualJournalPath(item.corporateTxnId, 'transaction')
            : manualJournalPath(),
    }),
    services_without_commission: item => ({
        key: item.accessKey ?? item.label,
        label: item.label,
        action: 'Set commission',
        to: item.accessKey
            ? accountingServicePath(
                  'without_plans',
                  item.accessKey,
                  ACCOUNTING_SERVICE_TABS.commission
              )
            : accountingLeafPath(paths.accountingAdmin.serviceWithoutPlans),
    }),
    platform_fee_missing_without_plans: platformFeeIssue('without_plans'),
    platform_fee_missing_with_plans: platformFeeIssue('with_plans'),
    partners_without_share: item => ({
        key: item.partnerId ?? item.label,
        label: item.label,
        detail:
            item.partnerId && item.partnerId !== item.label
                ? `Partner ID ${item.partnerId}`
                : undefined,
        action: 'Set share',
        to: withQuery(accountingLeafPath(paths.accountingAdmin.whitelabelPartners), {
            search: item.partnerId,
            configure: item.partnerId,
        }),
    }),
    chart_of_accounts_issues: item => {
        const path = accountingLeafPath(paths.accountingAdmin.chartOfAccounts);
        const accountName = item.accountName ?? item.label;
        if (item.issue === 'missing') {
            return {
                key: `missing:${accountName}`,
                label: accountName,
                detail: 'Required account is missing',
                action: 'Add account',
                to: withQuery(path, { add: accountName }),
            };
        }
        if (item.issue === 'misclassified') {
            return {
                key: `misclassified:${accountName}`,
                label: accountName,
                detail: item.accountType
                    ? `Booked as ${item.accountType}, on the wrong side of the balance sheet`
                    : 'On the wrong side of the balance sheet',
                action: 'Fix account type',
                to: withQuery(path, { search: accountName }),
            };
        }
        return {
            key: `unsynced:${accountName}`,
            label: accountName,
            detail: item.syncStatus
                ? (SYNC_STATUS_LABELS[item.syncStatus] ?? item.syncStatus)
                : 'Not synced with the books',
            action: 'Open account',
            to: withQuery(path, { search: accountName }),
        };
    },
    plans_missing_commission: item => ({
        key: `${item.catalogue ?? ''}:${item.planId ?? item.label}`,
        label: item.label,
        detail: item.catalogue ? (CATALOGUE_LABELS[item.catalogue] ?? item.catalogue) : undefined,
        action: 'Set commission',
        to: item.accessKey
            ? withQuery(
                  accountingServicePath(
                      'with_plans',
                      item.accessKey,
                      ACCOUNTING_SERVICE_TABS.plans
                  ),
                  item.catalogue === 'settings' ? { subTab: 'addOns' } : { search: item.label }
              )
            : accountingLeafPath(paths.accountingAdmin.serviceWithPlans),
    }),
    services_awaiting_approval: item => ({
        key: `${item.partnerPermissionId ?? ''}:${item.accessKey ?? item.label}`,
        label: item.serviceLabel ?? item.label,
        detail: joinDetail([
            item.partnerName ?? (item.partnerPermissionId ? 'Peko (Default)' : null),
            item.status === 'REJECTED' ? 'Rejected' : 'Pending',
        ]),
        action: 'Review',
        to: approvalsPath(
            item.partnerPermissionId,
            item.status === 'REJECTED' ? 'rejected' : undefined,
            item.serviceLabel
        ),
    }),
    approval_gate_off: item => ({
        key: item.label,
        label: item.label,
        action: 'Turn the gate on',
        to: approvalsPath(),
    }),
    ledger_entries_not_in_books: item => ({
        key: `${item.ledger ?? ''}:${item.entryKind ?? ''}:${item.profileId ?? ''}:${item.date ?? ''}:${item.amount ?? ''}`,
        label: item.label,
        detail: joinDetail([
            amountOf(item.amount),
            formatDay(item.date),
            item.deleted ? 'Deleted, still in the books' : null,
        ]),
        action: item.deleted ? 'Remove from books' : 'Mark in books',
        to:
            item.ledger && item.profileId !== null && item.profileId !== undefined
                ? accountingLedgerPath(
                      LEDGER_KIND_OF[item.ledger],
                      String(item.profileId),
                      ledgerEntryTab(item)
                  )
                : manualOperationsPath(),
    }),
};

type AlertCopy = Pick<AccountingAlert, 'body' | 'action' | 'to'>;

const labelsOf = (items: DashboardAlertItem[]) => items.map(item => item.label);

const describeNotes = (notes?: { note: string; count: number }[]) =>
    (notes ?? []).filter(entry => entry.count > 0).map(entry => `${entry.note} ${entry.count}`);

const ALERT_COPY: Record<DashboardAlertType, (alert: DashboardAlert) => AlertCopy> = {
    go_live_not_set: () => ({
        body: 'No accounting go-live date is set, so every figure on this portal reads zero.',
        action: 'Set go-live date',
        to: GO_LIVE_PATH,
    }),
    journal_recording_off: ({ meta }) => {
        const services = Number(meta?.services) || 0;
        const serviceText = `${services} vendor ${plural(services, 'service is', 'services are')} set not to post`;
        return {
            body: meta?.paused
                ? `Journal recording is paused for every service, so no new entry reaches the books${
                      services ? `; ${serviceText} as well` : ''
                  }.`
                : `${serviceText}, so ${plural(services, 'its', 'their')} orders never reach the books.`,
            action: 'Open order journals',
            to: withQuery(ORDER_JOURNALS_PATH, { status: 'skipped' }),
        };
    },
    failures_share_reason: ({ count, items, meta }) => {
        const total = Number(meta?.total) || count;
        const reason = items[0]?.label ?? 'one reason';
        return {
            body: `${count} of today's ${total} refused ${plural(total, 'entry', 'entries')} share one reason: ${reason}.`,
            action: 'Open order journals',
            to: withQuery(ORDER_JOURNALS_PATH, { status: 'failed' }),
        };
    },
    journals_held_back_today: ({ count, meta }) => {
        const notes = describeNotes(meta?.notes);
        return {
            body: `${count} ${plural(count, 'entry was', 'entries were')} held back from the books today${
                notes.length ? ` (${joinNames(notes)})` : ''
            }.`,
            action: 'Open order journals',
            to: withQuery(ORDER_JOURNALS_PATH, { status: 'skipped' }),
        };
    },
    refunds_waiting_for_sale: ({ count }) => ({
        body: `${count} refund ${plural(count, 'entry is', 'entries are')} waiting for the sale entry to reach the books first.`,
        action: 'Open order journals',
        to: withQuery(ORDER_JOURNALS_PATH, { journalKey: 'transaction' }),
    }),
    partners_without_gateway_charge: ({ count, items }) => ({
        body: `${describeItems(labelsOf(items), count) || `${count} ${plural(count, 'partner', 'partners')}`} ${plural(count, 'has', 'have')} no gateway charge terms, so nothing is netted out of ${plural(count, 'its', 'their')} share.`,
        action: 'Open partners',
        to: accountingLeafPath(paths.accountingAdmin.whitelabelPartners),
    }),
    vendors_without_gst: ({ count, items }) => ({
        body: `${describeItems(labelsOf(items), count) || `${count} ${plural(count, 'vendor', 'vendors')}`} ${plural(count, 'is', 'are')} missing GST details, so the GST split on commission cannot be decided.`,
        action: 'Open vendors',
        to: LEDGER_LIST_PATH.vendors,
    }),
    chart_of_accounts_pending: ({ count, items }) => ({
        body: `${count} ${plural(count, 'account has', 'accounts have')} been pending sync with the books for over a day${
            items.length ? ` (${describeItems(labelsOf(items), count)})` : ''
        }.`,
        action: 'Open chart of accounts',
        to: accountingLeafPath(paths.accountingAdmin.chartOfAccounts),
    }),
    peko_packages_without_pricing: ({ count, items }) => ({
        body: `${count} ${plural(count, 'plan or Peko package has', 'plans or Peko packages have')} no price set${
            items.length ? ` (${describeItems(labelsOf(items), count)})` : ''
        }.`,
        action: 'Open Peko Subscriptions',
        to: PEKO_SUBSCRIPTIONS_PATH,
    }),
    approvals_drifted: ({ count, items }) => ({
        body: `${count} approved ${plural(count, 'service has', 'services have')} changed since approval${
            items.length ? ` (${describeItems(labelsOf(items), count)})` : ''
        }.`,
        action: 'Open approvals',
        to: approvalsPath(undefined, 'approved'),
    }),
    vendor_balance_low: ({ count, meta }) => {
        const negative = Number(meta?.negative) || 0;
        const threshold =
            typeof meta?.threshold === 'number' ? ` of ${formatInr(meta.threshold)}` : '';
        return {
            body: `${count} ${plural(count, 'vendor advance is', 'vendor advances are')} below the low-balance threshold${threshold}${
                negative ? `, ${negative} already exhausted` : ''
            }.`,
            action: 'Open vendors',
            to: LEDGER_LIST_PATH.vendors,
        };
    },
    partner_payable_overdue: ({ count, meta }) => ({
        body: `${count} ${plural(count, 'partner is', 'partners are')} owed money with no payout recorded in the last ${Number(meta?.days) || 30} days.`,
        action: 'Open partners',
        to: LEDGER_LIST_PATH.partners,
    }),
    gateway_settlements_short: ({ count, meta }) => ({
        body: `${count} gateway ${plural(count, 'receipt is', 'receipts are')} short of the expected amount${
            typeof meta?.shortfall === 'number' ? ` by ${formatInr(meta.shortfall)}` : ''
        } with no fee recorded to explain it.`,
        action: 'Open payment gateways',
        to: LEDGER_LIST_PATH.payment_gateways,
    }),
    opening_balances_missing: ({ count, meta }) => {
        const parts = [
            [meta?.vendors, 'vendors'],
            [meta?.partners, 'partners'],
            [meta?.gateways, 'payment gateways'],
        ]
            .filter(([total]) => Number(total) > 0)
            .map(([total, name]) => `${name} ${total}`);
        return {
            body: `${count} ${plural(count, 'profile', 'profiles')} had orders before go-live but ${plural(count, 'has', 'have')} no opening balance${
                parts.length ? ` (${joinNames(parts)})` : ''
            }.`,
            action: 'Open manual operations',
            to: manualOperationsPath(),
        };
    },
    failed_journals_today: ({ count }) => ({
        body: `${count} journal ${plural(count, 'entry', 'entries')} failed to record today.`,
        action: 'Open order journals',
        to: accountingLeafPath(paths.accountingAdmin.orderJournals),
    }),
    journals_not_recorded: ({ count }) => ({
        body: `${count} successful ${plural(count, 'order has', 'orders have')} no journal recorded today.`,
        action: 'Open order journals',
        to: accountingLeafPath(paths.accountingAdmin.orderJournals),
    }),
    services_without_commission: ({ count, items }) => ({
        body: `${describeItems(labelsOf(items), count) || `${count} ${plural(count, 'service', 'services')}`} ${plural(count, 'has', 'have')} no commission configured.`,
        action: 'Configure services',
        to: accountingLeafPath(paths.accountingAdmin.serviceWithoutPlans),
    }),
    platform_fee_missing_without_plans: platformFeeCopy('without_plans'),
    platform_fee_missing_with_plans: platformFeeCopy('with_plans'),
    partners_without_share: ({ count, items }) => ({
        body: `${describeItems(labelsOf(items), count) || `${count} ${plural(count, 'partner', 'partners')}`} ${plural(count, 'has', 'have')} no partner share configured.`,
        action: 'Open partners',
        to: accountingLeafPath(paths.accountingAdmin.whitelabelPartners),
    }),
    chart_of_accounts_issues: ({ count, items, meta }) => {
        const parts: string[] = [];
        if (meta?.missing) {
            parts.push(
                `${meta.missing} required ${plural(meta.missing, 'account is', 'accounts are')} missing`
            );
        }
        if (meta?.unsynced) {
            parts.push(
                `${meta.unsynced} ${plural(meta.unsynced, 'account is', 'accounts are')} not synced`
            );
        }
        if (meta?.misclassified) {
            parts.push(
                `${meta.misclassified} ${plural(meta.misclassified, 'account is', 'accounts are')} on the wrong side of the balance sheet`
            );
        }
        const summary = parts.length
            ? parts.join(' and ')
            : `${count} ${plural(count, 'issue needs', 'issues need')} attention`;
        const sample = items.length ? ` (${describeItems(labelsOf(items), count)})` : '';
        return {
            body: `Chart of accounts: ${summary}${sample}.`,
            action: 'Open chart of accounts',
            to: accountingLeafPath(paths.accountingAdmin.chartOfAccounts),
        };
    },
    plans_missing_commission: ({ count, meta }) => {
        const catalogues = Object.entries(meta?.catalogues ?? {})
            .filter(([, total]) => total > 0)
            .map(([key]) => CATALOGUE_LABELS[key] ?? key);
        const scope = catalogues.length ? ` across ${joinNames(catalogues)}` : '';
        return {
            body: `${count} ${plural(count, 'plan is', 'plans are')} missing commission${scope}.`,
            action: 'Open plans',
            to: accountingLeafPath(paths.accountingAdmin.serviceWithPlans),
        };
    },
    services_awaiting_approval: ({ count, items }) => ({
        body: `${count} ${plural(count, 'service is', 'services are')} waiting for accounting approval${
            items.length ? ` (${describeItems(labelsOf(items), count)})` : ''
        }.`,
        action: 'Open approvals',
        to: approvalsPath(),
    }),
    approval_gate_off: () => ({
        body: 'Dev mode: the approval gate is off, so unapproved services are visible to corporates.',
        action: 'Open approvals',
        to: approvalsPath(),
    }),
    ledger_entries_not_in_books: ({ count, meta }) => {
        const ledgers = [
            [meta?.vendors, 'vendors'],
            [meta?.partners, 'partners'],
            [meta?.gateways, 'payment gateways'],
        ]
            .filter(([total]) => Number(total) > 0)
            .map(([total, name]) => `${name} ${total}`);
        const scope = ledgers.length ? ` (${joinNames(ledgers)})` : '';
        const deleted = meta?.deleted
            ? `, ${meta.deleted} of them deleted and waiting to be removed from the books`
            : '';
        return {
            body: `${count} ${plural(count, 'entry', 'entries')} recorded by hand ${plural(count, 'is', 'are')} not marked as in the books yet${scope}${deleted}.`,
            action: 'Open manual operations',
            to: manualOperationsPath(),
        };
    },
};

const itemsOf = (alert: DashboardAlert): DashboardAlertItem[] =>
    (alert.items ?? [])
        .map(item => (typeof item === 'string' ? { label: item } : item))
        .filter(item => item && typeof item.label === 'string' && item.label.length > 0);

const gateIssues = (alert: DashboardAlert): AccountingAlertIssue[] => {
    const by = alert.meta?.setByName ? ` by ${alert.meta.setByName}` : '';
    const at = alert.meta?.setAt
        ? ` on ${dayjs(alert.meta.setAt).format('DD MMM YYYY, HH:mm')}`
        : '';
    return [ISSUE_OF.approval_gate_off({ label: `Gate switched off${by}${at}` })];
};

const issuesOf = (alert: DashboardAlert): AccountingAlertIssue[] => {
    if (alert.type === 'approval_gate_off') return gateIssues(alert);
    if (alert.type === 'go_live_not_set') {
        return [
            ISSUE_OF.go_live_not_set({
                label: 'No go-live date is set, so nothing is counted yet',
            }),
        ];
    }
    const seen = new Set<string>();
    return itemsOf(alert)
        .map(item => ISSUE_OF[alert.type](item))
        .filter(issue => {
            if (seen.has(issue.key)) return false;
            seen.add(issue.key);
            return true;
        });
};

export const buildAlerts = (alerts?: DashboardAlert[]): AccountingAlert[] =>
    (alerts ?? [])
        .filter(alert => alert.count > 0 && Boolean(ALERT_COPY[alert.type]))
        .map(alert => {
            const items = itemsOf(alert);
            const issues = issuesOf({ ...alert, items });
            return {
                key: alert.type,
                tone: alert.severity,
                title: ALERT_TITLES_BY_TYPE[alert.type],
                ...ALERT_COPY[alert.type]({ ...alert, items }),
                issues,
                hidden:
                    alert.type === 'approval_gate_off' || alert.type === 'go_live_not_set'
                        ? 0
                        : Math.max(alert.count - items.length, 0),
            };
        });
