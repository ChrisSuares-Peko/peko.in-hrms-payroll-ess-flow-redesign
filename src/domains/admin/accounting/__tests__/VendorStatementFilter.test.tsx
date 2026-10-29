import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { downloadVendorStatement, getVendorStatement } from '../api/vendorLedger';
import LedgerStatementPanel from '../components/ledgers/LedgerStatementPanel';
import VendorStatementPanel from '../components/ledgers/VendorStatementPanel';
import { Posting } from '../types/posting';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('../api/vendorLedger', async importOriginal => ({
    ...(await importOriginal<typeof import('../api/vendorLedger')>()),
    getVendorStatement: vi.fn(),
    downloadVendorStatement: vi.fn(),
}));

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

// Rendering a table, a debounced search and an antd select in jsdom is slow enough to sit on
// the default five second limit when many suites run at once.
vi.setConfig({ testTimeout: 20000 });

const RANGE = { from: '2026-09-07', to: '2026-10-07' };

const POSTED: Posting = { state: 'posted', note: null, detail: null };

const STATEMENT = {
    vendorName: 'xoxoday',
    openingBalance: -9000,
    totalDebit: 29982.02,
    totalCredit: 53446.26,
    closingBalance: -32464.24,
    entries: [
        {
            date: '2026-09-07',
            particulars: 'Commission',
            reference: '1788761320899',
            entryNumber: null,
            type: 'Commission',
            debit: 225,
            credit: null,
            balance: -13775,
            posting: POSTED,
        },
        {
            date: '2026-09-10',
            particulars: 'Deposit — NEFT',
            reference: 'UTR-1',
            entryNumber: 'DEP-000001',
            type: 'Deposit',
            debit: 3000,
            credit: null,
            balance: -10775,
            posting: POSTED,
        },
    ],
    recordsTotal: 2,
    truncated: false,
    page: 1,
    itemsPerPage: 10,
};

const SEARCH_PLACEHOLDER = 'Search particulars, reference or type';

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
    (getVendorStatement as Mock).mockResolvedValue(STATEMENT);
    (downloadVendorStatement as Mock).mockResolvedValue(new Blob(['x']));
});

const renderPanel = () =>
    render(
        <MemoryRouter>
            <VendorStatementPanel
                vendorId="5001"
                vendorName="xoxoday"
                range={RANGE}
                openingBalanceSet
            />
        </MemoryRouter>
    );

