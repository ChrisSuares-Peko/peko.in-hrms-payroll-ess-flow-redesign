import '@testing-library/jest-dom/vitest';

import { ReactNode } from 'react';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAccountingGoLiveDate, updateAccountingGoLiveDate } from '../api/accountingPeriod';
import { getAccountingDashboard } from '../api/dashboard';
import AccountingDashboard from '../pages/AccountingDashboard';
import { AccountingDashboardData, DashboardMetrics } from '../types/dashboard';
import { KPI_CARD_TITLES, INTERNAL_KPI_CARD_TITLES } from '../utils/dashboardData';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@src/hooks/store', () => {
    const dispatch = vi.fn();
    return { useAppSelector: vi.fn(), useAppDispatch: () => dispatch };
});

vi.mock('../api/dashboard', () => ({ getAccountingDashboard: vi.fn() }));

vi.mock('../api/accountingPeriod', () => ({
    getAccountingGoLiveDate: vi.fn(),
    updateAccountingGoLiveDate: vi.fn(),
}));

vi.mock('recharts', async importOriginal => ({
    ...(await importOriginal<typeof import('recharts')>()),
    PieChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Pie: () => null,
    Cell: () => null,
    Tooltip: () => null,
}));

const state = { reducer: { auth: { role: 'system_user', id: 7 } } };

const metrics = (overrides: Partial<DashboardMetrics> = {}): DashboardMetrics => ({
    journalEntries: 56,
    transactionEntries: 49,
    refundEntries: 3,
    cashbackEntries: 4,
    cashbackReversalEntries: 0,
    adminRefundEntries: 0,
    failedEntries: 2,
    skippedEntries: 1,
    notRecordedEntries: 0,
    transactionsCount: 49,
    gmv: 31246.09,
    discounts: 1200,
    netGmv: 30046.09,
    commission: 1820.4,
    platformFee: 640,
    subscriptions: 1490,
    subscriptionsMonthly: 990,
    subscriptionsAnnually: 500,
    otherSales: 725.5,
    otherSalesCount: 2,
    thirdPartySales: 1200,
    thirdPartySalesCount: 3,
    ...overrides,
});

const payload: AccountingDashboardData = {
    generatedAt: '2026-09-16T08:35:00.000Z',
    cached: false,
    sections: {
        today: metrics(),
        monthly: metrics({ transactionsCount: 1160, gmv: 90210.5 }),
    },
    alerts: [
        {
            type: 'failed_journals_today',
            severity: 'error',
            count: 2,
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
            ],
        },
        {
            type: 'chart_of_accounts_issues',
            severity: 'warning',
            count: 1,
            items: [
                { label: 'Cashback Expense', issue: 'missing', accountName: 'Cashback Expense' },
            ],
            meta: { missing: 1, unsynced: 0 },
        },
    ],
    rankings: {
        services: [
            { id: 12, name: 'Visa', amount: 41250.75, orders: 312 },
            { id: 3, name: 'Flights', amount: 18740, orders: 205 },
            { id: 8, name: 'Attestation', amount: 9320.5, orders: 41 },
        ],
        vendors: [
            { id: 4, name: 'Acme Telecom', amount: 8650.4, orders: 190 },
            { id: 9, name: 'Cleartrip', amount: 2210.25, orders: 37 },
        ],
        partners: [
            { id: null, name: null, amount: 52310.2, orders: 615 },
            { id: 77, name: 'Gulf Reach', amount: 12980.4, orders: 88 },
        ],
    },
};

const cardOf = (title: string) => screen.getByText(title).closest('.ant-card') as HTMLElement;

const zeroed: Partial<DashboardMetrics> = {
    journalEntries: 0,
    transactionEntries: 0,
    refundEntries: 0,
    cashbackEntries: 0,
    cashbackReversalEntries: 0,
    adminRefundEntries: 0,
    failedEntries: 0,
    skippedEntries: 0,
    notRecordedEntries: 0,
    transactionsCount: 0,
    gmv: 0,
    commission: 0,
    platformFee: 0,
    subscriptions: 0,
    subscriptionsMonthly: 0,
    subscriptionsAnnually: 0,
    otherSales: 0,
    otherSalesCount: 0,
    thirdPartySales: 0,
    thirdPartySalesCount: 0,
};

