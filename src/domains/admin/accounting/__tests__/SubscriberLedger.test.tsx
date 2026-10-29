import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    downloadSubscriberOrderDocument,
    getSubscriberBills,
    getSubscriberLedgerDetail,
    getSubscriberLedgerList,
    getSubscriberTransactions,
    getSubscriberWallet,
} from '../api/subscriberLedger';
import { ADJUST_WALLET_PATH, WALLET_REPORT_PATH } from '../components/ledgers/SubscriberTabPanel';
import { LEDGER_LEAF_BY_KIND } from '../config/ledgerPaths';
import { AccountingShellProvider, DrillPanel } from '../context/AccountingShellContext';
import SubscriberLedgerDetail, {
    subscriberStatusPill,
    subscriberSubtitle,
    summaryScopeNote,
} from '../pages/SubscriberLedgerDetail';
import SubscriberLedgerList from '../pages/SubscriberLedgerList';

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

vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({
    default: () => ({
        partnerData: [
            { value: 'default', label: 'Default' },
            { value: '55', label: 'Gulf Reach' },
        ],
    }),
}));

vi.mock('../api/subscriberLedger', () => ({
    getSubscriberLedgerList: vi.fn(),
    getSubscriberLedgerDetail: vi.fn(),
    getSubscriberTransactions: vi.fn(),
    getSubscriberWallet: vi.fn(),
    getSubscriberBills: vi.fn(),
    downloadSubscriberOrderDocument: vi.fn(),
}));

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const POSTED = { state: 'posted', note: null, detail: null };
const NOT_APPLICABLE = { state: 'notApplicable', note: null, detail: null };
const REFUSED = { state: 'notPosted', note: 'Books refused it', detail: 'Account not found' };

const SUBSCRIBER = {
    id: 99,
    credentialId: 99,
    corporateUserId: 12,
    name: 'Al Rams Trading LLP',
    contactPersonName: 'Ibrahim',
    username: '100001266',
    email: 'a@alrams.in',
    partnerName: 'Gulf Reach',
    planName: 'Growth',
    kycStatus: 'verified',
    isActive: true,
    walletBalance: 27366,
};

const NEGATIVE_SUBSCRIBER = {
    ...SUBSCRIBER,
    id: 100,
    credentialId: 100,
    corporateUserId: 13,
    name: null,
    contactPersonName: 'Ravi Kumar',
    username: '100001267',
    partnerName: null,
    planName: 'Peko Free',
    isActive: false,
    walletBalance: -1580.88,
};

const SUMMARY = {
    topUps: 30000,
    withdrawals: 1000,
    spent: 1664,
    paidViaGateway: 5034,
    platformFee: 25,
    cashback: 30,
    walletBalance: 27366,
    ledgerBalance: 27366,
    walletDifference: 0,
};

const UNNAMED_SUBSCRIBER = {
    ...SUBSCRIBER,
    id: 101,
    credentialId: 101,
    corporateUserId: null,
    name: null,
    contactPersonName: null,
    username: '100001268',
    partnerName: null,
    planName: null,
    walletBalance: 0,
};

const LIST_RESPONSE = {
    subscribers: [SUBSCRIBER, NEGATIVE_SUBSCRIBER, UNNAMED_SUBSCRIBER],
    recordsTotal: 3,
    page: 1,
    itemsPerPage: 10,
    kpis: {
        totalSubscribers: 2,
        walletBalancesHeld: 31250.5,
        subscribersWithBalance: 1,
        gmvThisMonth: 5000,
        spentThisMonth: 1264,
        platformFeeThisMonth: 25,
        cashbackThisMonth: 30,
    },
    generatedAt: '2026-09-18T08:30:00.000Z',
    cached: false,
};

const paged = <T,>(entries: T[]) => ({
    entries,
    recordsTotal: entries.length,
    page: 1,
    itemsPerPage: 10,
});

const dispatch = vi.fn();

