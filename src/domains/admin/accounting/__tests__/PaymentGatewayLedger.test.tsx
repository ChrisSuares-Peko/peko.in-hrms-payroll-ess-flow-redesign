import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    createPaymentGatewayOpeningBalance,
    createPaymentGatewaySettlement,
    getPaymentGatewayDetail,
    getPaymentGatewayList,
    getPaymentGatewaySettlementSuggestion,
    getPaymentGatewaySettlements,
    getPaymentGatewayStatement,
    getPaymentGatewayTransactions,
    deletePaymentGatewayFee,
    markPaymentGatewayFeeBooks,
    reversePaymentGatewaySettlement,
    updatePaymentGatewayOpeningBalance,
    updatePaymentGatewaySettlement,
} from '../api/paymentGatewayLedger';
import { LEDGER_LEAF_BY_KIND } from '../config/ledgerPaths';
import { AccountingShellProvider, DrillPanel } from '../context/AccountingShellContext';
import PaymentGatewayLedgerDetail from '../pages/PaymentGatewayLedgerDetail';
import PaymentGatewayLedgerList from '../pages/PaymentGatewayLedgerList';

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

vi.mock('../api/paymentGatewayLedger', () => ({
    getPaymentGatewayList: vi.fn(),
    getPaymentGatewayDetail: vi.fn(),
    getPaymentGatewayTransactions: vi.fn(),
    getPaymentGatewaySettlements: vi.fn(),
    getPaymentGatewaySettlementSuggestion: vi.fn(),
    createPaymentGatewayOpeningBalance: vi.fn(),
    createPaymentGatewaySettlement: vi.fn(),
    reversePaymentGatewaySettlement: vi.fn(),
    reversePaymentGatewayFee: vi.fn(),
    createPaymentGatewayFee: vi.fn(),
    updatePaymentGatewaySettlement: vi.fn(),
    deletePaymentGatewaySettlement: vi.fn(),
    updatePaymentGatewayFee: vi.fn(),
    deletePaymentGatewayFee: vi.fn(),
    updatePaymentGatewayOpeningBalance: vi.fn(),
    deletePaymentGatewayOpeningBalance: vi.fn(),
    markPaymentGatewaySettlementBooks: vi.fn(),
    markPaymentGatewayFeeBooks: vi.fn(),
    getPaymentGatewayStatement: vi.fn(),
    downloadPaymentGatewayStatement: vi.fn(),
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
                                services: [
                                    { service: 'Payment Gateways', hasAccess: true, update },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    },
});

const GATEWAY_ID = '4567000000000777';

const POSTED = { state: 'posted' as const, note: null, detail: null };
const NOT_APPLICABLE = { state: 'notApplicable' as const, note: null, detail: null };
const REFUSED = {
    state: 'notPosted' as const,
    note: 'Books refused it',
    detail: 'Account not found',
};

const GATEWAY = {
    gatewayAccountId: GATEWAY_ID,
    gatewayName: 'Cashfree',
    accountType: 'bank',
    collected: 20000,
    received: 15000,
    fees: 400,
    opening: 0,
    outstanding: 4600,
};

const SUMMARY = {
    ...GATEWAY,
    transactionCount: 14,
    lastReceiptDate: '2026-09-22',
    lastReceiptAmount: 15000,
};

const settlementRow = (over = {}) => ({
    id: 1,
    gatewayAccountId: GATEWAY_ID,
    settlementId: 1,
    entryKind: 'RECEIPT' as const,
    entryType: 'ENTRY' as const,
    amount: 15000,
    expectedAmount: 15400,
    entryDate: '2026-09-22',
    reference: 'SETL-8891',
    entryNumber: 'RCT-000001',
    mode: 'NEFT',
    note: 'weekly batch',
    status: 'ACTIVE',
    posting: NOT_APPLICABLE,
    reversesId: null,
    slipKey: null,
    slipName: null,
    slipFormat: null,
    recordedByName: 'Ibrahim',
    voidedByName: null,
    voidedAt: null,
    voidReason: null,
    createdAt: '2026-09-22T10:00:00.000Z',
    ...over,
});

const dispatch = vi.fn();

const setState = (state: unknown) => {
    (useAppSelector as unknown as Mock).mockImplementation((selector: never) =>
        (selector as unknown as (value: unknown) => unknown)(state)
    );
};

const realGetComputedStyle = window.getComputedStyle.bind(window);

vi.setConfig({ testTimeout: 20000 });

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    // GenericTable folds any column past the viewport into the expandable row, and jsdom is
    // 1024 wide by default, which is narrower than these tables.
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    setState(stateWith(true));
    (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);

    (getPaymentGatewayList as Mock).mockResolvedValue({
        gateways: [GATEWAY],
        recordsTotal: 1,
        page: 1,
        itemsPerPage: 10,
        kpis: {
            totalGateways: 1,
            outstandingTotal: 4600,
            awaitingSettlement: 1,
            collectedThisMonth: 20000,
            receivedThisMonth: 15000,
        },
        generatedAt: '2026-09-23T08:30:00.000Z',
        cached: true,
    });
    (getPaymentGatewayDetail as Mock).mockResolvedValue({ gateway: GATEWAY, summary: SUMMARY });
    (getPaymentGatewayTransactions as Mock).mockResolvedValue({
        entries: [
            {
                id: 7,
                corporateTxnId: '1790073500101',
                transactionDate: '2026-09-22T10:00:00.000Z',
                subscriberName: 'Al Rams Trading',
                service: 'Payroll',
                paymentMode: 'PAYMENT GATEWAY + WALLET',
                totalAmount: 1224,
                gatewayAmount: 500,
                beforeOpening: false,
                status: 'SUCCESS',
                posting: POSTED,
            },
        ],
        recordsTotal: 1,
        page: 1,
        itemsPerPage: 10,
    });
    (getPaymentGatewaySettlements as Mock).mockResolvedValue({
        entries: [settlementRow()],
        recordsTotal: 1,
        feeEntries: [settlementRow({ id: 2, entryKind: 'FEE', amount: 400, expectedAmount: null })],
        feeRecordsTotal: 1,
        collected: 20000,
        received: 15000,
        fees: 400,
        opening: 0,
        outstanding: 4600,
        transactionCount: 14,
        openingBalanceSet: false,
        openingBalanceAsOf: null,
        lastReceiptDate: '2026-09-22',
        lastReceiptAmount: 15000,
        page: 1,
        feePage: 1,
        itemsPerPage: 5,
    });
    (getPaymentGatewaySettlementSuggestion as Mock).mockResolvedValue({
        suggestedAmount: 4600,
        collected: 20000,
        received: 15000,
        fees: 400,
        transactionCount: 14,
        lastReceiptDate: '2026-09-22',
    });
    (createPaymentGatewaySettlement as Mock).mockResolvedValue({
        receipt: settlementRow({ id: 3 }),
        fee: settlementRow({ id: 4, entryKind: 'FEE', amount: 400 }),
    });
    (createPaymentGatewayOpeningBalance as Mock).mockResolvedValue(
        settlementRow({ id: 9, entryKind: 'OPENING' })
    );
    (reversePaymentGatewaySettlement as Mock).mockResolvedValue([
        settlementRow({ id: 5, entryType: 'REVERSAL' }),
        settlementRow({ id: 6, entryKind: 'FEE', entryType: 'REVERSAL', amount: 400 }),
    ]);
    (getPaymentGatewayStatement as Mock).mockResolvedValue({
        gatewayName: 'Cashfree',
        openingBalance: 0,
        totalDebit: 20000,
        totalCredit: 15400,
        closingBalance: 4600,
        entries: [
            {
                date: '2026-09-22',
                particulars: 'Collected up to 2026-09-22 — 14 transactions',
                reference: null,
                type: 'Collected',
                debit: 20000,
                credit: null,
                balance: 20000,
                posting: REFUSED,
            },
            {
                date: '2026-09-22',
                particulars: 'Received — NEFT',
                reference: 'SETL-8891',
                type: 'Received',
                debit: null,
                credit: 15000,
                balance: 5000,
                posting: NOT_APPLICABLE,
            },
            {
                date: '2026-09-22',
                particulars: 'Gateway charges',
                reference: 'SETL-8891',
                type: 'Fee',
                debit: null,
                credit: 400,
                balance: 4600,
                posting: NOT_APPLICABLE,
            },
        ],
        recordsTotal: 3,
        truncated: false,
        page: 1,
        itemsPerPage: 10,
    });
});

