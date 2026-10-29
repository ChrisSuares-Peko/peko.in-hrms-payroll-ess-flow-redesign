import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import dayjs from 'dayjs';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    createVendorCommission,
    createVendorCostOfSales,
    createVendorCreditNote,
    createVendorDebitNote,
    createVendorDeposit,
    createVendorOpeningBalance,
    deleteVendorCreditNote,
    deleteVendorDeposit,
    deleteVendorOpeningBalance,
    downloadVendorStatement,
    downloadVendorTaxDocument,
    getVendorCommissions,
    getVendorCostOfSales,
    getVendorCreditNotes,
    getVendorDebitNotes,
    getVendorDeposits,
    getVendorLedgerDetail,
    getVendorLedgerList,
    getVendorLedgerSlip,
    getVendorStatement,
    getVendorTransactions,
    markVendorDepositBooks,
    reverseVendorDeposit,
    updateVendorCommission,
    updateVendorDeposit,
    updateVendorOpeningBalance,
} from '../api/vendorLedger';
import { REMOVE_FROM_PORTAL_TEXT } from '../components/ledgers/BooksMarkCell';
import { DELETE_ENTRY_TEXT } from '../components/ledgers/VendorEntryDrawers';
import { LEDGER_KINDS, LEDGER_LEAF_BY_KIND } from '../config/ledgerPaths';
import { AccountingShellProvider, DrillPanel } from '../context/AccountingShellContext';
import VendorLedgerDetail from '../pages/VendorLedgerDetail';
import VendorLedgerList from '../pages/VendorLedgerList';

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

vi.mock('../api/vendorLedger', () => ({
    getVendorLedgerList: vi.fn(),
    getVendorLedgerDetail: vi.fn(),
    getVendorTransactions: vi.fn(),
    getVendorCommissions: vi.fn(),
    getVendorDeposits: vi.fn(),
    getVendorCreditNotes: vi.fn(),
    getVendorCostOfSales: vi.fn(),
    getVendorDebitNotes: vi.fn(),
    getVendorLedgerSlip: vi.fn(),
    createVendorDeposit: vi.fn(),
    createVendorCreditNote: vi.fn(),
    createVendorCommission: vi.fn(),
    createVendorCostOfSales: vi.fn(),
    createVendorDebitNote: vi.fn(),
    createVendorOpeningBalance: vi.fn(),
    reverseVendorDeposit: vi.fn(),
    reverseVendorCreditNote: vi.fn(),
    reverseVendorCommission: vi.fn(),
    reverseVendorCostOfSales: vi.fn(),
    reverseVendorDebitNote: vi.fn(),
    updateVendorDeposit: vi.fn(),
    deleteVendorDeposit: vi.fn(),
    updateVendorOpeningBalance: vi.fn(),
    deleteVendorOpeningBalance: vi.fn(),
    updateVendorCreditNote: vi.fn(),
    deleteVendorCreditNote: vi.fn(),
    updateVendorCommission: vi.fn(),
    deleteVendorCommission: vi.fn(),
    updateVendorCostOfSales: vi.fn(),
    deleteVendorCostOfSales: vi.fn(),
    updateVendorDebitNote: vi.fn(),
    deleteVendorDebitNote: vi.fn(),
    markVendorDepositBooks: vi.fn(),
    markVendorCreditNoteBooks: vi.fn(),
    markVendorCommissionBooks: vi.fn(),
    markVendorCostOfSalesBooks: vi.fn(),
    markVendorDebitNoteBooks: vi.fn(),
    getVendorStatement: vi.fn(),
    downloadVendorStatement: vi.fn(),
    downloadVendorTaxDocument: vi.fn(),
}));

const STATE = {
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
                                services: [{ service: 'Vendors', hasAccess: true, update: true }],
                            },
                        ],
                    },
                ],
            },
        },
    },
};

const READONLY_STATE = {
    reducer: {
        ...STATE.reducer,
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
                                services: [{ service: 'Vendors', hasAccess: true, update: false }],
                            },
                        ],
                    },
                ],
            },
        },
    },
};

const POSTED = { state: 'posted', note: null, detail: null };
const NOT_APPLICABLE = { state: 'notApplicable', note: null, detail: null };
const REFUSED = { state: 'notPosted', note: 'Books refused it', detail: 'Account not found' };
const NOT_RECORDED = { state: 'notPosted', note: 'Not recorded yet', detail: null };

const VENDOR = {
    id: 1,
    vendorName: 'Cleartrip Private Limited',
    type: 'Travel',
    gstNo: null,
    isActive: true,
    services: ['Flights', 'Hotels'],
    serviceCount: 2,
    deposited: 200000,
    creditNotes: 1500,
    used: 89500,
    commission: 9000,
    available: 121500,
    lowBalance: false,
};

const LOW_VENDOR = {
    ...VENDOR,
    id: 2,
    vendorName: 'Amer Hub Services',
    services: ['Document Attestation'],
    serviceCount: 1,
    deposited: 20000,
    creditNotes: 0,
    used: 18000,
    commission: 0,
    available: 2000,
    lowBalance: true,
};

const LIST_RESPONSE = {
    vendors: [VENDOR, LOW_VENDOR],
    recordsTotal: 2,
    page: 1,
    itemsPerPage: 10,
    kpis: {
        totalVendors: 2,
        depositsHeld: 123500,
        lowBalanceVendors: 1,
        depositedThisMonth: 425000,
        usedThisMonth: 318640.4,
        commissionThisMonth: 41208.75,
        openCreditNotes: 4,
        lowBalanceThreshold: 25000,
    },
    vendorDepositsAccountConfigured: true,
    generatedAt: '2026-09-18T08:30:00.000Z',
    cached: false,
};

const dispatch = vi.fn();

// The drawer tests render antd Drawer plus Formik plus the upload field, which is slow
// enough in jsdom to sit right on the default five second limit.
vi.setConfig({ testTimeout: 20000 });

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
    // GenericTable folds any column past the viewport into the expandable row, and jsdom
    // is 1024 wide by default, which is narrower than these tables.
    Object.defineProperty(window, 'innerWidth', { value: 2200, writable: true });
});

const setState = (state: unknown) => {
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
};

const renderList = () =>
    render(
        <MemoryRouter>
            <VendorLedgerList />
        </MemoryRouter>
    );

