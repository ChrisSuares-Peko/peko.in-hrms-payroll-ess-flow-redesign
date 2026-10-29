import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    downloadVendorLedgerTab,
    getVendorCommissions,
    getVendorCostOfSales,
    getVendorCreditNotes,
    getVendorDebitNotes,
    getVendorDeposits,
    getVendorTransactions,
} from '../api/vendorLedger';
import { DEPOSIT_MODE_OPTIONS } from '../components/ledgers/VendorEntryDrawers';
import VendorTabPanel from '../components/ledgers/VendorTabPanel';
import { LedgerTabKey } from '../config/ledgerPaths';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

vi.mock('../api/vendorLedger', async importOriginal => ({
    ...(await importOriginal<typeof import('../api/vendorLedger')>()),
    getVendorTransactions: vi.fn(),
    getVendorCommissions: vi.fn(),
    getVendorDeposits: vi.fn(),
    getVendorCreditNotes: vi.fn(),
    getVendorCostOfSales: vi.fn(),
    getVendorDebitNotes: vi.fn(),
    downloadVendorLedgerTab: vi.fn(),
}));

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

// Rendering a table, a debounced search and an antd select in jsdom is slow enough to sit on
// the default five second limit when many suites run at once.
vi.setConfig({ testTimeout: 20000 });

const RANGE = { from: '2026-09-06', to: '2026-10-06' };

const POSTED = { state: 'posted', note: null, detail: null };

const TRANSACTIONS = {
    entries: [
        {
            id: 7,
            corporateTxnId: '1790330777639',
            transactionDate: '2026-09-25T12:13:00.000Z',
            service: 'Xoxoday',
            customer: '100001238',
            vendorAmount: 100,
            commission: 8.26,
            markup: null,
            receivable: 91.74,
            status: 'SUCCESS',
            refunded: false,
            paymentMode: 'PAYMENT GATEWAY',
            posting: POSTED,
        },
    ],
    recordsTotal: 1,
    page: 1,
    itemsPerPage: 10,
};

const COMMISSIONS = {
    entries: [
        {
            id: 7,
            source: 'ORDER',
            corporateTxnId: '1790330777639',
            reference: null,
            entryNumber: null,
            transactionDate: '2026-09-25T12:13:00.000Z',
            service: 'Xoxoday',
            reason: null,
            orderAmount: 100,
            commissionExcludingGST: 7,
            commissionIncludingGST: 8.26,
            commissionReversed: 0,
            commissionNet: 8.26,
            refunded: false,
            posting: POSTED,
            status: null,
            entryType: null,
            recordedByName: null,
            hasDocument: false,
        },
    ],
    recordsTotal: 1,
    page: 1,
    itemsPerPage: 10,
};

const DEPOSITS = {
    entries: [
        {
            id: 3,
            amount: 5000,
            depositDate: '2026-09-20',
            reference: 'NEFT-1001',
            entryNumber: 'DEP-000001',
            mode: 'NEFT',
            note: null,
            status: 'ACTIVE',
            posting: { state: 'notApplicable', note: null, detail: null },
            entryType: 'DEPOSIT',
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
    page: 1,
    itemsPerPage: 10,
};

const CREDIT_NOTES = {
    entries: [
        {
            id: 4,
            kind: 'CREDIT_NOTE',
            source: 'MANUAL',
            reference: 'CN-7',
            entryNumber: 'VCN-000001',
            amount: 250,
            issueDate: '2026-09-21',
            reason: 'Duplicate booking',
            againstCorporateTxnId: null,
            status: 'OPEN',
            posting: { state: 'notApplicable', note: null, detail: null },
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
    ],
    recordsTotal: 1,
    page: 1,
    itemsPerPage: 10,
};

const COST_OF_SALES = {
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
            againstCorporateTxnId: null,
            status: 'OPEN',
            posting: { state: 'notApplicable', note: null, detail: null },
            entryType: 'ENTRY',
            reversesId: null,
            slipKey: null,
            slipName: null,
            slipFormat: null,
            recordedByName: 'Ibrahim',
            voidedByName: null,
            voidReason: null,
            hasDocument: false,
        },
    ],
    recordsTotal: 1,
    page: 1,
    itemsPerPage: 10,
};

const DEBIT_NOTES = {
    entries: [
        {
            ...COST_OF_SALES.entries[0],
            id: 21,
            kind: 'DEBIT_NOTE',
            entryNumber: 'VDN-000001',
            reference: 'DN-4',
            amount: 590,
            issueDate: '2026-10-20',
            reason: 'Cost of sales overstated',
        },
    ],
    recordsTotal: 1,
    page: 1,
    itemsPerPage: 10,
};

const realGetComputedStyle = window.getComputedStyle.bind(window);

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (getVendorTransactions as Mock).mockResolvedValue(TRANSACTIONS);
    (getVendorCommissions as Mock).mockResolvedValue(COMMISSIONS);
    (getVendorDeposits as Mock).mockResolvedValue(DEPOSITS);
    (getVendorCreditNotes as Mock).mockResolvedValue(CREDIT_NOTES);
    (getVendorCostOfSales as Mock).mockResolvedValue(COST_OF_SALES);
    (getVendorDebitNotes as Mock).mockResolvedValue(DEBIT_NOTES);
});

