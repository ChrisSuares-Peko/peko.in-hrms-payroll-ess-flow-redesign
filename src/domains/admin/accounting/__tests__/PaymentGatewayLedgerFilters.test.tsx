import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    downloadPaymentGatewayLedgerTab,
    downloadPaymentGatewayStatement,
    getPaymentGatewaySettlements,
    getPaymentGatewayStatement,
    getPaymentGatewayTransactions,
} from '../api/paymentGatewayLedger';
import PaymentGatewayStatementPanel from '../components/ledgers/PaymentGatewayStatementPanel';
import PaymentGatewayTabPanel from '../components/ledgers/PaymentGatewayTabPanel';
import { LedgerTabKey } from '../config/ledgerPaths';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

vi.mock('../api/paymentGatewayLedger', async importOriginal => ({
    ...(await importOriginal<typeof import('../api/paymentGatewayLedger')>()),
    getPaymentGatewayTransactions: vi.fn(),
    getPaymentGatewaySettlements: vi.fn(),
    getPaymentGatewayStatement: vi.fn(),
    downloadPaymentGatewayLedgerTab: vi.fn(),
    downloadPaymentGatewayStatement: vi.fn(),
}));

// Rendering a table, a debounced search and an antd select in jsdom is slow enough to sit on
// the default five second limit when many suites run at once.
vi.setConfig({ testTimeout: 20000 });

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const RANGE = { from: '2026-09-06', to: '2026-10-06' };

const GATEWAY_ID = '4003352000000058004';

const POSTED = { state: 'posted', note: null, detail: null };
const NOT_APPLICABLE = { state: 'notApplicable', note: null, detail: null };

const TRANSACTIONS = {
    entries: [
        {
            id: 1,
            corporateTxnId: '1791277831861',
            transactionDate: '2026-10-06T06:14:02.000Z',
            subscriberName: 'Faris Rahamn',
            service: 'Peko Go',
            paymentMode: 'PAYMENT GATEWAY',
            totalAmount: 1155.27,
            gatewayAmount: 1155.27,
            beforeOpening: false,
            status: 'SUCCESS',
            posting: POSTED,
        },
    ],
    recordsTotal: 1,
    openingBalanceAsOf: null,
    page: 1,
    itemsPerPage: 10,
};

const entry = (id: number, entryKind: string, reference: string) => ({
    id,
    gatewayAccountId: GATEWAY_ID,
    settlementId: null,
    entryKind,
    entryType: 'ENTRY',
    amount: 1000,
    expectedAmount: entryKind === 'RECEIPT' ? 1012 : null,
    entryDate: '2026-09-30',
    reference,
    mode: 'NEFT',
    note: null,
    status: 'ACTIVE',
    posting: NOT_APPLICABLE,
    reversesId: null,
    slipKey: null,
    slipName: null,
    slipFormat: null,
    recordedByName: 'Peko Payments Services LLC',
    voidedByName: null,
    voidReason: null,
});

const SETTLEMENTS = (
    received: unknown[],
    fees: unknown[],
    totals: { received?: number; fees?: number } = {}
) => ({
    entries: received,
    recordsTotal: totals.received ?? received.length,
    feeEntries: fees,
    feeRecordsTotal: totals.fees ?? fees.length,
    outstanding: 761110.01,
    collected: 413879.23,
    received: 0,
    fees: 100,
    opening: 0,
    transactionCount: 12,
    lastReceiptDate: null,
    lastReceiptAmount: null,
    openingBalanceSet: true,
    openingBalanceAsOf: null,
    page: 1,
    feePage: 1,
    itemsPerPage: 5,
});

const realGetComputedStyle = window.getComputedStyle.bind(window);

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    URL.createObjectURL = vi.fn(() => 'blob:statement');
    URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (getPaymentGatewayTransactions as Mock).mockResolvedValue(TRANSACTIONS);
    (getPaymentGatewaySettlements as Mock).mockResolvedValue(
        SETTLEMENTS([entry(3, 'RECEIPT', 'RCPT-5435')], [entry(4, 'FEE', 'FEE-sdf5')])
    );
    (downloadPaymentGatewayLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
});

