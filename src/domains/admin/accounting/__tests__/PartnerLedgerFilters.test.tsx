import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    downloadPartnerLedgerTab,
    downloadPartnerStatement,
    getPartnerDebitNotes,
    getPartnerPayouts,
    getPartnerStatement,
    getPartnerSubscriptions,
    getPartnerTransactions,
} from '../api/partnerLedger';
import PartnerStatementPanel from '../components/ledgers/PartnerStatementPanel';
import PartnerTabPanel from '../components/ledgers/PartnerTabPanel';
import { LedgerTabKey } from '../config/ledgerPaths';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

vi.mock('../api/partnerLedger', async importOriginal => ({
    ...(await importOriginal<typeof import('../api/partnerLedger')>()),
    getPartnerTransactions: vi.fn(),
    getPartnerSubscriptions: vi.fn(),
    getPartnerPayouts: vi.fn(),
    getPartnerDebitNotes: vi.fn(),
    getPartnerStatement: vi.fn(),
    downloadPartnerLedgerTab: vi.fn(),
    downloadPartnerStatement: vi.fn(),
}));

// Rendering a table, a debounced search and an antd select in jsdom is slow enough to sit on
// the default five second limit when many suites run at once.
vi.setConfig({ testTimeout: 20000 });

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const RANGE = { from: '2026-09-06', to: '2026-10-06' };

const POSTED = { state: 'posted', note: null, detail: null };
const NOT_APPLICABLE = { state: 'notApplicable', note: null, detail: null };

const page = (entries: unknown[], extra: Record<string, unknown> = {}) => ({
    entries,
    recordsTotal: entries.length,
    page: 1,
    itemsPerPage: 10,
    ...extra,
});

const TRANSACTIONS = page([
    {
        id: 1,
        corporateTxnId: '1791282332879',
        transactionDate: '2026-10-06T06:14:02.000Z',
        subscriberName: 'IMTD',
        service: 'Electricity Bill',
        totalAmount: 79042.6,
        netPlatformFee: 7070,
        netCommission: 8.47,
        couponTotal: 0,
        shareBase: 7078.47,
        shareExcludingGST: 707.85,
        shareGST: 127.41,
        partnerShare: 835.26,
        sharePercentageApplied: 10,
        status: 'SUCCESS',
        posting: POSTED,
    },
]);

const SUBSCRIPTIONS = page([
    {
        id: 2,
        corporateTxnId: '1789639023559',
        transactionDate: '2026-09-17T09:57:00.000Z',
        subscriberName: 'Aj cent',
        planName: 'Invoicing',
        billingType: 'MONTHLY',
        subscriptionStatus: 'ACTIVE',
        addOn: false,
        totalAmount: 470.82,
        netRevenue: 399,
        couponTotal: 0,
        shareBase: 470.82,
        shareExcludingGST: 70.62,
        shareGST: 12.68,
        partnerShare: 83.3,
        sharePercentageApplied: 15,
        status: 'SUCCESS',
        posting: POSTED,
    },
]);

