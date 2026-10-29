import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { DashboardAlert, DashboardAlertItem } from '../types/dashboard';
import {
    ALERT_TITLES,
    INTERNAL_KPI_CARD_TITLES,
    KPI_CARD_TITLES,
    KPI_SECTIONS,
    buildAlerts,
    buildSections,
    journalHealthOf,
} from '../utils/dashboardData';

const alert = (overrides: Partial<DashboardAlert>): DashboardAlert => ({
    type: 'failed_journals_today',
    severity: 'error',
    count: 1,
    items: [],
    ...overrides,
});

type Section = ReturnType<typeof buildSections>[number];

const allKpis = (section: Section) => [
    section.journal.total,
    ...section.journal.kinds,
    ...section.journal.statuses,
    ...section.kpis,
];

const kpiOf = (section: Section, title: string) =>
    allKpis(section).find(kpi => kpi.title === title);

const valueOf = (section: Section, title: string) => kpiOf(section, title)?.value;

describe('buildSections', () => {
    it('builds only the today and monthly sections with every card in order', () => {
        const sections = buildSections({ today: {}, monthly: {} });

        expect(sections.map(section => section.key)).toEqual(['today', 'monthly']);
        expect(sections.map(section => section.title)).toEqual(KPI_SECTIONS.map(s => s.title));
        sections.forEach(section => {
            expect(allKpis(section).map(kpi => kpi.title)).toEqual(KPI_CARD_TITLES);
        });
    });

    it('lists the internal purchase accounts on their own line, without a platform fee card, linking to the same pages scoped to those accounts', () => {
        const [today] = buildSections({
            today: {
                gmv: 31246.09,
                platformFee: 640,
                range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                internal: { transactionsCount: 3, gmv: 1200, commission: 90, otherSales: 50 },
            },
        });

        expect(today.internalKpis.map(kpi => kpi.title)).toEqual(INTERNAL_KPI_CARD_TITLES);
        expect(INTERNAL_KPI_CARD_TITLES).not.toContain('Platform Fee (excl. GST)');
        expect(INTERNAL_KPI_CARD_TITLES).toHaveLength(10);
        const byTitle = (title: string) => today.internalKpis.find(kpi => kpi.title === title)!;
        expect(byTitle('Total GMV').value).toBe('₹ 1,200.00');
        expect(byTitle('Transactions Count').value).toBe('3');
        expect(byTitle('Total Discount').value).toBe('₹ 0.00');
        expect(byTitle('Total GMV').to).toBe(
            '/system-user/accounting/transactions?from=2026-09-16&to=2026-09-16&status=SUCCESS&accounts=internal'
        );
        expect(byTitle('Commission (excl. GST)').to).toBe(
            '/system-user/accounting/commission-details?from=2026-09-16&to=2026-09-16&accounts=internal'
        );
        expect(byTitle('Other Sales').to).toBe(
            '/system-user/accounting/other-sales?from=2026-09-16&to=2026-09-16&accounts=internal'
        );
        expect(today.internalKpis.map(kpi => kpi.key)).toContain('today-internal-gmv');
        expect(valueOf(today, 'Total GMV')).toBe('₹ 31,246.09');
    });

    it('folds the nine journal figures into one summary and keeps the rest as cards', () => {
        const [today] = buildSections({
            today: {
                journalEntries: 53,
                transactionEntries: 49,
                refundEntries: 3,
                cashbackEntries: 1,
                failedEntries: 2,
                skippedEntries: 1,
                notRecordedEntries: 4,
            },
        });

        expect(today.journal.total.title).toBe('Journal Entries');
        expect(today.journal.total.value).toBe('53');
        expect(today.journal.kinds.map(kpi => [kpi.title, kpi.shortTitle, kpi.value])).toEqual([
            ['Transaction Entries', 'Sales', '49'],
            ['Refund Entries', 'Refunds', '3'],
            ['Cashback Entries', 'Cashback', '1'],
            ['Cashback Reversal Entries', 'Reversals', '0'],
            ['Admin Triggered Refund Entries', 'Admin refunds', '0'],
        ]);
        expect(
            today.journal.statuses.map(kpi => [kpi.title, kpi.value, kpi.tone, kpi.action])
        ).toEqual([
            ['Failed Entries', '2', 'danger', 'Retry'],
            ['Skipped Entries', '1', 'warning', 'Review'],
            ['Not Recorded Entries', '4', 'warning', 'Record'],
        ]);
        expect(today.journal.attention.map(kpi => kpi.title)).toEqual([
            'Failed Entries',
            'Skipped Entries',
            'Not Recorded Entries',
        ]);
        expect(today.journal.counts).toEqual({
            recorded: 53,
            failed: 2,
            skipped: 1,
            notRecorded: 4,
        });
        expect(today.journal.attempted).toBe(60);
        expect(today.journal.health).toEqual({
            percent: 88,
            tone: 'error',
            label: 'Entries refused',
        });
        expect(today.kpis.map(kpi => kpi.title)).toEqual([
            'Transactions Count',
            'Total GMV',
            'Total Discount',
            'Net GMV',
            'Commission (excl. GST)',
            'Platform Fee (excl. GST)',
            'Total Subscriptions',
            'Subscriptions (Monthly)',
            'Subscriptions (Annual)',
            'Other Sales',
            'Third-Party Sales',
        ]);
    });

    it('labels commission and platform fee as GST exclusive and keeps GMV', () => {
        expect(KPI_CARD_TITLES).toEqual([
            'Journal Entries',
            'Transaction Entries',
            'Refund Entries',
            'Cashback Entries',
            'Cashback Reversal Entries',
            'Admin Triggered Refund Entries',
            'Failed Entries',
            'Skipped Entries',
            'Not Recorded Entries',
            'Transactions Count',
            'Total GMV',
            'Total Discount',
            'Net GMV',
            'Commission (excl. GST)',
            'Platform Fee (excl. GST)',
            'Total Subscriptions',
            'Subscriptions (Monthly)',
            'Subscriptions (Annual)',
            'Other Sales',
            'Third-Party Sales',
        ]);
    });

    it('lists only the attention states that have entries, and grades the day', () => {
        const build = (today: Record<string, number>) => buildSections({ today })[0].journal;

        const skippedOnly = build({ journalEntries: 53, skippedEntries: 1 });
        expect(skippedOnly.attention.map(kpi => kpi.title)).toEqual(['Skipped Entries']);
        expect(skippedOnly.health).toEqual({
            percent: 98,
            tone: 'warning',
            label: 'Needs attention',
        });

        const clean = build({ journalEntries: 12 });
        expect(clean.attention).toEqual([]);
        expect(clean.health).toEqual({ percent: 100, tone: 'success', label: 'All in the books' });

        const empty = build({});
        expect(empty.attention).toEqual([]);
        expect(empty.health).toEqual({ percent: null, tone: 'neutral', label: 'No entries yet' });
    });

    it('never rounds a day with a held-back entry up to 100%', () => {
        expect(
            journalHealthOf({ recorded: 999, failed: 0, skipped: 1, notRecorded: 0 }).percent
        ).toBe(99);
        expect(journalHealthOf({ recorded: 0, failed: 3, skipped: 0, notRecorded: 0 })).toEqual({
            percent: 0,
            tone: 'error',
            label: 'Entries refused',
        });
    });

    it('formats counts without decimals and amounts in rupees', () => {
        const [today] = buildSections({
            today: { transactionsCount: 61230, gmv: 90210.5, commission: 1820.4 },
        });

        expect(valueOf(today, 'Transactions Count')).toBe('61,230');
        expect(valueOf(today, 'Total GMV')).toBe('₹ 90,210.50');
        expect(valueOf(today, 'Commission (excl. GST)')).toBe('₹ 1,820.40');
    });

    it('falls back to zero for missing metrics or sections', () => {
        const [today, monthly] = buildSections({ today: {} });

        expect(valueOf(today, 'Total GMV')).toBe('₹ 0.00');
        expect(valueOf(today, 'Journal Entries')).toBe('0');
        expect(valueOf(monthly, 'Total Subscriptions')).toBe('₹ 0.00');
        expect(buildSections(undefined)[0].kpis[0].value).toBe('0');
    });

    it('keeps the danger and warning tones on failed and skipped entries', () => {
        const [today] = buildSections();

        expect(kpiOf(today, 'Failed Entries')?.tone).toBe('danger');
        expect(kpiOf(today, 'Skipped Entries')?.tone).toBe('warning');
        expect(kpiOf(today, 'Total GMV')?.tone).toBeUndefined();
    });

    it('sends Not Recorded Entries to Order Journals filtered to orders whose journal never ran', () => {
        const [today] = buildSections({
            today: { range: { from: '2026-10-02 00:00:00', to: '2026-10-02 23:59:59' } },
        });

        expect(kpiOf(today, 'Not Recorded Entries')?.to).toBe(
            '/system-user/accounting/order-journals?from=2026-10-02&to=2026-10-02&journalKey=any&status=notRecorded'
        );
        expect(kpiOf(today, 'Failed Entries')?.to).toBe(
            '/system-user/accounting/order-journals?from=2026-10-02&to=2026-10-02&journalKey=any&status=failed'
        );
    });

    it('sends Third-Party Sales to the Payment Links tab for the same dates, in rupees', () => {
        const [today] = buildSections({
            today: {
                thirdPartySales: 2998,
                range: { from: '2026-10-02 00:00:00', to: '2026-10-02 23:59:59' },
            },
        });

        expect(valueOf(today, 'Third-Party Sales')).toBe('₹ 2,998.00');
        expect(today.kpis.find(kpi => kpi.title === 'Third-Party Sales')?.to).toBe(
            '/system-user/accounting/third-party-sales/payment-links?from=2026-10-02&to=2026-10-02'
        );
        expect(
            buildSections({ today: {} })[0].kpis.find(kpi => kpi.title === 'Third-Party Sales')?.to
        ).toBeUndefined();
    });
});