const renderPanel = (tab: LedgerTabKey) =>
    render(
        <MemoryRouter>
            <PaymentGatewayTabPanel
                gatewayId={GATEWAY_ID}
                gatewayName="Cashfree"
                tab={tab}
                range={RANGE}
                canUpdate
                onChanged={vi.fn()}
            />
        </MemoryRouter>
    );

const comesAfter = (earlier: Element, later: Element) =>
    Math.floor(earlier.compareDocumentPosition(later) / Node.DOCUMENT_POSITION_FOLLOWING) % 2 === 1;

const pickIn = async (select: Element, option: string) => {
    fireEvent.mouseDown(select);
    fireEvent.click(await screen.findByTitle(option));
};

const TRANSACTION_SEARCH = 'Search txn ID, subscriber or service';
const ENTRY_SEARCH = 'Search entry no., reference, note or recorded by';

// The Received table sits above the Bills table, and each carries its own pair of buttons, its
// own search and its own filters.
const RECEIVED = 0;
const FEES = 1;

const exportButton = (table: number, name: RegExp) =>
    screen.getAllByRole('button', { name })[table];
const searchOf = (table: number) => screen.getAllByPlaceholderText(ENTRY_SEARCH)[table];
const statusOf = (table: number) => screen.getAllByText('All statuses')[table];