const renderDetail = (url: string, setPanel = vi.fn()) => {
    render(
        <AccountingShellProvider value={setPanel}>
            <MemoryRouter initialEntries={[url]}>
                <Routes>
                    <Route
                        path="/system-user/accounting/vendors/:id/:tab?"
                        element={<VendorLedgerDetail />}
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
    setState(STATE);
    (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
    (getVendorLedgerList as Mock).mockResolvedValue(LIST_RESPONSE);
    (getVendorLedgerDetail as Mock).mockResolvedValue({
        vendor: VENDOR,
        summary: {
            deposited: 200000,
            creditNotes: 1500,
            manualCommission: 0,
            used: 89500,
            commission: 9000,
            openingBalance: 3000,
            totalTransaction: 91000,
            available: 121500,
            openingBalanceSet: true,
            openingBalanceAsOf: '2026-08-19',
        },
        vendorDepositsAccountConfigured: true,
    });
    (getVendorTransactions as Mock).mockResolvedValue({
        entries: [
            {
                id: 7,
                corporateTxnId: '1789647165639',
                transactionDate: '2026-09-17T12:13:00.000Z',
                service: 'Flights',
                customer: '100001266',
                vendorAmount: 361.8,
                commission: 10.8,
                markup: null,
                receivable: 351,
                commissionMode: 'MARGIN',
                status: 'SUCCESS',
                paymentMode: 'PAYMENT GATEWAY',
                posting: POSTED,
            },
            {
                id: 8,
                corporateTxnId: '1789647165640',
                transactionDate: '2026-09-16T12:13:00.000Z',
                service: 'Flights',
                customer: '100001266',
                vendorAmount: 500,
                commission: 30,
                markup: null,
                receivable: 450,
                commissionMode: 'MIXED',
                status: 'FAILED',
                refunded: true,
                paymentMode: 'WALLET',
                posting: {
                    state: 'notPosted',
                    note: 'Refund: Books refused it',
                    detail: 'Account not found',
                },
            },
            {
                id: 9,
                corporateTxnId: '1789647165641',
                transactionDate: '2026-09-15T12:13:00.000Z',
                service: 'Peko Subscription',
                customer: '100001266',
                vendorAmount: null,
                commission: null,
                markup: null,
                receivable: null,
                commissionMode: null,
                status: 'SUCCESS',
                paymentMode: 'WALLET',
                posting: NOT_RECORDED,
            },
            {
                id: 10,
                corporateTxnId: '1789647165642',
                transactionDate: '2026-09-14T12:13:00.000Z',
                service: 'Gift Cards',
                customer: '100001266',
                vendorAmount: 882,
                commission: null,
                markup: 100,
                receivable: null,
                commissionMode: 'PRINCIPAL_MARKUP',
                status: 'SUCCESS',
                paymentMode: 'PAYMENT GATEWAY',
                posting: POSTED,
            },
        ],
        recordsTotal: 4,
        page: 1,
        itemsPerPage: 10,
    });
    (getVendorCommissions as Mock).mockResolvedValue({
        entries: [
            {
                id: 7,
                source: 'ORDER',
                corporateTxnId: '1789647165639',
                reference: null,
                entryNumber: null,
                transactionDate: '2026-09-17T12:13:00.000Z',
                service: 'Flights',
                reason: null,
                orderAmount: 361.8,
                commissionExcludingGST: 9.15,
                commissionIncludingGST: 10.8,
                commissionReversed: 5.4,
                commissionNet: 5.4,
                refunded: true,
                posting: POSTED,
                status: null,
                entryType: null,
                recordedByName: null,
                hasDocument: true,
            },
            {
                id: 12,
                source: 'MANUAL',
                corporateTxnId: null,
                reference: 'CM-14',
                entryNumber: 'COM-000001',
                transactionDate: '2026-09-19',
                service: null,
                reason: 'Annual rebate',
                orderAmount: null,
                commissionExcludingGST: 236,
                commissionIncludingGST: 236,
                commissionReversed: 0,
                commissionNet: 236,
                refunded: false,
                posting: NOT_APPLICABLE,
                status: 'OPEN',
                entryType: 'ENTRY',
                recordedByName: 'Ibrahim',
                hasDocument: true,
            },
        ],
        recordsTotal: 2,
        page: 1,
        itemsPerPage: 10,
    });
    (getVendorDeposits as Mock).mockResolvedValue({
        entries: [
            {
                id: 3,
                amount: 200000,
                depositDate: '2026-09-18',
                reference: 'UTR-778899',
                entryNumber: 'DEP-000001',
                mode: 'NEFT',
                note: 'Monthly top-up',
                status: 'ACTIVE',
                posting: NOT_APPLICABLE,
                entryType: 'DEPOSIT',
                reversesId: null,
                slipKey: 'staging/system_user/ibrahim/vendor-ledger-slips/1/uuid-1',
                slipName: 'bank-slip.pdf',
                slipFormat: 'pdf',
                recordedByName: 'Ibrahim',
                voidedByName: null,
                voidReason: null,
            },
            {
                id: 5,
                amount: 50000,
                depositDate: '2026-09-17',
                reference: 'UTR-112233',
                entryNumber: 'DEP-000002',
                mode: 'RTGS',
                note: null,
                status: 'VOIDED',
                posting: NOT_APPLICABLE,
                entryType: 'DEPOSIT',
                reversesId: null,
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: 'Ibrahim',
                voidedByName: 'Ibrahim',
                voidReason: 'wrong vendor',
            },
            {
                id: 6,
                amount: 50000,
                depositDate: '2026-09-17',
                reference: 'UTR-112233',
                entryNumber: 'DEP-000003',
                mode: 'RTGS',
                note: 'wrong vendor',
                status: 'ACTIVE',
                posting: NOT_APPLICABLE,
                entryType: 'REVERSAL',
                reversesId: 5,
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: 'Ibrahim',
                voidedByName: null,
                voidReason: null,
            },
            {
                id: 2,
                amount: 75000,
                depositDate: '2026-08-19',
                reference: null,
                entryNumber: 'OPB-000001',
                mode: 'OTHER',
                note: 'carried in from the sheet',
                status: 'ACTIVE',
                posting: NOT_APPLICABLE,
                entryType: 'OPENING',
                reversesId: null,
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: 'Ibrahim',
                voidedByName: null,
                voidReason: null,
            },
        ],
        recordsTotal: 4,
        page: 1,
        itemsPerPage: 10,
    });
    (getVendorStatement as Mock).mockResolvedValue({
        vendorName: 'Cleartrip Private Limited',
        openingBalance: 200000,
        totalDebit: 59,
        totalCredit: 1000,
        closingBalance: 199059,
        entries: [
            {
                date: '2026-09-02',
                particulars: 'Order value — Flights',
                reference: '1789647165639',
                type: 'Order',
                debit: null,
                credit: 1000,
                balance: 199000,
                posting: POSTED,
            },
            {
                date: '2026-09-02',
                particulars: 'Commission',
                reference: '1789647165639',
                type: 'Commission',
                debit: 50,
                credit: null,
                balance: 199050,
                posting: POSTED,
            },
            {
                date: '2026-09-09',
                particulars: 'Commission reversed',
                reference: '1789647165640',
                type: 'Refund',
                debit: null,
                credit: 29.5,
                balance: 199059,
                posting: REFUSED,
            },
        ],
        recordsTotal: 3,
        truncated: false,
        page: 1,
        itemsPerPage: 10,
    });
    (getVendorDebitNotes as Mock).mockResolvedValue({
        entries: [
            {
                id: 21,
                kind: 'DEBIT_NOTE',
                source: 'MANUAL',
                reference: 'DN-4',
                entryNumber: 'VDN-000001',
                amount: 590,
                issueDate: '2026-10-20',
                reason: 'Cost of sales overstated',
                againstCorporateTxnId: null,
                status: 'OPEN',
                posting: NOT_APPLICABLE,
                entryType: 'ENTRY',
                reversesId: null,
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: 'Ibrahim',
                voidedByName: null,
                voidReason: null,
                hasDocument: false,
                gstInclusive: true,
                gstRate: 18,
                taxableAmount: 500,
                gstAmount: 90,
                booksSynced: false,
            },
        ],
        recordsTotal: 1,
        page: 1,
        itemsPerPage: 10,
    });
    (getVendorCostOfSales as Mock).mockResolvedValue({
        entries: [
            {
                id: 9,
                kind: 'COST_OF_SALES',
                source: 'MANUAL',
                reference: 'CS-3',
                entryNumber: 'COS-000001',
                amount: 1180,
                issueDate: '2026-09-19',
                reason: 'Courier charges',
                againstCorporateTxnId: '1789647165640',
                status: 'OPEN',
                posting: NOT_APPLICABLE,
                entryType: 'ENTRY',
                reversesId: null,
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: 'Ibrahim',
                voidedByName: null,
                voidReason: null,
                hasDocument: false,
                gstInclusive: true,
                gstRate: 18,
                taxableAmount: 1000,
                gstAmount: 180,
                booksSynced: false,
            },
        ],
        recordsTotal: 1,
        page: 1,
        itemsPerPage: 10,
    });
    (getVendorCreditNotes as Mock).mockResolvedValue({
        entries: [
            {
                id: 4,
                kind: 'CREDIT_NOTE',
                source: 'MANUAL',
                reference: 'CN-1042',
                entryNumber: 'VCN-000001',
                amount: 1500,
                issueDate: '2026-09-18',
                reason: 'Rate correction',
                againstCorporateTxnId: null,
                status: 'OPEN',
                posting: NOT_APPLICABLE,
                entryType: 'ENTRY',
                reversesId: null,
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: 'Ibrahim',
                voidedByName: null,
                voidReason: null,
                hasDocument: true,
            },
            {
                id: null,
                kind: 'COMMISSION',
                source: 'AUTO',
                reference: '1789647165640',
                entryNumber: null,
                amount: 29.5,
                issueDate: '2026-09-20',
                reason: 'Commission reversed on Flights',
                againstCorporateTxnId: '1789647165640',
                status: 'OPEN',
                posting: REFUSED,
                entryType: 'REVERSAL',
                reversesId: null,
                slipKey: null,
                slipName: null,
                slipFormat: null,
                recordedByName: null,
                voidedByName: null,
                voidReason: null,
                hasDocument: true,
            },
        ],
        recordsTotal: 2,
        page: 1,
        itemsPerPage: 10,
    });
});

describe('vendors is an api backed ledger', () => {
    it('leaves every ledger on real data, with a tab set and no generated-data flag', () => {
        LEDGER_KINDS.forEach(kind => {
            expect(LEDGER_LEAF_BY_KIND[kind].tabs.length).toBeGreaterThan(0);
            expect('source' in LEDGER_LEAF_BY_KIND[kind]).toBe(false);
        });
    });

    it('gives vendors a record action on deposits, credit notes and commissions', () => {
        expect(Object.keys(LEDGER_LEAF_BY_KIND.vendors.recordActions ?? {})).toEqual([
            'deposits',
            'credit-notes',
            'commissions',
            'cost-of-sales',
            'debit-notes',
        ]);
    });
});

describe('VendorLedgerList', () => {
    it('requests the first page and renders the kpis from the api', async () => {
        renderList();

        await waitFor(() => expect(getVendorLedgerList).toHaveBeenCalled());
        expect(getVendorLedgerList).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            refresh: false,
            page: 1,
            itemsPerPage: 10,
            searchText: '',
        });

        expect(await screen.findByText('Total Vendors')).toBeInTheDocument();
        expect(screen.getByText('Deposits Held')).toBeInTheDocument();
        expect(screen.getByText('Commission This Month')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 1,23,500.00').length).toBeGreaterThan(0);
    });

    it('shows each vendor with its services, balance and status', async () => {
        renderList();

        expect(await screen.findByText('Cleartrip Private Limited')).toBeInTheDocument();
        expect(screen.getAllByText('Flights · Hotels').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 1,21,500.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Healthy').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Low balance').length).toBeGreaterThan(0);
    });

    it('expands long service lists in batches without opening the vendor row', async () => {
        const services = [
            'Bike Insurance',
            'Bill Payments',
            'Broadband Bill',
            'Cable Recharge',
            'Car Insurance',
            'Clubs And Associations',
            'Complaint Registration',
            'Credit Card Payment',
            'Donations',
            'DTH',
            'Education Fees',
            'Electricity Bill',
            'FASTag Recharge',
            'Hospital And Pathology',
            'Housing Society',
            'Insurance',
            'Landline',
            'Life Insurance',
            'Loan Repayment',
        ];
        (getVendorLedgerList as Mock).mockResolvedValue({
            ...LIST_RESPONSE,
            vendors: [{ ...VENDOR, services }, LOW_VENDOR],
        });

        renderList();

        expect(
            await screen.findByText('Bike Insurance · Bill Payments · Broadband Bill · …')
        ).toBeInTheDocument();
        fireEvent.click(screen.getAllByRole('button', { name: 'Show more' })[0]);

        expect(await screen.findByText(services.slice(0, 15).join(' · '))).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Show more' })).toHaveLength(1);
        expect(navigateMock).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
        expect(await screen.findByText(services.join(' · '))).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
        expect(
            await screen.findByText('Bike Insurance · Bill Payments · Broadband Bill · …')
        ).toBeInTheDocument();
    });

    it('opens a vendor by its id when the row is clicked', async () => {
        renderList();

        fireEvent.click(await screen.findByText('Cleartrip Private Limited'));

        expect(navigateMock).toHaveBeenCalledWith('/system-user/accounting/vendors/1/transactions');
    });

    it('refreshes the cached balances on demand', async () => {
        renderList();
        await screen.findByText('Cleartrip Private Limited');

        fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

        await waitFor(() =>
            expect(getVendorLedgerList).toHaveBeenLastCalledWith(
                expect.objectContaining({ refresh: true })
            )
        );
    });

    it('warns when the shared Vendor Deposits account is missing', async () => {
        (getVendorLedgerList as Mock).mockResolvedValue({
            ...LIST_RESPONSE,
            vendorDepositsAccountConfigured: false,
        });

        renderList();

        expect(
            await screen.findByText(/Vendor Deposits" account is not set up/)
        ).toBeInTheDocument();
        expect(screen.getByText('Open chart of accounts')).toHaveAttribute(
            'href',
            '/system-user/accounting/chart-of-accounts'
        );
    });

    it('shows no warning once the shared account exists', async () => {
        renderList();

        await screen.findByText('Cleartrip Private Limited');
        expect(screen.queryByText(/is not set up/)).not.toBeInTheDocument();
    });

    it('sends the search text to the api', async () => {
        renderList();
        await screen.findByText('Cleartrip Private Limited');

        fireEvent.change(screen.getByPlaceholderText('Search vendors'), {
            target: { value: 'cleartrip' },
        });

        await waitFor(() =>
            expect(getVendorLedgerList).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'cleartrip', page: 1 })
            )
        );
    });
});