const updatedLabel = (iso: string) => `Updated ${dayjs(iso).format('DD MMM YYYY, HH:mm')}`;

const JOURNAL_KIND_TITLES = [
    'Transaction Entries',
    'Refund Entries',
    'Cashback Entries',
    'Cashback Reversal Entries',
    'Admin Triggered Refund Entries',
];

const JOURNAL_TITLES = new Set([
    'Journal Entries',
    ...JOURNAL_KIND_TITLES,
    'Failed Entries',
    'Skipped Entries',
    'Not Recorded Entries',
]);

const CARD_TITLES = KPI_CARD_TITLES.filter(title => !JOURNAL_TITLES.has(title));

const renderDashboard = () =>
    render(
        <MemoryRouter initialEntries={['/system-user/accounting']}>
            <AccountingDashboard />
        </MemoryRouter>
    );

describe('AccountingDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
        (getAccountingDashboard as Mock).mockResolvedValue(payload);
        (getAccountingGoLiveDate as Mock).mockResolvedValue({
            date: '2026-09-01',
            configured: true,
            setByName: 'Ibrahim',
            setAt: '2026-09-01T06:00:00.000Z',
            reason: 'portal go live',
        });
    });

    it('shows a skeleton while the dashboard loads', () => {
        (getAccountingDashboard as Mock).mockReturnValue(new Promise(() => {}));

        renderDashboard();

        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
        expect(screen.queryByText("Today's Statistics")).not.toBeInTheDocument();
    });

    it('requests the dashboard for the signed-in admin without forcing a refresh', async () => {
        renderDashboard();

        await screen.findByText("Today's Statistics");

        expect(getAccountingDashboard).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            refresh: false,
        });
    });

    it('renders the today and monthly sections with every card and formatted values', async () => {
        renderDashboard();

        await screen.findByText("Today's Statistics");

        expect(screen.queryByText('Overview')).not.toBeInTheDocument();
        expect(screen.getByText('Monthly Statistics')).toBeInTheDocument();
        expect(KPI_CARD_TITLES).toHaveLength(20);
        CARD_TITLES.forEach(title => {
            expect(screen.getAllByText(title)).toHaveLength(2);
        });
        expect(screen.getAllByText('Journal Entries')).toHaveLength(2);
        JOURNAL_KIND_TITLES.forEach(title => {
            expect(screen.getAllByLabelText(new RegExp(`^${title},`))).toHaveLength(2);
        });
        expect(screen.getAllByText('Failed Entries')).toHaveLength(2);
        expect(screen.getAllByText('Skipped Entries')).toHaveLength(2);
        expect(screen.queryByText('Not Recorded Entries')).not.toBeInTheDocument();
        expect(screen.getByText('₹ 31,246.09')).toBeInTheDocument();
        expect(screen.getByText('₹ 90,210.50')).toBeInTheDocument();
        expect(screen.getByText('1,160')).toBeInTheDocument();
        expect(screen.getByText(updatedLabel(payload.generatedAt))).toBeInTheDocument();
    });

    it("lists the internal purchase accounts' figures on their own line in each section, opening the same pages scoped to those accounts", async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: {
                today: {
                    ...metrics(),
                    range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                    internal: { transactionsCount: 3, gmv: 1200.5, commission: 90 },
                },
                monthly: {
                    ...metrics({ transactionsCount: 1160, gmv: 90210.5 }),
                    range: { from: '2026-09-01 00:00:00', to: '2026-09-16 23:59:59' },
                    internal: { transactionsCount: 40, gmv: 15000 },
                },
            },
        });

        renderDashboard();
        await screen.findByText("Today's Statistics");

        const toggles = screen.getAllByRole('button', { name: 'Internal purchase accounts' });
        expect(toggles).toHaveLength(2);
        toggles.forEach(toggle => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
        expect(screen.queryByText('₹ 1,200.50')).not.toBeInTheDocument();
        expect(screen.getAllByText('Total GMV')).toHaveLength(2);

        fireEvent.click(toggles[0]);
        expect(toggles[0]).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('₹ 1,200.50')).toBeInTheDocument();
        expect(screen.queryByText('₹ 15,000.00')).not.toBeInTheDocument();
        INTERNAL_KPI_CARD_TITLES.forEach(title => {
            expect(screen.getAllByText(title)).toHaveLength(3);
        });
        expect(screen.getAllByText('Platform Fee (excl. GST)')).toHaveLength(2);

        const [, todayInternalGmv] = screen.getAllByText('Total GMV');
        fireEvent.click(todayInternalGmv);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/transactions?from=2026-09-16&to=2026-09-16&status=SUCCESS&accounts=internal'
        );

        fireEvent.click(toggles[0]);
        expect(screen.queryByText('₹ 1,200.50')).not.toBeInTheDocument();
        expect(screen.getAllByText('Total GMV')).toHaveLength(2);

        fireEvent.click(toggles[1]);
        expect(screen.getByText('₹ 15,000.00')).toBeInTheDocument();
        const [, , monthlyInternalCommission] = screen.getAllByText('Commission (excl. GST)');
        fireEvent.click(monthlyInternalCommission);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/commission-details?from=2026-09-01&to=2026-09-16&accounts=internal'
        );
    });

    it('shows Subscriptions split into its own Total/Monthly/Annual cards, for both sections', async () => {
        renderDashboard();

        await screen.findByText("Today's Statistics");

        expect(screen.getAllByText('Total Subscriptions')).toHaveLength(2);
        expect(screen.getAllByText('Subscriptions (Monthly)')).toHaveLength(2);
        expect(screen.getAllByText('Subscriptions (Annual)')).toHaveLength(2);
        expect(screen.getAllByText('₹ 990.00')).toHaveLength(2);
        expect(screen.getAllByText('₹ 500.00')).toHaveLength(2);
    });

    it("links the Other Sales card to the Other Sales page scoped to that section's own date range", async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: {
                today: {
                    ...metrics(),
                    range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                },
                monthly: {
                    ...metrics({ transactionsCount: 1160, gmv: 90210.5 }),
                    range: { from: '2026-09-01 00:00:00', to: '2026-09-16 23:59:59' },
                },
            },
        });

        renderDashboard();
        await screen.findByText("Today's Statistics");

        const [todayCard, monthlyCard] = screen.getAllByText('Other Sales');

        fireEvent.click(todayCard);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/other-sales?from=2026-09-16&to=2026-09-16'
        );

        fireEvent.click(monthlyCard);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/other-sales?from=2026-09-01&to=2026-09-16'
        );
    });

    it("links the Third-Party Sales card to Payment Links scoped to that section's own date range", async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: {
                today: {
                    ...metrics(),
                    range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                },
                monthly: {
                    ...metrics({ thirdPartySales: 2998 }),
                    range: { from: '2026-09-01 00:00:00', to: '2026-09-16 23:59:59' },
                },
            },
        });

        renderDashboard();
        await screen.findByText("Today's Statistics");

        expect(screen.getByText('₹ 2,998.00')).toBeInTheDocument();
        const [todayCard, monthlyCard] = screen.getAllByText('Third-Party Sales');

        fireEvent.click(todayCard);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/third-party-sales/payment-links?from=2026-09-16&to=2026-09-16'
        );

        fireEvent.click(monthlyCard);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/third-party-sales/payment-links?from=2026-09-01&to=2026-09-16'
        );
    });

    it('links the journal-key cards to Order Journals scoped to that range, with a status filter only where exact', async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: {
                today: {
                    ...metrics(),
                    range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                },
                monthly: {
                    ...metrics({ transactionsCount: 1160, gmv: 90210.5 }),
                    range: { from: '2026-09-01 00:00:00', to: '2026-09-16 23:59:59' },
                },
            },
        });

        renderDashboard();
        await screen.findByText("Today's Statistics");

        const [todayJournals] = screen.getAllByText('Open order journals');
        fireEvent.click(todayJournals);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/order-journals?from=2026-09-16&to=2026-09-16'
        );

        const [todayRefundEntries] = screen.getAllByLabelText(/^Refund Entries,/);
        fireEvent.click(todayRefundEntries);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/order-journals?from=2026-09-16&to=2026-09-16&journalKey=refund&status=success'
        );

        const [, monthlyFailedEntries] = screen.getAllByText('Failed Entries');
        fireEvent.click(monthlyFailedEntries);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/order-journals?from=2026-09-01&to=2026-09-16&journalKey=any&status=failed'
        );

        const [, monthlySkippedEntries] = screen.getAllByText('Skipped Entries');
        fireEvent.click(monthlySkippedEntries);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/order-journals?from=2026-09-01&to=2026-09-16&journalKey=any&status=skipped'
        );
    });

    it('links Transaction Entries, Transactions Count and GMV to the payment-status-only Transactions page', async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: {
                today: {
                    ...metrics(),
                    range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                },
                monthly: {
                    ...metrics({ transactionsCount: 1160, gmv: 90210.5 }),
                    range: { from: '2026-09-01 00:00:00', to: '2026-09-16 23:59:59' },
                },
            },
        });

        renderDashboard();
        await screen.findByText("Today's Statistics");

        const expected =
            '/system-user/accounting/transactions?from=2026-09-16&to=2026-09-16&status=SUCCESS';

        const [todayTransactionEntries] = screen.getAllByLabelText(/^Transaction Entries,/);
        fireEvent.click(todayTransactionEntries);
        expect(navigateMock).toHaveBeenLastCalledWith(expected);

        const [todayTransactionsCount] = screen.getAllByText('Transactions Count');
        fireEvent.click(todayTransactionsCount);
        expect(navigateMock).toHaveBeenLastCalledWith(expected);

        const [todayGmv] = screen.getAllByText('Total GMV');
        fireEvent.click(todayGmv);
        expect(navigateMock).toHaveBeenLastCalledWith(expected);

        const [todayDiscount] = screen.getAllByText('Total Discount');
        fireEvent.click(todayDiscount);
        expect(navigateMock).toHaveBeenLastCalledWith(expected);

        const [todayNetGmv] = screen.getAllByText('Net GMV');
        fireEvent.click(todayNetGmv);
        expect(navigateMock).toHaveBeenLastCalledWith(expected);
    });

    it('shows the discount Peko bore and the net GMV beside GMV, so the three add up on screen', async () => {
        renderDashboard();
        await screen.findByText("Today's Statistics");

        expect(screen.getAllByText('Total Discount').length).toBe(2);
        expect(screen.getAllByText('Net GMV').length).toBe(2);
        expect(screen.getAllByText('₹ 1,200.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 30,046.09').length).toBeGreaterThan(0);
    });

    it('links Commission and Platform Fee to their own dedicated details pages', async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: {
                today: {
                    ...metrics(),
                    range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                },
                monthly: {
                    ...metrics({ transactionsCount: 1160, gmv: 90210.5 }),
                    range: { from: '2026-09-01 00:00:00', to: '2026-09-16 23:59:59' },
                },
            },
        });

        renderDashboard();
        await screen.findByText("Today's Statistics");

        const [todayCommission] = screen.getAllByText('Commission (excl. GST)');
        fireEvent.click(todayCommission);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/commission-details?from=2026-09-16&to=2026-09-16'
        );

        const [, monthlyPlatformFee] = screen.getAllByText('Platform Fee (excl. GST)');
        fireEvent.click(monthlyPlatformFee);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/platform-fee-details?from=2026-09-01&to=2026-09-16'
        );
    });

    it('links all 3 Subscriptions cards to one shared page, Monthly/Annual seeding billingType', async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: {
                today: {
                    ...metrics(),
                    range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                },
                monthly: {
                    ...metrics({ transactionsCount: 1160, gmv: 90210.5 }),
                    range: { from: '2026-09-01 00:00:00', to: '2026-09-16 23:59:59' },
                },
            },
        });

        renderDashboard();
        await screen.findByText("Today's Statistics");

        const [todaySubscriptions] = screen.getAllByText('Total Subscriptions');
        fireEvent.click(todaySubscriptions);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/subscription-details?from=2026-09-16&to=2026-09-16'
        );

        const [, monthlyMonthly] = screen.getAllByText('Subscriptions (Monthly)');
        fireEvent.click(monthlyMonthly);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/subscription-details?from=2026-09-01&to=2026-09-16&billingType=MONTHLY'
        );

        const [, monthlyAnnual] = screen.getAllByText('Subscriptions (Annual)');
        fireEvent.click(monthlyAnnual);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/subscription-details?from=2026-09-01&to=2026-09-16&billingType=ANNUALLY'
        );
    });

    it('draws the three chart cards under the alerts from the month-to-date figures', async () => {
        renderDashboard();

        await screen.findByText("Today's Statistics");

        ['Journal Health', 'Revenue Mix', 'Top Performers'].forEach(title => {
            expect(screen.getAllByText(title)).toHaveLength(1);
        });
        expect(screen.getAllByText('Month to date')).toHaveLength(3);
        expect(screen.getByTestId('alert-totals')).toHaveTextContent('1 critical1 warning');
        CARD_TITLES.forEach(title => {
            expect(screen.getAllByText(title)).toHaveLength(2);
        });

        const health = cardOf('Journal Health');
        expect(within(health).getByText('59')).toBeInTheDocument();
        expect(within(health).getByText('Entries')).toBeInTheDocument();
        expect(
            within(health).getByRole('img', {
                name: 'Journal health: 56 recorded, 2 failed, 1 skipped, 0 not recorded',
            })
        ).toBeInTheDocument();
        [
            ['Recorded', '56'],
            ['Failed', '2'],
            ['Skipped', '1'],
            ['Not recorded', '0'],
        ].forEach(([label, count]) => {
            expect(within(health).getByText(label)).toBeInTheDocument();
            expect(within(health).getByText(count)).toBeInTheDocument();
        });

        const mix = cardOf('Revenue Mix');
        expect(within(mix).getByRole('meter', { name: 'Commission' })).toHaveStyle({
            width: '100%',
        });
        expect(within(mix).getByRole('meter', { name: 'Platform fee' })).toHaveStyle({
            width: '35%',
        });
        expect(within(mix).getByRole('meter', { name: 'Subscription income' })).toHaveStyle({
            width: '82%',
        });
        expect(within(mix).getByRole('meter', { name: 'Sales as principal' })).toHaveStyle({
            width: '40%',
        });
        expect(within(mix).getByText('₹ 1,820.40')).toBeInTheDocument();

        const top = cardOf('Top Performers');
        expect(within(top).getByText('Visa')).toBeInTheDocument();
        expect(within(top).getByText('312 orders')).toBeInTheDocument();
        expect(within(top).getByRole('meter', { name: 'Visa' })).toHaveStyle({ width: '100%' });
        expect(within(top).getByRole('meter', { name: 'Attestation' })).toHaveStyle({
            width: '23%',
        });
        expect(
            within(top).getByText('Ranked by full order value on successful orders')
        ).toBeInTheDocument();
    });

    it('switches Top Performers between services, vendors and partners', async () => {
        renderDashboard();

        await screen.findByText("Today's Statistics");
        const top = cardOf('Top Performers');

        fireEvent.click(within(top).getByRole('radio', { name: 'Vendors' }));

        expect(within(top).getByRole('radio', { name: 'Vendors' })).toBeChecked();
        expect(within(top).getByText('Acme Telecom')).toBeInTheDocument();
        expect(within(top).queryByText('Visa')).not.toBeInTheDocument();
        expect(within(top).getByText('Ranked by commission excluding GST')).toBeInTheDocument();

        fireEvent.click(within(top).getByRole('radio', { name: 'Partners' }));

        expect(within(top).getByText('Peko (Default)')).toBeInTheDocument();
        expect(within(top).getByText('Gulf Reach')).toBeInTheDocument();
        expect(within(top).getByRole('meter', { name: 'Gulf Reach' })).toHaveStyle({
            width: '25%',
        });
    });

    it('says when the rankings could not be loaded, and when the month has no orders yet', async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({ ...payload, rankings: null });

        renderDashboard();
        await screen.findByText("Today's Statistics");

        expect(screen.getByText('Rankings could not be loaded.')).toBeInTheDocument();
        expect(screen.getByText('Monthly Statistics')).toBeInTheDocument();

        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            rankings: { services: [], vendors: [], partners: [] },
        });
        fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

        expect(await screen.findByText('No successful orders this month yet.')).toBeInTheDocument();
    });

    it('renders the alerts from the api and navigates on action', async () => {
        renderDashboard();

        await screen.findByText("Today's Statistics");

        expect(screen.getByTestId('alert-totals')).toHaveTextContent('1 critical1 warning');
        expect(screen.getByText('Failed journal entries')).toBeInTheDocument();
        expect(screen.getByText('2 journal entries failed to record today.')).toBeInTheDocument();
        expect(
            screen.getByText('Chart of accounts: 1 required account is missing (Cashback Expense).')
        ).toBeInTheDocument();

        fireEvent.click(screen.getByText('Open chart of accounts'));

        expect(navigateMock).toHaveBeenCalledWith('/system-user/accounting/chart-of-accounts');
    });

    it('expands an alert into its issues, each with its own link straight to the fix', async () => {
        renderDashboard();

        await screen.findByText("Today's Statistics");

        expect(screen.queryByText('PK-1')).not.toBeInTheDocument();
        const failed = screen.getByRole('button', { name: /Failed journal entries/ });
        const card = within(failed.parentElement as HTMLElement);
        expect(failed).toHaveAttribute('aria-expanded', 'false');
        expect(card.getByText('Show 1 issue')).toBeInTheDocument();

        fireEvent.click(failed);

        expect(failed).toHaveAttribute('aria-expanded', 'true');
        expect(card.getByText('Hide 1 issue')).toBeInTheDocument();
        expect(card.getByText('PK-1')).toBeInTheDocument();
        expect(
            card.getByText('Refund · Visa · ₹ 1,200.00 · No COA accounts found')
        ).toBeInTheDocument();
        expect(card.getByText('1 more not listed here')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Retry entry'));
        expect(navigateMock).toHaveBeenCalledWith(
            '/system-user/accounting/order-journals?from=2026-09-16&to=2026-09-16&journalKey=refund&status=failed&search=PK-1&open=PK-1'
        );

        fireEvent.click(screen.getByRole('button', { name: /Chart of accounts issues/ }));
        fireEvent.click(screen.getByText('Add account'));
        expect(navigateMock).toHaveBeenCalledWith(
            '/system-user/accounting/chart-of-accounts?add=Cashback+Expense'
        );
    });

    it('heads the journals card with the share in the books and a verdict on the day', async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: {
                today: {
                    ...metrics(),
                    range: { from: '2026-09-16 00:00:00', to: '2026-09-16 23:59:59' },
                },
                monthly: {
                    ...metrics(),
                    range: { from: '2026-09-01 00:00:00', to: '2026-09-16 23:59:59' },
                },
            },
        });

        renderDashboard();

        await screen.findByText("Today's Statistics");

        expect(screen.getAllByText('94%')).toHaveLength(2);
        expect(screen.getAllByText('Entries refused')).toHaveLength(2);
        expect(screen.getAllByText('of 59 tried, in the books')).toHaveLength(2);
        expect(screen.getAllByText('56 recorded')).toHaveLength(2);
        expect(screen.getAllByText('2 failed')).toHaveLength(2);
        expect(screen.queryByText('0 not recorded')).not.toBeInTheDocument();
        expect(
            screen.getAllByRole('img', {
                name: 'Journal entries: 56 recorded, 2 failed, 1 skipped',
            })
        ).toHaveLength(2);
        expect(screen.getAllByText('Sales')).toHaveLength(2);
        expect(screen.getAllByText('Retry')).toHaveLength(2);
        expect(screen.getAllByText('Review')).toHaveLength(2);
        expect(screen.queryByText('Nothing needs attention')).not.toBeInTheDocument();

        fireEvent.click(screen.getAllByText('Retry')[0]);
        expect(navigateMock).toHaveBeenLastCalledWith(
            '/system-user/accounting/order-journals?from=2026-09-16&to=2026-09-16&journalKey=any&status=failed'
        );
    });

    it('says nothing needs attention when every entry reached the books', async () => {
        const clean = metrics({ failedEntries: 0, skippedEntries: 0, notRecordedEntries: 0 });
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: { today: clean, monthly: clean },
        });

        renderDashboard();

        await screen.findByText("Today's Statistics");

        expect(screen.getAllByText('100%')).toHaveLength(2);
        expect(screen.getAllByText('All in the books')).toHaveLength(2);
        expect(screen.getAllByText('Nothing needs attention')).toHaveLength(2);
        expect(
            screen.getByText("Every entry tried for today's orders reached the books.")
        ).toBeInTheDocument();
        expect(screen.queryByText('Failed Entries')).not.toBeInTheDocument();
    });

    it('reads all clear when there is nothing to fix', async () => {
        (getAccountingDashboard as Mock).mockResolvedValue({ ...payload, alerts: [] });

        renderDashboard();

        await screen.findByText("Today's Statistics");

        expect(screen.getByText('All clear')).toBeInTheDocument();
        expect(
            screen.getByText('No alerts right now. Everything is in order.')
        ).toBeInTheDocument();
    });

    it('refreshes through the api and shows the new timestamp', async () => {
        renderDashboard();
        await screen.findByText("Today's Statistics");
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            generatedAt: '2026-09-16T09:00:00.000Z',
        });

        fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

        await waitFor(() =>
            expect(getAccountingDashboard).toHaveBeenLastCalledWith({
                userId: 7,
                userType: 'system_user',
                refresh: true,
            })
        );
        expect(
            await screen.findByText(updatedLabel('2026-09-16T09:00:00.000Z'))
        ).toBeInTheDocument();
    });

    it('offers a retry when the first load fails', async () => {
        (getAccountingDashboard as Mock).mockResolvedValueOnce(false);

        renderDashboard();

        expect(
            await screen.findByText('The accounting dashboard could not be loaded.')
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Retry/ }));

        expect(await screen.findByText("Today's Statistics")).toBeInTheDocument();
        expect(getAccountingDashboard).toHaveBeenCalledTimes(2);
    });
});

