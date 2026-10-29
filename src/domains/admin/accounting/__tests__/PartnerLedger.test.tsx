import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    createPartnerDebitNote,
    createPartnerOpeningBalance,
    createPartnerPayout,
    getPartnerDebitNotes,
    getPartnerLedgerDetail,
    getPartnerLedgerList,
    getPartnerPayoutSuggestion,
    getPartnerPayouts,
    getPartnerStatement,
    getPartnerSubscriptions,
    getPartnerTransactions,
    deletePartnerDebitNote,
    deletePartnerOpeningBalance,
    markPartnerPayoutBooks,
    reversePartnerDebitNote,
    reversePartnerPayout,
    updatePartnerDebitNote,
    updatePartnerPayout,
} from '../api/partnerLedger';
import { LEDGER_LEAF_BY_KIND } from '../config/ledgerPaths';
import { AccountingShellProvider, DrillPanel } from '../context/AccountingShellContext';
import PartnerLedgerDetail from '../pages/PartnerLedgerDetail';
import PartnerLedgerList from '../pages/PartnerLedgerList';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock,
        Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
    };
});

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: vi.fn() }));

vi.mock('../api/partnerLedger', () => ({
    getPartnerLedgerList: vi.fn(),
    getPartnerLedgerDetail: vi.fn(),
    getPartnerTransactions: vi.fn(),
    getPartnerSubscriptions: vi.fn(),
    getPartnerPayouts: vi.fn(),
    getPartnerPayoutSuggestion: vi.fn(),
    createPartnerOpeningBalance: vi.fn(),
    createPartnerPayout: vi.fn(),
    reversePartnerPayout: vi.fn(),
    getPartnerDebitNotes: vi.fn(),
    createPartnerDebitNote: vi.fn(),
    reversePartnerDebitNote: vi.fn(),
    updatePartnerPayout: vi.fn(),
    deletePartnerPayout: vi.fn(),
    updatePartnerOpeningBalance: vi.fn(),
    deletePartnerOpeningBalance: vi.fn(),
    updatePartnerDebitNote: vi.fn(),
    deletePartnerDebitNote: vi.fn(),
    markPartnerPayoutBooks: vi.fn(),
    markPartnerDebitNoteBooks: vi.fn(),
    getPartnerStatement: vi.fn(),
    downloadPartnerStatement: vi.fn(),
}));

const stateWith = (update: boolean) => ({
    reducer: {
        auth: { role: 'system_user', id: 7 },
        services: {
            services: {
                data: [
                    {
                        serviceCategory: 'Accounting',
                        hasAccess: true,
                        services: [
                            {
                                category: 'Ledgers',
                                hasAccess: true,
                                services: [{ service: 'Partners', hasAccess: true, update }],
                            },
                        ],
                    },
                ],
            },
        },
    },
});

const POSTED = { state: 'posted', note: null, detail: null };
const NOT_APPLICABLE = { state: 'notApplicable', note: null, detail: null };

const PARTNER = {
    credentialId: 55,
    systemUserId: 11,
    partnerName: 'Gulf Reach',
    branding: 'Gulf',
    portalUrl: 'gulf.peko.one',
    sharePercentage: 10,
    isActive: true,
    earned: 153.4,
    paid: 100,
    debitNotes: 0,
    owed: 53.4,
};

const SUMMARY = {
    earned: 153.4,
    paid: 100,
    debitNotes: 0,
    gmv: 31246.09,
    opening: 0,
    owed: 53.4,
    lastPayoutDate: '2026-09-10',
    lastPayoutAmount: 100,
    openingBalanceSet: false,
    openingBalanceAsOf: null,
    partnershipAccountConfigured: true,
};

const dispatch = vi.fn();

const setState = (state: unknown) => {
    (useAppSelector as unknown as Mock).mockImplementation((selector: never) =>
        (selector as unknown as (value: unknown) => unknown)(state)
    );
};

// The shared TextInput spreads Formik's field props onto the input, so the field name is the
// only stable handle; its Form.Item label is not wired with htmlFor.
const field = (name: string) => document.querySelector(`input[name="${name}"]`) as HTMLInputElement;

const realGetComputedStyle = window.getComputedStyle.bind(window);