describe('VendorLedgerDetail', () => {
    it('redirects a missing tab to transactions', () => {
        renderDetail('/system-user/accounting/vendors/1');

        expect(screen.getByTestId('navigate')).toHaveTextContent(
            '/system-user/accounting/vendors/1/transactions'
        );
    });

    it('registers the drill panel with the vendor header and its tabs', async () => {
        const setPanel = renderDetail('/system-user/accounting/vendors/1/transactions');

        await waitFor(() => expect(lastPanel(setPanel)).not.toBeNull());
        const panel = lastPanel(setPanel)!;
        expect(panel.title).toBe('Cleartrip Private Limited');
        expect(panel.subtitle).toBe('Flights · Hotels');
        expect(panel.status).toEqual({ label: 'Healthy', tone: 'success' });
        expect(panel.tabs.map(tab => tab.key)).toEqual([
            'transactions',
            'commissions',
            'credit-notes',
            'cost-of-sales',
            'debit-notes',
            'deposits',
            'statement-of-accounts',
        ]);
        expect(panel.backTo).toBe('/system-user/accounting/vendors');
    });

    it('warns on the profile when the shared account is missing', async () => {
        (getVendorLedgerDetail as Mock).mockResolvedValue({
            vendor: VENDOR,
            summary: {
                deposited: 200000,
                creditNotes: 1500,
                manualCommission: 0,
                used: 9500,
                commission: 9000,
                openingBalance: 0,
                totalTransaction: 11000,
                available: 198500,
            },
            vendorDepositsAccountConfigured: false,
        });

        renderDetail('/system-user/accounting/vendors/1/transactions');

        expect(
            await screen.findByText(/Vendor Deposits" account is not set up/)
        ).toBeInTheDocument();
    });

    it('shows the standing position above the table', async () => {
        renderDetail('/system-user/accounting/vendors/1/transactions');

        expect(await screen.findByText('Opening Balance')).toBeInTheDocument();
        expect(screen.getByText('Deposit')).toBeInTheDocument();
        expect(screen.getByText('Total Transaction')).toBeInTheDocument();
        expect(screen.getByText('Commission earned')).toBeInTheDocument();
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 1,21,500.00').length).toBeGreaterThan(0);
    });

    it('says which figures follow the date filter and which does not', async () => {
        renderDetail('/system-user/accounting/vendors/1/transactions');

        const note = await screen.findByText(/Available is the balance left with the vendor today/);
        expect(note).toHaveTextContent(
            `${dayjs().subtract(1, 'month').format('DD MMM YYYY')} to ${dayjs().format('DD MMM YYYY')}`
        );
    });

    it('sends the selected range to the summary and reloads without a skeleton', async () => {
        renderDetail('/system-user/accounting/vendors/1/transactions');

        await waitFor(() => expect(getVendorLedgerDetail).toHaveBeenCalled());
        expect(getVendorLedgerDetail).toHaveBeenCalledWith(
            expect.objectContaining({
                vendorId: '1',
                from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                to: dayjs().format('YYYY-MM-DD'),
            })
        );
    });

    it('keeps the date filter on the statement tab', async () => {
        renderDetail('/system-user/accounting/vendors/1/statement-of-accounts');

        await waitFor(() => expect(getVendorStatement).toHaveBeenCalled());
        expect(
            screen.getByText(/Available is the balance left with the vendor today/)
        ).toBeInTheDocument();
    });

    it('breaks each order into the parts the vendor is concerned with', async () => {
        renderDetail('/system-user/accounting/vendors/1/transactions');

        await waitFor(() => expect(getVendorTransactions).toHaveBeenCalled());
        expect(getVendorTransactions).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: '1', page: 1, itemsPerPage: 10 })
        );
        expect(await screen.findByText('1789647165639')).toBeInTheDocument();
        expect(screen.getAllByText('Vendor Amount').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Commission (incl. VAT)').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Markup').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Payable').length).toBeGreaterThan(0);
        expect(screen.queryByText('Order Amount')).not.toBeInTheDocument();
        expect(screen.getAllByText('₹ 361.80').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 10.80').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 351.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 450.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Refunded').length).toBeGreaterThan(0);
    });

    it('lists a sale made as principal at the vendor’s price, with the net markup beside it, no payable and its tag', async () => {
        renderDetail('/system-user/accounting/vendors/1/transactions');

        const row = (await screen.findByText('1789647165642')).closest('tr') as HTMLElement;
        expect(within(row).getByText('₹ 882.00')).toBeInTheDocument();
        expect(within(row).getByText('₹ 100.00')).toBeInTheDocument();
        expect(within(row).getAllByText('—').length).toBeGreaterThanOrEqual(2);
        expect(within(row).getByText('Principal Markup')).toBeInTheDocument();
        expect(screen.getByText(/never come out of the advance/)).toBeInTheDocument();
    });

    it('tags every order by how it was sold, two tags on an order sold both ways and none without a breakdown', async () => {
        renderDetail('/system-user/accounting/vendors/1/transactions');

        const margin = (await screen.findByText('1789647165639')).closest('tr') as HTMLElement;
        expect(within(margin).getByText('Margin')).toBeInTheDocument();
        expect(within(margin).queryByText('Principal Markup')).not.toBeInTheDocument();

        const mixed = screen.getByText('1789647165640').closest('tr') as HTMLElement;
        expect(within(mixed).getByText('Margin')).toBeInTheDocument();
        expect(within(mixed).getByText('Principal Markup')).toBeInTheDocument();

        const untagged = screen.getByText('1789647165641').closest('tr') as HTMLElement;
        expect(within(untagged).queryByText('Margin')).not.toBeInTheDocument();
        expect(within(untagged).queryByText('Agent Markup')).not.toBeInTheDocument();
    });

    it('lists debit notes raised on the vendor on their own tab, with Record debit note and no tax document', async () => {
        renderDetail('/system-user/accounting/vendors/1/debit-notes');

        expect(await screen.findByText('VDN-000001')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Record debit note' })).toBeInTheDocument();
        expect(screen.getByText('Cost of sales overstated')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 590.00').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(1);
        expect(screen.queryAllByRole('button', { name: 'Tax Credit Note' })).toHaveLength(0);
        expect(getVendorDebitNotes).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: '1', page: 1 })
        );
    });

    it('dashes an order that carries no vendor split', async () => {
        renderDetail('/system-user/accounting/vendors/1/transactions');

        expect(await screen.findByText('1789647165641')).toBeInTheDocument();
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
    });

    it('shows what a refund took back off the commission, and the net', async () => {
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await waitFor(() => expect(getVendorCommissions).toHaveBeenCalled());
        expect(await screen.findByText('1789647165639')).toBeInTheDocument();
        expect(screen.getAllByText('Reversed').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Net').length).toBeGreaterThan(0);
        expect(screen.getByText('- ₹ 5.40')).toHaveClass('text-red-600');
        expect(screen.getAllByText('₹ 5.40').length).toBeGreaterThan(0);
        expect(screen.queryByText('Opening Balance')).not.toBeInTheDocument();
    });

    it('lists a manually recorded commission beside the ones the orders produced', async () => {
        renderDetail('/system-user/accounting/vendors/1/commissions');

        expect(await screen.findByText('COM-000001')).toBeInTheDocument();
        expect(screen.getAllByText('Annual rebate').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Manual').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Order').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 236.00').length).toBeGreaterThan(0);
        // Only the manual row can be reversed; an order's commission is the journal's.
        expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(1);
    });

    it('offers Record commission on the commissions tab', async () => {
        renderDetail('/system-user/accounting/vendors/1/commissions');

        expect(
            await screen.findByRole('button', { name: 'Record commission' })
        ).toBeInTheDocument();
    });

    it('links every commission invoice to the Commission Invoice operation, to edit and send it', async () => {
        (getVendorCommissions as Mock).mockResolvedValue({
            entries: [
                {
                    id: 7,
                    source: 'ORDER',
                    corporateTxnId: '1789647165639',
                    reference: null,
                    entryNumber: null,
                    transactionDate: '2026-09-17',
                    service: 'Flights',
                    reason: null,
                    orderAmount: 361.8,
                    commissionExcludingGST: 9.15,
                    commissionIncludingGST: 10.8,
                    commissionReversed: 0,
                    commissionNet: 10.8,
                    refunded: false,
                    posting: POSTED,
                    status: null,
                    entryType: null,
                    recordedByName: null,
                    hasDocument: true,
                },
                {
                    id: 12,
                    source: 'MANUAL',
                    corporateTxnId: null,
                    reference: 'CM-14',
                    entryNumber: 'COM-000002',
                    transactionDate: '2026-10-10',
                    service: null,
                    reason: 'Quarterly true-up',
                    orderAmount: null,
                    commissionExcludingGST: 200,
                    commissionIncludingGST: 236,
                    commissionReversed: 0,
                    commissionNet: 236,
                    refunded: false,
                    posting: NOT_APPLICABLE,
                    status: 'OPEN',
                    entryType: 'ENTRY',
                    recordedByName: 'Ibrahim',
                    hasDocument: true,
                    booksSynced: false,
                },
            ],
            recordsTotal: 2,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('1789647165639');
        expect(screen.getByRole('link', { name: 'Edit invoice 1789647165639' })).toHaveAttribute(
            'href',
            '/system-user/accounting/manual-operations/commission-invoice?vendor=1&source=order&id=1789647165639'
        );
        expect(screen.getByRole('link', { name: 'Edit invoice COM-000002' })).toHaveAttribute(
            'href',
            '/system-user/accounting/manual-operations/commission-invoice?vendor=1&source=manual&id=12'
        );
    });

    it('lists cost of sales entries on their own tab, with no tax document and Record cost of sales', async () => {
        renderDetail('/system-user/accounting/vendors/1/cost-of-sales');

        expect(await screen.findByText('COS-000001')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Record cost of sales' })).toBeInTheDocument();
        expect(screen.getByText('Courier charges')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 1,180.00').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(1);
        expect(screen.queryAllByRole('button', { name: 'Tax Invoice' })).toHaveLength(0);
        expect(screen.queryAllByRole('button', { name: 'Commission Invoice' })).toHaveLength(0);
        expect(screen.queryAllByRole('button', { name: 'Tax Credit Note' })).toHaveLength(0);
        expect(getVendorCostOfSales).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: '1', page: 1 })
        );
    });

    it('folds the columns that do not fit into the expandable row on a narrow screen', async () => {
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
        try {
            renderDetail('/system-user/accounting/vendors/1/commissions');
            await screen.findByText('1789647165639');

            expect(screen.queryByText('Commission (excl. GST)')).not.toBeInTheDocument();

            fireEvent.click(document.querySelector('.ant-table-row-expand-icon') as HTMLElement);

            expect(await screen.findByText('Commission (excl. GST)')).toBeInTheDocument();
            expect(screen.getAllByText('₹ 9.15').length).toBeGreaterThan(0);
        } finally {
            Object.defineProperty(window, 'innerWidth', { value: 2200, writable: true });
        }
    });

    it('never folds the actions column away, so a manual commission stays reversible', async () => {
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
        try {
            renderDetail('/system-user/accounting/vendors/1/commissions');
            await screen.findByText('COM-000001');

            expect(screen.getAllByText('Actions').length).toBeGreaterThan(0);
            expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(1);
        } finally {
            Object.defineProperty(window, 'innerWidth', { value: 2200, writable: true });
        }
    });

    it('loads commissions on the commissions tab without an invoice status', async () => {
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await waitFor(() => expect(getVendorCommissions).toHaveBeenCalled());
        expect(await screen.findByText('1789647165639')).toBeInTheDocument();
        expect(screen.getAllByText('Commission (excl. GST)').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 9.15').length).toBeGreaterThan(0);
        expect(screen.queryAllByText('Invoiced')).toHaveLength(0);
    });

    it('records a deposit and refreshes the tab', async () => {
        (createVendorDeposit as Mock).mockResolvedValue({ id: 9 });
        renderDetail('/system-user/accounting/vendors/1/deposits');

        await screen.findByText('UTR-778899');
        fireEvent.click(screen.getByRole('button', { name: 'Record deposit' }));

        fireEvent.change(await screen.findByPlaceholderText('0.00'), {
            target: { value: '25000' },
        });
        fireEvent.change(screen.getByPlaceholderText('Bank / UTR reference'), {
            target: { value: 'UTR-556677' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(createVendorDeposit).toHaveBeenCalled());
        expect(createVendorDeposit).toHaveBeenCalledWith(
            expect.objectContaining({
                vendorId: '1',
                amount: 25000,
                reference: 'UTR-556677',
                mode: 'NEFT',
            })
        );
        await waitFor(() => expect(dispatch).toHaveBeenCalled());
        expect(getVendorDeposits).toHaveBeenCalledTimes(2);
    });

    it('offers a slip upload while recording a deposit', async () => {
        renderDetail('/system-user/accounting/vendors/1/deposits');

        await screen.findByText('UTR-778899');
        fireEvent.click(screen.getByRole('button', { name: 'Record deposit' }));

        expect(await screen.findByText('Deposit slip (optional)')).toBeInTheDocument();
        expect(screen.getByText('PDF, JPG or PNG up to 5 MB')).toBeInTheDocument();
    });

    it('sends the chosen slip with the deposit', async () => {
        (createVendorDeposit as Mock).mockResolvedValue({ id: 9 });
        renderDetail('/system-user/accounting/vendors/1/deposits');

        await screen.findByText('UTR-778899');
        fireEvent.click(screen.getByRole('button', { name: 'Record deposit' }));

        fireEvent.change(await screen.findByPlaceholderText('0.00'), {
            target: { value: '25000' },
        });
        fireEvent.change(screen.getByPlaceholderText('Bank / UTR reference'), {
            target: { value: 'UTR-556677' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(createVendorDeposit).toHaveBeenCalled());
        expect((createVendorDeposit as Mock).mock.calls[0][0]).not.toHaveProperty('slipBase64');
    });

    it('shows the attached slip and opens it on click', async () => {
        (getVendorLedgerSlip as Mock).mockResolvedValue({
            buffer: { data: [37, 80, 68, 70] },
            type: 'pdf',
        });
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        renderDetail('/system-user/accounting/vendors/1/deposits');

        const slip = await screen.findByText('bank-slip.pdf');
        expect(slip).toBeInTheDocument();
        fireEvent.click(slip);

        await waitFor(() => expect(getVendorLedgerSlip).toHaveBeenCalled());
        expect(getVendorLedgerSlip).toHaveBeenCalledWith(
            expect.objectContaining({
                slipKey: 'staging/system_user/ibrahim/vendor-ledger-slips/1/uuid-1',
            })
        );
        await waitFor(() => expect(openSpy).toHaveBeenCalled());
        openSpy.mockRestore();
    });

    it('dashes a deposit that has no slip', async () => {
        renderDetail('/system-user/accounting/vendors/1/deposits');

        await screen.findByText('UTR-778899');
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('reverses a deposit with a reason', async () => {
        (reverseVendorDeposit as Mock).mockResolvedValue({ id: 9, entryType: 'REVERSAL' });
        renderDetail('/system-user/accounting/vendors/1/deposits');

        await screen.findByText('UTR-778899');
        fireEvent.click(screen.getAllByRole('button', { name: 'Reverse' })[0]);

        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being voided?'), {
            target: { value: 'duplicate entry' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Void entry' }));

        await waitFor(() =>
            expect(reverseVendorDeposit).toHaveBeenCalledWith(
                expect.objectContaining({ id: 3, reason: 'duplicate entry' })
            )
        );
    });

    it('shows the original and its reversal side by side, and offers no action on either', async () => {
        renderDetail('/system-user/accounting/vendors/1/deposits');

        await screen.findByText('UTR-778899');
        expect(screen.getAllByText('UTR-112233').length).toBe(2);
        expect(screen.getAllByText('Reversed').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Reversal').length).toBeGreaterThan(0);
        expect(screen.getAllByText('- ₹ 50,000.00').length).toBeGreaterThan(0);
        // Only the one live deposit can still be reversed.
        expect(screen.getAllByRole('button', { name: 'Reverse' }).length).toBe(2);
    });

    it('shows the opening balance as its own row', async () => {
        renderDetail('/system-user/accounting/vendors/1/deposits');

        expect(await screen.findByText('Opening balance')).toBeInTheDocument();
        expect(screen.getAllByText('Opening').length).toBeGreaterThan(0);
    });

    it('no longer offers apply on a credit note', async () => {
        renderDetail('/system-user/accounting/vendors/1/credit-notes');

        expect(await screen.findByText('VCN-000001')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Record credit note' })).toBeInTheDocument();
        expect(screen.queryAllByRole('button', { name: 'Apply' })).toHaveLength(0);
        expect(screen.getAllByRole('button', { name: 'Reverse' }).length).toBeGreaterThan(0);
    });

    it('lists the commission a refund took back beside the manual notes', async () => {
        renderDetail('/system-user/accounting/vendors/1/credit-notes');

        expect(await screen.findByText('VCN-000001')).toBeInTheDocument();
        expect(screen.getAllByText('Commission reversed on Flights').length).toBeGreaterThan(0);
        expect(screen.getAllByText('From refund').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Manual').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 29.50').length).toBeGreaterThan(0);
        // A reversal read off the journal is not a row, so there is nothing to reverse on it.
        expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(1);
    });

    it('disables every write action without update permission', async () => {
        setState(READONLY_STATE);
        renderDetail('/system-user/accounting/vendors/1/deposits');

        await screen.findByText('UTR-778899');
        expect(screen.getByRole('button', { name: 'Record deposit' })).toBeDisabled();
        expect(screen.getAllByRole('button', { name: 'Reverse' })[0]).toBeDisabled();
    });

    it('warns and offers to set an opening balance when the vendor has none', async () => {
        (getVendorLedgerDetail as Mock).mockResolvedValue({
            vendor: VENDOR,
            summary: {
                deposited: 200000,
                creditNotes: 1500,
                used: 89500,
                commission: 9000,
                openingBalance: 0,
                totalTransaction: 91000,
                available: 118500,
                openingBalanceSet: false,
                openingBalanceAsOf: null,
            },
            vendorDepositsAccountConfigured: true,
        });

        renderDetail('/system-user/accounting/vendors/1/deposits');

        expect(
            await screen.findByText(/No opening balance is set for this vendor/)
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Set opening balance' })).toBeInTheDocument();
    });

    it('hides the opening balance action once one is set', async () => {
        renderDetail('/system-user/accounting/vendors/1/deposits');

        await screen.findByText('UTR-778899');
        expect(screen.queryByText(/No opening balance is set/)).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Set opening balance' })
        ).not.toBeInTheDocument();
    });

    it('records an opening balance', async () => {
        (getVendorLedgerDetail as Mock).mockResolvedValue({
            vendor: VENDOR,
            summary: {
                deposited: 0,
                creditNotes: 0,
                used: 0,
                commission: 0,
                available: 0,
                openingBalance: 0,
                totalTransaction: 0,
                openingBalanceSet: false,
                openingBalanceAsOf: null,
            },
            vendorDepositsAccountConfigured: true,
        });
        (createVendorOpeningBalance as Mock).mockResolvedValue({ id: 11, entryType: 'OPENING' });

        renderDetail('/system-user/accounting/vendors/1/deposits');

        fireEvent.click(await screen.findByRole('button', { name: 'Set opening balance' }));
        fireEvent.change(await screen.findByPlaceholderText('0.00'), {
            target: { value: '75000' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(createVendorOpeningBalance).toHaveBeenCalled());
        expect(createVendorOpeningBalance).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: '1', amount: 75000 })
        );
    });

    it('renders the statement with an opening and a closing line', async () => {
        renderDetail('/system-user/accounting/vendors/1/statement-of-accounts');

        await waitFor(() => expect(getVendorStatement).toHaveBeenCalled());
        expect(getVendorTransactions).not.toHaveBeenCalled();

        expect(await screen.findByText('Opening balance')).toBeInTheDocument();
        expect(screen.getByText('Closing balance')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 2,00,000.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 1,99,059.00').length).toBeGreaterThan(0);
    });

    it('lists an order as its component debit and credit lines', async () => {
        renderDetail('/system-user/accounting/vendors/1/statement-of-accounts');

        expect(await screen.findByText('Order value — Flights')).toBeInTheDocument();
        // The Type column repeats the word, so the particular is not unique on the page.
        expect(screen.getAllByText('Commission').length).toBeGreaterThan(0);
        expect(screen.getByText('Commission reversed')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 1,000.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 50.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 29.50').length).toBeGreaterThan(0);
    });

    it('says whether each line posted rather than leaving the column blank', async () => {
        renderDetail('/system-user/accounting/vendors/1/statement-of-accounts');

        expect(await screen.findByText('Not posted')).toBeInTheDocument();
        expect(screen.getByText('Books refused it')).toBeInTheDocument();
        // A healthy line says so; an empty column reads as missing data.
        expect(screen.getAllByText('Posted').length).toBeGreaterThan(0);
    });

    it('says on every tab whether each line reached the books and why not', async () => {
        const rowOf = (text: string) => screen.getAllByText(text)[0].closest('tr') as HTMLElement;

        renderDetail('/system-user/accounting/vendors/1/transactions');
        await screen.findByText('1789647165640');
        expect(within(rowOf('1789647165639')).getByText('Posted')).toBeInTheDocument();
        expect(
            within(rowOf('1789647165640')).getByText('Refund: Books refused it')
        ).toBeInTheDocument();
        expect(within(rowOf('1789647165641')).getByText('Not recorded yet')).toBeInTheDocument();
    });

    it('gives a deposit recorded by hand no Posted column, since In Books says where it stands', async () => {
        const rowOf = (text: string) => screen.getAllByText(text)[0].closest('tr') as HTMLElement;

        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');
        expect(within(rowOf('UTR-778899')).queryByText('Not applicable')).not.toBeInTheDocument();
        expect(screen.getByText('In Books')).toBeInTheDocument();
        expect(screen.queryByText('Posted')).not.toBeInTheDocument();
    });

    it('gives a credit note taken back on a refund the status of that refund, under In Books', async () => {
        const rowOf = (text: string) => screen.getAllByText(text)[0].closest('tr') as HTMLElement;

        renderDetail('/system-user/accounting/vendors/1/credit-notes');
        await screen.findByText('VCN-000001');
        expect(within(rowOf('VCN-000001')).queryByText('Not applicable')).not.toBeInTheDocument();
        expect(screen.queryByText('Posted')).not.toBeInTheDocument();
        expect(
            within(rowOf('Commission reversed on Flights')).getByText('Books refused it')
        ).toBeInTheDocument();
    });

    it('marks funding lines as never going to the books', async () => {
        (getVendorStatement as Mock).mockResolvedValue({
            vendorName: 'Cleartrip Private Limited',
            openingBalance: 0,
            totalDebit: 50000,
            totalCredit: 0,
            closingBalance: 50000,
            entries: [
                {
                    date: '2026-09-05',
                    particulars: 'Deposit — NEFT',
                    reference: 'UTR-778899',
                    type: 'Deposit',
                    debit: 50000,
                    credit: null,
                    balance: 50000,
                    posting: NOT_APPLICABLE,
                },
            ],
            recordsTotal: 1,
            truncated: false,
            page: 1,
            itemsPerPage: 10,
        });

        renderDetail('/system-user/accounting/vendors/1/statement-of-accounts');

        const cell = await screen.findByText('Deposit — NEFT');
        const row = cell.closest('tr') as HTMLElement;

        // The row itself must not claim the line posted or failed; a deposit never goes
        // through a journal at all.
        expect(row.textContent).not.toContain('Posted');
        expect(row.textContent).not.toContain('Not posted');
        expect(row.textContent).toContain('Not applicable');
    });

    it('says the opening line is wrong when no opening balance is set', async () => {
        (getVendorLedgerDetail as Mock).mockResolvedValue({
            vendor: VENDOR,
            summary: {
                deposited: 0,
                creditNotes: 0,
                used: 0,
                commission: 0,
                available: 0,
                openingBalance: 0,
                totalTransaction: 0,
                openingBalanceSet: false,
                openingBalanceAsOf: null,
            },
            vendorDepositsAccountConfigured: true,
        });

        renderDetail('/system-user/accounting/vendors/1/statement-of-accounts');

        expect(
            await screen.findByText(/every figure on the statement is short/)
        ).toBeInTheDocument();
    });

    it('downloads the statement as excel and as pdf', async () => {
        const createObjectURL = vi.fn(() => 'blob:statement');
        const revokeObjectURL = vi.fn();
        Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true });
        Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true });
        (downloadVendorStatement as Mock).mockResolvedValue(new Blob(['x']));

        renderDetail('/system-user/accounting/vendors/1/statement-of-accounts');

        fireEvent.click(await screen.findByRole('button', { name: /Export Excel/ }));
        await waitFor(() => expect(downloadVendorStatement).toHaveBeenCalled());
        expect(downloadVendorStatement).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: '1', format: 'export' })
        );

        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));
        await waitFor(() =>
            expect(downloadVendorStatement).toHaveBeenCalledWith(
                expect.objectContaining({ format: 'pdf' })
            )
        );
    });

    it('offers the tax invoice on every commission the gateway raised one for', async () => {
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('1789647165639');
        expect(screen.getAllByRole('button', { name: 'Commission Invoice' })).toHaveLength(2);
        expect(screen.queryAllByRole('button', { name: 'Tax Credit Note' })).toHaveLength(0);
    });

    it('tells a manual commission apart from its reversal', async () => {
        const manual = {
            id: 12,
            source: 'MANUAL',
            corporateTxnId: null,
            reference: 'CM-12398335',
            entryNumber: 'COM-000003',
            service: null,
            orderAmount: null,
            commissionExcludingGST: 100,
            commissionIncludingGST: 100,
            commissionReversed: 0,
            commissionNet: 100,
            refunded: false,
            recordedByName: 'Ibrahim',
            hasDocument: true,
        };
        (getVendorCommissions as Mock).mockResolvedValue({
            entries: [
                {
                    ...manual,
                    id: 14,
                    transactionDate: '2026-09-22',
                    reason: 'raised twice',
                    status: 'OPEN',
                    entryType: 'REVERSAL',
                },
                {
                    ...manual,
                    transactionDate: '2026-09-21',
                    reason: 'balancing',
                    status: 'VOIDED',
                    entryType: 'ENTRY',
                },
            ],
            recordsTotal: 2,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('raised twice');
        expect(screen.getAllByText('Reversal').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Reversed').length).toBeGreaterThan(0);
        expect(screen.getByText('Reverses CM-12398335')).toBeInTheDocument();
        expect(screen.getAllByText('- ₹ 100.00')[0]).toHaveClass('text-red-600');
        // A reversal is a credit note, and neither row can be reversed again.
        expect(screen.getAllByRole('button', { name: 'Tax Credit Note' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: 'Commission Invoice' })).toHaveLength(1);
        expect(screen.queryAllByRole('button', { name: 'Reverse' })).toHaveLength(0);
    });

    it('shows the markup on the principal items beside the commission of an order sold both ways', async () => {
        (getVendorCommissions as Mock).mockResolvedValue({
            entries: [
                {
                    id: 21,
                    source: 'ORDER',
                    corporateTxnId: '1790000000001',
                    reference: null,
                    entryNumber: null,
                    transactionDate: '2026-09-17',
                    service: 'Hotels',
                    reason: null,
                    orderAmount: 813.8,
                    commissionExcludingGST: 9.15,
                    commissionIncludingGST: 10.8,
                    principalMarkup: 47.2,
                    commissionReversed: 0,
                    commissionNet: 10.8,
                    refunded: false,
                    status: null,
                    entryType: null,
                    recordedByName: null,
                    hasDocument: false,
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('1790000000001');
        expect(screen.getAllByText('Principal Markup').length).toBeGreaterThan(0);
        expect(screen.getByText('₹ 47.20')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 10.80').length).toBeGreaterThan(0);
    });

    it('offers no invoice on a commission that never had one', async () => {
        (getVendorCommissions as Mock).mockResolvedValue({
            entries: [
                {
                    id: 8,
                    source: 'ORDER',
                    corporateTxnId: '1789647165641',
                    reference: null,
                    entryNumber: null,
                    transactionDate: '2026-09-17',
                    service: 'Hotels',
                    reason: null,
                    orderAmount: 100,
                    commissionExcludingGST: 0,
                    commissionIncludingGST: 0,
                    commissionReversed: 0,
                    commissionNet: 0,
                    refunded: false,
                    status: null,
                    entryType: null,
                    recordedByName: null,
                    hasDocument: false,
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('1789647165641');
        expect(screen.queryAllByRole('button', { name: 'Commission Invoice' })).toHaveLength(0);
    });

    it('downloads an order commission invoice by its order reference', async () => {
        const createObjectURL = vi.fn(() => 'blob:invoice');
        Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true });
        Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
        (downloadVendorTaxDocument as Mock).mockResolvedValue(new Blob(['x']));

        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('1789647165639');
        fireEvent.click(screen.getAllByRole('button', { name: 'Commission Invoice' })[0]);

        await waitFor(() =>
            expect(downloadVendorTaxDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    vendorId: '1',
                    tab: 'commissions',
                    source: 'order',
                    id: '1789647165639',
                })
            )
        );
        expect(createObjectURL).toHaveBeenCalled();
    });

    it('downloads a manual commission invoice by its entry id', async () => {
        (downloadVendorTaxDocument as Mock).mockResolvedValue(new Blob(['x']));
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('COM-000001');
        fireEvent.click(screen.getAllByRole('button', { name: 'Commission Invoice' })[1]);

        await waitFor(() =>
            expect(downloadVendorTaxDocument).toHaveBeenCalledWith(
                expect.objectContaining({ tab: 'commissions', source: 'manual', id: '12' })
            )
        );
    });

    it('offers a tax credit note on both the manual note and the one read off a refund', async () => {
        renderDetail('/system-user/accounting/vendors/1/credit-notes');

        await screen.findByText('VCN-000001');
        expect(screen.getAllByRole('button', { name: 'Tax Credit Note' })).toHaveLength(2);
        expect(screen.queryAllByRole('button', { name: 'Tax Invoice' })).toHaveLength(0);
    });

    it('downloads a refund credit note against the order it reverses', async () => {
        (downloadVendorTaxDocument as Mock).mockResolvedValue(new Blob(['x']));
        renderDetail('/system-user/accounting/vendors/1/credit-notes');

        await screen.findByText('VCN-000001');
        fireEvent.click(screen.getAllByRole('button', { name: 'Tax Credit Note' })[1]);

        await waitFor(() =>
            expect(downloadVendorTaxDocument).toHaveBeenCalledWith(
                expect.objectContaining({
                    tab: 'credit-notes',
                    source: 'auto',
                    id: '1789647165640',
                })
            )
        );
    });

    it('downloads a manual credit note by its entry id', async () => {
        (downloadVendorTaxDocument as Mock).mockResolvedValue(new Blob(['x']));
        renderDetail('/system-user/accounting/vendors/1/credit-notes');

        await screen.findByText('VCN-000001');
        fireEvent.click(screen.getAllByRole('button', { name: 'Tax Credit Note' })[0]);

        await waitFor(() =>
            expect(downloadVendorTaxDocument).toHaveBeenCalledWith(
                expect.objectContaining({ tab: 'credit-notes', source: 'manual', id: '4' })
            )
        );
    });

    it('says so when a document cannot be downloaded', async () => {
        (downloadVendorTaxDocument as Mock).mockResolvedValue(false);

        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('1789647165639');
        fireEvent.click(screen.getAllByRole('button', { name: 'Commission Invoice' })[0]);

        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        description: 'Could not download the commission invoice',
                        variant: 'error',
                    }),
                })
            )
        );
    });

    it('still lets a read only admin take the paper', async () => {
        setState(READONLY_STATE);
        renderDetail('/system-user/accounting/vendors/1/commissions');

        await screen.findByText('1789647165639');
        screen.getAllByRole('button', { name: 'Commission Invoice' }).forEach(button => {
            expect(button).not.toBeDisabled();
        });
    });

    it('shows a not found card for an unknown vendor', async () => {
        (getVendorLedgerDetail as Mock).mockResolvedValue(false);
        const setPanel = renderDetail('/system-user/accounting/vendors/999/transactions');

        expect(await screen.findByText('Vendor not found')).toBeInTheDocument();
        expect(lastPanel(setPanel)).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Back to Vendors' }));
        expect(navigateMock).toHaveBeenCalledWith('/system-user/accounting/vendors');
    });
});

describe('an order whose journal never derived a commission', () => {
    it('is listed with every figure dashed and says the journal did not post', async () => {
        (getVendorCommissions as Mock).mockResolvedValue({
            entries: [
                {
                    id: 31,
                    source: 'ORDER',
                    corporateTxnId: 'V-NOJOURNAL',
                    reference: null,
                    entryNumber: null,
                    transactionDate: '2026-09-18T10:00:00.000Z',
                    service: 'Flights',
                    reason: null,
                    orderAmount: null,
                    commissionExcludingGST: null,
                    commissionIncludingGST: null,
                    commissionReversed: null,
                    commissionNet: null,
                    refunded: false,
                    posting: {
                        state: 'notPosted',
                        note: 'Could not be prepared',
                        detail: 'Missing chart of accounts',
                    },
                    status: null,
                    entryType: null,
                    recordedByName: null,
                    hasDocument: false,
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });

        renderDetail('/system-user/accounting/vendors/1/commissions');

        expect(await screen.findByText('V-NOJOURNAL')).toBeInTheDocument();
        expect(screen.getAllByText('Not posted').length).toBeGreaterThan(0);
        expect(screen.getByText('Could not be prepared')).toBeInTheDocument();
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);
        expect(screen.queryByText('₹ 0.00')).not.toBeInTheDocument();
    });
});

describe('correcting a vendor entry recorded by hand', () => {
    const giveReason = async (text: string) =>
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being changed?'), {
            target: { value: text },
        });

    it('edits a deposit from the values it holds, with a reason, and refreshes the tab', async () => {
        (updateVendorDeposit as Mock).mockResolvedValue({ id: 3 });
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');

        fireEvent.click(screen.getByLabelText('Edit Deposit DEP-000001'));

        const amount = await screen.findByPlaceholderText('0.00');
        expect(amount).toHaveValue('200000');
        expect(screen.getByPlaceholderText('Bank / UTR reference')).toHaveValue('UTR-778899');
        expect(screen.getByText(/Attached: bank-slip.pdf/)).toBeInTheDocument();

        fireEvent.change(amount, { target: { value: '210000' } });
        await giveReason('Typed the wrong amount');
        fireEvent.click(screen.getByText('Save changes'));

        await waitFor(() =>
            expect(updateVendorDeposit).toHaveBeenCalledWith(
                expect.objectContaining({
                    vendorId: '1',
                    id: 3,
                    amount: 210000,
                    depositDate: '2026-09-18',
                    reference: 'UTR-778899',
                    mode: 'NEFT',
                    note: 'Monthly top-up',
                    changeReason: 'Typed the wrong amount',
                })
            )
        );
        await waitFor(() => expect(getVendorDeposits).toHaveBeenCalledTimes(2));
    });

    it('will not save an edit without a reason', async () => {
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');

        fireEvent.click(screen.getByLabelText('Edit Deposit DEP-000001'));
        fireEvent.click(await screen.findByText('Save changes'));

        expect(await screen.findByText('Reason is required')).toBeInTheDocument();
        expect(updateVendorDeposit).not.toHaveBeenCalled();
    });

    it('deletes a deposit with a reason, after saying what deleting does', async () => {
        (deleteVendorDeposit as Mock).mockResolvedValue({ id: 3 });
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');

        fireEvent.click(screen.getByLabelText('Delete Deposit DEP-000001'));

        expect(await screen.findByText(DELETE_ENTRY_TEXT)).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText('Why is this entry being deleted?'), {
            target: { value: 'Recorded twice' },
        });
        fireEvent.click(screen.getByText('Delete entry'));

        await waitFor(() =>
            expect(deleteVendorDeposit).toHaveBeenCalledWith(
                expect.objectContaining({ vendorId: '1', id: 3, reason: 'Recorded twice' })
            )
        );
    });

    it('edits and deletes the opening balance through its own calls', async () => {
        (updateVendorOpeningBalance as Mock).mockResolvedValue({ id: 2 });
        (deleteVendorOpeningBalance as Mock).mockResolvedValue({ id: 2 });
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');

        fireEvent.click(screen.getByLabelText('Edit Opening balance'));
        expect(await screen.findByPlaceholderText('0.00')).toHaveValue('75000');
        await giveReason('Per the closing statement');
        fireEvent.click(screen.getByText('Save changes'));
        await waitFor(() =>
            expect(updateVendorOpeningBalance).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 2,
                    amount: 75000,
                    asOfDate: '2026-08-19',
                    note: 'carried in from the sheet',
                    changeReason: 'Per the closing statement',
                })
            )
        );

        fireEvent.click(screen.getByLabelText('Delete Opening balance'));
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being deleted?'), {
            target: { value: 'Set against the wrong vendor' },
        });
        fireEvent.click(screen.getByText('Delete entry'));
        await waitFor(() =>
            expect(deleteVendorOpeningBalance).toHaveBeenCalledWith(
                expect.objectContaining({ id: 2, reason: 'Set against the wrong vendor' })
            )
        );
    });

    it('offers edit and delete on live entries only', async () => {
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');

        expect(screen.getAllByLabelText(/^Edit /)).toHaveLength(2);
        expect(screen.getAllByLabelText(/^Delete /)).toHaveLength(2);
        expect(screen.queryByLabelText('Edit Deposit DEP-000002')).not.toBeInTheDocument();
    });

    it('edits a manual commission from its row', async () => {
        (updateVendorCommission as Mock).mockResolvedValue({ id: 12 });
        renderDetail('/system-user/accounting/vendors/1/commissions');
        await screen.findByText('COM-000001');

        fireEvent.click(screen.getByLabelText('Edit Commission COM-000001'));
        expect(await screen.findByPlaceholderText('0.00')).toHaveValue('236');
        await giveReason('Rebate was agreed lower');
        fireEvent.click(screen.getByText('Save changes'));
        await waitFor(() =>
            expect(updateVendorCommission).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 12,
                    amount: 236,
                    gstInclusive: true,
                    issueDate: '2026-09-19',
                    reason: 'Annual rebate',
                    againstCorporateTxnId: '',
                    changeReason: 'Rebate was agreed lower',
                })
            )
        );
    });

    it('deletes a credit note recorded by hand', async () => {
        (deleteVendorCreditNote as Mock).mockResolvedValue({ id: 4 });
        renderDetail('/system-user/accounting/vendors/1/credit-notes');
        await screen.findByText('VCN-000001');

        fireEvent.click(screen.getByLabelText('Delete Credit note VCN-000001'));
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being deleted?'), {
            target: { value: 'Raised twice' },
        });
        fireEvent.click(screen.getByText('Delete entry'));
        await waitFor(() =>
            expect(deleteVendorCreditNote).toHaveBeenCalledWith(
                expect.objectContaining({ vendorId: '1', id: 4, reason: 'Raised twice' })
            )
        );
    });

    it('keeps edit and delete off a read only role', async () => {
        setState(READONLY_STATE);
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');

        expect(screen.getByLabelText('Edit Deposit DEP-000001')).toBeDisabled();
        expect(screen.getByLabelText('Delete Deposit DEP-000001')).toBeDisabled();
    });
});