const renderPanel = (tab: LedgerTabKey) =>
    render(
        <MemoryRouter>
            <VendorTabPanel
                vendorId="5001"
                vendorName="xoxoday"
                tab={tab}
                range={RANGE}
                canUpdate
                openingBalanceSet
                onChanged={vi.fn()}
            />
        </MemoryRouter>
    );

describe('Vendor ledger export', () => {
    it.each([
        ['transactions', '1790330777639'],
        ['commissions', '1790330777639'],
        ['deposits', 'NEFT-1001'],
        ['credit-notes', 'VCN-000001'],
        ['cost-of-sales', 'COS-000001'],
        ['debit-notes', 'VDN-000001'],
    ] as [LedgerTabKey, string][])(
        'offers Excel and PDF on the %s tab, and no CSV',
        async (tab, reference) => {
            renderPanel(tab);

            await screen.findByText(reference);
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeEnabled();
            expect(screen.getByRole('button', { name: /Download PDF/ })).toBeEnabled();
            expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
        }
    );

    it.each([
        ['transactions', 'Transactions', '1790330777639'],
        ['commissions', 'Commissions', '1790330777639'],
        ['deposits', 'Deposits', 'NEFT-1001'],
        ['credit-notes', 'Credit Notes', 'VCN-000001'],
        ['cost-of-sales', 'Cost of Sales', 'COS-000001'],
        ['debit-notes', 'Debit Notes', 'VDN-000001'],
    ] as [LedgerTabKey, string, string][])(
        'downloads the %s for the vendor and the dates on screen, and saves the file',
        async (tab, label, reference) => {
            const blob = new Blob(['x']);
            (downloadVendorLedgerTab as Mock).mockResolvedValue(blob);
            renderPanel(tab);

            await screen.findByText(reference);
            fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

            await waitFor(() => expect(downloadVendorLedgerTab).toHaveBeenCalled());
            expect(downloadVendorLedgerTab).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                vendorId: '5001',
                tab,
                from: '2026-09-06',
                to: '2026-10-06',
                format: 'pdf',
            });
            await waitFor(() =>
                expect(saveAs).toHaveBeenCalledWith(
                    blob,
                    `xoxoday ${label} 2026-09-06 to 2026-10-06.pdf`
                )
            );
        }
    );

    it('keeps the Record commission button beside the export buttons', async () => {
        renderPanel('commissions');

        await screen.findByText('1790330777639');
        expect(screen.getByRole('button', { name: /Record commission/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeInTheDocument();
    });

    it('disables the buttons when there is nothing to export', async () => {
        (getVendorTransactions as Mock).mockResolvedValue({
            ...TRANSACTIONS,
            entries: [],
            recordsTotal: 0,
        });
        renderPanel('transactions');

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled()
        );
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });

    it('keeps the Record deposit and Record credit note buttons beside the export buttons', async () => {
        const deposits = renderPanel('deposits');
        await screen.findByText('NEFT-1001');
        expect(screen.getByRole('button', { name: /Record deposit/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeInTheDocument();
        deposits.unmount();

        renderPanel('credit-notes');
        await screen.findByText('VCN-000001');
        expect(screen.getByRole('button', { name: /Record credit note/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeInTheDocument();
    });
});

const SEARCH_PLACEHOLDER = 'Search reference, service or customer';

describe('Vendor transactions search and status filter', () => {
    it('puts the search and the status filter below the export buttons', async () => {
        renderPanel('transactions');

        await screen.findByText('1790330777639');
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        const search = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
        const status = screen.getByText('All statuses');

        // compareDocumentPosition is a bit mask; the following-in-the-page bit is worth 4.
        const comesAfter = (earlier: Element, later: Element) =>
            Math.floor(earlier.compareDocumentPosition(later) / Node.DOCUMENT_POSITION_FOLLOWING) %
                2 ===
            1;

        expect(comesAfter(exportButton, search)).toBe(true);
        expect(comesAfter(exportButton, status)).toBe(true);
    });

    it('asks for every transaction until something is typed or picked', async () => {
        renderPanel('transactions');

        await screen.findByText('1790330777639');
        expect(getVendorTransactions).toHaveBeenLastCalledWith(
            expect.not.objectContaining({ searchText: expect.anything() })
        );
        expect(getVendorTransactions).toHaveBeenLastCalledWith(
            expect.not.objectContaining({ status: expect.anything() })
        );
    });

    it('asks for what was typed, from the first page', async () => {
        renderPanel('transactions');
        await screen.findByText('1790330777639');

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
            target: { value: 'xoxo' },
        });

        await waitFor(() =>
            expect(getVendorTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'xoxo', page: 1 })
            )
        );
    });

    it('offers Success, Refunded and Failed, the three names the Status pill uses', async () => {
        renderPanel('transactions');
        await screen.findByText('1790330777639');

        fireEvent.mouseDown(screen.getByText('All statuses'));

        expect(await screen.findByTitle('Success')).toBeInTheDocument();
        expect(await screen.findByTitle('Refunded')).toBeInTheDocument();
        expect(await screen.findByTitle('Failed')).toBeInTheDocument();
    });

    it('asks for the status picked, from the first page', async () => {
        renderPanel('transactions');
        await screen.findByText('1790330777639');

        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Failed'));

        await waitFor(() =>
            expect(getVendorTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'failed', page: 1 })
            )
        );
    });

    it('goes back to every status when the choice is cleared', async () => {
        const { container } = renderPanel('transactions');
        await screen.findByText('1790330777639');
        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Refunded'));
        await waitFor(() =>
            expect(getVendorTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'refunded' })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);

        await waitFor(() =>
            expect(getVendorTransactions).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ status: expect.anything() })
            )
        );
    });

    it('exports what the table is filtered to, the search and the status both', async () => {
        (downloadVendorLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
        renderPanel('transactions');
        await screen.findByText('1790330777639');

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
            target: { value: 'xoxo' },
        });
        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Failed'));
        await waitFor(() =>
            expect(getVendorTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'xoxo', status: 'failed' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadVendorLedgerTab).toHaveBeenCalled());
        expect(downloadVendorLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            vendorId: '5001',
            tab: 'transactions',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'xoxo',
            status: 'failed',
            format: 'excel',
        });
    });

    it('sends no search or status to the export when none was chosen', async () => {
        (downloadVendorLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
        renderPanel('transactions');
        await screen.findByText('1790330777639');

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadVendorLedgerTab).toHaveBeenCalled());
        const sent = (downloadVendorLedgerTab as Mock).mock.calls[0][0];
        expect(sent.searchText).toBeUndefined();
        expect(sent.status).toBeUndefined();
    });

    it('says nothing matches, and keeps the export off, when the filter finds no transactions', async () => {
        renderPanel('transactions');
        await screen.findByText('1790330777639');
        (getVendorTransactions as Mock).mockResolvedValue({
            ...TRANSACTIONS,
            entries: [],
            recordsTotal: 0,
        });

        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Failed'));

        expect(
            await screen.findByText('No transactions match your search or filter.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });
});

const COMMISSION_SEARCH_PLACEHOLDER = 'Search entry no., order ref or service';

describe('Vendor commissions search and status filter', () => {
    it('puts the search and the status filter below the export buttons, beside Record commission', async () => {
        renderPanel('commissions');

        await screen.findByText('1790330777639');
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        const search = screen.getByPlaceholderText(COMMISSION_SEARCH_PLACEHOLDER);
        const status = screen.getByText('All statuses');

        const comesAfter = (earlier: Element, later: Element) =>
            Math.floor(earlier.compareDocumentPosition(later) / Node.DOCUMENT_POSITION_FOLLOWING) %
                2 ===
            1;
        expect(comesAfter(exportButton, search)).toBe(true);
        expect(comesAfter(exportButton, status)).toBe(true);
        expect(screen.getByRole('button', { name: /Record commission/ })).toBeInTheDocument();
    });

    it('does not use the transactions search words on this tab', async () => {
        renderPanel('commissions');

        await screen.findByText('1790330777639');
        expect(
            screen.queryByPlaceholderText('Search reference, service or customer')
        ).not.toBeInTheDocument();
    });

    it('offers the five names the Status pill uses on a commission', async () => {
        renderPanel('commissions');
        await screen.findByText('1790330777639');

        fireEvent.mouseDown(screen.getByText('All statuses'));

        await Promise.all(
            ['Earned', 'Refunded', 'Active', 'Reversal', 'Reversed'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
        expect(screen.queryByTitle('Success')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Failed')).not.toBeInTheDocument();
    });

    it('asks for what was typed, from the first page', async () => {
        renderPanel('commissions');
        await screen.findByText('1790330777639');

        fireEvent.change(screen.getByPlaceholderText(COMMISSION_SEARCH_PLACEHOLDER), {
            target: { value: 'xoxo' },
        });

        await waitFor(() =>
            expect(getVendorCommissions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'xoxo', page: 1 })
            )
        );
    });

    it('asks for the status picked, from the first page, and goes back when it is cleared', async () => {
        const { container } = renderPanel('commissions');
        await screen.findByText('1790330777639');

        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Reversal'));
        await waitFor(() =>
            expect(getVendorCommissions).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'reversal', page: 1 })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);
        await waitFor(() =>
            expect(getVendorCommissions).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ status: expect.anything() })
            )
        );
    });

    it('exports what the table is filtered to, the search and the status both', async () => {
        (downloadVendorLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
        renderPanel('commissions');
        await screen.findByText('1790330777639');

        fireEvent.change(screen.getByPlaceholderText(COMMISSION_SEARCH_PLACEHOLDER), {
            target: { value: 'xoxo' },
        });
        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Refunded'));
        await waitFor(() =>
            expect(getVendorCommissions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'xoxo', status: 'refunded' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadVendorLedgerTab).toHaveBeenCalled());
        expect(downloadVendorLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            vendorId: '5001',
            tab: 'commissions',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'xoxo',
            status: 'refunded',
            format: 'pdf',
        });
    });

    it('says nothing matches, and keeps the export off, when the filter finds no commissions', async () => {
        renderPanel('commissions');
        await screen.findByText('1790330777639');
        (getVendorCommissions as Mock).mockResolvedValue({
            ...COMMISSIONS,
            entries: [],
            recordsTotal: 0,
        });

        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Reversed'));

        expect(
            await screen.findByText('No commissions match your search or filter.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });
});

const DEPOSIT_SEARCH_PLACEHOLDER = 'Search entry no., reference, note or recorded by';

describe('Vendor deposits search, status and mode filters', () => {
    it('puts the search, the status and the mode below the export buttons, beside the record buttons', async () => {
        renderPanel('deposits');

        await screen.findByText('NEFT-1001');
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        const search = screen.getByPlaceholderText(DEPOSIT_SEARCH_PLACEHOLDER);
        const status = screen.getByText('All statuses');
        const mode = screen.getByText('All modes');

        const comesAfter = (earlier: Element, later: Element) =>
            Math.floor(earlier.compareDocumentPosition(later) / Node.DOCUMENT_POSITION_FOLLOWING) %
                2 ===
            1;
        expect(comesAfter(exportButton, search)).toBe(true);
        expect(comesAfter(exportButton, status)).toBe(true);
        expect(comesAfter(exportButton, mode)).toBe(true);
        expect(screen.getByRole('button', { name: /Record deposit/ })).toBeInTheDocument();
    });

    it('offers the four names the Status pill uses on a deposit', async () => {
        renderPanel('deposits');
        await screen.findByText('NEFT-1001');

        fireEvent.mouseDown(screen.getByText('All statuses'));

        await Promise.all(
            ['Active', 'Opening', 'Reversal', 'Reversed'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
        expect(screen.queryByTitle('Success')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Earned')).not.toBeInTheDocument();
    });

    it('offers every mode a deposit can be recorded with', async () => {
        renderPanel('deposits');
        await screen.findByText('NEFT-1001');

        fireEvent.mouseDown(screen.getByText('All modes'));

        await Promise.all(
            DEPOSIT_MODE_OPTIONS.map(async ({ label }) =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
        expect(DEPOSIT_MODE_OPTIONS.length).toBeGreaterThan(1);
    });

    it('asks for every deposit until something is typed or picked', async () => {
        renderPanel('deposits');

        await screen.findByText('NEFT-1001');
        const last = (getVendorDeposits as Mock).mock.calls.at(-1)?.[0];
        expect(last.searchText).toBeUndefined();
        expect(last.status).toBeUndefined();
        expect(last.mode).toBeUndefined();
    });

    it('asks for what was typed, from the first page', async () => {
        renderPanel('deposits');
        await screen.findByText('NEFT-1001');

        fireEvent.change(screen.getByPlaceholderText(DEPOSIT_SEARCH_PLACEHOLDER), {
            target: { value: 'utr' },
        });

        await waitFor(() =>
            expect(getVendorDeposits).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'utr', page: 1 })
            )
        );
    });

    it('asks for the mode picked, from the first page, and goes back when it is cleared', async () => {
        const { container } = renderPanel('deposits');
        await screen.findByText('NEFT-1001');

        fireEvent.mouseDown(screen.getByText('All modes'));
        fireEvent.click(await screen.findByTitle('UPI'));
        await waitFor(() =>
            expect(getVendorDeposits).toHaveBeenLastCalledWith(
                expect.objectContaining({ mode: 'UPI', page: 1 })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);
        await waitFor(() =>
            expect(getVendorDeposits).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ mode: expect.anything() })
            )
        );
    });

    it('asks for the status picked, from the first page', async () => {
        renderPanel('deposits');
        await screen.findByText('NEFT-1001');

        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Reversal'));

        await waitFor(() =>
            expect(getVendorDeposits).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'reversal', page: 1 })
            )
        );
    });

    it('exports what the table is filtered to, the search, the status and the mode all', async () => {
        (downloadVendorLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
        renderPanel('deposits');
        await screen.findByText('NEFT-1001');

        fireEvent.change(screen.getByPlaceholderText(DEPOSIT_SEARCH_PLACEHOLDER), {
            target: { value: 'utr' },
        });
        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Active'));
        fireEvent.mouseDown(screen.getByText('All modes'));
        fireEvent.click(await screen.findByTitle('UPI'));
        await waitFor(() =>
            expect(getVendorDeposits).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'utr', status: 'active', mode: 'UPI' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadVendorLedgerTab).toHaveBeenCalled());
        expect(downloadVendorLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            vendorId: '5001',
            tab: 'deposits',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'utr',
            status: 'active',
            mode: 'UPI',
            format: 'excel',
        });
    });

    it('sends no search, status or mode to the export when none was chosen', async () => {
        (downloadVendorLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
        renderPanel('deposits');
        await screen.findByText('NEFT-1001');

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadVendorLedgerTab).toHaveBeenCalled());
        const sent = (downloadVendorLedgerTab as Mock).mock.calls[0][0];
        expect(sent.searchText).toBeUndefined();
        expect(sent.status).toBeUndefined();
        expect(sent.mode).toBeUndefined();
    });

    it('says nothing matches, and keeps the export off, when the filters find no deposits', async () => {
        renderPanel('deposits');
        await screen.findByText('NEFT-1001');
        (getVendorDeposits as Mock).mockResolvedValue({
            ...DEPOSITS,
            entries: [],
            recordsTotal: 0,
        });

        fireEvent.mouseDown(screen.getByText('All modes'));
        fireEvent.click(await screen.findByTitle('Cheque'));

        expect(
            await screen.findByText('No deposits match your search or filter.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });
});

const CREDIT_NOTE_SEARCH_PLACEHOLDER = 'Search entry no., credit note, order or reason';

describe('Vendor credit notes search and status filter', () => {
    it('puts the search and the status filter below the export buttons, beside Record credit note', async () => {
        renderPanel('credit-notes');

        await screen.findByText('VCN-000001');
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        const search = screen.getByPlaceholderText(CREDIT_NOTE_SEARCH_PLACEHOLDER);
        const status = screen.getByText('All statuses');

        const comesAfter = (earlier: Element, later: Element) =>
            Math.floor(earlier.compareDocumentPosition(later) / Node.DOCUMENT_POSITION_FOLLOWING) %
                2 ===
            1;
        expect(comesAfter(exportButton, search)).toBe(true);
        expect(comesAfter(exportButton, status)).toBe(true);
        expect(screen.getByRole('button', { name: /Record credit note/ })).toBeInTheDocument();
    });

    it('has no mode filter, which only deposits have', async () => {
        renderPanel('credit-notes');

        await screen.findByText('VCN-000001');
        expect(screen.queryByText('All modes')).not.toBeInTheDocument();
    });

    it('offers the three names the Status pill uses on a credit note', async () => {
        renderPanel('credit-notes');
        await screen.findByText('VCN-000001');

        fireEvent.mouseDown(screen.getByText('All statuses'));

        await Promise.all(
            ['Active', 'Reversal', 'Reversed'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
        expect(screen.queryByTitle('Opening')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Success')).not.toBeInTheDocument();
    });

    it('asks for what was typed, from the first page', async () => {
        renderPanel('credit-notes');
        await screen.findByText('VCN-000001');

        fireEvent.change(screen.getByPlaceholderText(CREDIT_NOTE_SEARCH_PLACEHOLDER), {
            target: { value: 'duplicate' },
        });

        await waitFor(() =>
            expect(getVendorCreditNotes).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'duplicate', page: 1 })
            )
        );
    });

    it('asks for the status picked, from the first page, and goes back when it is cleared', async () => {
        const { container } = renderPanel('credit-notes');
        await screen.findByText('VCN-000001');

        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Reversal'));
        await waitFor(() =>
            expect(getVendorCreditNotes).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'reversal', page: 1 })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);
        await waitFor(() =>
            expect(getVendorCreditNotes).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ status: expect.anything() })
            )
        );
    });

    it('exports what the table is filtered to, the search and the status both', async () => {
        (downloadVendorLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
        renderPanel('credit-notes');
        await screen.findByText('VCN-000001');

        fireEvent.change(screen.getByPlaceholderText(CREDIT_NOTE_SEARCH_PLACEHOLDER), {
            target: { value: 'duplicate' },
        });
        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Active'));
        await waitFor(() =>
            expect(getVendorCreditNotes).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'duplicate', status: 'active' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadVendorLedgerTab).toHaveBeenCalled());
        expect(downloadVendorLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            vendorId: '5001',
            tab: 'credit-notes',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'duplicate',
            status: 'active',
            format: 'pdf',
        });
    });

    it('says nothing matches, and keeps the export off, when the filter finds no credit notes', async () => {
        renderPanel('credit-notes');
        await screen.findByText('VCN-000001');
        (getVendorCreditNotes as Mock).mockResolvedValue({
            ...CREDIT_NOTES,
            entries: [],
            recordsTotal: 0,
        });

        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Reversed'));

        expect(
            await screen.findByText('No credit notes match your search or filter.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });
});