vi.setConfig({ testTimeout: 20000 });

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    setState(stateWith(true));
    (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);

    (getPartnerLedgerList as Mock).mockResolvedValue({
        partners: [PARTNER],
        recordsTotal: 1,
        page: 1,
        itemsPerPage: 10,
        kpis: {
            totalPartners: 2,
            owedTotal: 53.4,
            awaitingPayout: 1,
            partnersWithoutShare: 1,
            earnedThisMonth: 153.4,
            paidThisMonth: 100,
            gmvThisMonth: 31246.09,
        },
        partnershipAccountConfigured: true,
        generatedAt: '2026-09-22T08:30:00.000Z',
        cached: true,
    });
    (getPartnerLedgerDetail as Mock).mockResolvedValue({
        partner: PARTNER,
        summary: SUMMARY,
        partnershipAccountConfigured: true,
    });
    (getPartnerTransactions as Mock).mockResolvedValue({
        entries: [
            {
                id: 1,
                corporateTxnId: 'P1',
                transactionDate: '2026-09-02T10:00:00.000Z',
                subscriberName: 'Al Rams Trading',
                service: 'Flights',
                totalAmount: 1080,
                netPlatformFee: 67.8,
                netCommission: 100,
                couponTotal: 100,
                gatewayCharge: 22.5,
                shareBase: 200,
                shareExcludingGST: 20,
                shareGST: 3.6,
                partnerShare: 23.6,
                sharePercentageApplied: 10.1,
                status: 'SUCCESS',
                posting: POSTED,
            },
        ],
        recordsTotal: 1,
        page: 1,
        itemsPerPage: 10,
    });
    (getPartnerSubscriptions as Mock).mockResolvedValue({
        entries: [
            {
                id: 4,
                corporateTxnId: 'P4',
                transactionDate: '2026-09-18T10:00:00.000Z',
                subscriberName: 'Al Rams Trading',
                planName: 'Peko Pro',
                billingType: 'MONTHLY',
                subscriptionStatus: 'ACTIVE',
                addOn: false,
                totalAmount: 1180,
                netRevenue: 1000,
                couponTotal: 0,
                gatewayCharge: 0,
                shareBase: 1000,
                shareExcludingGST: 100,
                shareGST: 18,
                partnerShare: 118,
                sharePercentageApplied: 10,
                status: 'SUCCESS',
                posting: {
                    state: 'notPosted',
                    note: 'Recording paused',
                    detail: 'Journal recording is currently paused',
                },
            },
            {
                id: 5,
                corporateTxnId: 'P5',
                transactionDate: '2026-09-19T10:00:00.000Z',
                subscriberName: 'Al Rams Trading',
                planName: 'eSign',
                billingType: 'MONTHLY',
                subscriptionStatus: 'ACTIVE',
                addOn: true,
                totalAmount: 96.97,
                netRevenue: 99,
                couponTotal: 19.85,
                gatewayCharge: null,
                shareBase: 113.79,
                shareExcludingGST: 17.07,
                shareGST: 3.07,
                partnerShare: 20.14,
                sharePercentageApplied: null,
                status: 'SUCCESS',
                posting: POSTED,
            },
        ],
        recordsTotal: 2,
        page: 1,
        itemsPerPage: 10,
    });
    (getPartnerPayouts as Mock).mockResolvedValue({
        entries: [
            {
                id: 3,
                partnerCredentialId: 55,
                amount: 100,
                calculatedAmount: 153.4,
                difference: -53.4,
                payoutDate: '2026-09-10',
                reference: 'NEFT-1',
                entryNumber: 'PAY-000001',
                mode: 'NEFT',
                note: 'part settlement',
                status: 'ACTIVE',
                posting: NOT_APPLICABLE,
                entryKind: 'PAYOUT',
                entryType: 'PAYOUT',
                reversesId: null,
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: 'Ibrahim',
                voidedByName: null,
                voidReason: null,
            },
        ],
        recordsTotal: 1,
        owed: 53.4,
        earned: 153.4,
        paid: 100,
        debitNotes: 0,
        opening: 0,
        lastPayoutDate: '2026-09-10',
        lastPayoutAmount: 100,
        openingBalanceSet: false,
        openingBalanceAsOf: null,
        page: 1,
        itemsPerPage: 10,
    });
    (getPartnerPayoutSuggestion as Mock).mockResolvedValue({
        suggestedAmount: 53.4,
        earned: 153.4,
        paid: 100,
        debitNotes: 0,
        lastPayoutDate: '2026-09-10',
    });
    (getPartnerDebitNotes as Mock).mockResolvedValue({
        entries: [
            {
                id: 21,
                partnerCredentialId: 55,
                kind: 'DEBIT_NOTE',
                reference: 'DN-1042',
                entryNumber: 'PDN-000001',
                amount: 20,
                issueDate: '2026-10-07',
                reason: 'Share clawed back',
                againstCorporateTxnId: 'P1',
                status: 'OPEN',
                posting: NOT_APPLICABLE,
                entryType: 'ENTRY',
                reversesId: null,
                source: 'MANUAL',
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: 'Ibrahim',
                voidedByName: null,
                voidReason: null,
            },
        ],
        recordsTotal: 1,
        page: 1,
        itemsPerPage: 10,
    });
    (getPartnerStatement as Mock).mockResolvedValue({
        partnerName: 'Gulf Reach',
        openingBalance: 0,
        totalDebit: 100,
        totalCredit: 153.4,
        closingBalance: 53.4,
        entries: [
            {
                date: '2026-09-10',
                particulars: 'Earned up to 2026-09-10 — 3 transactions',
                reference: null,
                type: 'Earned',
                debit: null,
                credit: 35.4,
                balance: 35.4,
                posting: POSTED,
            },
            {
                date: '2026-09-10',
                particulars: 'Payout — NEFT',
                reference: 'NEFT-1',
                type: 'Payout',
                debit: 100,
                credit: null,
                balance: -64.6,
                posting: NOT_APPLICABLE,
            },
        ],
        recordsTotal: 2,
        truncated: false,
        page: 1,
        itemsPerPage: 10,
    });
});

const renderList = () =>
    render(
        <MemoryRouter>
            <PartnerLedgerList />
        </MemoryRouter>
    );

const renderDetail = (url: string, setPanel = vi.fn()) => {
    render(
        <MemoryRouter initialEntries={[url]}>
            <AccountingShellProvider value={setPanel}>
                <Routes>
                    <Route
                        path="/system-user/accounting/partners/:id/:tab?"
                        element={<PartnerLedgerDetail />}
                    />
                </Routes>
            </AccountingShellProvider>
        </MemoryRouter>
    );
    return setPanel;
};