describe('Payment gateway Transactions — search and Status filter', () => {
    it('puts the search and the Status filter below the export buttons', async () => {
        renderPanel('transactions');

        await screen.findByText('1791277831861');
        const excel = screen.getByRole('button', { name: /Export Excel/ });
        expect(comesAfter(excel, screen.getByPlaceholderText(TRANSACTION_SEARCH))).toBe(true);
        expect(comesAfter(excel, screen.getByText('All statuses'))).toBe(true);
        expect(screen.queryByText('All modes')).not.toBeInTheDocument();
    });

    it('offers the three names the Status pill uses', async () => {
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.mouseDown(screen.getByText('All statuses'));

        await Promise.all(
            ['Success', 'Refunded', 'Failed'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
        expect(screen.queryByTitle('Charged')).not.toBeInTheDocument();
    });

    it('asks for every row, with no search or filter, until one is chosen', async () => {
        renderPanel('transactions');

        await screen.findByText('1791277831861');
        const last = (getPaymentGatewayTransactions as Mock).mock.calls.at(-1)?.[0];
        expect(last.searchText).toBeUndefined();
        expect(last.status).toBeUndefined();
    });

    it('asks for what was typed, from the first page', async () => {
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.change(screen.getByPlaceholderText(TRANSACTION_SEARCH), {
            target: { value: 'hike' },
        });

        await waitFor(() =>
            expect(getPaymentGatewayTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'hike', page: 1 })
            )
        );
    });

    it('asks for the status picked, from the first page, and goes back when it is cleared', async () => {
        const { container } = renderPanel('transactions');
        await screen.findByText('1791277831861');

        await pickIn(screen.getByText('All statuses'), 'Failed');
        await waitFor(() =>
            expect(getPaymentGatewayTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'failed', page: 1 })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);
        await waitFor(() =>
            expect(getPaymentGatewayTransactions).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ status: expect.anything() })
            )
        );
    });

    it('goes back to the first page when a filter changes', async () => {
        (getPaymentGatewayTransactions as Mock).mockResolvedValue({
            ...TRANSACTIONS,
            recordsTotal: 25,
        });
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.click(await screen.findByTitle('2'));
        await waitFor(() =>
            expect(getPaymentGatewayTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 2 })
            )
        );

        await pickIn(screen.getByText('All statuses'), 'Success');
        await waitFor(() =>
            expect(getPaymentGatewayTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'success', page: 1 })
            )
        );
    });

    it('exports Excel with the dates and the search the table is filtered to', async () => {
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.change(screen.getByPlaceholderText(TRANSACTION_SEARCH), {
            target: { value: 'hike' },
        });
        await waitFor(() =>
            expect(getPaymentGatewayTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'hike' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalled());
        expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            gatewayId: GATEWAY_ID,
            tab: 'transactions',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'hike',
            format: 'excel',
        });
    });

    it('exports the PDF with the search and the status', async () => {
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.change(screen.getByPlaceholderText(TRANSACTION_SEARCH), {
            target: { value: 'peko' },
        });
        await pickIn(screen.getByText('All statuses'), 'Refunded');
        await waitFor(() =>
            expect(getPaymentGatewayTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'peko', status: 'refunded' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalled());
        expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            gatewayId: GATEWAY_ID,
            tab: 'transactions',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'peko',
            status: 'refunded',
            format: 'pdf',
        });
    });

    it('sends no search or status to the export when none was chosen', async () => {
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalled());
        const sent = (downloadPaymentGatewayLedgerTab as Mock).mock.calls[0][0];
        expect([sent.searchText, sent.status, sent.mode]).toEqual([
            undefined,
            undefined,
            undefined,
        ]);
    });

    it('says nothing matches, and keeps the export off, when the search finds nothing', async () => {
        renderPanel('transactions');
        await screen.findByText('1791277831861');
        (getPaymentGatewayTransactions as Mock).mockResolvedValue({
            ...TRANSACTIONS,
            entries: [],
            recordsTotal: 0,
        });

        fireEvent.change(screen.getByPlaceholderText(TRANSACTION_SEARCH), {
            target: { value: 'nothing like this' },
        });

        expect(
            await screen.findByText('No payments match your search or filter.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });
});

describe('Payment gateway Received & Bills — search and filters on each table', () => {
    it('gives each table its own search and Status filter below its own export buttons', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        expect(screen.getAllByPlaceholderText(ENTRY_SEARCH)).toHaveLength(2);
        expect(screen.getAllByText('All statuses')).toHaveLength(2);
        [RECEIVED, FEES].forEach(table => {
            const excel = exportButton(table, /Export Excel/);
            expect(comesAfter(excel, searchOf(table))).toBe(true);
            expect(comesAfter(excel, statusOf(table))).toBe(true);
        });
        // The second table's controls come after the first table's, not before.
        expect(comesAfter(searchOf(RECEIVED), exportButton(FEES, /Export Excel/))).toBe(true);
    });

    it('has a Mode filter on Received only, where a mode is recorded', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        expect(screen.getAllByText('All modes')).toHaveLength(1);
        expect(
            comesAfter(exportButton(RECEIVED, /Export Excel/), screen.getByText('All modes'))
        ).toBe(true);
        expect(comesAfter(screen.getByText('All modes'), exportButton(FEES, /Export Excel/))).toBe(
            true
        );
    });

    it('offers Received its four names and Bills its three, and Received every mode', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        fireEvent.mouseDown(statusOf(RECEIVED));
        await Promise.all(
            ['Opening', 'Reversal', 'Reversed'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
        expect(screen.queryByTitle('Charged')).not.toBeInTheDocument();

        fireEvent.mouseDown(screen.getByText('All modes'));
        await Promise.all(
            ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Other'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
    });

    it('offers Bills the names its Status pill uses, with no opening', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        fireEvent.mouseDown(statusOf(FEES));

        expect(await screen.findByTitle('Charged')).toBeInTheDocument();
        expect(screen.queryByTitle('Opening')).not.toBeInTheDocument();
    });

    it('asks for no search or filter on either table until one is chosen', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        const last = (getPaymentGatewaySettlements as Mock).mock.calls.at(-1)?.[0];
        ['searchText', 'status', 'mode', 'feeSearchText', 'feeStatus'].forEach(key => {
            expect(last[key]).toBeUndefined();
        });
    });

    it("asks for the received table's own search, status and mode, from its first page", async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        fireEvent.change(searchOf(RECEIVED), { target: { value: 'utr' } });
        await pickIn(statusOf(RECEIVED), 'Opening');
        await pickIn(screen.getByText('All modes'), 'UPI');

        await waitFor(() =>
            expect(getPaymentGatewaySettlements).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    searchText: 'utr',
                    status: 'opening',
                    mode: 'UPI',
                    page: 1,
                })
            )
        );
        const last = (getPaymentGatewaySettlements as Mock).mock.calls.at(-1)?.[0];
        expect(last.feeSearchText).toBeUndefined();
        expect(last.feeStatus).toBeUndefined();
    });

    it("asks for the fee table's own search and status under their own names", async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        fireEvent.change(searchOf(FEES), { target: { value: 'bill' } });
        await pickIn(statusOf(FEES), 'Charged');

        await waitFor(() =>
            expect(getPaymentGatewaySettlements).toHaveBeenLastCalledWith(
                expect.objectContaining({ feeSearchText: 'bill', feeStatus: 'charged' })
            )
        );
        const last = (getPaymentGatewaySettlements as Mock).mock.calls.at(-1)?.[0];
        expect(last.searchText).toBeUndefined();
        expect(last.status).toBeUndefined();
        expect(last.mode).toBeUndefined();
    });

    it("goes back to a table's first page when its own filter changes, and leaves the other table's page alone", async () => {
        (getPaymentGatewaySettlements as Mock).mockResolvedValue(
            SETTLEMENTS([entry(3, 'RECEIPT', 'RCPT-5435')], [entry(4, 'FEE', 'FEE-sdf5')], {
                received: 12,
                fees: 12,
            })
        );
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        const [receivedTwo, feesTwo] = await screen.findAllByTitle('2');
        fireEvent.click(receivedTwo);
        await waitFor(() =>
            expect(getPaymentGatewaySettlements).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 2, feePage: 1 })
            )
        );
        fireEvent.click(feesTwo);
        await waitFor(() =>
            expect(getPaymentGatewaySettlements).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 2, feePage: 2 })
            )
        );

        await pickIn(statusOf(RECEIVED), 'Reversal');
        await waitFor(() =>
            expect(getPaymentGatewaySettlements).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'reversal', page: 1, feePage: 2 })
            )
        );

        // The received table now shows its choice, so the one placeholder left is the fee table's.
        await pickIn(screen.getByText('All statuses'), 'Charged');
        await waitFor(() =>
            expect(getPaymentGatewaySettlements).toHaveBeenLastCalledWith(
                expect.objectContaining({ feeStatus: 'charged', page: 1, feePage: 1 })
            )
        );
    });

    it('exports Received with its own search, status and mode, and nothing from the fee table', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        fireEvent.change(searchOf(RECEIVED), { target: { value: 'utr' } });
        fireEvent.change(searchOf(FEES), { target: { value: 'bill' } });
        await pickIn(statusOf(RECEIVED), 'Reversal');
        await pickIn(screen.getByText('All modes'), 'UPI');
        await waitFor(() =>
            expect(getPaymentGatewaySettlements).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    searchText: 'utr',
                    status: 'reversal',
                    mode: 'UPI',
                    feeSearchText: 'bill',
                })
            )
        );
        fireEvent.click(exportButton(RECEIVED, /Download PDF/));

        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalled());
        expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            gatewayId: GATEWAY_ID,
            tab: 'received',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'utr',
            status: 'reversal',
            mode: 'UPI',
            format: 'pdf',
        });
    });

    it('exports Bills / Fees Charged with its own search and status, and nothing from the received table', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        fireEvent.change(searchOf(RECEIVED), { target: { value: 'utr' } });
        fireEvent.change(searchOf(FEES), { target: { value: 'bill' } });
        await pickIn(statusOf(FEES), 'Charged');
        await waitFor(() =>
            expect(getPaymentGatewaySettlements).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    searchText: 'utr',
                    feeSearchText: 'bill',
                    feeStatus: 'charged',
                })
            )
        );
        fireEvent.click(exportButton(FEES, /Export Excel/));

        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalled());
        expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            gatewayId: GATEWAY_ID,
            tab: 'fees',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'bill',
            status: 'charged',
            format: 'excel',
        });
    });

    it('sends no search or filter to either export when none was chosen', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        fireEvent.click(exportButton(RECEIVED, /Export Excel/));
        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledTimes(1));
        fireEvent.click(exportButton(FEES, /Export Excel/));
        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledTimes(2));

        (downloadPaymentGatewayLedgerTab as Mock).mock.calls.forEach(([sent]) => {
            expect([sent.searchText, sent.status, sent.mode]).toEqual([
                undefined,
                undefined,
                undefined,
            ]);
        });
    });

    it('says nothing matches in the table that was searched, and keeps only its export off', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');
        (getPaymentGatewaySettlements as Mock).mockResolvedValue(
            SETTLEMENTS([], [entry(4, 'FEE', 'FEE-sdf5')])
        );

        fireEvent.change(searchOf(RECEIVED), { target: { value: 'nothing like this' } });

        expect(
            await screen.findByText('No receipts match your search or filter.')
        ).toBeInTheDocument();
        expect(exportButton(RECEIVED, /Export Excel/)).toBeDisabled();
        expect(exportButton(RECEIVED, /Download PDF/)).toBeDisabled();
        expect(exportButton(FEES, /Export Excel/)).toBeEnabled();
        expect(
            screen.queryByText('No charges match your search or filter.')
        ).not.toBeInTheDocument();
    });

    it('says nothing matches in the fee table too', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');
        (getPaymentGatewaySettlements as Mock).mockResolvedValue(
            SETTLEMENTS([entry(3, 'RECEIPT', 'RCPT-5435')], [])
        );

        fireEvent.change(searchOf(FEES), { target: { value: 'nothing like this' } });

        expect(
            await screen.findByText('No charges match your search or filter.')
        ).toBeInTheDocument();
        expect(exportButton(FEES, /Export Excel/)).toBeDisabled();
        expect(exportButton(RECEIVED, /Export Excel/)).toBeEnabled();
    });

    it('keeps the usual empty messages when nothing is filtered', async () => {
        (getPaymentGatewaySettlements as Mock).mockResolvedValue(SETTLEMENTS([], []));
        renderPanel('received-and-bills');

        expect(
            await screen.findByText('Nothing received from this gateway yet.')
        ).toBeInTheDocument();
        expect(screen.getByText('No charges recorded for this gateway yet.')).toBeInTheDocument();
    });

    it('keeps Record fee and Set opening balance beside the export buttons', async () => {
        renderPanel('received-and-bills');
        await screen.findByText('RCPT-5435');

        expect(screen.getByRole('button', { name: /Record fee/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Record receipt/ })).toBeInTheDocument();
    });
});

