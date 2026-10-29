import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    downloadSubscriberLedgerTab,
    getSubscriberBills,
    getSubscriberTransactions,
    getSubscriberWallet,
} from '../api/subscriberLedger';
import SubscriberTabPanel from '../components/ledgers/SubscriberTabPanel';
import { LedgerTabKey } from '../config/ledgerPaths';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

vi.mock('../api/subscriberLedger', async importOriginal => ({
    ...(await importOriginal<typeof import('../api/subscriberLedger')>()),
    getSubscriberTransactions: vi.fn(),
    getSubscriberWallet: vi.fn(),
    getSubscriberBills: vi.fn(),
    downloadSubscriberLedgerTab: vi.fn(),
}));

// Rendering a table, a debounced search and an antd select in jsdom is slow enough to sit on
// the default five second limit when many suites run at once.
vi.setConfig({ testTimeout: 20000 });

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const RANGE = { from: '2026-09-06', to: '2026-10-06' };

const POSTED = { state: 'posted', note: null, detail: null };
const NOT_APPLICABLE = { state: 'notApplicable', note: null, detail: null };

const page = (entries: unknown[], recordsTotal = entries.length) => ({
    entries,
    recordsTotal,
    page: 1,
    itemsPerPage: 10,
});

const TRANSACTIONS = page([
    {
        id: 1,
        corporateTxnId: '1791277831861',
        transactionDate: '2026-10-06T06:14:02.000Z',
        service: 'Peko Go',
        orderAmount: 1155.27,
        discount: 0,
        paidFromWallet: null,
        paidViaGateway: 1155.27,
        status: 'SUCCESS',
        paymentMode: 'PAYMENT GATEWAY',
        posting: POSTED,
    },
]);

const WALLET = page([
    {
        id: '5-1',
        transactionDate: '2026-09-30T08:00:00.000Z',
        reference: '1790765440435',
        type: 'Admin withdrawal',
        particulars: 'Funds withdrawn by Peko Payments Services LLC',
        remark: null,
        debit: 10000,
        credit: null,
        balanceAfter: 36000,
        posting: NOT_APPLICABLE,
    },
]);

const BILLS = page([
    {
        id: '2:pekoInvoice',
        orderId: 2,
        corporateTxnId: '1791277613418',
        transactionDate: '2026-10-06T06:14:02.000Z',
        service: 'Hike',
        document: 'pekoInvoice',
        kind: 'platformFeeInvoice',
        label: 'Platform Fee Invoice',
        documentNumber: 'PI-2026-0417',
        issuedDate: '2026-10-06',
        taxable: 21.19,
        gst: 3.81,
        total: 25,
    },
]);

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
    (getSubscriberTransactions as Mock).mockResolvedValue(TRANSACTIONS);
    (getSubscriberWallet as Mock).mockResolvedValue(WALLET);
    (getSubscriberBills as Mock).mockResolvedValue(BILLS);
    (downloadSubscriberLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
});

const renderPanel = (tab: LedgerTabKey) =>
    render(
        <MemoryRouter>
            <SubscriberTabPanel
                credentialId="100000838"
                subscriberName="Faris Rahamn"
                tab={tab}
                range={RANGE}
            />
        </MemoryRouter>
    );

const comesAfter = (earlier: Element, later: Element) =>
    Math.floor(earlier.compareDocumentPosition(later) / Node.DOCUMENT_POSITION_FOLLOWING) % 2 === 1;

type TabSetup = {
    tab: LedgerTabKey;
    reference: string;
    placeholder: string;
    load: () => Mock;
    emptyText: string;
};

const TABS: TabSetup[] = [
    {
        tab: 'transactions',
        reference: '1791277831861',
        placeholder: 'Search reference or service',
        load: () => getSubscriberTransactions as Mock,
        emptyText: 'No transactions match your search or filter.',
    },
    {
        tab: 'wallet',
        reference: '1790765440435',
        placeholder: 'Search reference, particulars or type',
        load: () => getSubscriberWallet as Mock,
        emptyText: 'No wallet entries match your search or filter.',
    },
    {
        tab: 'bills',
        reference: '1791277613418',
        placeholder: 'Search reference, document number or service',
        load: () => getSubscriberBills as Mock,
        emptyText: 'No bills match your search.',
    },
];

const EACH_TAB = TABS.map(setup => [setup.tab, setup] as [LedgerTabKey, TabSetup]);

const pick = async (placeholder: string, option: string) => {
    fireEvent.mouseDown(screen.getByText(placeholder));
    fireEvent.click(await screen.findByTitle(option));
};