describe('the go live date on the dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
        (getAccountingDashboard as Mock).mockResolvedValue(payload);
    });

    it('names the date the portal accounts from, and who set it', async () => {
        (getAccountingGoLiveDate as Mock).mockResolvedValue({
            date: '2026-09-01',
            configured: true,
            setByName: 'Ibrahim',
            setAt: '2026-09-01T06:00:00.000Z',
            reason: 'portal go live',
        });

        renderDashboard();

        expect(await screen.findByText('Accounting from 01 Sep 2026')).toBeInTheDocument();
        expect(
            screen.getByText('Set by Ibrahim on 01 Sep 2026 — portal go live')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Change date/ })).toBeInTheDocument();
    });

    it('reads zero rather than blank while no date is set, and says why', async () => {
        (getAccountingGoLiveDate as Mock).mockResolvedValue({ date: null, configured: false });
        (getAccountingDashboard as Mock).mockResolvedValue({
            ...payload,
            sections: { today: metrics(zeroed), monthly: metrics(zeroed) },
            alerts: [],
        });

        renderDashboard();

        expect(await screen.findByText('Accounting go live date not set')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Until one is set every figure below reads zero and every list is empty.'
            )
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Set date/ })).toBeInTheDocument();
        expect(screen.getAllByText('₹ 0.00').length).toBeGreaterThan(0);
        expect(screen.queryByText('₹ 31,246.09')).not.toBeInTheDocument();
    });

    it('warns that the date moves every balance before it lets one be changed', async () => {
        (getAccountingGoLiveDate as Mock).mockResolvedValue({
            date: '2026-09-01',
            configured: true,
        });
        (updateAccountingGoLiveDate as Mock).mockResolvedValue({
            date: '2026-10-01',
            configured: true,
        });

        renderDashboard();
        fireEvent.click(await screen.findByRole('button', { name: /Change date/ }));

        expect(await screen.findByText('Change accounting go live date')).toBeInTheDocument();
        expect(screen.getByText('This moves every balance in the portal')).toBeInTheDocument();
        expect(
            screen.getByText(
                /Orders, journals, deposits, payouts and settlements dated before it are left out/
            )
        ).toBeInTheDocument();
    });
});