const PAYOUTS = page(
    [
        {
            id: 3,
            partnerCredentialId: 3126,
            amount: 2000,
            calculatedAmount: 2678.18,
            difference: -678.18,
            payoutDate: '2026-09-20',
            reference: 'NEFT-9001',
            entryNumber: 'PAY-000001',
            mode: 'NEFT',
            note: null,
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
    { owed: 2678.18, lastPayoutDate: null, openingBalanceSet: true }
);

const DEBIT_NOTES = page([
    {
        id: 21,
        partnerCredentialId: 3126,
        kind: 'DEBIT_NOTE',
        reference: 'DN-1042',
        entryNumber: 'PDN-000001',
        amount: 20,
        issueDate: '2026-10-07',
        reason: 'Share clawed back',
        againstCorporateTxnId: '1791282332879',
        status: 'OPEN',
        posting: { state: 'notApplicable', note: null, detail: null },
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
    (getPartnerTransactions as Mock).mockResolvedValue(TRANSACTIONS);
    (getPartnerSubscriptions as Mock).mockResolvedValue(SUBSCRIPTIONS);
    (getPartnerPayouts as Mock).mockResolvedValue(PAYOUTS);
    (getPartnerDebitNotes as Mock).mockResolvedValue(DEBIT_NOTES);
    (downloadPartnerLedgerTab as Mock).mockResolvedValue(new Blob(['x']));
});

const renderPanel = (tab: LedgerTabKey) =>
    render(
        <MemoryRouter>
            <PartnerTabPanel
                partnerId="3126"
                partnerName="Cent Saarthi"
                tab={tab}
                range={RANGE}
                canUpdate
                onChanged={vi.fn()}
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
        reference: '1791282332879',
        placeholder: 'Search txn ID, subscriber or service',
        load: () => getPartnerTransactions as Mock,
        emptyText: 'No transactions match your search or filter.',
    },
    {
        tab: 'own-subscriptions',
        reference: '1789639023559',
        placeholder: 'Search txn ID, subscriber or plan',
        load: () => getPartnerSubscriptions as Mock,
        emptyText: 'No subscriptions match your search or filter.',
    },
    {
        tab: 'payments',
        reference: 'NEFT-9001',
        placeholder: 'Search entry no., reference, note or recorded by',
        load: () => getPartnerPayouts as Mock,
        emptyText: 'No payments match your search or filter.',
    },
    {
        tab: 'debit-notes',
        reference: 'PDN-000001',
        placeholder: 'Search entry no., debit note, order, reason or recorded by',
        load: () => getPartnerDebitNotes as Mock,
        emptyText: 'No debit notes match your search or filter.',
    },
];

const EACH_TAB = TABS.map(setup => [setup.tab, setup] as [LedgerTabKey, TabSetup]);

const pick = async (placeholder: string, option: string) => {
    fireEvent.mouseDown(screen.getByText(placeholder));
    fireEvent.click(await screen.findByTitle(option));
};

describe('Partner tab search and filters', () => {
    it.each(EACH_TAB)(
        'puts the search and the Status filter below the export buttons on the %s tab',
        async (_tab, { tab, reference, placeholder }) => {
            renderPanel(tab);

            await screen.findByText(reference);
            const exportButton = screen.getByRole('button', { name: /Export Excel/ });
            expect(comesAfter(exportButton, screen.getByPlaceholderText(placeholder))).toBe(true);
            expect(comesAfter(exportButton, screen.getByText('All statuses'))).toBe(true);
        }
    );

    it('has a Mode filter only on Payments, where a mode is recorded', async () => {
        renderPanel('payments');
        await screen.findByText('NEFT-9001');
        expect(screen.getByText('All modes')).toBeInTheDocument();
    });

    it.each(['transactions', 'own-subscriptions', 'debit-notes'] as LedgerTabKey[])(
        'has no Mode filter on the %s tab',
        async tab => {
            renderPanel(tab);

            await screen.findByText(TABS.find(setup => setup.tab === tab)?.reference as string);
            expect(screen.queryByText('All modes')).not.toBeInTheDocument();
        }
    );

    it('offers the three names the Status pill uses on Debit Notes', async () => {
        renderPanel('debit-notes');
        await screen.findByText('PDN-000001');

        fireEvent.mouseDown(screen.getByText('All statuses'));
        await Promise.all(
            ['Active', 'Reversal', 'Reversed'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
        expect(screen.queryByTitle('Paid')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Opening')).not.toBeInTheDocument();
    });

    it.each(['transactions', 'own-subscriptions'] as LedgerTabKey[])(
        'offers the three names the Status pill uses on the %s tab',
        async tab => {
            renderPanel(tab);
            await screen.findByText(tab === 'transactions' ? '1791282332879' : '1789639023559');

            fireEvent.mouseDown(screen.getByText('All statuses'));

            await Promise.all(
                ['Success', 'Refunded', 'Failed'].map(async label =>
                    expect(await screen.findByTitle(label)).toBeInTheDocument()
                )
            );
            expect(screen.queryByTitle('Paid')).not.toBeInTheDocument();
        }
    );

    it('offers the four names the Status pill uses on Payments, and every mode', async () => {
        renderPanel('payments');
        await screen.findByText('NEFT-9001');

        fireEvent.mouseDown(screen.getByText('All statuses'));
        await Promise.all(
            ['Paid', 'Opening', 'Reversal', 'Reversed'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
        expect(screen.queryByTitle('Success')).not.toBeInTheDocument();

        fireEvent.mouseDown(screen.getByText('All modes'));
        await Promise.all(
            ['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Other'].map(async label =>
                expect(await screen.findByTitle(label)).toBeInTheDocument()
            )
        );
    });

    it.each(EACH_TAB)(
        'asks for every row, with no search or filter, until one is chosen on the %s tab',
        async (_tab, { tab, reference, load }) => {
            renderPanel(tab);

            await screen.findByText(reference);
            const last = load().mock.calls.at(-1)?.[0];
            expect(last.searchText).toBeUndefined();
            expect(last.status).toBeUndefined();
            expect(last.mode).toBeUndefined();
        }
    );

    it.each(EACH_TAB)(
        'asks for what was typed, from the first page, on the %s tab',
        async (_tab, { tab, reference, placeholder, load }) => {
            renderPanel(tab);
            await screen.findByText(reference);

            fireEvent.change(screen.getByPlaceholderText(placeholder), {
                target: { value: 'air' },
            });

            await waitFor(() =>
                expect(load()).toHaveBeenLastCalledWith(
                    expect.objectContaining({ searchText: 'air', page: 1 })
                )
            );
        }
    );

    it('asks for the status picked, from the first page, and goes back when it is cleared', async () => {
        const { container } = renderPanel('transactions');
        await screen.findByText('1791282332879');

        await pick('All statuses', 'Failed');
        await waitFor(() =>
            expect(getPartnerTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'failed', page: 1 })
            )
        );

        const clear = container.querySelector('.ant-select-clear');
        expect(clear).not.toBeNull();
        fireEvent.mouseDown(clear as Element);
        await waitFor(() =>
            expect(getPartnerTransactions).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ status: expect.anything() })
            )
        );
    });

    it('asks for the status and the mode picked on Payments, each on its own, and both together', async () => {
        renderPanel('payments');
        await screen.findByText('NEFT-9001');

        await pick('All statuses', 'Reversal');
        await waitFor(() =>
            expect(getPartnerPayouts).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'reversal', page: 1 })
            )
        );
        expect((getPartnerPayouts as Mock).mock.calls.at(-1)?.[0].mode).toBeUndefined();

        await pick('All modes', 'UPI');
        await waitFor(() =>
            expect(getPartnerPayouts).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'reversal', mode: 'UPI', page: 1 })
            )
        );
    });

    it('goes back to the first page when a filter changes', async () => {
        (getPartnerTransactions as Mock).mockResolvedValue({ ...TRANSACTIONS, recordsTotal: 25 });
        renderPanel('transactions');
        await screen.findByText('1791282332879');

        fireEvent.click(await screen.findByTitle('2'));
        await waitFor(() =>
            expect(getPartnerTransactions).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 2 })
            )
        );

        await pick('All statuses', 'Success');
        await waitFor(() =>
            expect(getPartnerTransactions).toHaveBeenLastCalledWith(
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
                target: { value: 'air' },
            });
            await waitFor(() =>
                expect(load()).toHaveBeenLastCalledWith(
                    expect.objectContaining({ searchText: 'air' })
                )
            );
            fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

            await waitFor(() => expect(downloadPartnerLedgerTab).toHaveBeenCalled());
            expect(downloadPartnerLedgerTab).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                partnerId: '3126',
                tab,
                from: '2026-09-06',
                to: '2026-10-06',
                searchText: 'air',
                format: 'excel',
            });
        }
    );

    it('exports the PDF of Own Subscriptions with the search and the status', async () => {
        renderPanel('own-subscriptions');
        await screen.findByText('1789639023559');

        fireEvent.change(screen.getByPlaceholderText('Search txn ID, subscriber or plan'), {
            target: { value: 'invoicing' },
        });
        await pick('All statuses', 'Refunded');
        await waitFor(() =>
            expect(getPartnerSubscriptions).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'invoicing', status: 'refunded' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadPartnerLedgerTab).toHaveBeenCalled());
        expect(downloadPartnerLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            partnerId: '3126',
            tab: 'own-subscriptions',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'invoicing',
            status: 'refunded',
            format: 'pdf',
        });
    });

    it('exports the PDF of Payments with the search, the status and the mode', async () => {
        renderPanel('payments');
        await screen.findByText('NEFT-9001');

        fireEvent.change(
            screen.getByPlaceholderText('Search entry no., reference, note or recorded by'),
            {
                target: { value: 'ibrahim' },
            }
        );
        await pick('All statuses', 'Paid');
        await pick('All modes', 'UPI');
        await waitFor(() =>
            expect(getPartnerPayouts).toHaveBeenLastCalledWith(
                expect.objectContaining({ searchText: 'ibrahim', status: 'paid', mode: 'UPI' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadPartnerLedgerTab).toHaveBeenCalled());
        expect(downloadPartnerLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            partnerId: '3126',
            tab: 'payments',
            from: '2026-09-06',
            to: '2026-10-06',
            searchText: 'ibrahim',
            status: 'paid',
            mode: 'UPI',
            format: 'pdf',
        });
    });

    it('sends no search or filter to the export when none was chosen', async () => {
        renderPanel('payments');
        await screen.findByText('NEFT-9001');

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadPartnerLedgerTab).toHaveBeenCalled());
        const sent = (downloadPartnerLedgerTab as Mock).mock.calls[0][0];
        expect([sent.searchText, sent.status, sent.mode]).toEqual([
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
            load().mockResolvedValue(page([], { owed: 0, openingBalanceSet: true }));

            fireEvent.change(screen.getByPlaceholderText(placeholder), {
                target: { value: 'nothing like this' },
            });

            expect(await screen.findByText(emptyText)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
            expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
        }
    );

    it('keeps the buttons that record entries beside the export buttons on Payments', async () => {
        renderPanel('payments');

        await screen.findByText('NEFT-9001');
        expect(screen.getByRole('button', { name: /Record payout/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeInTheDocument();
    });
});

const STATEMENT = {
    partnerName: 'Cent Saarthi',
    openingBalance: 0,
    totalDebit: 2000,
    totalCredit: 2678.18,
    closingBalance: 678.18,
    entries: [
        {
            date: '2026-09-17',
            particulars: 'Earned — Invoicing',
            reference: '1789639023559',
            type: 'Earned',
            debit: null,
            credit: 2678.18,
            balance: 2678.18,
            posting: POSTED,
        },
        {
            date: '2026-09-20',
            particulars: 'Payout — NEFT',
            reference: 'NEFT-9001',
            type: 'Payout',
            debit: 2000,
            credit: null,
            balance: 678.18,
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
            <PartnerStatementPanel partnerId="3126" partnerName="Cent Saarthi" range={RANGE} />
        </MemoryRouter>
    );

describe('Partner statement search and Debit / Credit filter', () => {
    beforeEach(() => {
        (getPartnerStatement as Mock).mockResolvedValue(STATEMENT);
        (downloadPartnerStatement as Mock).mockResolvedValue(new Blob(['x']));
    });

    it('puts the search and the debit or credit filter below the export buttons, at the right end', async () => {
        renderStatement();

        await screen.findByText('NEFT-9001');
        const exportButton = screen.getByRole('button', { name: /Export Excel/ });
        expect(comesAfter(exportButton, screen.getByPlaceholderText(SEARCH_PLACEHOLDER))).toBe(
            true
        );
        expect(comesAfter(exportButton, screen.getByText('All entries'))).toBe(true);
    });

    it('asks for every line until something is typed or picked', async () => {
        renderStatement();

        await screen.findByText('NEFT-9001');
        const last = (getPartnerStatement as Mock).mock.calls.at(-1)?.[0];
        expect(last.searchText).toBeUndefined();
        expect(last.side).toBeUndefined();
    });

    it('asks for what was typed, and the side picked, from the first page', async () => {
        renderStatement();
        await screen.findByText('NEFT-9001');

        fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
            target: { value: 'payout' },
        });
        await pick('All entries', 'Debit');

        await waitFor(() =>
            expect(getPartnerStatement).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    partnerId: '3126',
                    searchText: 'payout',
                    side: 'debit',
                    page: 1,
                })
            )
        );
    });

    it('lists only the matching lines when filtered, and says the figures above still cover the whole period', async () => {
        renderStatement();
        await screen.findByText('NEFT-9001');
        expect(screen.getByText('Opening balance')).toBeInTheDocument();
        expect(screen.getByText('Closing balance')).toBeInTheDocument();

        await pick('All entries', 'Debit');

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
            await screen.findByText('NEFT-9001');

            fireEvent.change(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), {
                target: { value: 'payout' },
            });
            await pick('All entries', 'Debit');
            await waitFor(() =>
                expect(getPartnerStatement).toHaveBeenLastCalledWith(
                    expect.objectContaining({ searchText: 'payout', side: 'debit' })
                )
            );
            fireEvent.click(screen.getByRole('button', { name: button }));

            await waitFor(() => expect(downloadPartnerStatement).toHaveBeenCalled());
            expect(downloadPartnerStatement).toHaveBeenCalledWith(
                expect.objectContaining({
                    partnerId: '3126',
                    format,
                    searchText: 'payout',
                    side: 'debit',
                    from: '2026-09-06',
                    to: '2026-10-06',
                })
            );
        }
    );

    it('sends no search or side to the export when none was chosen', async () => {
        renderStatement();
        await screen.findByText('NEFT-9001');

        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadPartnerStatement).toHaveBeenCalled());
        const sent = (downloadPartnerStatement as Mock).mock.calls[0][0];
        expect(sent.searchText).toBeUndefined();
        expect(sent.side).toBeUndefined();
    });

    it('says nothing matches, and keeps the export off, when the filters find no lines', async () => {
        renderStatement();
        await screen.findByText('NEFT-9001');
        (getPartnerStatement as Mock).mockResolvedValue({
            ...STATEMENT,
            entries: [],
            recordsTotal: 0,
        });

        await pick('All entries', 'Credit');

        expect(
            await screen.findByText('No lines match your search or filter.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });
});