const lastPanel = (setPanel: Mock): DrillPanel | null => {
    const calls = setPanel.mock.calls.filter(([value]) => value !== null);
    return calls.length ? calls[calls.length - 1][0] : null;
};

describe('partners is an api backed ledger', () => {
    it('carries the five tabs asked for and records payouts and debit notes on their tabs', () => {
        const leaf = LEDGER_LEAF_BY_KIND.partners;

        expect(leaf.tabs).toEqual([
            'transactions',
            'own-subscriptions',
            'payments',
            'debit-notes',
            'statement-of-accounts',
        ]);
        expect(Object.keys(leaf.recordActions || {})).toEqual(['payments', 'debit-notes']);
    });
});

describe('PartnerLedgerList', () => {
    it('shows each partner with its share and what is left to pay', async () => {
        renderList();

        expect(await screen.findByText('Gulf Reach')).toBeInTheDocument();
        expect(screen.getAllByText('gulf.peko.one').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/10(.00)? %/).length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 53.40').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Payout due').length).toBeGreaterThan(0);
    });

    it('shows what is owed across every partner on the cards', async () => {
        renderList();

        await screen.findByText('Gulf Reach');
        expect(screen.getAllByText('Owed To Partners').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Awaiting Payout').length).toBeGreaterThan(0);
        expect(screen.getAllByText('No Share Configured').length).toBeGreaterThan(0);
        expect(screen.getByText('GMV This Month')).toBeInTheDocument();
        expect(screen.getByText('₹ 31,246.09')).toBeInTheDocument();
    });

    it('opens a partner by its credential id when the row is clicked', async () => {
        renderList();

        fireEvent.click(await screen.findByText('Gulf Reach'));

        expect(navigateMock).toHaveBeenCalledWith(
            '/system-user/accounting/partners/55/transactions'
        );
    });

    it('warns when the partnership payable account is missing', async () => {
        (getPartnerLedgerList as Mock).mockResolvedValue({
            partners: [],
            recordsTotal: 0,
            kpis: null,
            partnershipAccountConfigured: false,
            generatedAt: '',
            cached: false,
        });
        renderList();

        expect(await screen.findByText(/Partnership Fee Payable/)).toBeInTheDocument();
    });
});