describe('Subscriber tab search and filters', () => {
    it.each(EACH_TAB)(
        'puts the search after the export buttons on the %s tab',
        async (_tab, { tab, reference, placeholder }) => {
            renderPanel(tab);

            await screen.findByText(reference);
            const exportButton = screen.getByRole('button', { name: /Export Excel/ });
            expect(comesAfter(exportButton, screen.getByPlaceholderText(placeholder))).toBe(true);
        }
    );

    const headerActionsOf = () =>
        screen.getByRole('button', { name: /Export Excel/ }).closest('.ant-flex')?.parentElement;

    it('puts the Bills search on the same line as the export buttons, right after them', async () => {
        renderPanel('bills');

        await screen.findByText('1791277613418');
        expect(headerActionsOf()).toContainElement(
            screen.getByPlaceholderText('Search reference, document number or service')
        );
    });

    it.each(['transactions', 'wallet'] as LedgerTabKey[])(
        'keeps the %s search on its own line below the export buttons, with its filters',
        async tab => {
            renderPanel(tab);

            await screen.findByText(tab === 'wallet' ? '1790765440435' : '1791277831861');
            const search = screen.getByPlaceholderText(
                tab === 'wallet'
                    ? 'Search reference, particulars or type'
                    : 'Search reference or service'
            );
            expect(headerActionsOf()).not.toContainElement(search);
        }
    );

    it('puts the Status filter below the export buttons on the Transactions tab', async () => {
        renderPanel('transactions');

        await screen.findByText('1791277831861');
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        expect(comesAfter(exportButton, screen.getByText('All statuses'))).toBe(true);
        expect(screen.queryByText('All types')).not.toBeInTheDocument();
        expect(screen.queryByText('All entries')).not.toBeInTheDocument();
    });

    it('puts the Type and Debit / Credit filters below the export buttons on the Wallet tab, above its note', async () => {
        renderPanel('wallet');

        await screen.findByText('1790765440435');
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        const note = screen.getByText('This tab reads the wallet, not the accounting period');
        expect(comesAfter(exportButton, screen.getByText('All types'))).toBe(true);
        expect(comesAfter(exportButton, screen.getByText('All entries'))).toBe(true);
        expect(comesAfter(screen.getByText('All entries'), note)).toBe(true);
        expect(screen.queryByText('All statuses')).not.toBeInTheDocument();
    });

    it('can only search Bills, whose table shows no status or debit and credit', async () => {
        renderPanel('bills');

        await screen.findByText('1791277613418');
        expect(
            screen.getByPlaceholderText('Search reference, document number or service')
        ).toBeInTheDocument();
        expect(screen.queryByText('All statuses')).not.toBeInTheDocument();
        expect(screen.queryByText('All types')).not.toBeInTheDocument();
        expect(screen.queryByText('All entries')).not.toBeInTheDocument();
    });

    it('offers the three names the Status pill uses on Transactions', async () => {
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.mouseDown(screen.getByText('All statuses'));

        await Promise.all(
            ['Success', 'Refunded', 'Failed'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
    });

    it('offers the seven names the Type pill uses on Wallet, and Debit and Credit', async () => {
        renderPanel('wallet');
        await screen.findByText('1790765440435');

        fireEvent.mouseDown(screen.getByText('All types'));
        await Promise.all(
            [
                'Purchase',
                'Refund',
                'Cashback',
                'Cashback reversal',
                'Top-up',
                'Admin credit',
                'Admin withdrawal',
            ].map(async label => expect(await screen.findByTitle(label)).toBeInTheDocument())
        );

        fireEvent.mouseDown(screen.getByText('All entries'));
        expect(await screen.findByTitle('Debit')).toBeInTheDocument();
        expect(await screen.findByTitle('Credit')).toBeInTheDocument();
    });

    it.each(EACH_TAB)(
        'asks for every row, with no search or filter, until one is chosen on the %s tab',
        async (_tab, { tab, reference, load }) => {
            renderPanel(tab);

            await screen.findByText(reference);
            const last = load().mock.calls.at(-1)?.[0];
            expect(last.searchText).toBeUndefined();
            expect(last.status).toBeUndefined();
            expect(last.type).toBeUndefined();
            expect(last.side).toBeUndefined();
        }
    );

    it.each(EACH_TAB)(
        'asks for what was typed, from the first page, on the %s tab',
        async (_tab, { tab, reference, placeholder, load }) => {
            renderPanel(tab);
            await screen.findByText(reference);

            fireEvent.change(screen.getByPlaceholderText(placeholder), {
                target: { value: 'hike' },
            });

            await waitFor(() =>
                expect(load()).toHaveBeenLastCalledWith(
                    expect.objectContaining({ searchText: 'hike', page: 1 })
                )
            );
        }
    );

    it('asks for the status picked, from the first page, and goes back when it is cleared', async () => {
        const { container } = renderPanel('transactions');
        await screen.findByText('1791277831861');

        await pick('All statuses', 'Failed');
        await waitFor(() =>
            expect(getSubscriberTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'failed', page: 1 })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);
        await waitFor(() =>
            expect(getSubscriberTransactions).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ status: expect.anything() })
            )
        );
    });

    it('asks for the type and the side picked on Wallet, each on its own, and both together', async () => {
        renderPanel('wallet');
        await screen.findByText('1790765440435');

        await pick('All types', 'Refund');
        await waitFor(() =>
            expect(getSubscriberWallet).toHaveBeenLastCalledWith(
                expect.objectContaining({ type: 'refund', page: 1 })
            )
        );
        expect((getSubscriberWallet as Mock).mock.calls.at(-1)?.[0].side).toBeUndefined();

        await pick('All entries', 'Credit');
        await waitFor(() =>
            expect(getSubscriberWallet).toHaveBeenLastCalledWith(
                expect.objectContaining({ type: 'refund', side: 'credit', page: 1 })
            )
        );
    });

    it('goes back to the first page when a filter changes', async () => {
        (getSubscriberTransactions as Mock).mockResolvedValue({
            ...TRANSACTIONS,
            recordsTotal: 25,
        });
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.click(await screen.findByTitle('2'));
        await waitFor(() =>
            expect(getSubscriberTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 2 })
            )
        );

        await pick('All statuses', 'Success');
        await waitFor(() =>
            expect(getSubscriberTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'success', page: 1 })
            )
        );
    });

    it.each(EACH_TAB)(
        'exports Excel with the dates and the search the table is filtered to on the %s tab',
        async (_tab, { tab, reference, placeholder, load }) => {
            renderPanel(tab);
            await screen.findByText(reference);

            fireEvent.change(screen.getByPlaceholderText(placeholder), {
                target: { value: 'hike' },
            });
            await waitFor(() =>
                expect(load()).toHaveBeenLastCalledWith(
                    expect.objectContaining({ searchText: 'hike' })
                )
            );
            fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

            await waitFor(() => expect(downloadSubscriberLedgerTab).toHaveBeenCalled());
            expect(downloadSubscriberLedgerTab).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                credentialId: '100000838',
                tab,
                from: '2026-09-06',
                to: '2026-10-06',
                searchText: 'hike',
                format: 'excel',
            });
        }
    );

    it('exports the PDF of Transactions with the search and the status', async () => {
        renderPanel('transactions');
        await screen.findByText('1791277831861');

        fireEvent.change(screen.getByPlaceholderText('Search reference or service'), {
            target: { value: 'peko' },
        });
        await pick('All statuses', 'Refunded');
        await waitFor(() =>
            expect(getSubscriberTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'peko', status: 'refunded' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadSubscriberLedgerTab).toHaveBeenCalled());
        expect(downloadSubscriberLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            credentialId: '100000838',
            tab: 'transactions',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'peko',
            status: 'refunded',
            format: 'pdf',
        });
    });

    it('exports the PDF of Wallet with the search, the type and the side', async () => {
        renderPanel('wallet');
        await screen.findByText('1790765440435');

        fireEvent.change(screen.getByPlaceholderText('Search reference, particulars or type'), {
            target: { value: 'peko' },
        });
        await pick('All types', 'Admin withdrawal');
        await pick('All entries', 'Debit');
        await waitFor(() =>
            expect(getSubscriberWallet).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    searchText: 'peko',
                    type: 'admin-withdrawal',
                    side: 'debit',
                })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadSubscriberLedgerTab).toHaveBeenCalled());
        expect(downloadSubscriberLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            credentialId: '100000838',
            tab: 'wallet',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'peko',
            type: 'admin-withdrawal',
            side: 'debit',
            format: 'pdf',
        });
    });

    it('sends no search or filter to the export when none was chosen', async () => {
        renderPanel('wallet');
        await screen.findByText('1790765440435');

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadSubscriberLedgerTab).toHaveBeenCalled());
        const sent = (downloadSubscriberLedgerTab as Mock).mock.calls[0][0];
        expect([sent.searchText, sent.status, sent.type, sent.side]).toEqual([
            undefined,
            undefined,
            undefined,
            undefined,
        ]);
    });

    it.each(EACH_TAB)(
        'says nothing matches, and keeps the export off, when the search finds nothing on the %s tab',
        async (_tab, { tab, reference, placeholder, load, emptyText }) => {
            renderPanel(tab);
            await screen.findByText(reference);
            load().mockResolvedValue(page([]));

            fireEvent.change(screen.getByPlaceholderText(placeholder), {
                target: { value: 'nothing like this' },
            });

            expect(await screen.findByText(emptyText)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
            expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
        }
    );

    it('keeps the usual empty table when nothing is filtered', async () => {
        (getSubscriberWallet as Mock).mockResolvedValue(page([]));
        renderPanel('wallet');

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled()
        );
        expect(
            screen.queryByText('No wallet entries match your search or filter.')
        ).not.toBeInTheDocument();
    });
});