describe('Vendor statement search and Debit / Credit filter', () => {
    it('puts the search and the debit or credit filter above the table, at the right end', async () => {
        renderPanel();

        await screen.findByText('UTR-1');
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        const search = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
        const side = screen.getByText('All entries');

        const comesAfter = (earlier: Element, later: Element) =>
            Math.floor(earlier.compareDocumentPosition(later) / Node.DOCUMENT_POSITION_FOLLOWING) %
                2 ===
            1;
        expect(comesAfter(exportButton, search)).toBe(true);
        expect(comesAfter(exportButton, side)).toBe(true);
        expect(comesAfter(screen.getByText('Closing Balance'), search)).toBe(true);
    });

    it('asks for every line until something is typed or picked', async () => {
        renderPanel();

        await screen.findByText('UTR-1');
        const last = (getVendorStatement as Mock).mock.calls.at(-1)?.[0];
        expect(last.searchText).toBeUndefined();
        expect(last.side).toBeUndefined();
    });

    it('offers Debit and Credit', async () => {
        renderPanel();
        await screen.findByText('UTR-1');

        fireEvent.mouseDown(screen.getByText('All entries'));

        expect(await screen.findByTitle('Debit')).toBeInTheDocument();
        expect(await screen.findByTitle('Credit')).toBeInTheDocument();
    });

    it('asks for what was typed, from the first page', async () => {
        renderPanel();
        await screen.findByText('UTR-1');

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
            target: { value: 'utr' },
        });

        await waitFor(() =>
            expect(getVendorStatement).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'utr', page: 1 })
            )
        );
    });

    it('asks for the side picked, from the first page, and goes back when it is cleared', async () => {
        const { container } = renderPanel();
        await screen.findByText('UTR-1');

        fireEvent.mouseDown(screen.getByText('All entries'));
        fireEvent.click(await screen.findByTitle('Debit'));
        await waitFor(() =>
            expect(getVendorStatement).toHaveBeenLastCalledWith(
                expect.objectContaining({ side: 'debit', page: 1 })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);
        await waitFor(() =>
            expect(getVendorStatement).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ side: expect.anything() })
            )
        );
    });

    it('shows the opening and closing lines until a filter is used, then only the matching lines', async () => {
        renderPanel();
        await screen.findByText('UTR-1');
        expect(screen.getByText('Opening balance')).toBeInTheDocument();
        expect(screen.getByText('Closing balance')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByText('All entries'));
        fireEvent.click(await screen.findByTitle('Debit'));

        await waitFor(() => expect(screen.queryByText('Opening balance')).not.toBeInTheDocument());
        expect(screen.queryByText('Closing balance')).not.toBeInTheDocument();
        expect(screen.getByText('UTR-1')).toBeInTheDocument();
    });

    it('says the figures above still cover the whole period, only while filtered', async () => {
        renderPanel();
        await screen.findByText('UTR-1');
        expect(
            screen.queryByText('The figures above still cover the whole period.')
        ).not.toBeInTheDocument();

        fireEvent.mouseDown(screen.getByText('All entries'));
        fireEvent.click(await screen.findByTitle('Credit'));

        expect(
            await screen.findByText('The figures above still cover the whole period.')
        ).toBeInTheDocument();
    });

    it('exports Excel with the search and the side the table is filtered to', async () => {
        renderPanel();
        await screen.findByText('UTR-1');

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
            target: { value: 'utr' },
        });
        fireEvent.mouseDown(screen.getByText('All entries'));
        fireEvent.click(await screen.findByTitle('Debit'));
        await waitFor(() =>
            expect(getVendorStatement).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'utr', side: 'debit' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadVendorStatement).toHaveBeenCalled());
        expect(downloadVendorStatement).toHaveBeenCalledWith(
            expect.objectContaining({
                vendorId: '5001',
                format: 'export',
                searchText: 'utr',
                side: 'debit',
                from: '2026-09-07',
                to: '2026-10-07',
            })
        );
    });

    it('exports the PDF with the same filters', async () => {
        renderPanel();
        await screen.findByText('UTR-1');

        fireEvent.mouseDown(screen.getByText('All entries'));
        fireEvent.click(await screen.findByTitle('Credit'));
        await waitFor(() =>
            expect(getVendorStatement).toHaveBeenLastCalledWith(
                expect.objectContaining({ side: 'credit' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadVendorStatement).toHaveBeenCalled());
        expect(downloadVendorStatement).toHaveBeenCalledWith(
            expect.objectContaining({ format: 'pdf', side: 'credit' })
        );
    });

    it('sends no search or side to the export when none was chosen', async () => {
        renderPanel();
        await screen.findByText('UTR-1');

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadVendorStatement).toHaveBeenCalled());
        const sent = (downloadVendorStatement as Mock).mock.calls[0][0];
        expect(sent.searchText).toBeUndefined();
        expect(sent.side).toBeUndefined();
    });

    it('says nothing matches, and keeps the export off, when the filters find no lines', async () => {
        renderPanel();
        await screen.findByText('UTR-1');
        (getVendorStatement as Mock).mockResolvedValue({
            ...STATEMENT,
            entries: [],
            recordsTotal: 0,
        });

        fireEvent.mouseDown(screen.getByText('All entries'));
        fireEvent.click(await screen.findByTitle('Credit'));

        expect(
            await screen.findByText('No lines match your search or filter.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });
});

describe('the statement panel the other ledgers share', () => {
    it('has no search or debit and credit filter unless a ledger asks for it', async () => {
        render(
            <MemoryRouter>
                <LedgerStatementPanel
                    description="Every movement."
                    partyName="Cent Saarthi"
                    range={RANGE}
                    convention="A debit raises the balance."
                    load={async () => STATEMENT}
                    download={async () => new Blob(['x'])}
                />
            </MemoryRouter>
        );

        await screen.findByText('UTR-1');
        expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
        expect(screen.queryByText('All entries')).not.toBeInTheDocument();
        expect(screen.getByText('Opening balance')).toBeInTheDocument();
    });
});