describe('PartnerLedgerDetail', () => {
    it('registers the drill panel with the five tabs', async () => {
        const setPanel = renderDetail('/system-user/accounting/partners/55/transactions');

        await screen.findByText('P1');
        const panel = lastPanel(setPanel);
        expect(panel?.title).toBe('Gulf Reach');
        expect(panel?.tabs.map(item => item.key)).toEqual([
            'transactions',
            'own-subscriptions',
            'payments',
            'debit-notes',
            'statement-of-accounts',
        ]);
    });

    it('redirects a missing tab to transactions', () => {
        renderDetail('/system-user/accounting/partners/55');

        expect(screen.getByTestId('navigate')).toHaveTextContent(
            '/system-user/accounting/partners/55/transactions'
        );
    });

    it('shows earned, paid and what is left above the table', async () => {
        renderDetail('/system-user/accounting/partners/55/transactions');

        await screen.findByText('P1');
        expect(screen.getAllByText('Left To Pay').length).toBeGreaterThan(0);
        expect(screen.getByText('GMV')).toBeInTheDocument();
        expect(screen.getByText('₹ 31,246.09')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 153.40').length).toBeGreaterThan(0);
        expect(
            screen.getByText(
                /GMV is the full value of every successful order for this partner, before any discount/
            )
        ).toBeInTheDocument();
    });

    it('warns when the partner has no share configured', async () => {
        (getPartnerLedgerDetail as Mock).mockResolvedValue({
            partner: { ...PARTNER, sharePercentage: null },
            summary: SUMMARY,
            partnershipAccountConfigured: true,
        });
        renderDetail('/system-user/accounting/partners/55/transactions');

        expect(await screen.findByText(/no share percentage configured/)).toBeInTheDocument();
    });

    it('breaks a transaction into every part the share is taken from', async () => {
        renderDetail('/system-user/accounting/partners/55/transactions');

        expect(await screen.findByText('P1')).toBeInTheDocument();
        expect(screen.getByText('Net Platform Fee')).toBeInTheDocument();
        expect(screen.getByText('Net Commission')).toBeInTheDocument();
        expect(screen.queryByText('Vendor Payable')).not.toBeInTheDocument();
        expect(screen.getAllByText('₹ 1,080.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 67.80').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 100.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 23.60').length).toBeGreaterThan(0);
    });

    it('shows the gateway charge the partner bore and the base the share was taken on', async () => {
        renderDetail('/system-user/accounting/partners/55/transactions');

        await screen.findByText('P1');
        expect(screen.getAllByText('Gateway Charge').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Share Base').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 22.50').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 200.00').length).toBeGreaterThan(0);
    });

    it('dashes the gateway charge on a subscription recorded before the charge existed', async () => {
        renderDetail('/system-user/accounting/partners/55/own-subscriptions');

        const row = (await screen.findByText('P5')).closest('tr') as HTMLElement;
        expect(screen.getAllByText('Gateway Charge').length).toBeGreaterThan(0);
        expect(within(row).getAllByText('—').length).toBeGreaterThan(0);
    });

    it('shows the coupon as money taken off', async () => {
        renderDetail('/system-user/accounting/partners/55/transactions');

        await screen.findByText('P1');
        expect(screen.getAllByText('- ₹ 100.00')[0]).toHaveClass('text-red-600');
    });

    it('shows the rate that applied at the time rather than the partner rate today', async () => {
        renderDetail('/system-user/accounting/partners/55/transactions');

        await screen.findByText('P1');
        expect(screen.getAllByText('Share Applied').length).toBeGreaterThan(0);
        expect(screen.getAllByText('10.10 %').length).toBeGreaterThan(0);
    });

    it('lists the portal subscriptions on their own tab with the share on each', async () => {
        renderDetail('/system-user/accounting/partners/55/own-subscriptions');

        expect(await screen.findByText('P4')).toBeInTheDocument();
        expect(screen.getAllByText('Peko Pro').length).toBeGreaterThan(0);
        expect(screen.getAllByText('MONTHLY').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 118.00').length).toBeGreaterThan(0);
        expect(getPartnerSubscriptions).toHaveBeenCalled();
    });

    it('names the tax on both subscription amount headers so they stop reading as contradictory', async () => {
        renderDetail('/system-user/accounting/partners/55/own-subscriptions');

        await screen.findByText('P4');
        expect(screen.getAllByText('Amount (incl. GST)').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Net Revenue (excl. GST)').length).toBeGreaterThan(0);
    });

    it('explains a subscription whose net revenue beats its amount by naming the coupon', async () => {
        renderDetail('/system-user/accounting/partners/55/own-subscriptions');

        await screen.findByText('P5');
        expect(screen.getAllByText('- ₹ 19.85')[0]).toHaveClass('text-red-600');
    });

    it('puts the base the rate applies to on the row, so the arithmetic closes on screen', async () => {
        renderDetail('/system-user/accounting/partners/55/own-subscriptions');

        await screen.findByText('P5');
        expect(screen.getAllByText('Share Base').length).toBeGreaterThan(0);
        // 113.79 x 15% = 17.07 fee, + 3.07 GST = the 20.14 headline.
        expect(screen.getAllByText('₹ 113.79').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 20.14').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 17.07 + ₹ 3.07 GST').length).toBeGreaterThan(0);
    });

    it('names the GST rather than leaving the headline unexplained by the percentage', async () => {
        renderDetail('/system-user/accounting/partners/55/transactions');

        await screen.findByText('P1');
        expect(screen.getAllByText('₹ 20.00 + ₹ 3.60 GST').length).toBeGreaterThan(0);
        expect(screen.queryByText(/excl\. GST/)).not.toBeInTheDocument();
    });

    it('shows the rate on a subscription and dashes where there was no base to divide by', async () => {
        renderDetail('/system-user/accounting/partners/55/own-subscriptions');

        await screen.findByText('P4');
        expect(screen.getAllByText('Share Applied').length).toBeGreaterThan(0);
        expect(screen.getAllByText('10.00 %').length).toBeGreaterThan(0);
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('says whether each partner order reached the books', async () => {
        renderDetail('/system-user/accounting/partners/55/transactions');

        const row = (await screen.findByText('P1')).closest('tr') as HTMLElement;
        expect(within(row).getByText('Posted')).toBeInTheDocument();
    });

    it('says why a portal subscription has not reached the books, behind the row expander', async () => {
        renderDetail('/system-user/accounting/partners/55/own-subscriptions');

        await screen.findByText('P4');
        const expander = document.querySelector('.ant-table-row-expand-icon') as HTMLElement;
        expect(expander).toBeTruthy();
        fireEvent.click(expander);

        expect(await screen.findByText('Recording paused')).toBeInTheDocument();
    });

    it('gives a payout no Posted column, since In Books says where it stands', async () => {
        renderDetail('/system-user/accounting/partners/55/payments');

        const row = (await screen.findByText('NEFT-1')).closest('tr') as HTMLElement;
        expect(within(row).queryByText('Not applicable')).not.toBeInTheDocument();
        expect(screen.getByText('In Books')).toBeInTheDocument();
        expect(screen.queryByText('Posted')).not.toBeInTheDocument();
    });
});

describe('a table too wide for the screen', () => {
    const atWidth = async (width: number, run: () => Promise<void>) => {
        Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
        try {
            await run();
        } finally {
            Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
        }
    };

    const expandFirstRow = () =>
        fireEvent.click(document.querySelector('.ant-table-row-expand-icon') as HTMLElement);

    it('moves the columns that do not fit behind the expander rather than off-screen', async () => {
        await atWidth(700, async () => {
            renderDetail('/system-user/accounting/partners/55/payments');
            await screen.findByText('PAY-000001');

            expect(screen.queryByText('Recorded By')).not.toBeInTheDocument();
            expect(screen.queryByText('Ibrahim')).not.toBeInTheDocument();

            expandFirstRow();

            expect(await screen.findByText('Recorded By')).toBeInTheDocument();
            expect(screen.getAllByText('Ibrahim').length).toBeGreaterThan(0);
        });
    });

    it('keeps the actions column in the row itself, so a payout can still be reversed', async () => {
        await atWidth(700, async () => {
            renderDetail('/system-user/accounting/partners/55/payments');
            await screen.findByText('PAY-000001');

            expect(screen.getAllByText('Actions').length).toBeGreaterThan(0);
            expect(screen.getByRole('button', { name: 'Reverse' })).toBeEnabled();
            expect(document.querySelector('.ant-table-row-expand-icon')).toBeTruthy();
        });
    });

    it('folds nothing and shows no expander when every column fits', async () => {
        renderDetail('/system-user/accounting/partners/55/payments');
        await screen.findByText('NEFT-1');

        expect(screen.getAllByText('Recorded By').length).toBeGreaterThan(0);
        expect(document.querySelector('.ant-table-row-expand-icon')).toBeNull();
    });
});

describe('going live with history behind you', () => {
    const openTab = () => renderDetail('/system-user/accounting/partners/55/payments');

    it('warns while no opening is set, because the whole history reads as unpaid', async () => {
        openTab();

        expect(
            await screen.findByText(/everything it earned before this portal started recording/)
        ).toBeInTheDocument();
        expect(screen.queryByText('Left To Pay')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Set opening balance' })).toBeEnabled();
    });

    it('records what Peko already owed as of the go-live date', async () => {
        (createPartnerOpeningBalance as Mock).mockResolvedValue({ id: 9, entryKind: 'OPENING' });
        openTab();

        await screen.findByText('NEFT-1');
        fireEvent.click(screen.getByRole('button', { name: 'Set opening balance' }));

        await waitFor(() => expect(field('amount')).toBeInTheDocument());
        fireEvent.change(field('amount'), { target: { value: '2000' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(createPartnerOpeningBalance).toHaveBeenCalled());
        expect((createPartnerOpeningBalance as Mock).mock.calls[0][0].amount).toBe(2000);
    });

    it('lists the opening in the Payments table and stops offering to set another', async () => {
        (getPartnerPayouts as Mock).mockResolvedValue({
            entries: [
                {
                    id: 9,
                    partnerCredentialId: 55,
                    amount: 2000,
                    calculatedAmount: null,
                    difference: null,
                    payoutDate: '2026-10-01',
                    reference: null,
                    entryNumber: 'OPB-000001',
                    mode: 'OTHER',
                    note: 'per Sep recon',
                    status: 'ACTIVE',
                    entryKind: 'OPENING',
                    entryType: 'PAYOUT',
                    reversesId: null,
                    slipKey: null,
                    slipName: null,
                    slipFormat: null,
                    recordedByName: 'Ibrahim',
                    voidedByName: null,
                    voidReason: null,
                },
            ],
            recordsTotal: 1,
            owed: 2053.4,
            earned: 153.4,
            paid: 100,
            opening: 2000,
            lastPayoutDate: '2026-09-10',
            lastPayoutAmount: 100,
            openingBalanceSet: true,
            openingBalanceAsOf: '2026-10-01',
            page: 1,
            itemsPerPage: 10,
        });
        openTab();

        expect(await screen.findByText('Opening balance')).toBeInTheDocument();
        expect(screen.getAllByText('Opening').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 2,000.00').length).toBeGreaterThan(0);
        expect(
            screen.queryByRole('button', { name: 'Set opening balance' })
        ).not.toBeInTheDocument();
    });
});

describe('the payments tab', () => {
    it('shows what is left to pay and when it was last settled', async () => {
        renderDetail('/system-user/accounting/partners/55/payments');

        await screen.findByText('NEFT-1');
        expect(screen.getAllByText('Left to pay').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Last payment').length).toBeGreaterThan(0);
        expect(screen.getAllByText('10 Sep 2026').length).toBeGreaterThan(0);
    });

    it('shows what was suggested beside what was paid, and by how much it fell short', async () => {
        renderDetail('/system-user/accounting/partners/55/payments');

        await screen.findByText('NEFT-1');
        expect(screen.getAllByText('₹ 100.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 153.40').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Short by ₹ 53.40/).length).toBeGreaterThan(0);
    });

    it('opens the drawer with the calculated amount already filled in', async () => {
        renderDetail('/system-user/accounting/partners/55/payments');

        await screen.findByText('NEFT-1');
        fireEvent.click(screen.getByRole('button', { name: 'Record payout' }));

        await waitFor(() => expect(getPartnerPayoutSuggestion).toHaveBeenCalled());
        expect(await screen.findByPlaceholderText('0.00')).toHaveValue('53.4');
        expect(screen.getByText(/The ledger makes this ₹ 53.40/)).toBeInTheDocument();
    });

    it('records the amount the accounts team typed, not the one suggested', async () => {
        (createPartnerPayout as Mock).mockResolvedValue({ id: 9 });
        renderDetail('/system-user/accounting/partners/55/payments');

        await screen.findByText('NEFT-1');
        fireEvent.click(screen.getByRole('button', { name: 'Record payout' }));

        const amount = await screen.findByPlaceholderText('0.00');
        fireEvent.change(amount, { target: { value: '40' } });
        fireEvent.change(screen.getByPlaceholderText('Bank / UTR reference'), {
            target: { value: 'NEFT-2' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save payout' }));

        await waitFor(() =>
            expect(createPartnerPayout).toHaveBeenCalledWith(
                expect.objectContaining({ partnerId: '55', amount: 40, reference: 'NEFT-2' })
            )
        );
        expect(getPartnerPayouts).toHaveBeenCalledTimes(2);
    });

    it('reverses a payout with a reason', async () => {
        (reversePartnerPayout as Mock).mockResolvedValue({ id: 10 });
        renderDetail('/system-user/accounting/partners/55/payments');

        await screen.findByText('NEFT-1');
        fireEvent.click(screen.getByRole('button', { name: 'Reverse' }));

        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being voided?'), {
            target: { value: 'sent twice' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Void entry' }));

        await waitFor(() =>
            expect(reversePartnerPayout).toHaveBeenCalledWith(
                expect.objectContaining({ id: 3, reason: 'sent twice' })
            )
        );
    });

    it('offers no reverse on a row that is already reversed', async () => {
        (getPartnerPayouts as Mock).mockResolvedValue({
            entries: [
                {
                    id: 3,
                    amount: 100,
                    calculatedAmount: null,
                    difference: null,
                    payoutDate: '2026-09-10',
                    reference: 'NEFT-1',
                    entryNumber: 'PAY-000002',
                    mode: 'NEFT',
                    note: null,
                    status: 'VOIDED',
                    entryKind: 'PAYOUT',
                    entryType: 'PAYOUT',
                    recordedByName: 'Ibrahim',
                    voidedByName: 'Ibrahim',
                    voidReason: 'sent twice',
                },
            ],
            recordsTotal: 1,
            owed: 153.4,
            earned: 153.4,
            paid: 0,
            lastPayoutDate: null,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail('/system-user/accounting/partners/55/payments');

        await screen.findByText('NEFT-1');
        expect(screen.queryAllByRole('button', { name: 'Reverse' })).toHaveLength(0);
    });

    it('disables recording without update permission', async () => {
        setState(stateWith(false));
        renderDetail('/system-user/accounting/partners/55/payments');

        await screen.findByText('NEFT-1');
        expect(screen.getByRole('button', { name: 'Record payout' })).toBeDisabled();
    });
});

describe('the debit notes tab', () => {
    const openTab = () => renderDetail('/system-user/accounting/partners/55/debit-notes');

    it('lists each debit note with what it took back and whether it still stands', async () => {
        openTab();

        const row = (await screen.findByText('PDN-000001')).closest('tr') as HTMLElement;
        expect(within(row).getByText('₹ 20.00')).toBeInTheDocument();
        expect(within(row).getByText('Share clawed back')).toBeInTheDocument();
        expect(within(row).getByText('Active')).toBeInTheDocument();
        expect(within(row).queryByText('Not applicable')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Record debit note' })).toBeEnabled();
        expect(
            screen.queryByRole('button', { name: 'Set opening balance' })
        ).not.toBeInTheDocument();
    });

    it('shows what the debit notes took back beside what was earned and paid', async () => {
        (getPartnerLedgerDetail as Mock).mockResolvedValue({
            partner: { ...PARTNER, debitNotes: 20, owed: 33.4 },
            summary: { ...SUMMARY, debitNotes: 20, owed: 33.4 },
            partnershipAccountConfigured: true,
        });
        renderDetail('/system-user/accounting/partners/55/transactions');

        await screen.findByText('P1');
        expect(screen.getAllByText('Debit Notes').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 20.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 33.40').length).toBeGreaterThan(0);
    });

    it('records a debit note typed in by hand, with no suggested figure', async () => {
        (createPartnerDebitNote as Mock).mockResolvedValue({ id: 22 });
        openTab();

        await screen.findByText('PDN-000001');
        fireEvent.click(screen.getByRole('button', { name: 'Record debit note' }));

        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '15' } });
        fireEvent.change(screen.getByPlaceholderText('Transaction ID, optional'), {
            target: { value: 'P3' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(createPartnerDebitNote).toHaveBeenCalledWith(
                expect.objectContaining({
                    partnerId: '55',
                    amount: 15,
                    gstInclusive: true,
                    againstCorporateTxnId: 'P3',
                })
            )
        );
        expect(getPartnerPayoutSuggestion).not.toHaveBeenCalled();
        expect(getPartnerDebitNotes).toHaveBeenCalledTimes(2);
    });

    it('reverses a debit note with a reason', async () => {
        (reversePartnerDebitNote as Mock).mockResolvedValue({ id: 23 });
        openTab();

        await screen.findByText('PDN-000001');
        fireEvent.click(screen.getByRole('button', { name: 'Reverse' }));

        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being voided?'), {
            target: { value: 'raised twice' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Void entry' }));

        await waitFor(() =>
            expect(reversePartnerDebitNote).toHaveBeenCalledWith(
                expect.objectContaining({ partnerId: '55', id: 21, reason: 'raised twice' })
            )
        );
        expect(reversePartnerPayout).not.toHaveBeenCalled();
    });

    it('shows a reversal as money given back and offers no reverse on it', async () => {
        (getPartnerDebitNotes as Mock).mockResolvedValue({
            entries: [
                {
                    id: 23,
                    partnerCredentialId: 55,
                    kind: 'DEBIT_NOTE',
                    reference: 'DN-1042',
                    entryNumber: 'PDN-000002',
                    amount: 20,
                    issueDate: '2026-10-08',
                    reason: 'raised twice',
                    againstCorporateTxnId: null,
                    status: 'OPEN',
                    posting: NOT_APPLICABLE,
                    entryType: 'REVERSAL',
                    reversesId: 21,
                    source: 'MANUAL',
                    slipKey: null,
                    slipName: null,
                    slipFormat: null,
                    recordedByName: 'Ibrahim',
                    voidedByName: null,
                    voidReason: null,
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });
        openTab();

        const row = (await screen.findByText('PDN-000002')).closest('tr') as HTMLElement;
        expect(within(row).getByText('- ₹ 20.00')).toBeInTheDocument();
        expect(within(row).getByText('Reversal')).toBeInTheDocument();
        expect(screen.queryAllByRole('button', { name: 'Reverse' })).toHaveLength(0);
    });

    it('disables recording and reversing without update permission', async () => {
        setState(stateWith(false));
        openTab();

        await screen.findByText('PDN-000001');
        expect(screen.getByRole('button', { name: 'Record debit note' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reverse' })).toBeDisabled();
    });
});

describe('the statement', () => {
    it('shows the grouped periods and the payouts that closed them', async () => {
        renderDetail('/system-user/accounting/partners/55/statement-of-accounts');

        expect(await screen.findByText(/3 transactions/)).toBeInTheDocument();
        expect(screen.getAllByText('Payout — NEFT').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Opening balance').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Closing balance').length).toBeGreaterThan(0);
    });

    it('says which side raises what Peko owes', async () => {
        renderDetail('/system-user/accounting/partners/55/statement-of-accounts');

        await screen.findByText(/3 transactions/);
        expect(screen.getByText(/A credit is share the partner earned/)).toBeInTheDocument();
    });
});

describe('an order whose entry never reached the books', () => {
    it('is listed with every amount dashed', async () => {
        (getPartnerTransactions as Mock).mockResolvedValue({
            entries: [
                {
                    id: 9,
                    corporateTxnId: 'P-NOJOURNAL',
                    transactionDate: '2026-09-18T10:00:00.000Z',
                    subscriberName: 'Al Rams Trading',
                    service: 'Flights',
                    totalAmount: null,
                    netPlatformFee: null,
                    netCommission: null,
                    couponTotal: null,
                    gatewayCharge: null,
                    shareBase: null,
                    shareExcludingGST: null,
                    shareGST: null,
                    partnerShare: null,
                    sharePercentageApplied: null,
                    status: 'SUCCESS',
                    posting: { state: 'notPosted', note: 'Not recorded yet', detail: null },
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });

        renderDetail('/system-user/accounting/partners/55/transactions');

        const row = (await screen.findByText('P-NOJOURNAL')).closest('tr') as HTMLElement;
        expect(within(row).getByText('Not posted')).toBeInTheDocument();
        expect(within(row).queryByText('₹ 1,180.00')).not.toBeInTheDocument();
        expect(within(row).getAllByText('—').length).toBeGreaterThanOrEqual(4);
        expect(within(row).queryByText('₹ 0.00')).not.toBeInTheDocument();
    });
});

describe('correcting a partner entry recorded by hand', () => {
    const giveReason = async (text: string) =>
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being changed?'), {
            target: { value: text },
        });

    it('edits a payout from the values it holds, without suggesting a new amount', async () => {
        (updatePartnerPayout as Mock).mockResolvedValue({ id: 3 });
        renderDetail('/system-user/accounting/partners/55/payments');
        await screen.findByText('NEFT-1');

        fireEvent.click(screen.getByLabelText('Edit Payout PAY-000001'));
        const amount = await screen.findByPlaceholderText('0.00');
        expect(amount).toHaveValue('100');
        expect(screen.queryByText(/The ledger makes this/)).not.toBeInTheDocument();
        expect(getPartnerPayoutSuggestion).not.toHaveBeenCalled();

        fireEvent.change(amount, { target: { value: '90' } });
        await giveReason('Bank kept a charge');
        fireEvent.click(screen.getByText('Save changes'));

        await waitFor(() =>
            expect(updatePartnerPayout).toHaveBeenCalledWith(
                expect.objectContaining({
                    partnerId: '55',
                    id: 3,
                    amount: 90,
                    payoutDate: '2026-09-10',
                    reference: 'NEFT-1',
                    mode: 'NEFT',
                    note: 'part settlement',
                    changeReason: 'Bank kept a charge',
                })
            )
        );
    });

    it('edits a debit note and deletes it', async () => {
        (updatePartnerDebitNote as Mock).mockResolvedValue({ id: 21 });
        (deletePartnerDebitNote as Mock).mockResolvedValue({ id: 21 });
        renderDetail('/system-user/accounting/partners/55/debit-notes');
        await screen.findByText('PDN-000001');

        fireEvent.click(screen.getByLabelText('Edit Debit note PDN-000001'));
        await screen.findByPlaceholderText('0.00');
        await giveReason('Wrong amount');
        fireEvent.click(screen.getByText('Save changes'));
        await waitFor(() =>
            expect(updatePartnerDebitNote).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 21,
                    amount: 20,
                    gstInclusive: true,
                    issueDate: '2026-10-07',
                    reason: 'Share clawed back',
                    againstCorporateTxnId: 'P1',
                    changeReason: 'Wrong amount',
                })
            )
        );

        fireEvent.click(screen.getByLabelText('Delete Debit note PDN-000001'));
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being deleted?'), {
            target: { value: 'Raised twice' },
        });
        fireEvent.click(screen.getByText('Delete entry'));
        await waitFor(() =>
            expect(deletePartnerDebitNote).toHaveBeenCalledWith(
                expect.objectContaining({ partnerId: '55', id: 21, reason: 'Raised twice' })
            )
        );
    });

    it('names an opening row as the opening balance and deletes it through its own call', async () => {
        (getPartnerPayouts as Mock).mockResolvedValue({
            entries: [
                {
                    id: 9,
                    partnerCredentialId: 55,
                    amount: 400,
                    calculatedAmount: null,
                    difference: null,
                    payoutDate: '2026-08-31',
                    reference: null,
                    entryNumber: 'OPB-000002',
                    mode: 'OTHER',
                    note: 'carried in',
                    status: 'ACTIVE',
                    posting: NOT_APPLICABLE,
                    entryKind: 'OPENING',
                    entryType: 'PAYOUT',
                    reversesId: null,
                    slipKey: null,
                    slipName: null,
                    slipFormat: null,
                    recordedByName: 'Ibrahim',
                    voidedByName: null,
                    voidReason: null,
                },
            ],
            recordsTotal: 1,
            owed: 400,
            earned: 0,
            paid: 0,
            debitNotes: 0,
            opening: 400,
            lastPayoutDate: null,
            lastPayoutAmount: null,
            openingBalanceSet: true,
            openingBalanceAsOf: '2026-08-31',
            page: 1,
            itemsPerPage: 10,
        });
        (deletePartnerOpeningBalance as Mock).mockResolvedValue({ id: 9 });
        renderDetail('/system-user/accounting/partners/55/payments');

        fireEvent.click(await screen.findByLabelText('Delete Opening balance'));
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being deleted?'), {
            target: { value: 'Set twice' },
        });
        fireEvent.click(screen.getByText('Delete entry'));
        await waitFor(() =>
            expect(deletePartnerOpeningBalance).toHaveBeenCalledWith(
                expect.objectContaining({ id: 9, reason: 'Set twice' })
            )
        );
    });
});

describe('telling the portal a partner payout is in the books', () => {
    it('marks a payout from its switch', async () => {
        const { entries, ...rest } = await (getPartnerPayouts as Mock)();
        (getPartnerPayouts as Mock).mockResolvedValue({
            ...rest,
            entries: entries.map((row: object) => ({ ...row, booksSynced: false })),
        });
        (markPartnerPayoutBooks as Mock).mockResolvedValue({
            id: 3,
            booksSynced: true,
            removed: false,
        });
        renderDetail('/system-user/accounting/partners/55/payments');
        await screen.findByText('NEFT-1');

        fireEvent.click(screen.getByLabelText('Payout PAY-000001 is in the books'));

        await waitFor(() =>
            expect(markPartnerPayoutBooks).toHaveBeenCalledWith(
                expect.objectContaining({ partnerId: '55', id: 3, synced: true })
            )
        );
    });
});

describe('GST on a debit note recorded by hand', () => {
    beforeEach(() => {
        (getPartnerLedgerDetail as Mock).mockResolvedValue({
            partner: PARTNER,
            summary: SUMMARY,
            partnershipAccountConfigured: true,
            gstRate: 18,
        });
    });

    it('adds GST on top of a debit note typed without it, and shows the split before saving', async () => {
        (createPartnerDebitNote as Mock).mockResolvedValue({ id: 22 });
        renderDetail('/system-user/accounting/partners/55/debit-notes');
        await screen.findByText('PDN-000001');

        fireEvent.click(screen.getByRole('button', { name: 'Record debit note' }));
        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });
        expect(screen.getByLabelText('Inclusive of GST')).toBeChecked();
        fireEvent.click(screen.getByLabelText('Exclusive of GST'));

        expect(
            await screen.findByText(
                /Taxable ₹ 100.00 \+ GST \(18%\) ₹ 18.00 = ₹ 118.00 on the ledger/
            )
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() =>
            expect(createPartnerDebitNote).toHaveBeenCalledWith(
                expect.objectContaining({ amount: 100, gstInclusive: false })
            )
        );
    });

    it('shows the GST kept on a debit note', async () => {
        (getPartnerDebitNotes as Mock).mockResolvedValue({
            entries: [
                {
                    id: 21,
                    partnerCredentialId: 55,
                    kind: 'DEBIT_NOTE',
                    reference: 'DN-1042',
                    entryNumber: 'PDN-000003',
                    amount: 118,
                    gstInclusive: false,
                    gstRate: 18,
                    taxableAmount: 100,
                    gstAmount: 18,
                    issueDate: '2026-10-07',
                    reason: 'Share clawed back',
                    againstCorporateTxnId: 'P1',
                    status: 'OPEN',
                    posting: NOT_APPLICABLE,
                    entryType: 'ENTRY',
                    reversesId: null,
                    source: 'MANUAL',
                    slipKey: null,
                    slipName: null,
                    slipFormat: null,
                    recordedByName: 'Ibrahim',
                    voidedByName: null,
                    voidReason: null,
                    booksSynced: false,
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail('/system-user/accounting/partners/55/debit-notes');

        const row = (await screen.findByText('PDN-000003')).closest('tr') as HTMLElement;
        expect(within(row).getByText('₹ 18.00')).toBeInTheDocument();
        expect(within(row).getByText('₹ 118.00')).toBeInTheDocument();
    });
});