describe('telling the portal a vendor entry is in the books', () => {
    const DEPOSIT_ROW = {
        id: 3,
        amount: 200000,
        depositDate: '2026-09-18',
        reference: 'UTR-778899',
        entryNumber: 'DEP-000004',
        mode: 'NEFT',
        note: 'Monthly top-up',
        status: 'ACTIVE',
        posting: NOT_APPLICABLE,
        entryType: 'DEPOSIT',
        reversesId: null,
        slipKey: null,
        slipName: null,
        slipFormat: null,
        recordedByName: 'Ibrahim',
        voidedByName: null,
        voidReason: null,
        booksSynced: false,
        deleted: false,
    };

    const withDeposits = (entries: object[]) =>
        (getVendorDeposits as Mock).mockResolvedValue({
            entries,
            recordsTotal: entries.length,
            page: 1,
            itemsPerPage: 10,
        });

    it('marks a deposit as in the books from its switch and refreshes the tab', async () => {
        withDeposits([DEPOSIT_ROW]);
        (markVendorDepositBooks as Mock).mockResolvedValue({
            id: 3,
            booksSynced: true,
            removed: false,
        });
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899', undefined, { timeout: 5000 });

        const toggle = screen.getByLabelText('Deposit DEP-000004 is in the books');
        expect(toggle).not.toBeChecked();
        fireEvent.click(toggle);

        await waitFor(() =>
            expect(markVendorDepositBooks).toHaveBeenCalledWith(
                expect.objectContaining({ vendorId: '1', id: 3, synced: true })
            )
        );
        await waitFor(() => expect(getVendorDeposits).toHaveBeenCalledTimes(2));
    });

    it('shows a deleted deposit as Deleted, with no actions, and removes it only after the warning', async () => {
        withDeposits([
            {
                ...DEPOSIT_ROW,
                deleted: true,
                deletedByName: 'Asha',
                deleteReason: 'Recorded twice',
            },
        ]);
        (markVendorDepositBooks as Mock).mockResolvedValue({ id: 3, removed: true });
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');

        expect(screen.getByText('Deleted')).toBeInTheDocument();
        expect(screen.getByText(/Deleted: Recorded twice/)).toBeInTheDocument();
        expect(screen.getByText('Still in books')).toBeInTheDocument();
        expect(screen.queryByText('Reverse')).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/^Edit /)).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('Mark Deposit DEP-000004 removed from the books'));

        expect(await screen.findByText(REMOVE_FROM_PORTAL_TEXT)).toBeInTheDocument();
        expect(markVendorDepositBooks).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('Remove from portal'));

        await waitFor(() =>
            expect(markVendorDepositBooks).toHaveBeenCalledWith(
                expect.objectContaining({ id: 3, synced: true })
            )
        );
    });

    it('keeps the switch off for a read only role', async () => {
        setState(READONLY_STATE);
        withDeposits([DEPOSIT_ROW]);
        renderDetail('/system-user/accounting/vendors/1/deposits');
        await screen.findByText('UTR-778899');

        expect(screen.getByLabelText('Deposit DEP-000004 is in the books')).toBeDisabled();
    });

    it('offers the switch only on an entry recorded by hand, not on one taken back on a refund', async () => {
        const { entries } = await (getVendorCreditNotes as Mock)();
        (getVendorCreditNotes as Mock).mockResolvedValue({
            entries: entries.map((row: { source: string }) =>
                row.source === 'MANUAL'
                    ? { ...row, booksSynced: true, booksSyncedByName: 'Asha' }
                    : row
            ),
            recordsTotal: entries.length,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail('/system-user/accounting/vendors/1/credit-notes');
        await screen.findByText('VCN-000001');

        const toggles = screen.queryAllByLabelText(/is in the books$/);
        expect(toggles).toHaveLength(1);
        expect(toggles[0]).toHaveAttribute('aria-label', 'Credit note VCN-000001 is in the books');
        expect(toggles[0]).toBeChecked();
    });
});