vi.setConfig({ testTimeout: 20000 });

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
    // GenericTable folds any column past the viewport into the expandable row, and jsdom
    // is 1024 wide by default, which is narrower than these tables.
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(URL, 'createObjectURL', {
        value: vi.fn(() => 'blob:statement'),
        writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

const renderList = () =>
    render(
        <MemoryRouter>
            <SubscriberLedgerList />
        </MemoryRouter>
    );

const renderDetail = (url: string, setPanel = vi.fn()) => {
    render(
        <AccountingShellProvider value={setPanel}>
            <MemoryRouter initialEntries={[url]}>
                <Routes>
                    <Route
                        path="/system-user/accounting/subscribers/:id/:tab?"
                        element={<SubscriberLedgerDetail />}
                    />
                </Routes>
            </MemoryRouter>
        </AccountingShellProvider>
    );
    return setPanel;
};

const lastPanel = (setPanel: Mock): DrillPanel | null => {
    const calls = setPanel.mock.calls.filter(([value]) => value !== null);
    return calls.length ? calls[calls.length - 1][0] : null;
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
    (getSubscriberLedgerList as Mock).mockResolvedValue(LIST_RESPONSE);
    (getSubscriberLedgerDetail as Mock).mockResolvedValue({
        subscriber: SUBSCRIBER,
        summary: SUMMARY,
    });
    (getSubscriberTransactions as Mock).mockResolvedValue(
        paged([
            {
                id: 7,
                corporateTxnId: '1787561688848',
                transactionDate: '2026-09-05T10:00:00.000Z',
                service: 'Electricity Bill',
                orderAmount: 1224,
                discount: 50,
                paidFromWallet: 674,
                paidViaGateway: 500,
                status: 'SUCCESS',
                paymentMode: 'PAYMENT GATEWAY + WALLET',
                receiptAvailable: true,
                posting: POSTED,
            },
            {
                id: 8,
                corporateTxnId: '1787561688001',
                transactionDate: '2026-08-02T10:00:00.000Z',
                service: 'Flights',
                orderAmount: 400,
                discount: null,
                paidFromWallet: null,
                paidViaGateway: null,
                status: 'REFUNDED',
                paymentMode: 'WALLET',
                receiptAvailable: false,
                posting: { state: 'notPosted', note: 'Refund: Not recorded yet', detail: null },
            },
        ])
    );
    (getSubscriberWallet as Mock).mockResolvedValue(
        paged([
            {
                id: '7-2',
                transactionDate: '2026-09-14T09:00:00.000Z',
                reference: 'GW1',
                type: 'Cashback',
                particulars: 'Cashback — Flights',
                remark: null,
                debit: null,
                credit: 30,
                balanceAfter: 29030,
                posting: REFUSED,
            },
            {
                id: '5-1',
                transactionDate: '2026-09-12T09:00:00.000Z',
                reference: '1758400000001',
                type: 'Admin withdrawal',
                particulars: 'Funds withdrawn by Rahul',
                remark: 'wrong account',
                debit: 1000,
                credit: null,
                balanceAfter: 29000,
                posting: NOT_APPLICABLE,
            },
            {
                id: '4-2',
                transactionDate: '2026-09-10T12:00:00.000Z',
                reference: '1787561688848',
                type: 'Cashback reversal',
                particulars: 'Cashback reversed — Electricity Bill',
                remark: null,
                debit: 12,
                credit: null,
                balanceAfter: 30000,
                posting: POSTED,
            },
            {
                id: '4-1',
                transactionDate: '2026-09-10T12:00:00.000Z',
                reference: '1787561688848',
                type: 'Refund',
                particulars: 'Refund — Electricity Bill',
                remark: null,
                debit: null,
                credit: 674,
                balanceAfter: 30012,
                posting: POSTED,
            },
            {
                id: '3-2',
                transactionDate: '2026-09-07T09:00:00.000Z',
                reference: '1758400000000',
                type: 'Admin credit',
                particulars: 'Funds added by Rahul',
                remark: 'credit note settlement',
                debit: null,
                credit: 5000,
                balanceAfter: 29338,
                posting: NOT_APPLICABLE,
            },
            {
                id: '2-2',
                transactionDate: '2026-09-05T10:00:00.000Z',
                reference: '1787561688848',
                type: 'Cashback',
                particulars: 'Cashback — Electricity Bill',
                remark: null,
                debit: null,
                credit: 12,
                balanceAfter: 24338,
                posting: POSTED,
            },
            {
                id: '2-1',
                transactionDate: '2026-09-05T10:00:00.000Z',
                reference: '1787561688848',
                type: 'Purchase',
                particulars: 'Purchase — Electricity Bill',
                remark: null,
                debit: 674,
                credit: null,
                balanceAfter: 24326,
                posting: POSTED,
            },
            {
                id: '1-2',
                transactionDate: '2026-09-02T04:00:00.000Z',
                reference: '1787561688000',
                type: 'Top-up',
                particulars: 'Wallet top-up',
                remark: 'Fund added through gateway',
                debit: null,
                credit: 25000,
                balanceAfter: 25000,
                posting: NOT_APPLICABLE,
            },
        ])
    );
    (getSubscriberBills as Mock).mockResolvedValue(
        paged([
            {
                id: '7:fullInvoice',
                orderId: 7,
                corporateTxnId: '1787561688848',
                transactionDate: '2026-09-05T10:00:00.000Z',
                service: 'Electricity Bill',
                document: 'fullInvoice',
                kind: 'invoice',
                label: 'Invoice',
                documentNumber: 'PI-2026-0101',
                issuedDate: '2026-09-05',
                taxable: 1016.1,
                gst: 182.9,
                total: 1199,
            },
            {
                id: '7:pekoInvoice',
                orderId: 7,
                corporateTxnId: '1787561688848',
                transactionDate: '2026-09-05T10:00:00.000Z',
                service: 'Electricity Bill',
                document: 'pekoInvoice',
                kind: 'platformFeeInvoice',
                label: 'Platform Fee Invoice',
                documentNumber: 'PI-2026-0102',
                issuedDate: '2026-09-05',
                taxable: 21.19,
                gst: 3.81,
                total: 25,
            },
        ])
    );
});

describe('subscribers is an api backed ledger', () => {
    it('has three read-only tabs, cashback on the wallet tab and peko plans on transactions, and no record action', () => {
        const leaf = LEDGER_LEAF_BY_KIND.subscribers;
        expect(leaf.tabs).toEqual(['transactions', 'wallet', 'bills']);
        expect(leaf.recordActions).toBeUndefined();
    });

    it('points wallet writes at the screens that own them', () => {
        expect(ADJUST_WALLET_PATH).toBe('/system-user/accounts/transfer-funds');
        expect(WALLET_REPORT_PATH).toBe('/system-user/reports/wallet-reports');
    });

    it('builds the panel subtitle without repeating the name and with the default partner', () => {
        expect(subscriberSubtitle(SUBSCRIBER)).toBe('100001266 · Gulf Reach · Growth');
        expect(subscriberSubtitle(NEGATIVE_SUBSCRIBER)).toBe(
            '100001267 · Peko (Default) · Peko Free'
        );
        expect(subscriberSubtitle(UNNAMED_SUBSCRIBER)).toBe('Peko (Default)');
    });

    it('derives the status pill from the account flag and the wallet sign', () => {
        expect(subscriberStatusPill(SUBSCRIBER)).toEqual({ label: 'Active', tone: 'success' });
        expect(subscriberStatusPill({ isActive: true, walletBalance: -1 })).toEqual({
            label: 'Negative balance',
            tone: 'warning',
        });
        expect(subscriberStatusPill(NEGATIVE_SUBSCRIBER)).toEqual({
            label: 'Inactive',
            tone: 'neutral',
        });
    });

    it('mentions admin withdrawals in the scope note only when there were some', () => {
        const range = { from: '2026-09-01', to: '2026-09-19' };
        expect(summaryScopeNote(range, SUMMARY)).toContain('₹ 1,000.00');
        expect(summaryScopeNote(range, SUMMARY)).toContain('01 Sep 2026 to 19 Sep 2026');
        expect(summaryScopeNote(range, { ...SUMMARY, withdrawals: 0 })).not.toContain(
            'withdrawals'
        );
    });
});

describe('SubscriberLedgerList', () => {
    it('requests the first page and renders the kpis from the api', async () => {
        renderList();

        await waitFor(() => expect(getSubscriberLedgerList).toHaveBeenCalled());
        expect(getSubscriberLedgerList).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            refresh: false,
            page: 1,
            itemsPerPage: 10,
            searchText: '',
        });

        expect(await screen.findByText('Total Subscribers')).toBeInTheDocument();
        expect(screen.getByText('Cashback and Rewards')).toBeInTheDocument();
        expect(screen.getByText('GMV This Month')).toBeInTheDocument();
        expect(screen.getByText('Cashbacks Spent This Month')).toBeInTheDocument();
        expect(screen.getByText('Cashbacks Provided This Month')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 31,250.50').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 5,000.00').length).toBeGreaterThan(0);
    });

    it('drops the top-ups card and the old card names', async () => {
        renderList();

        await screen.findByText('Total Subscribers');
        [
            'Top-ups This Month',
            'Wallet Balances Held',
            'Spent This Month',
            'Cashback This Month',
        ].forEach(title => expect(screen.queryByText(title)).not.toBeInTheDocument());
    });

    it('shows each subscriber with its account id, partner, plan, balance and status', async () => {
        renderList();

        expect(await screen.findByText('Al Rams Trading LLP')).toBeInTheDocument();
        expect(screen.getAllByText('100001266').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Gulf Reach').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Growth').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);

        const negative = screen.getAllByText('₹ -1,580.88')[0];
        expect(negative).toHaveClass('text-red-600');
    });

    it('labels a subscriber with no partner as Peko and never prints the account id twice', async () => {
        renderList();

        await screen.findByText('Al Rams Trading LLP');
        expect(screen.getAllByText('Peko (Default)').length).toBeGreaterThan(1);
        expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
        expect(screen.getAllByText('100001267').length).toBeGreaterThan(0);

        const accountIdCells = screen.getAllByText('100001268');
        expect(accountIdCells.length).toBeGreaterThan(0);
        accountIdCells.forEach(cell => expect(cell).not.toHaveClass('text-navTextColor'));
    });

    it('opens a subscriber by its credential id when the row is clicked', async () => {
        renderList();

        fireEvent.click(await screen.findByText('Al Rams Trading LLP'));

        expect(navigateMock).toHaveBeenCalledWith(
            '/system-user/accounting/subscribers/99/transactions'
        );
    });

    it('refreshes the cached kpis on demand', async () => {
        renderList();
        await screen.findByText('Al Rams Trading LLP');

        fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

        await waitFor(() =>
            expect(getSubscriberLedgerList).toHaveBeenLastCalledWith(
                expect.objectContaining({ refresh: true })
            )
        );
    });

    it('lists every partner until one is picked', async () => {
        renderList();

        await screen.findByText('Al Rams Trading LLP');
        expect(screen.getByText('All partners')).toBeInTheDocument();
        expect(getSubscriberLedgerList).toHaveBeenLastCalledWith(
            expect.not.objectContaining({ partnerId: expect.anything() })
        );
    });

    it('offers Peko itself, named as the Partner column names it, and every partner', async () => {
        renderList();
        await screen.findByText('Al Rams Trading LLP');

        fireEvent.mouseDown(screen.getByText('All partners'));

        expect(await screen.findByTitle('Peko (Default)')).toBeInTheDocument();
        expect(await screen.findByTitle('Gulf Reach')).toBeInTheDocument();
    });

    it('asks for the partner picked, from the first page', async () => {
        renderList();
        await screen.findByText('Al Rams Trading LLP');

        fireEvent.mouseDown(screen.getByText('All partners'));
        fireEvent.click(await screen.findByTitle('Gulf Reach'));

        await waitFor(() =>
            expect(getSubscriberLedgerList).toHaveBeenLastCalledWith(
                expect.objectContaining({ partnerId: '55', page: 1 })
            )
        );
    });

    it('asks for Peko`s own subscribers when Peko (Default) is picked', async () => {
        renderList();
        await screen.findByText('Al Rams Trading LLP');

        fireEvent.mouseDown(screen.getByText('All partners'));
        fireEvent.click(await screen.findByTitle('Peko (Default)'));

        await waitFor(() =>
            expect(getSubscriberLedgerList).toHaveBeenLastCalledWith(
                expect.objectContaining({ partnerId: 'default' })
            )
        );
    });

    it('goes back to every partner when the choice is cleared', async () => {
        const { container } = renderList();
        await screen.findByText('Al Rams Trading LLP');
        fireEvent.mouseDown(screen.getByText('All partners'));
        fireEvent.click(await screen.findByTitle('Gulf Reach'));
        await waitFor(() =>
            expect(getSubscriberLedgerList).toHaveBeenLastCalledWith(
                expect.objectContaining({ partnerId: '55' })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);

        await waitFor(() =>
            expect(getSubscriberLedgerList).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ partnerId: expect.anything() })
            )
        );
    });

    it('says nothing matches when the partner picked has no subscribers', async () => {
        renderList();
        await screen.findByText('Al Rams Trading LLP');
        (getSubscriberLedgerList as Mock).mockResolvedValue({
            ...LIST_RESPONSE,
            subscribers: [],
            recordsTotal: 0,
        });

        fireEvent.mouseDown(screen.getByText('All partners'));
        fireEvent.click(await screen.findByTitle('Gulf Reach'));

        expect(await screen.findByText('No subscribers match your search.')).toBeInTheDocument();
    });
});