const renderList = () =>
    render(
        <MemoryRouter>
            <PaymentGatewayLedgerList />
        </MemoryRouter>
    );

const renderDetail = (url: string, setPanel = vi.fn()) => {
    render(
        <AccountingShellProvider value={setPanel}>
            <MemoryRouter initialEntries={[url]}>
                <Routes>
                    <Route
                        path="/system-user/accounting/payment-gateways/:id/:tab?"
                        element={<PaymentGatewayLedgerDetail />}
                    />
                </Routes>
            </MemoryRouter>
        </AccountingShellProvider>
    );
    return setPanel;
};

// The shared TextInput spreads Formik's field props onto the input, so the field name is
// the only stable handle; its Form.Item label is not wired with htmlFor.
const field = (name: string) => document.querySelector(`input[name="${name}"]`) as HTMLInputElement;

const lastPanel = (setPanel: Mock): DrillPanel | null => {
    const calls = setPanel.mock.calls.filter(([value]) => value !== null);
    return calls.length ? calls[calls.length - 1][0] : null;
};

describe('the gateways list', () => {
    it('is on real data with the four tabs and a record action', () => {
        const leaf = LEDGER_LEAF_BY_KIND.payment_gateways;
        expect(leaf.tabs).toEqual(['transactions', 'received-and-bills', 'statement-of-accounts']);
        expect(Object.keys(leaf.recordActions || {})).toEqual(['received-and-bills']);
    });

    it('names each gateway by its account and positions it', async () => {
        renderList();

        expect(await screen.findByText('Cashfree')).toBeInTheDocument();
        expect(screen.getAllByText(GATEWAY_ID).length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 20,000.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 4,600.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Settlement pending').length).toBeGreaterThan(0);
    });

    it('says plainly when no gateway account has been posted to', async () => {
        (getPaymentGatewayList as Mock).mockResolvedValue({
            gateways: [],
            recordsTotal: 0,
            page: 1,
            itemsPerPage: 10,
            kpis: {
                totalGateways: 0,
                outstandingTotal: 0,
                awaitingSettlement: 0,
                collectedThisMonth: 0,
                receivedThisMonth: 0,
            },
            generatedAt: '2026-09-23T08:30:00.000Z',
            cached: false,
        });
        renderList();

        expect(
            await screen.findByText('No payment gateway has been posted to yet.')
        ).toBeInTheDocument();
    });
});

describe('the transactions tab', () => {
    it('separates what the order was worth from what went through the gateway', async () => {
        renderDetail(`/system-user/accounting/payment-gateways/${GATEWAY_ID}/transactions`);

        expect(await screen.findByText('1790073500101')).toBeInTheDocument();
        expect(screen.getAllByText('Through Gateway').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 1,224.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 500.00').length).toBeGreaterThan(0);
    });

    it('says whether each collected order reached the books', async () => {
        renderDetail(`/system-user/accounting/payment-gateways/${GATEWAY_ID}/transactions`);

        const row = (await screen.findByText('1790073500101')).closest('tr') as HTMLElement;
        expect(within(row).getByText('Posted')).toBeInTheDocument();
    });

    it('registers the drill panel with the gateway account as its subtitle', async () => {
        const setPanel = renderDetail(
            `/system-user/accounting/payment-gateways/${GATEWAY_ID}/transactions`
        );

        await waitFor(() => expect(lastPanel(setPanel)).not.toBeNull());
        const panel = lastPanel(setPanel)!;
        expect(panel.title).toBe('Cashfree');
        expect(panel.subtitle).toBe(GATEWAY_ID);
        expect(panel.tabs.map(tab => tab.key)).toEqual([
            'transactions',
            'received-and-bills',
            'statement-of-accounts',
        ]);
    });
});

describe('the received and bills tab', () => {
    const openTab = () =>
        renderDetail(`/system-user/accounting/payment-gateways/${GATEWAY_ID}/received-and-bills`);

    it('shows both tables, the receipts above the charges', async () => {
        openTab();

        expect((await screen.findAllByText('Received')).length).toBeGreaterThan(0);
        expect(screen.getByText('Bills / Fees Charged')).toBeInTheDocument();
        expect(screen.getAllByText('SETL-8891').length).toBeGreaterThan(1);
        expect(screen.getAllByText('₹ 15,000.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 400.00').length).toBeGreaterThan(0);
    });

    it('gives receipts and charges no Posted column, since In Books says where they stand', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        expect(screen.queryByText('Not applicable')).not.toBeInTheDocument();
        expect(screen.getAllByText('In Books')).toHaveLength(2);
        expect(screen.queryByText('Posted')).not.toBeInTheDocument();
    });

    it('says what the gateway is holding, over how many transactions, and warns about charges', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        expect(screen.getAllByText('Transactions').length).toBeGreaterThan(0);
        expect(screen.getAllByText('14').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 4,600.00').length).toBeGreaterThan(0);
        expect(screen.queryByText('Yet To Receive')).not.toBeInTheDocument();
        expect(
            screen.getByText(/charges it will keep are not reported to Peko/)
        ).toBeInTheDocument();
    });

    it('shows the shortfall on the receipt as what the gateway kept', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        expect(screen.getAllByText('₹ 15,400.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/₹ 400.00 kept as charges/).length).toBeGreaterThan(0);
    });

    it('opens the drawer with the outstanding amount already filled in', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        fireEvent.click(screen.getByRole('button', { name: 'Record receipt' }));

        await waitFor(() => expect(getPaymentGatewaySettlementSuggestion).toHaveBeenCalled());
        expect(await screen.findByText(/The gateway is holding ₹ 4600 in all/)).toBeInTheDocument();
        expect(field('expectedAmount')).toHaveValue('4600');
    });

    it('derives the fee from the shortfall and never lets it be typed', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        fireEvent.click(screen.getByRole('button', { name: 'Record receipt' }));
        await waitFor(() => expect(getPaymentGatewaySettlementSuggestion).toHaveBeenCalled());

        await waitFor(() => expect(field('amount')).toBeInTheDocument());
        fireEvent.change(field('amount'), { target: { value: '4200' } });

        const fee = field('feeAmount');
        await waitFor(() => expect(fee).toHaveValue('400'));
        expect(fee).toBeDisabled();
    });

    it('records the settlement and reports the charge it implied', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        fireEvent.click(screen.getByRole('button', { name: 'Record receipt' }));
        await waitFor(() => expect(getPaymentGatewaySettlementSuggestion).toHaveBeenCalled());

        await waitFor(() => expect(field('amount')).toBeInTheDocument());
        fireEvent.change(field('amount'), { target: { value: '4200' } });
        fireEvent.change(field('reference'), { target: { value: 'SETL-9000' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save settlement' }));

        await waitFor(() => expect(createPaymentGatewaySettlement).toHaveBeenCalled());
        const sent = (createPaymentGatewaySettlement as Mock).mock.calls[0][0];
        expect(sent.amount).toBe(4200);
        expect(sent.expectedAmount).toBe(4600);
        // The fee is the server's to work out, so it is never part of the request.
        expect(sent.feeAmount).toBeUndefined();
    });

    it('offers Reverse on a receipt only, and says it takes the charges with it', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        // One Reverse button: the receipt has one, the fee row does not.
        expect(screen.getAllByRole('button', { name: 'Reverse' })).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { name: 'Reverse' }));
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being voided?'), {
            target: { value: 'wrong gateway' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Void entry' }));

        await waitFor(() => expect(reversePaymentGatewaySettlement).toHaveBeenCalled());
        expect((reversePaymentGatewaySettlement as Mock).mock.calls[0][0].id).toBe(1);
    });

    it('disables the write actions without update permission', async () => {
        setState(stateWith(false));
        openTab();

        await screen.findAllByText('SETL-8891');
        expect(screen.getByRole('button', { name: 'Record receipt' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reverse' })).toBeDisabled();
    });
});

describe('going live with history behind you', () => {
    const openTab = () =>
        renderDetail(`/system-user/accounting/payment-gateways/${GATEWAY_ID}/received-and-bills`);

    it('warns while no opening is set, because the whole history reads as outstanding', async () => {
        openTab();

        expect(
            await screen.findByText(/everything it collected before this portal started recording/)
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Set opening balance' })).toBeEnabled();
    });

    it('records the position carried in as of the go-live date', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        fireEvent.click(screen.getByRole('button', { name: 'Set opening balance' }));

        await waitFor(() => expect(field('amount')).toBeInTheDocument());
        fireEvent.change(field('amount'), { target: { value: '12400' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(createPaymentGatewayOpeningBalance).toHaveBeenCalled());
        const sent = (createPaymentGatewayOpeningBalance as Mock).mock.calls[0][0];
        expect(sent.amount).toBe(12400);
        expect(sent.asOfDate).toBeTruthy();
    });

    it('takes an opening of zero, which is what a fully settled history means', async () => {
        openTab();

        await screen.findAllByText('SETL-8891');
        fireEvent.click(screen.getByRole('button', { name: 'Set opening balance' }));

        await waitFor(() => expect(field('amount')).toBeInTheDocument());
        fireEvent.change(field('amount'), { target: { value: '0' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(createPaymentGatewayOpeningBalance).toHaveBeenCalled());
        expect((createPaymentGatewayOpeningBalance as Mock).mock.calls[0][0].amount).toBe(0);
    });

    it('lists the opening in the Received table and stops offering to set another', async () => {
        (getPaymentGatewaySettlements as Mock).mockResolvedValue({
            entries: [
                settlementRow(),
                settlementRow({
                    id: 9,
                    entryKind: 'OPENING',
                    amount: 12400,
                    expectedAmount: null,
                    reference: null,
                    entryDate: '2026-10-01',
                }),
            ],
            recordsTotal: 2,
            feeEntries: [],
            feeRecordsTotal: 0,
            collected: 20000,
            received: 15000,
            fees: 400,
            opening: 12400,
            outstanding: 17000,
            transactionCount: 14,
            lastReceiptDate: '2026-09-22',
            lastReceiptAmount: 15000,
            openingBalanceSet: true,
            openingBalanceAsOf: '2026-10-01',
            page: 1,
            feePage: 1,
            itemsPerPage: 5,
        });
        openTab();

        expect(await screen.findByText('Opening balance')).toBeInTheDocument();
        expect(screen.getAllByText('Opening').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 12,400.00').length).toBeGreaterThan(0);
        expect(
            screen.queryByRole('button', { name: 'Set opening balance' })
        ).not.toBeInTheDocument();
    });

    it('marks an order that falls inside the opening rather than hiding it', async () => {
        (getPaymentGatewayTransactions as Mock).mockResolvedValue({
            entries: [
                {
                    id: 8,
                    corporateTxnId: '1789900000001',
                    transactionDate: '2026-09-28T10:00:00.000Z',
                    subscriberName: 'Al Rams Trading',
                    service: 'Flights',
                    paymentMode: 'PAYMENT GATEWAY',
                    totalAmount: 800,
                    gatewayAmount: 800,
                    beforeOpening: true,
                    status: 'SUCCESS',
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });
        renderDetail(`/system-user/accounting/payment-gateways/${GATEWAY_ID}/transactions`);

        expect(await screen.findByText('1789900000001')).toBeInTheDocument();
        expect(screen.getByText('before opening')).toBeInTheDocument();
    });
});

describe('the statement tab', () => {
    it('carries the three kinds of line the gateway ledger is made of', async () => {
        renderDetail(
            `/system-user/accounting/payment-gateways/${GATEWAY_ID}/statement-of-accounts`
        );

        expect(await screen.findByText(/Collected up to 2026-09-22/)).toBeInTheDocument();
        expect(screen.getAllByText('Received — NEFT').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Gateway charges').length).toBeGreaterThan(0);
        expect(screen.getByText(/A debit is money the gateway took in/)).toBeInTheDocument();
    });

    it('says why a collection is not in the books and marks receipts and charges as never going there', async () => {
        renderDetail(
            `/system-user/accounting/payment-gateways/${GATEWAY_ID}/statement-of-accounts`
        );

        const collected = (await screen.findByText(/Collected up to 2026-09-22/)).closest(
            'tr'
        ) as HTMLElement;
        expect(within(collected).getByText('Books refused it')).toBeInTheDocument();
        expect(
            within(
                screen.getAllByText('Gateway charges')[0].closest('tr') as HTMLElement
            ).getByText('Not applicable')
        ).toBeInTheDocument();
    });
});

describe('an order the gateway placed but the journal never derived', () => {
    it('is listed with every amount dashed', async () => {
        (getPaymentGatewayTransactions as Mock).mockResolvedValue({
            entries: [
                {
                    id: 9,
                    corporateTxnId: 'G-NOJOURNAL',
                    transactionDate: '2026-09-22T10:00:00.000Z',
                    subscriberName: 'Al Rams Trading',
                    service: 'Payroll',
                    paymentMode: 'PAYMENT GATEWAY',
                    totalAmount: null,
                    gatewayAmount: null,
                    beforeOpening: false,
                    status: 'SUCCESS',
                },
            ],
            recordsTotal: 1,
            page: 1,
            itemsPerPage: 10,
        });

        renderDetail(`/system-user/accounting/payment-gateways/${GATEWAY_ID}/transactions`);

        expect(await screen.findByText('G-NOJOURNAL')).toBeInTheDocument();
        expect(screen.queryByText('₹ 1,180.00')).not.toBeInTheDocument();
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
        expect(screen.queryByText('₹ 0.00')).not.toBeInTheDocument();
    });
});

describe('correcting a gateway entry recorded by hand', () => {
    const SETTLED = `/system-user/accounting/payment-gateways/${GATEWAY_ID}/received-and-bills`;

    const standalone = () =>
        (getPaymentGatewaySettlements as Mock).mockResolvedValue({
            entries: [
                settlementRow({ settlementId: null, expectedAmount: null }),
                settlementRow({
                    id: 9,
                    settlementId: null,
                    entryKind: 'OPENING',
                    reference: null,
                    amount: 2500,
                    entryDate: '2026-08-31',
                    note: 'carried in',
                }),
            ],
            recordsTotal: 2,
            feeEntries: [
                settlementRow({
                    id: 2,
                    settlementId: null,
                    entryKind: 'FEE',
                    entryNumber: 'BIL-000001',
                    amount: 400,
                    reference: 'FEE-1',
                    expectedAmount: null,
                }),
            ],
            feeRecordsTotal: 1,
            collected: 20000,
            received: 15000,
            fees: 400,
            opening: 2500,
            outstanding: 7100,
            openingBalanceSet: true,
            page: 1,
            itemsPerPage: 5,
        });

    const giveReason = async (text: string) =>
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being changed?'), {
            target: { value: text },
        });

    it('edits a receipt from the values it holds', async () => {
        standalone();
        (updatePaymentGatewaySettlement as Mock).mockResolvedValue({ id: 1 });
        renderDetail(SETTLED);
        await screen.findByText('SETL-8891', undefined, { timeout: 5000 });

        fireEvent.click(screen.getByLabelText('Edit Receipt RCT-000001'));
        const amount = await screen.findByPlaceholderText('0.00');
        expect(amount).toHaveValue('15000');
        fireEvent.change(amount, { target: { value: '14950' } });
        await giveReason('Bank statement shows less');
        fireEvent.click(screen.getByText('Save changes'));

        await waitFor(() =>
            expect(updatePaymentGatewaySettlement).toHaveBeenCalledWith(
                expect.objectContaining({
                    gatewayId: GATEWAY_ID,
                    id: 1,
                    amount: 14950,
                    entryDate: '2026-09-22',
                    reference: 'SETL-8891',
                    mode: 'NEFT',
                    note: 'weekly batch',
                    changeReason: 'Bank statement shows less',
                })
            )
        );
    });

    it('deletes a fee and edits the opening through their own calls', async () => {
        standalone();
        (deletePaymentGatewayFee as Mock).mockResolvedValue({ id: 2 });
        (updatePaymentGatewayOpeningBalance as Mock).mockResolvedValue({ id: 9 });
        renderDetail(SETTLED);
        await screen.findByText('FEE-1', undefined, { timeout: 5000 });

        fireEvent.click(screen.getByLabelText('Delete Fee BIL-000001'));
        fireEvent.change(await screen.findByPlaceholderText('Why is this entry being deleted?'), {
            target: { value: 'Charged twice' },
        });
        fireEvent.click(screen.getByText('Delete entry'));
        await waitFor(() =>
            expect(deletePaymentGatewayFee).toHaveBeenCalledWith(
                expect.objectContaining({ id: 2, reason: 'Charged twice' })
            )
        );

        fireEvent.click(await screen.findByLabelText('Edit Opening balance'));
        await giveReason('Per the statement');
        fireEvent.click(screen.getByText('Save changes'));
        await waitFor(() =>
            expect(updatePaymentGatewayOpeningBalance).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 9,
                    amount: 2500,
                    asOfDate: '2026-08-31',
                    note: 'carried in',
                })
            )
        );
    });

    it('offers only reverse on an entry recorded together with its fee', async () => {
        renderDetail(SETTLED);

        await screen.findAllByText('SETL-8891');
        expect(screen.queryByLabelText(/^Edit /)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/^Delete /)).not.toBeInTheDocument();
        expect(screen.getAllByText('Reverse').length).toBeGreaterThan(0);
    });
});

describe('removing a deleted gateway fee once the books have lost it', () => {
    it('asks first, then removes it from the portal', async () => {
        (getPaymentGatewaySettlements as Mock).mockResolvedValue({
            entries: [],
            recordsTotal: 0,
            feeEntries: [
                settlementRow({
                    id: 2,
                    settlementId: null,
                    entryKind: 'FEE',
                    entryNumber: 'BIL-000001',
                    amount: 400,
                    reference: 'FEE-1',
                    expectedAmount: null,
                    booksSynced: false,
                    deleted: true,
                    deleteReason: 'Charged twice',
                    deletedByName: 'Asha',
                }),
            ],
            feeRecordsTotal: 1,
            collected: 0,
            received: 0,
            fees: 0,
            opening: 0,
            outstanding: 0,
            openingBalanceSet: true,
            page: 1,
            itemsPerPage: 5,
        });
        (markPaymentGatewayFeeBooks as Mock).mockResolvedValue({ id: 2, removed: true });
        renderDetail(`/system-user/accounting/payment-gateways/${GATEWAY_ID}/received-and-bills`);
        await screen.findByText('FEE-1', undefined, { timeout: 5000 });

        expect(screen.getByText('Deleted')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Mark Fee BIL-000001 removed from the books'));
        fireEvent.click(await screen.findByText('Remove from portal'));

        await waitFor(() =>
            expect(markPaymentGatewayFeeBooks).toHaveBeenCalledWith(
                expect.objectContaining({ gatewayId: GATEWAY_ID, id: 2, synced: true })
            )
        );
    });
});