describe('GST on vendor entries recorded by hand', () => {
    const manualCommission = {
        id: 15,
        source: 'MANUAL',
        corporateTxnId: null,
        reference: 'CM-15',
        entryNumber: 'COM-000004',
        transactionDate: '2026-10-10',
        service: null,
        reason: 'Quarterly true-up',
        againstCorporateTxnId: '',
        orderAmount: null,
        commissionExcludingGST: 200,
        commissionIncludingGST: 236,
        commissionReversed: 0,
        commissionNet: 236,
        refunded: false,
        posting: NOT_APPLICABLE,
        status: 'OPEN',
        entryType: 'ENTRY',
        recordedByName: 'Ibrahim',
        hasDocument: true,
        booksSynced: false,
        gstInclusive: false,
        gstRate: 18,
        taxableAmount: 200,
        gstAmount: 36,
    };

    beforeEach(() => {
        (getVendorLedgerDetail as Mock).mockResolvedValue({
            vendor: VENDOR,
            summary: {
                deposited: 200000,
                creditNotes: 1500,
                manualCommission: 0,
                used: 89500,
                commission: 9000,
                openingBalance: 3000,
                totalTransaction: 91000,
                available: 121500,
                openingBalanceSet: true,
                openingBalanceAsOf: '2026-08-19',
            },
            vendorDepositsAccountConfigured: true,
            gstRate: 18,
        });
    });

    const giveReason = async (text: string) =>
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being changed?'), {
            target: { value: text },
        });

    it('reads the amount as inclusive unless told otherwise, and shows the split before saving', async () => {
        (createVendorCommission as Mock).mockResolvedValue({ id: 9 });
        renderDetail('/system-user/accounting/vendors/1/commissions');
        await screen.findByText('COM-000001');

        fireEvent.click(screen.getByRole('button', { name: 'Record commission' }));
        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '236' } });

        expect(screen.getByLabelText('Inclusive of GST')).toBeChecked();
        expect(
            await screen.findByText(
                /Taxable ₹ 200.00 \+ GST \(18%\) ₹ 36.00 = ₹ 236.00 on the ledger/
            )
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() =>
            expect(createVendorCommission).toHaveBeenCalledWith(
                expect.objectContaining({ amount: 236, gstInclusive: true })
            )
        );
    });

    it('records a cost of sales entry through its own endpoint, like a manual commission', async () => {
        (createVendorCostOfSales as Mock).mockResolvedValue({ id: 10 });
        renderDetail('/system-user/accounting/vendors/1/cost-of-sales');
        await screen.findByText('COS-000001');

        fireEvent.click(screen.getByRole('button', { name: 'Record cost of sales' }));
        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '236' } });

        expect(screen.getByLabelText('Inclusive of GST')).toBeChecked();
        expect(
            await screen.findByText(
                /Taxable ₹ 200.00 \+ GST \(18%\) ₹ 36.00 = ₹ 236.00 on the ledger/
            )
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() =>
            expect(createVendorCostOfSales).toHaveBeenCalledWith(
                expect.objectContaining({ amount: 236, gstInclusive: true })
            )
        );
    });

    it('records a debit note on the vendor through its own endpoint', async () => {
        (createVendorDebitNote as Mock).mockResolvedValue({ id: 22 });
        renderDetail('/system-user/accounting/vendors/1/debit-notes');
        await screen.findByText('VDN-000001');

        fireEvent.click(screen.getByRole('button', { name: 'Record debit note' }));
        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '236' } });

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() =>
            expect(createVendorDebitNote).toHaveBeenCalledWith(
                expect.objectContaining({ amount: 236, gstInclusive: true })
            )
        );
    });

    it('adds GST on top of a credit note typed without it', async () => {
        (createVendorCreditNote as Mock).mockResolvedValue({ id: 9 });
        renderDetail('/system-user/accounting/vendors/1/credit-notes');
        await screen.findByText('VCN-000001');

        fireEvent.click(screen.getByRole('button', { name: 'Record credit note' }));
        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1000' } });
        fireEvent.click(screen.getByLabelText('Exclusive of GST'));

        expect(
            await screen.findByText(
                /Taxable ₹ 1,000.00 \+ GST \(18%\) ₹ 180.00 = ₹ 1,180.00 on the ledger/
            )
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() =>
            expect(createVendorCreditNote).toHaveBeenCalledWith(
                expect.objectContaining({ amount: 1000, gstInclusive: false })
            )
        );
    });

    it('opens an exclusive commission for editing on the figure that was typed', async () => {
        (getVendorCommissions as Mock).mockResolvedValue({
            entries: [manualCommission],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });
        (updateVendorCommission as Mock).mockResolvedValue({ id: 15 });
        renderDetail('/system-user/accounting/vendors/1/commissions');
        await screen.findByText('COM-000004');

        fireEvent.click(screen.getByLabelText('Edit Commission COM-000004'));
        expect(await screen.findByPlaceholderText('0.00')).toHaveValue('200');
        expect(screen.getByLabelText('Exclusive of GST')).toBeChecked();

        await giveReason('Rate corrected');
        fireEvent.click(screen.getByText('Save changes'));
        await waitFor(() =>
            expect(updateVendorCommission).toHaveBeenCalledWith(
                expect.objectContaining({ id: 15, amount: 200, gstInclusive: false })
            )
        );
    });

    it('shows the GST kept on a credit note, and a dash on an older one', async () => {
        (getVendorCreditNotes as Mock).mockResolvedValue({
            entries: [
                {
                    id: 4,
                    kind: 'CREDIT_NOTE',
                    source: 'MANUAL',
                    reference: 'CN-1042',
                    entryNumber: 'VCN-000002',
                    amount: 1500,
                    gstInclusive: true,
                    gstRate: 18,
                    taxableAmount: 1271.19,
                    gstAmount: 228.81,
                    issueDate: '2026-09-18',
                    reason: 'Rate correction',
                    againstCorporateTxnId: null,
                    status: 'OPEN',
                    posting: NOT_APPLICABLE,
                    entryType: 'ENTRY',
                    reversesId: null,
                    slipKey: null,
                    slipName: null,
                    slipFormat: null,
                    recordedByName: 'Ibrahim',
                    voidedByName: null,
                    voidReason: null,
                    hasDocument: true,
                    booksSynced: false,
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail('/system-user/accounting/vendors/1/credit-notes');

        const row = (await screen.findByText('VCN-000002')).closest('tr') as HTMLElement;
        expect(screen.getAllByText('GST').length).toBeGreaterThan(0);
        expect(within(row).getByText('₹ 228.81')).toBeInTheDocument();
    });
});