const named = (...labels: string[]): DashboardAlertItem[] => labels.map(label => ({ label }));

describe('buildAlerts', () => {
    it('drops empty alerts and keeps the api order', () => {
        const alerts = buildAlerts([
            alert({ count: 0 }),
            alert({
                type: 'partners_without_share',
                severity: 'warning',
                count: 1,
                items: named('Gulf Reach'),
            }),
            alert({ count: 3 }),
        ]);

        expect(alerts.map(item => item.key)).toEqual([
            'partners_without_share',
            'failed_journals_today',
        ]);
        expect(buildAlerts(undefined)).toEqual([]);
    });

    it('gives every alert a title that has an FYI, and the whole list of titles', () => {
        expect(ALERT_TITLES).toEqual([
            'Go-live date not set',
            'Journal recording off',
            'Failed journal entries',
            'Failures share one reason',
            'Journals not recorded',
            'Entries held back today',
            'Refunds waiting for the sale',
            'Services without commission',
            'Platform fee not set (without plans)',
            'Partners without share',
            'Partners without gateway charge',
            'Vendors without GST details',
            'Chart of accounts issues',
            'Chart of accounts stuck pending',
            'Plans missing commission',
            'Platform fee not set (with plans)',
            'Peko packages without pricing',
            'Approval gate off',
            'Services awaiting approval',
            'Approved services drifted',
            'Vendor advance running low',
            'Partner payable overdue',
            'Gateway settlements short',
            'Opening balances missing',
            'Entries not in books',
        ]);
        expect(buildAlerts([alert({ count: 1 })])[0].title).toBe('Failed journal entries');
    });

    it('describes failed journals with the right plural and link, and lists each order with a retry link', () => {
        expect(buildAlerts([alert({ count: 1 })])[0]).toEqual({
            key: 'failed_journals_today',
            tone: 'error',
            title: 'Failed journal entries',
            body: '1 journal entry failed to record today.',
            action: 'Open order journals',
            to: '/system-user/accounting/order-journals',
            issues: [],
            hidden: 1,
        });
        expect(buildAlerts([alert({ count: 2 })])[0].body).toBe(
            '2 journal entries failed to record today.'
        );

        const [failed] = buildAlerts([
            alert({
                count: 3,
                items: [
                    {
                        label: 'PK-1',
                        corporateTxnId: 'PK-1',
                        journalKey: 'refund',
                        journalLabel: 'Refund',
                        service: 'Visa',
                        amount: 1200,
                        orderDate: '2026-09-16',
                        reason: 'No COA accounts found',
                    },
                    {
                        label: 'PK-2',
                        corporateTxnId: 'PK-2',
                        journalKey: 'transaction',
                        journalLabel: 'Transaction',
                        service: null,
                        amount: 50,
                        orderDate: null,
                        reason: null,
                    },
                ],
            }),
        ]);
        expect(failed.hidden).toBe(1);
        expect(failed.issues).toEqual([
            {
                key: 'PK-1:refund',
                label: 'PK-1',
                detail: 'Refund · Visa · ₹ 1,200.00 · No COA accounts found',
                action: 'Retry entry',
                to: '/system-user/accounting/order-journals?from=2026-09-16&to=2026-09-16&journalKey=refund&status=failed&search=PK-1&open=PK-1',
            },
            {
                key: 'PK-2:transaction',
                label: 'PK-2',
                detail: 'Transaction · ₹ 50.00',
                action: 'Retry entry',
                to: '/system-user/accounting/order-journals?journalKey=transaction&status=failed&search=PK-2&open=PK-2',
            },
        ]);
    });

    it('describes orders whose journal never ran, and sends each one to the manual journal', () => {
        const notRecorded = (count: number, items: DashboardAlertItem[] = []) =>
            buildAlerts([
                alert({ type: 'journals_not_recorded', severity: 'warning', count, items }),
            ])[0];

        expect(notRecorded(1)).toMatchObject({
            key: 'journals_not_recorded',
            tone: 'warning',
            title: 'Journals not recorded',
            body: '1 successful order has no journal recorded today.',
            action: 'Open order journals',
            to: '/system-user/accounting/order-journals',
            issues: [],
        });
        expect(notRecorded(3).body).toBe('3 successful orders have no journal recorded today.');
        expect(
            notRecorded(1, [
                { label: 'PK-9', corporateTxnId: 'PK-9', service: 'Flights', amount: 999 },
            ]).issues
        ).toEqual([
            {
                key: 'PK-9',
                label: 'PK-9',
                detail: 'Flights · ₹ 999.00',
                action: 'Record journal',
                to: '/system-user/accounting/manual-operations/journal/PK-9?event=transaction',
            },
        ]);
    });

    it('names services without commission, summarises the rest and links each to its commission tab', () => {
        const build = (count: number, items: DashboardAlertItem[]) =>
            buildAlerts([
                alert({ type: 'services_without_commission', severity: 'warning', count, items }),
            ])[0];

        const single = build(1, [{ label: 'Visa', accessKey: 'visa' }]);
        expect(single.body).toBe('Visa has no commission configured.');
        expect(single.action).toBe('Configure services');
        expect(single.to).toBe('/system-user/accounting/service-without-plans');
        expect(single.tone).toBe('warning');
        expect(single.issues).toEqual([
            {
                key: 'visa',
                label: 'Visa',
                action: 'Set commission',
                to: '/system-user/accounting/service-without-plans/visa/commission',
            },
        ]);
        expect(build(2, named('Document Attestation', 'Office Address')).body).toBe(
            'Document Attestation and Office Address have no commission configured.'
        );
        expect(build(6, named('A', 'B', 'C', 'D', 'E')).body).toBe(
            'A, B, C and 3 more have no commission configured.'
        );
        expect(build(6, named('A', 'B', 'C', 'D', 'E')).hidden).toBe(1);
        expect(build(4, []).body).toBe('4 services have no commission configured.');
        expect(build(1, named('Ghost')).issues[0].to).toBe(
            '/system-user/accounting/service-without-plans'
        );
    });

    it('lists package links without a platform fee for each classification and opens the Platform Fee tab on that partner', () => {
        const build = (
            type: DashboardAlert['type'],
            count: number,
            services: number,
            items: DashboardAlertItem[]
        ) =>
            buildAlerts([
                alert({ type, severity: 'warning', count, meta: { services }, items }),
            ])[0];

        const withoutPlans = build('platform_fee_missing_without_plans', 2, 1, [
            {
                label: 'Visa · Starter',
                planType: 'without_plans',
                accessKey: 'visa',
                service: 'Visa',
                packageName: 'Starter',
                partnerId: null,
                partnerName: null,
            },
            {
                label: 'Visa · Pro',
                planType: 'without_plans',
                accessKey: 'visa',
                service: 'Visa',
                packageName: 'Pro',
                partnerId: '100002226',
                partnerName: 'Gulf Reach',
            },
        ]);
        expect(withoutPlans).toMatchObject({
            key: 'platform_fee_missing_without_plans',
            tone: 'warning',
            title: 'Platform fee not set (without plans)',
            body: '2 linked packages across 1 service without plans have no platform fee configured.',
            action: 'Open services',
            to: '/system-user/accounting/service-without-plans',
            hidden: 0,
        });
        expect(withoutPlans.issues).toEqual([
            {
                key: 'visa::Starter',
                label: 'Visa · Starter',
                detail: 'Peko (Default)',
                action: 'Set platform fee',
                to: '/system-user/accounting/service-without-plans/visa/platform-fee?search=Starter',
            },
            {
                key: 'visa:100002226:Pro',
                label: 'Visa · Pro',
                detail: 'Gulf Reach',
                action: 'Set platform fee',
                to: '/system-user/accounting/service-without-plans/visa/platform-fee?partner=100002226&search=Pro',
            },
        ]);

        const withPlans = build('platform_fee_missing_with_plans', 1, 1, [
            {
                label: 'Tunz eSIM · Package',
                planType: 'with_plans',
                accessKey: 'esim_tunz',
                service: 'Tunz eSIM',
                packageName: null,
                partnerId: '77',
                partnerName: null,
            },
        ]);
        expect(withPlans.body).toBe(
            '1 linked package across 1 service with plans has no platform fee configured.'
        );
        expect(withPlans.to).toBe('/system-user/accounting/service-with-plans');
        expect(withPlans.issues).toEqual([
            {
                key: 'esim_tunz:77:',
                label: 'Tunz eSIM · Package',
                detail: 'Partner 77',
                action: 'Set platform fee',
                to: '/system-user/accounting/service-with-plans/esim_tunz/platform-fee?partner=77',
            },
        ]);
        expect(build('platform_fee_missing_with_plans', 3, 0, []).body).toBe(
            '3 linked packages of services with plans have no platform fee configured.'
        );
        expect(
            build('platform_fee_missing_with_plans', 1, 1, named('Ghost · Pack')).issues[0].to
        ).toBe('/system-user/accounting/service-with-plans');
    });

    it('names partners without a share and opens each partner’s configuration', () => {
        const [partners] = buildAlerts([
            alert({
                type: 'partners_without_share',
                severity: 'warning',
                count: 1,
                items: [{ label: 'Gulf Reach', partnerId: '100002226' }],
            }),
        ]);

        expect(partners).toEqual({
            key: 'partners_without_share',
            tone: 'warning',
            title: 'Partners without share',
            body: 'Gulf Reach has no partner share configured.',
            action: 'Open partners',
            to: '/system-user/accounting/whitelabel-partners',
            issues: [
                {
                    key: '100002226',
                    label: 'Gulf Reach',
                    detail: 'Partner ID 100002226',
                    action: 'Set share',
                    to: '/system-user/accounting/whitelabel-partners?search=100002226&configure=100002226',
                },
            ],
            hidden: 0,
        });
    });

    it('summarises chart of accounts issues from the meta counts and links each account to its fix', () => {
        const [detailed] = buildAlerts([
            alert({
                type: 'chart_of_accounts_issues',
                severity: 'warning',
                count: 3,
                items: [
                    {
                        label: 'Cashback Expense',
                        issue: 'missing',
                        accountName: 'Cashback Expense',
                    },
                    {
                        label: 'Sales',
                        issue: 'unsynced',
                        accountName: 'Sales',
                        syncStatus: 'CREATE_FAILED',
                    },
                    {
                        label: 'Commission',
                        issue: 'unsynced',
                        accountName: 'Commission',
                        syncStatus: null,
                    },
                ],
                meta: { missing: 1, unsynced: 2 },
            }),
        ]);
        expect(detailed.body).toBe(
            'Chart of accounts: 1 required account is missing and 2 accounts are not synced (Cashback Expense, Sales and Commission).'
        );
        expect(detailed.action).toBe('Open chart of accounts');
        expect(detailed.to).toBe('/system-user/accounting/chart-of-accounts');
        expect(detailed.issues).toEqual([
            {
                key: 'missing:Cashback Expense',
                label: 'Cashback Expense',
                detail: 'Required account is missing',
                action: 'Add account',
                to: '/system-user/accounting/chart-of-accounts?add=Cashback+Expense',
            },
            {
                key: 'unsynced:Sales',
                label: 'Sales',
                detail: 'Create failed',
                action: 'Open account',
                to: '/system-user/accounting/chart-of-accounts?search=Sales',
            },
            {
                key: 'unsynced:Commission',
                label: 'Commission',
                detail: 'Not synced with the books',
                action: 'Open account',
                to: '/system-user/accounting/chart-of-accounts?search=Commission',
            },
        ]);

        const [bare] = buildAlerts([
            alert({ type: 'chart_of_accounts_issues', severity: 'warning', count: 2, items: [] }),
        ]);
        expect(bare.body).toBe('Chart of accounts: 2 issues need attention.');
        expect(bare.issues).toEqual([]);
        expect(bare.hidden).toBe(2);
    });

    it('calls out an account booked on the wrong side of the balance sheet', () => {
        const [wrongSide] = buildAlerts([
            alert({
                type: 'chart_of_accounts_issues',
                severity: 'error',
                count: 1,
                items: [
                    {
                        label: 'Vendor Deposits (other_current_liability)',
                        issue: 'misclassified',
                        accountName: 'Vendor Deposits',
                        accountType: 'other_current_liability',
                    },
                ],
                meta: { missing: 0, unsynced: 0, misclassified: 1 },
            }),
        ]);

        expect(wrongSide.body).toBe(
            'Chart of accounts: 1 account is on the wrong side of the balance sheet (Vendor Deposits (other_current_liability)).'
        );
        expect(wrongSide.tone).toBe('error');
        expect(wrongSide.issues).toEqual([
            {
                key: 'misclassified:Vendor Deposits',
                label: 'Vendor Deposits',
                detail: 'Booked as other_current_liability, on the wrong side of the balance sheet',
                action: 'Fix account type',
                to: '/system-user/accounting/chart-of-accounts?search=Vendor+Deposits',
            },
        ]);
    });

    it('counts services waiting for accounting approval and sends each to its partner on Approvals', () => {
        const build = (count: number, items: DashboardAlertItem[]) =>
            buildAlerts([
                alert({ type: 'services_awaiting_approval', severity: 'warning', count, items }),
            ])[0];

        expect(
            build(1, [
                {
                    label: 'Gulf Reach · eSIM',
                    partnerPermissionId: 12,
                    partnerName: 'Gulf Reach',
                    accessKey: 'esim_tunz',
                    serviceLabel: 'eSIM',
                    status: 'REJECTED',
                },
            ])
        ).toEqual({
            key: 'services_awaiting_approval',
            tone: 'warning',
            title: 'Services awaiting approval',
            body: '1 service is waiting for accounting approval (Gulf Reach · eSIM).',
            action: 'Open approvals',
            to: '/system-user/accounting/approvals',
            issues: [
                {
                    key: '12:esim_tunz',
                    label: 'eSIM',
                    detail: 'Gulf Reach · Rejected',
                    action: 'Review',
                    to: '/system-user/accounting/approvals?partner=12&status=rejected&search=eSIM',
                },
            ],
            hidden: 0,
        });
        expect(
            build(1, [
                {
                    label: 'Default · Visa',
                    partnerPermissionId: 1,
                    partnerName: null,
                    accessKey: 'visa',
                    serviceLabel: 'Visa',
                    status: 'PENDING',
                },
            ]).issues[0]
        ).toMatchObject({
            detail: 'Peko (Default) · Pending',
            to: '/system-user/accounting/approvals?partner=1&search=Visa',
        });
        expect(build(7, named('A', 'B', 'C', 'D', 'E')).body).toBe(
            '7 services are waiting for accounting approval (A, B, C and 4 more).'
        );
        expect(build(2, []).body).toBe('2 services are waiting for accounting approval.');
    });

    it('flags dev mode as an error that links to Approvals, naming who switched the gate off', () => {
        expect(
            buildAlerts([
                alert({
                    type: 'approval_gate_off',
                    severity: 'error',
                    count: 1,
                    meta: { setByName: 'Ibrahim', setAt: '2026-09-26T05:00:00.000Z' },
                }),
            ])[0]
        ).toEqual({
            key: 'approval_gate_off',
            tone: 'error',
            title: 'Approval gate off',
            body: 'Dev mode: the approval gate is off, so unapproved services are visible to corporates.',
            action: 'Open approvals',
            to: '/system-user/accounting/approvals',
            issues: [
                {
                    key: `Gate switched off by Ibrahim on ${dayjs('2026-09-26T05:00:00.000Z').format('DD MMM YYYY, HH:mm')}`,
                    label: `Gate switched off by Ibrahim on ${dayjs('2026-09-26T05:00:00.000Z').format('DD MMM YYYY, HH:mm')}`,
                    action: 'Turn the gate on',
                    to: '/system-user/accounting/approvals',
                },
            ],
            hidden: 0,
        });
    });

    it('counts the entries recorded by hand that are not in the books yet, and opens each profile’s tab', () => {
        const build = (
            count: number,
            meta?: DashboardAlert['meta'],
            items: DashboardAlertItem[] = []
        ) =>
            buildAlerts([
                alert({
                    type: 'ledger_entries_not_in_books',
                    severity: 'warning',
                    count,
                    meta,
                    items,
                }),
            ])[0];

        expect(build(5, { vendors: 3, partners: 0, gateways: 2, deleted: 1 })).toMatchObject({
            key: 'ledger_entries_not_in_books',
            tone: 'warning',
            title: 'Entries not in books',
            body: '5 entries recorded by hand are not marked as in the books yet (vendors 3 and payment gateways 2), 1 of them deleted and waiting to be removed from the books.',
            action: 'Open manual operations',
            to: '/system-user/accounting/manual-operations',
            issues: [],
            hidden: 5,
        });
        expect(build(1, { partners: 1 }).body).toBe(
            '1 entry recorded by hand is not marked as in the books yet (partners 1).'
        );

        const entries: DashboardAlertItem[] = [
            {
                label: 'Deposit · Paytm',
                ledger: 'vendors',
                entryKind: 'deposit',
                profileId: 3,
                profileName: 'Paytm',
                amount: 1000,
                date: '2026-10-01',
                deleted: false,
            },
            {
                label: 'Credit note · Paytm',
                ledger: 'vendors',
                entryKind: 'credit_note',
                profileId: 3,
                amount: 10,
                date: '2026-10-02',
                deleted: true,
            },
            {
                label: 'Commission · Paytm',
                ledger: 'vendors',
                entryKind: 'commission',
                profileId: 3,
                amount: 5,
                date: null,
                deleted: false,
            },
            {
                label: 'Opening balance · Gulf Reach',
                ledger: 'partners',
                entryKind: 'opening',
                profileId: 100002226,
                amount: 250,
                date: '2026-09-30',
                deleted: false,
            },
            {
                label: 'Debit note · Gulf Reach',
                ledger: 'partners',
                entryKind: 'debit_note',
                profileId: 100002226,
                amount: 99,
                date: '2026-10-02',
                deleted: false,
            },
            {
                label: 'Fee · Razorpay',
                ledger: 'gateways',
                entryKind: 'fee',
                profileId: '4521',
                amount: 12,
                date: '2026-10-04',
                deleted: false,
            },
            { label: 'Receipt · Unknown', entryKind: 'receipt', amount: 1 },
        ];
        expect(build(7, { vendors: 3, partners: 2, gateways: 2 }, entries).issues).toEqual([
            {
                key: 'vendors:deposit:3:2026-10-01:1000',
                label: 'Deposit · Paytm',
                detail: '₹ 1,000.00 · 01 Oct 2026',
                action: 'Mark in books',
                to: '/system-user/accounting/vendors/3/deposits',
            },
            {
                key: 'vendors:credit_note:3:2026-10-02:10',
                label: 'Credit note · Paytm',
                detail: '₹ 10.00 · 02 Oct 2026 · Deleted, still in the books',
                action: 'Remove from books',
                to: '/system-user/accounting/vendors/3/credit-notes',
            },
            {
                key: 'vendors:commission:3::5',
                label: 'Commission · Paytm',
                detail: '₹ 5.00',
                action: 'Mark in books',
                to: '/system-user/accounting/vendors/3/commissions',
            },
            {
                key: 'partners:opening:100002226:2026-09-30:250',
                label: 'Opening balance · Gulf Reach',
                detail: '₹ 250.00 · 30 Sep 2026',
                action: 'Mark in books',
                to: '/system-user/accounting/partners/100002226/payments',
            },
            {
                key: 'partners:debit_note:100002226:2026-10-02:99',
                label: 'Debit note · Gulf Reach',
                detail: '₹ 99.00 · 02 Oct 2026',
                action: 'Mark in books',
                to: '/system-user/accounting/partners/100002226/debit-notes',
            },
            {
                key: 'gateways:fee:4521:2026-10-04:12',
                label: 'Fee · Razorpay',
                detail: '₹ 12.00 · 04 Oct 2026',
                action: 'Mark in books',
                to: '/system-user/accounting/payment-gateways/4521/received-and-bills',
            },
            {
                key: ':receipt:::1',
                label: 'Receipt · Unknown',
                detail: '₹ 1.00',
                action: 'Mark in books',
                to: '/system-user/accounting/manual-operations',
            },
        ]);
    });

    it('lists the catalogues that have plans missing commission and opens each plan on its service', () => {
        const build = (
            count: number,
            meta?: DashboardAlert['meta'],
            items: DashboardAlertItem[] = []
        ) =>
            buildAlerts([
                alert({
                    type: 'plans_missing_commission',
                    severity: 'warning',
                    count,
                    meta,
                    items,
                }),
            ])[0];

        const many = build(7, { catalogues: { plans: 4, esimPlans: 3, hikes: 0 } });
        expect(many.body).toBe('7 plans are missing commission across Plans and eSIM plans.');
        expect(many.action).toBe('Open plans');
        expect(many.to).toBe('/system-user/accounting/service-with-plans');
        expect(build(1, { catalogues: { unknown_table: 1 } }).body).toBe(
            '1 plan is missing commission across unknown_table.'
        );
        expect(build(1).body).toBe('1 plan is missing commission.');
        expect(
            build(3, { catalogues: { esimPlans: 2, settings: 1 } }, [
                { label: 'India 5GB', catalogue: 'esimPlans', planId: 2, accessKey: 'esim_tunz' },
                { label: 'Lost plan', catalogue: 'carReportPlans', planId: 9, accessKey: null },
                {
                    label: 'Bot Builder',
                    catalogue: 'settings',
                    planId: 7,
                    accessKey: 'whatsApp_for_busines',
                },
            ]).issues
        ).toEqual([
            {
                key: 'esimPlans:2',
                label: 'India 5GB',
                detail: 'eSIM plans',
                action: 'Set commission',
                to: '/system-user/accounting/service-with-plans/esim_tunz/plans?search=India+5GB',
            },
            {
                key: 'carReportPlans:9',
                label: 'Lost plan',
                detail: 'carReportPlans',
                action: 'Set commission',
                to: '/system-user/accounting/service-with-plans',
            },
            {
                key: 'settings:7',
                label: 'Bot Builder',
                detail: 'Add-ons',
                action: 'Set commission',
                to: '/system-user/accounting/service-with-plans/whatsApp_for_busines/plans?subTab=addOns',
            },
        ]);
    });

    it('sends the go-live and recording alerts to the place the switch lives', () => {
        const [goLive] = buildAlerts([
            alert({ type: 'go_live_not_set', severity: 'error', count: 1 }),
        ]);
        expect(goLive).toEqual({
            key: 'go_live_not_set',
            tone: 'error',
            title: 'Go-live date not set',
            body: 'No accounting go-live date is set, so every figure on this portal reads zero.',
            action: 'Set go-live date',
            to: '/system-user/accounting?setGoLive=1',
            issues: [
                {
                    key: 'go-live',
                    label: 'No go-live date is set, so nothing is counted yet',
                    action: 'Set go-live date',
                    to: '/system-user/accounting?setGoLive=1',
                },
            ],
            hidden: 0,
        });

        const [recording] = buildAlerts([
            alert({
                type: 'journal_recording_off',
                severity: 'error',
                count: 2,
                meta: { paused: true, services: 1 },
                items: [
                    {
                        label: 'Journal recording is paused for every service',
                        kind: 'global',
                        setByName: 'Ibrahim',
                        setAt: '2026-10-19T10:00:00.000Z',
                    },
                    {
                        label: 'Visa',
                        kind: 'service',
                        accessKey: 'visa',
                        planType: 'without_plans',
                    },
                ],
            }),
        ]);
        expect(recording.body).toBe(
            'Journal recording is paused for every service, so no new entry reaches the books; 1 vendor service is set not to post as well.'
        );
        expect(recording.to).toBe('/system-user/accounting/order-journals?status=skipped');
        expect(recording.issues.map(issue => [issue.label, issue.action, issue.to])).toEqual([
            [
                'Journal recording is paused for every service',
                'See held-back entries',
                '/system-user/accounting/order-journals?status=skipped',
            ],
            [
                'Visa',
                'Open service',
                '/system-user/accounting/service-without-plans/visa/commission',
            ],
        ]);
        expect(recording.issues[0].detail).toBe(
            `Paused by Ibrahim · ${dayjs('2026-10-19T10:00:00.000Z').format('DD MMM YYYY, HH:mm')}`
        );
        expect(
            buildAlerts([
                alert({
                    type: 'journal_recording_off',
                    severity: 'warning',
                    count: 2,
                    meta: { paused: false, services: 2 },
                }),
            ])[0].body
        ).toBe('2 vendor services are set not to post, so their orders never reach the books.');
    });

    it('routes each held-back entry to the setting that holds it, and refunds to their sale', () => {
        const held = (note: string, extra: Partial<DashboardAlertItem> = {}) => ({
            label: 'PK-7',
            corporateTxnId: 'PK-7',
            journalKey: 'transaction',
            journalLabel: 'Transaction',
            service: 'Visa',
            accessKey: 'visa',
            planType: 'without_plans' as const,
            amount: 80,
            orderDate: '2026-10-20',
            note,
            ...extra,
        });
        const build = (items: DashboardAlertItem[], notes?: DashboardAlert['meta']) =>
            buildAlerts([
                alert({
                    type: 'journals_held_back_today',
                    severity: 'warning',
                    count: items.length,
                    items,
                    meta: notes,
                }),
            ])[0];

        const commission = build([held('Commission not configured')], {
            notes: [{ note: 'Commission not configured', count: 1 }],
        });
        expect(commission.body).toBe(
            '1 entry was held back from the books today (Commission not configured 1).'
        );
        expect(commission.to).toBe('/system-user/accounting/order-journals?status=skipped');
        expect(commission.issues[0]).toEqual({
            key: 'PK-7:transaction',
            label: 'PK-7',
            detail: 'Transaction · Visa · ₹ 80.00 · Commission not configured',
            action: 'Set commission',
            to: '/system-user/accounting/service-without-plans/visa/commission',
        });
        expect(
            build([
                held('Commission not configured', {
                    planType: 'with_plans',
                    accessKey: 'esim_tunz',
                }),
            ]).issues[0].to
        ).toBe('/system-user/accounting/service-with-plans/esim_tunz/plans');
        expect(build([held('Platform fee not configured')]).issues[0]).toMatchObject({
            action: 'Set platform fee',
            to: '/system-user/accounting/service-without-plans/visa/platform-fee',
        });
        expect(
            build([
                held('Waiting for the sale entry', {
                    journalKey: 'refund',
                    journalLabel: 'Refund',
                }),
            ]).issues[0]
        ).toMatchObject({
            action: 'Post the sale',
            to: '/system-user/accounting/order-journals?from=2026-10-20&to=2026-10-20&journalKey=transaction&search=PK-7&open=PK-7',
        });
        expect(build([held('Recording paused')]).issues[0]).toMatchObject({
            action: 'Open entry',
            to: '/system-user/accounting/order-journals?from=2026-10-20&to=2026-10-20&journalKey=transaction&status=skipped&search=PK-7&open=PK-7',
        });

        const [waiting] = buildAlerts([
            alert({
                type: 'refunds_waiting_for_sale',
                severity: 'warning',
                count: 1,
                items: [
                    held('', { journalKey: 'refund', journalLabel: 'Refund', note: undefined }),
                ],
            }),
        ]);
        expect(waiting.body).toBe(
            '1 refund entry is waiting for the sale entry to reach the books first.'
        );
        expect(waiting.issues[0]).toEqual({
            key: 'PK-7:refund',
            label: 'PK-7',
            detail: 'Refund · Visa · ₹ 80.00',
            action: 'Post the sale',
            to: '/system-user/accounting/order-journals?from=2026-10-20&to=2026-10-20&journalKey=transaction&search=PK-7&open=PK-7',
        });
    });

    it('describes the repeating failure reason with its share of the day', () => {
        const [shared] = buildAlerts([
            alert({
                type: 'failures_share_reason',
                severity: 'error',
                count: 3,
                meta: { total: 4, share: 75 },
                items: [
                    { label: 'Token expired', reason: 'Token expired', count: 3 },
                    { label: 'No reason given', reason: null, count: 1 },
                ],
            }),
        ]);
        expect(shared.body).toBe("3 of today's 4 refused entries share one reason: Token expired.");
        expect(shared.issues).toEqual([
            {
                key: 'Token expired',
                label: 'Token expired',
                detail: '3 entries today',
                action: 'See failed entries',
                to: '/system-user/accounting/order-journals?status=failed',
            },
            {
                key: 'No reason given',
                label: 'No reason given',
                detail: '1 entry today',
                action: 'See failed entries',
                to: '/system-user/accounting/order-journals?status=failed',
            },
        ]);
    });

    it('sends configuration gaps to the screen where each is fixed', () => {
        const [charge] = buildAlerts([
            alert({
                type: 'partners_without_gateway_charge',
                severity: 'warning',
                count: 1,
                items: [{ label: 'Gulf Reach', partnerId: '100002226' }],
            }),
        ]);
        expect(charge.body).toBe(
            'Gulf Reach has no gateway charge terms, so nothing is netted out of its share.'
        );
        expect(charge.issues[0]).toMatchObject({
            action: 'Set charge terms',
            to: '/system-user/accounting/whitelabel-partners?search=100002226&configure=100002226',
        });

        const [gst] = buildAlerts([
            alert({
                type: 'vendors_without_gst',
                severity: 'warning',
                count: 1,
                items: [
                    {
                        label: 'Paytm',
                        vendorId: 7,
                        accessKey: 'visa',
                        planType: 'without_plans',
                        services: ['Visa', 'Flights'],
                        missing: ['state', 'GST number'],
                    },
                ],
            }),
        ]);
        expect(gst.body).toBe(
            'Paytm is missing GST details, so the GST split on commission cannot be decided.'
        );
        expect(gst.issues[0]).toEqual({
            key: '7',
            label: 'Paytm',
            detail: 'Missing state and GST number · Visa, Flights',
            action: 'Edit vendor',
            to: '/system-user/accounting/service-without-plans/visa/vendor',
        });

        const [pending] = buildAlerts([
            alert({
                type: 'chart_of_accounts_pending',
                severity: 'warning',
                count: 1,
                items: [
                    {
                        label: 'Sales',
                        accountName: 'Sales',
                        syncStatus: 'CREATE_PENDING',
                        since: '2026-10-18T10:00:00.000Z',
                    },
                ],
            }),
        ]);
        expect(pending.body).toBe(
            '1 account has been pending sync with the books for over a day (Sales).'
        );
        expect(pending.issues[0]).toEqual({
            key: 'pending:Sales',
            label: 'Sales',
            detail: 'Create pending · since 18 Oct 2026',
            action: 'Open account',
            to: '/system-user/accounting/chart-of-accounts?search=Sales',
        });

        const [pricing] = buildAlerts([
            alert({
                type: 'peko_packages_without_pricing',
                severity: 'warning',
                count: 2,
                items: [
                    {
                        label: 'Starter',
                        packageId: 1,
                        packageName: 'Starter',
                        ownService: false,
                        partnerId: null,
                        partnerName: null,
                    },
                    {
                        label: 'Commerce Pro',
                        packageId: 2,
                        packageName: 'Commerce Pro',
                        ownService: true,
                        partnerId: '100002226',
                        partnerName: 'Gulf Reach',
                    },
                ],
            }),
        ]);
        expect(pricing.body).toBe(
            '2 plans or Peko packages have no price set (Starter and Commerce Pro).'
        );
        expect(pricing.issues.map(issue => [issue.detail, issue.to])).toEqual([
            [
                'Subscription plan · Peko (Default)',
                '/system-user/accounting/peko-subscriptions?tab=plans&search=Starter',
            ],
            [
                'Peko service package · Gulf Reach',
                '/system-user/accounting/peko-subscriptions?tab=plans&search=Commerce+Pro',
            ],
        ]);

        const [drift] = buildAlerts([
            alert({
                type: 'approvals_drifted',
                severity: 'warning',
                count: 1,
                items: [
                    {
                        label: 'Gulf Reach · eSIM',
                        partnerPermissionId: 12,
                        partnerName: 'Gulf Reach',
                        accessKey: 'esim_tunz',
                        serviceLabel: 'eSIM',
                        changes: ['Commission rate'],
                    },
                ],
            }),
        ]);
        expect(drift.body).toBe(
            '1 approved service has changed since approval (Gulf Reach · eSIM).'
        );
        expect(drift.to).toBe('/system-user/accounting/approvals?status=approved');
        expect(drift.issues[0]).toEqual({
            key: '12:esim_tunz',
            label: 'eSIM',
            detail: 'Gulf Reach · Changed: Commission rate',
            action: 'Review',
            to: '/system-user/accounting/approvals?partner=12&status=approved&search=eSIM',
        });
    });

    it('sends money alerts to the ledger profile where the entry is recorded', () => {
        const [low] = buildAlerts([
            alert({
                type: 'vendor_balance_low',
                severity: 'error',
                count: 2,
                meta: { threshold: 25000, negative: 1 },
                items: [
                    {
                        label: 'Cleartrip',
                        vendorId: 8,
                        available: -250.5,
                        threshold: 25000,
                        negative: true,
                    },
                    {
                        label: 'Paytm',
                        vendorId: 7,
                        available: 1000,
                        threshold: 25000,
                        negative: false,
                    },
                ],
            }),
        ]);
        expect(low.body).toBe(
            '2 vendor advances are below the low-balance threshold of ₹ 25,000.00, 1 already exhausted.'
        );
        expect(low.to).toBe('/system-user/accounting/vendors');
        expect(low.issues[0]).toEqual({
            key: '8',
            label: 'Cleartrip',
            detail: 'Advance exhausted · Available ₹ -250.50 · threshold ₹ 25,000.00',
            action: 'Record deposit',
            to: '/system-user/accounting/vendors/8/deposits',
        });

        const [overdue] = buildAlerts([
            alert({
                type: 'partner_payable_overdue',
                severity: 'warning',
                count: 1,
                meta: { days: 30 },
                items: [
                    {
                        label: 'Gulf Reach',
                        partnerId: '200',
                        owed: 1200,
                        lastPayout: '2026-08-15',
                        since: '2026-08-15',
                    },
                ],
            }),
        ]);
        expect(overdue.body).toBe(
            '1 partner is owed money with no payout recorded in the last 30 days.'
        );
        expect(overdue.issues[0]).toEqual({
            key: '200',
            label: 'Gulf Reach',
            detail: 'Owed ₹ 1,200.00 · last payout 15 Aug 2026',
            action: 'Record payout',
            to: '/system-user/accounting/partners/200/payments',
        });

        const [short] = buildAlerts([
            alert({
                type: 'gateway_settlements_short',
                severity: 'warning',
                count: 1,
                meta: { shortfall: 12.5 },
                items: [
                    {
                        label: 'Razorpay · 2026-10-04',
                        settlementId: 9,
                        gatewayAccountId: '4521',
                        gatewayName: 'Razorpay',
                        amount: 87.5,
                        expectedAmount: 100,
                        shortfall: 12.5,
                        date: '2026-10-04',
                        reference: 'UTR1',
                    },
                ],
            }),
        ]);
        expect(short.body).toBe(
            '1 gateway receipt is short of the expected amount by ₹ 12.50 with no fee recorded to explain it.'
        );
        expect(short.issues[0]).toEqual({
            key: '9',
            label: 'Razorpay · 2026-10-04',
            detail: 'Received ₹ 87.50 of ₹ 100.00 · short ₹ 12.50 · UTR1',
            action: 'Record fee',
            to: '/system-user/accounting/payment-gateways/4521/received-and-bills',
        });

        const [openings] = buildAlerts([
            alert({
                type: 'opening_balances_missing',
                severity: 'warning',
                count: 3,
                meta: { vendors: 1, partners: 1, gateways: 1 },
                items: [
                    {
                        label: 'Paytm',
                        ledger: 'vendors',
                        profileId: '7',
                        profileName: 'Paytm',
                        orders: 12,
                    },
                    {
                        label: 'Gulf Reach',
                        ledger: 'partners',
                        profileId: '100002226',
                        profileName: 'Gulf Reach',
                        orders: 1,
                    },
                    {
                        label: 'Razorpay',
                        ledger: 'gateways',
                        profileId: '4521',
                        profileName: 'Razorpay',
                        orders: 40,
                    },
                ],
            }),
        ]);
        expect(openings.body).toBe(
            '3 profiles had orders before go-live but have no opening balance (vendors 1, partners 1 and payment gateways 1).'
        );
        expect(openings.to).toBe('/system-user/accounting/manual-operations');
        expect(openings.issues.map(issue => [issue.detail, issue.action, issue.to])).toEqual([
            [
                'Vendor · 12 orders before go-live',
                'Set opening balance',
                '/system-user/accounting/vendors/7/deposits',
            ],
            [
                'Partner · 1 order before go-live',
                'Set opening balance',
                '/system-user/accounting/partners/100002226/payments',
            ],
            [
                'Payment gateway · 40 orders before go-live',
                'Set opening balance',
                '/system-user/accounting/payment-gateways/4521/received-and-bills',
            ],
        ]);
    });

    it('tolerates the older cached shape where items were plain names', () => {
        const [legacy] = buildAlerts([
            alert({
                type: 'services_without_commission',
                severity: 'warning',
                count: 2,
                items: ['Visa', 'Flights'] as unknown as DashboardAlertItem[],
            }),
        ]);

        expect(legacy.body).toBe('Visa and Flights have no commission configured.');
        expect(legacy.issues.map(issue => [issue.label, issue.to])).toEqual([
            ['Visa', '/system-user/accounting/service-without-plans'],
            ['Flights', '/system-user/accounting/service-without-plans'],
        ]);
    });
});