describe('SubscriberLedgerDetail', () => {
    it('registers the drill panel with the four tabs and the account details', async () => {
        const setPanel = renderDetail('/system-user/accounting/subscribers/99/transactions');

        await waitFor(() => expect(lastPanel(setPanel)).not.toBeNull());
        const panel = lastPanel(setPanel)!;
        expect(panel.title).toBe('Al Rams Trading LLP');
        expect(panel.subtitle).toBe('100001266 · Gulf Reach · Growth');
        expect(panel.status).toEqual({ label: 'Active', tone: 'success' });
        expect(panel.tabs.map(tab => tab.key)).toEqual(LEDGER_LEAF_BY_KIND.subscribers.tabs);
        expect(panel.backTo).toBe('/system-user/accounting/subscribers');

        panel.onTabChange('wallet');
        expect(navigateMock).toHaveBeenCalledWith('/system-user/accounting/subscribers/99/wallet');
    });

    it('redirects an unknown tab to transactions', () => {
        renderDetail('/system-user/accounting/subscribers/99/deposits');
        expect(screen.getByTestId('navigate')).toHaveTextContent(
            '/system-user/accounting/subscribers/99/transactions'
        );
    });

    it('shows the six summary tiles scoped by the range picker', async () => {
        renderDetail('/system-user/accounting/subscribers/99/transactions');

        expect(await screen.findByText('Top-ups')).toBeInTheDocument();
        expect(screen.getByText('Spent from Wallet')).toBeInTheDocument();
        expect(screen.getAllByText('Paid via Gateway').length).toBeGreaterThan(0);
        expect(screen.getByText('Platform Fee')).toBeInTheDocument();
        expect(screen.getByText('Cashback')).toBeInTheDocument();
        expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 27,366.00').length).toBeGreaterThan(0);
        expect(screen.getByText(/Admin withdrawals of ₹ 1,000.00/)).toBeInTheDocument();
        expect(screen.queryByText(/differ by/)).not.toBeInTheDocument();

        expect(getSubscriberLedgerDetail).toHaveBeenCalledWith(
            expect.objectContaining({
                credentialId: '99',
                from: expect.any(String),
                to: expect.any(String),
            })
        );
    });

    it('warns when the wallet moved without a ledger row', async () => {
        (getSubscriberLedgerDetail as Mock).mockResolvedValue({
            subscriber: SUBSCRIBER,
            summary: { ...SUMMARY, walletBalance: 27866, walletDifference: 500 },
        });

        renderDetail('/system-user/accounting/subscribers/99/transactions');

        expect(await screen.findByText(/differ by ₹ 500.00/)).toBeInTheDocument();
        expect(screen.getByText(/The wallet is above/)).toBeInTheDocument();
    });

    it('shows a not-found state when the api has no such subscriber', async () => {
        (getSubscriberLedgerDetail as Mock).mockResolvedValue(false);

        renderDetail('/system-user/accounting/subscribers/404/transactions');

        expect(await screen.findByText('Subscriber not found')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Back to Subscribers' }));
        expect(navigateMock).toHaveBeenCalledWith('/system-user/accounting/subscribers');
    });

    it('lists every order with its subscriber side split and real status', async () => {
        renderDetail('/system-user/accounting/subscribers/99/transactions');

        expect(await screen.findByText('1787561688848')).toBeInTheDocument();
        expect(getSubscriberTransactions).toHaveBeenCalledWith(
            expect.objectContaining({ credentialId: '99', page: 1, itemsPerPage: 10 })
        );
        expect(screen.getAllByText('Electricity Bill').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 1,224.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 674.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 500.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Success').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Refunded').length).toBeGreaterThan(0);
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
        expect(screen.queryByRole('button', { name: /Record/ })).not.toBeInTheDocument();
    });

    it('lists every wallet movement with its type, reference and balance, and links out to the owning screens', async () => {
        renderDetail('/system-user/accounting/subscribers/99/wallet');

        expect(await screen.findByText('Purchase — Electricity Bill')).toBeInTheDocument();
        [
            'Purchase',
            'Refund',
            'Cashback reversal',
            'Top-up',
            'Admin credit',
            'Admin withdrawal',
        ].forEach(type => expect(screen.getAllByText(type).length).toBeGreaterThan(0));
        expect(screen.getAllByText('Cashback').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('Cashback — Flights')).toBeInTheDocument();
        expect(screen.getByText('Refund — Electricity Bill')).toBeInTheDocument();
        expect(screen.getByText('Cashback reversed — Electricity Bill')).toBeInTheDocument();
        expect(screen.getByText('Funds added by Rahul')).toBeInTheDocument();
        expect(screen.getByText('credit note settlement')).toBeInTheDocument();
        expect(screen.getByText('Funds withdrawn by Rahul')).toBeInTheDocument();
        expect(screen.getByText('Fund added through gateway')).toBeInTheDocument();
        expect(screen.getAllByText('1787561688848').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 30,012.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 29,000.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Not posted').length).toBeGreaterThan(0);
        expect(screen.getByText('Books refused it')).toBeInTheDocument();
        expect(screen.getAllByText('Not applicable').length).toBe(3);
        expect(
            screen.queryByRole('button', { name: /^(Receipt|Invoice) for/ })
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Top-ups')).not.toBeInTheDocument();

        expect(screen.getByRole('link', { name: /Adjust wallet/ })).toHaveAttribute(
            'href',
            '/system-user/accounts/transfer-funds'
        );
        expect(screen.getByRole('link', { name: /Wallet report/ })).toHaveAttribute(
            'href',
            '/system-user/reports/wallet-reports'
        );
    });

    it('lists every invoice issued, one row each for the invoice and the platform fee invoice of an order, and no receipt', async () => {
        renderDetail('/system-user/accounting/subscribers/99/bills');

        expect(await screen.findByText('PI-2026-0101')).toBeInTheDocument();
        expect(screen.getByText('PI-2026-0102')).toBeInTheDocument();
        expect(screen.queryByText('PR-2026-0007')).not.toBeInTheDocument();
        expect(screen.getAllByText('1787561688848')).toHaveLength(2);
        expect(screen.getByText('Invoice')).toBeInTheDocument();
        expect(screen.getByText('Platform Fee Invoice')).toBeInTheDocument();
        expect(screen.queryByText('Receipt')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Receipt for/ })).not.toBeInTheDocument();
        expect(screen.getByText('₹ 1,016.10')).toBeInTheDocument();
        expect(screen.getByText('₹ 182.90')).toBeInTheDocument();
        expect(screen.getByText('₹ 1,199.00')).toBeInTheDocument();
        expect(screen.getByText('₹ 21.19')).toBeInTheDocument();
        expect(screen.getByText('₹ 3.81')).toBeInTheDocument();
        expect(screen.getByText('₹ 25.00')).toBeInTheDocument();
        expect(screen.queryByText('Posted')).not.toBeInTheDocument();
        expect(screen.queryByText('Commission Invoice')).not.toBeInTheDocument();
    });

    it('says whether each order reached the books, naming the refund when that is the part missing', async () => {
        renderDetail('/system-user/accounting/subscribers/99/transactions');

        const paid = (await screen.findByText('1787561688848')).closest('tr') as HTMLElement;
        const refunded = screen.getByText('1787561688001').closest('tr') as HTMLElement;
        expect(within(paid).getByText('Posted')).toBeInTheDocument();
        expect(within(refunded).getByText('Not posted')).toBeInTheDocument();
        expect(within(refunded).getByText('Refund: Not recorded yet')).toBeInTheDocument();
    });

    it('downloads each bill by its own document', async () => {
        (downloadSubscriberOrderDocument as Mock).mockResolvedValue(new Blob(['%PDF']));
        renderDetail('/system-user/accounting/subscribers/99/bills');

        await screen.findByText('PI-2026-0102');
        fireEvent.click(
            screen.getAllByRole('button', {
                name: 'Download Platform Fee Invoice for 1787561688848',
            })[0]
        );

        await waitFor(() =>
            expect(downloadSubscriberOrderDocument).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                credentialId: '99',
                orderId: 7,
                document: 'pekoInvoice',
            })
        );
        await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());

        fireEvent.click(
            screen.getAllByRole('button', { name: 'Download Invoice for 1787561688848' })[0]
        );

        await waitFor(() =>
            expect(downloadSubscriberOrderDocument).toHaveBeenCalledWith(
                expect.objectContaining({ orderId: 7, document: 'fullInvoice' })
            )
        );
    });

    it('offers the payment receipt on a transaction that has one, and no invoice there', async () => {
        renderDetail('/system-user/accounting/subscribers/99/transactions');

        await screen.findByText('1787561688848');
        expect(screen.getAllByLabelText('Download Receipt for 1787561688848')).toHaveLength(1);
        expect(screen.queryByLabelText(/Receipt for 1787561688001/)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Invoice for/)).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('Download Receipt for 1787561688848'));
        await waitFor(() =>
            expect(downloadSubscriberOrderDocument).toHaveBeenCalledWith(
                expect.objectContaining({ orderId: 7, document: 'receipt' })
            )
        );
    });

    it('says so when a document could not be downloaded', async () => {
        (downloadSubscriberOrderDocument as Mock).mockResolvedValue(false);
        renderDetail('/system-user/accounting/subscribers/99/bills');

        await screen.findByText('PI-2026-0101');
        fireEvent.click(
            screen.getAllByRole('button', { name: 'Download Invoice for 1787561688848' })[0]
        );

        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        description: 'Could not download the invoice',
                        variant: 'error',
                    }),
                })
            )
        );
    });

    it('sends an old cashback link to the transactions tab', () => {
        renderDetail('/system-user/accounting/subscribers/99/cashback');
        expect(screen.getByTestId('navigate')).toHaveTextContent(
            '/system-user/accounting/subscribers/99/transactions'
        );
    });

    it('sends an old peko subscriptions link to the transactions tab', () => {
        renderDetail('/system-user/accounting/subscribers/99/peko-subscriptions');
        expect(screen.getByTestId('navigate')).toHaveTextContent(
            '/system-user/accounting/subscribers/99/transactions'
        );
    });
});

describe('a bill stored without its figures', () => {
    it('dashes the number and every amount on the row, and still offers the download', async () => {
        (getSubscriberBills as Mock).mockResolvedValue(
            paged([
                {
                    id: '31:pekoInvoice',
                    orderId: 31,
                    corporateTxnId: 'S-NOFIGURES',
                    transactionDate: '2026-09-18T10:00:00.000Z',
                    service: 'Flights',
                    document: 'pekoInvoice',
                    kind: 'platformFeeInvoice',
                    label: 'Platform Fee Invoice',
                    documentNumber: null,
                    issuedDate: null,
                    taxable: null,
                    gst: null,
                    total: null,
                },
            ])
        );

        renderDetail('/system-user/accounting/subscribers/99/bills');

        expect(await screen.findByText('S-NOFIGURES')).toBeInTheDocument();
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);
        expect(screen.queryByText('₹ 0.00')).not.toBeInTheDocument();
        expect(
            screen.getAllByRole('button', {
                name: 'Download Platform Fee Invoice for S-NOFIGURES',
            })[0]
        ).toBeEnabled();
    });
});