const STATEMENT = {
    gatewayName: 'Cashfree',
    openingBalance: 0,
    totalDebit: 11899,
    totalCredit: 10100,
    closingBalance: 1799,
    entries: [
        {
            date: '2026-09-02',
            particulars: 'Collected — Hike',
            reference: '1791277232985',
            type: 'Collected',
            debit: 11899,
            credit: null,
            balance: 11899,
            posting: POSTED,
        },
        {
            date: '2026-09-05',
            particulars: 'Settlement received',
            reference: 'UTR-5',
            type: 'Received',
            debit: null,
            credit: 10000,
            balance: 1899,
            posting: NOT_APPLICABLE,
        },
    ],
    recordsTotal: 2,
    truncated: false,
    page: 1,
    itemsPerPage: 10,
};

const SEARCH_PLACEHOLDER = 'Search particulars, reference or type';

const renderStatement = () =>
    render(
        <MemoryRouter>
            <PaymentGatewayStatementPanel
                gatewayId={GATEWAY_ID}
                gatewayName="Cashfree"
                range={RANGE}
            />
        </MemoryRouter>
    );

describe('Payment gateway statement search and Debit / Credit filter', () => {
    beforeEach(() => {
        (getPaymentGatewayStatement as Mock).mockResolvedValue(STATEMENT);
        (downloadPaymentGatewayStatement as Mock).mockResolvedValue(new Blob(['x']));
    });

    it('puts the search and the debit or credit filter below the export buttons, at the right end', async () => {
        renderStatement();

        await screen.findByText('UTR-5');
        const excel = screen.getByRole('button', { name: /Export Excel/ });
        expect(comesAfter(excel, screen.getByPlaceholderText(SEARCH_PLACEHOLDER))).toBe(true);
        expect(comesAfter(excel, screen.getByText('All entries'))).toBe(true);
    });

    it('asks for every line until something is typed or picked', async () => {
        renderStatement();

        await screen.findByText('UTR-5');
        const last = (getPaymentGatewayStatement as Mock).mock.calls.at(-1)?.[0];
        expect(last.searchText).toBeUndefined();
        expect(last.side).toBeUndefined();
    });

    it('asks for what was typed, and the side picked, from the first page', async () => {
        renderStatement();
        await screen.findByText('UTR-5');

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
            target: { value: 'settlement' },
        });
        await pickIn(screen.getByText('All entries'), 'Credit');

        await waitFor(() =>
            expect(getPaymentGatewayStatement).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    gatewayId: GATEWAY_ID,
                    searchText: 'settlement',
                    side: 'credit',
                    page: 1,
                })
            )
        );
    });

    it('lists only the matching lines when filtered, and says the figures above still cover the whole period', async () => {
        renderStatement();
        await screen.findByText('UTR-5');
        expect(screen.getByText('Opening balance')).toBeInTheDocument();
        expect(screen.getByText('Closing balance')).toBeInTheDocument();

        await pickIn(screen.getByText('All entries'), 'Debit');

        expect(
            await screen.findByText('The figures above still cover the whole period.')
        ).toBeInTheDocument();
        expect(screen.queryByText('Opening balance')).not.toBeInTheDocument();
        expect(screen.queryByText('Closing balance')).not.toBeInTheDocument();
    });

    it.each([
        ['Excel', /Export Excel/, 'export'],
        ['PDF', /Download PDF/, 'pdf'],
    ])(
        'exports the %s with the search and the side the table is filtered to',
        async (_name, button, format) => {
            renderStatement();
            await screen.findByText('UTR-5');

            fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
                target: { value: 'settlement' },
            });
            await pickIn(screen.getByText('All entries'), 'Credit');
            await waitFor(() =>
                expect(getPaymentGatewayStatement).toHaveBeenLastCalledWith(
                    expect.objectContaining({ searchText: 'settlement', side: 'credit' })
                )
            );
            fireEvent.click(screen.getByRole('button', { name: button }));

            await waitFor(() => expect(downloadPaymentGatewayStatement).toHaveBeenCalled());
            expect(downloadPaymentGatewayStatement).toHaveBeenCalledWith(
                expect.objectContaining({
                    gatewayId: GATEWAY_ID,
                    format,
                    searchText: 'settlement',
                    side: 'credit',
                    from: '2026-09-06',
                    to: '2026-10-06',
                })
            );
        }
    );

    it('sends no search or side to the export when none was chosen', async () => {
        renderStatement();
        await screen.findByText('UTR-5');

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadPaymentGatewayStatement).toHaveBeenCalled());
        const sent = (downloadPaymentGatewayStatement as Mock).mock.calls[0][0];
        expect(sent.searchText).toBeUndefined();
        expect(sent.side).toBeUndefined();
    });

    it('says nothing matches, and keeps the export off, when the filters find no lines', async () => {
        renderStatement();
        await screen.findByText('UTR-5');
        (getPaymentGatewayStatement as Mock).mockResolvedValue({
            ...STATEMENT,
            entries: [],
            recordsTotal: 0,
        });

        await pickIn(screen.getByText('All entries'), 'Debit');

        expect(
            await screen.findByText('No lines match your search or filter.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });
});
