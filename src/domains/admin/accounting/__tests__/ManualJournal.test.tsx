import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    generateManualJournalSplit,
    getManualJournal,
    getManualJournalAccounts,
    postManualJournal,
    previewManualJournal,
} from '../api/manualJournal';
import {
    LINES_NOT_BUILT_TEXT,
    NO_PERMISSION_TEXT,
    SPLIT_NOT_GENERATED_TEXT,
} from '../components/manualOperations/JournalEditor';
import ManualJournal from '../pages/ManualJournal';
import {
    ManualJournalEvent,
    ManualJournalLookup,
    ManualJournalSetup,
    ManualJournalSplitTemplate,
} from '../types/manualJournal';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => vi.fn() }));

vi.mock('../api/manualJournal', () => ({
    getManualJournal: vi.fn(),
    getManualJournalAccounts: vi.fn(),
    previewManualJournal: vi.fn(),
    generateManualJournalSplit: vi.fn(),
    postManualJournal: vi.fn(),
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
                                category: 'Others',
                                hasAccess: true,
                                services: [
                                    {
                                        service: 'Manual Operations',
                                        hasAccess: true,
                                        view: true,
                                        update,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    },
});

const LINES = [
    { accountId: 'A1', accountName: 'Commission', direction: 'credit' as const, amount: 100 },
    { accountId: 'A2', accountName: 'Cashfree', direction: 'debit' as const, amount: 100 },
];

const POSTED = { state: 'posted' as const, note: null, detail: null };
const NOT_RECORDED = { state: 'notPosted' as const, note: 'Not recorded yet', detail: null };
const NOT_APPLICABLE = { state: 'notApplicable' as const, note: null, detail: null };

const event = (
    overrides: Partial<ManualJournalEvent> & Pick<ManualJournalEvent, 'key' | 'label'>
): ManualJournalEvent => ({
    verdict: null,
    posting: NOT_APPLICABLE,
    journal: null,
    defaults: { journalDate: '2026-09-10' },
    eligibility: { canRecord: false, reasons: ['The records show nothing'] },
    warnings: [],
    ...overrides,
});

const LOOKUP: ManualJournalLookup = {
    order: {
        id: 7,
        corporateTxnId: 'TXN-1',
        transactionDate: '2026-09-10T10:00:00.000Z',
        status: 'SUCCESS',
        service: 'Electricity Bill',
        customer: {
            username: '100000900',
            name: 'Al Rams',
            gstNumber: '07BBBBB0000B1Z5',
            state: 'Delhi',
        },
        partnerId: 55,
        partnerName: 'Gulf Reach',
        paymentGateway: 'Cashfree',
        amountInINR: 1180,
        paymentMode: 'PAYMENT GATEWAY',
    },
    split: { vendorPayable: 90, commissionIncludingGST: 10 },
    setup: null,
    recordingPaused: false,
    beforeGoLive: false,
    accountingFloor: '2026-08-31',
    events: [
        event({
            key: 'transaction',
            label: 'Sale',
            posting: NOT_RECORDED,
            eligibility: { canRecord: true, reasons: ['Not in the books yet; record it first'] },
        }),
        event({
            key: 'refund',
            label: 'Refund',
            verdict: true,
            posting: POSTED,
            journal: {
                journalDate: '2026-09-12',
                notes: 'Refund journal entry for corporate transaction TXN-1',
                lineItems: LINES,
                providerJournalId: 'Z-9',
                manual: {
                    action: 'recorded',
                    byId: 7,
                    byName: 'Ibrahim',
                    at: '2026-10-01T10:00:00.000Z',
                    reason: 'x',
                },
                reason: null,
                skipped: false,
            },
            defaults: { journalDate: '2026-09-12' },
            eligibility: { canRecord: false, reasons: ['Already in the books'] },
        }),
        event({
            key: 'adminRefund',
            label: 'Admin refund',
            eligibility: {
                canRecord: false,
                reasons: ['The records show no admin refund on this order'],
            },
        }),
        event({
            key: 'cashback',
            label: 'Cashback',
            defaults: { journalDate: '2026-09-10', amount: 12 },
        }),
        event({ key: 'cashbackReversal', label: 'Cashback reversal' }),
    ],
    history: [
        {
            id: 1,
            corporateTxnId: 'TXN-1',
            journalKey: 'refund',
            event: 'Refund',
            action: 'RECORDED',
            journalDate: '2026-09-12',
            reason: 'Wrong account',
            splitBefore: null,
            splitAfter: null,
            lineItemsBefore: null,
            lineItemsAfter: null,
            providerJournalId: 'Z-9',
            result: 'POSTED',
            failureReason: null,
            recordedByName: 'Ibrahim',
            createdAt: '2026-10-01T10:00:00.000Z',
        },
    ],
};

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

vi.setConfig({ testTimeout: 20000 });

const renderPage = (url: string) =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <Routes>
                <Route
                    path="/system-user/accounting/manual-operations/journal/:corporateTxnId?"
                    element={<ManualJournal />}
                />
            </Routes>
        </MemoryRouter>
    );

const eventsTable = () => screen.getAllByRole('table')[0];
const rowOf = (text: string) =>
    within(eventsTable()).getAllByText(text)[0].closest('tr') as HTMLElement;

beforeEach(() => {
    vi.clearAllMocks();
    const state = stateWith(true);
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
    (getManualJournal as Mock).mockResolvedValue(LOOKUP);
    (getManualJournalAccounts as Mock).mockResolvedValue([
        { id: 'A1', name: 'Commission', type: 'income', shared: true },
        { id: 'A2', name: 'Cashfree', type: 'bank', shared: true },
        { id: 'A3', name: 'Sales', type: 'income', shared: true },
    ]);
    (previewManualJournal as Mock).mockResolvedValue({
        ok: true,
        lineItems: LINES,
        journalAccountIds: { paymentGateway: 'A2' },
        balanced: true,
        reason: null,
    });
    (postManualJournal as Mock).mockResolvedValue({
        success: true,
        action: 'recorded',
        providerJournalId: 'Z-NEW',
        reason: null,
    });
});

describe('ManualJournal', () => {
    it('searches an order by transaction id', () => {
        renderPage('/system-user/accounting/manual-operations/journal');

        fireEvent.change(screen.getByLabelText('Transaction id'), { target: { value: ' TXN-1 ' } });
        fireEvent.click(screen.getByRole('button', { name: 'search' }));

        expect(navigateMock).toHaveBeenCalledWith(
            '/system-user/accounting/manual-operations/journal/TXN-1'
        );
        expect(getManualJournal).not.toHaveBeenCalled();
    });

    it('shows the order, its five events with their posting status, and the history', async () => {
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');

        expect(await screen.findByText('Electricity Bill')).toBeInTheDocument();
        expect(getManualJournal).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            corporateTxnId: 'TXN-1',
        });
        expect(screen.getByText('Al Rams')).toBeInTheDocument();
        expect(screen.getByText('Gulf Reach')).toBeInTheDocument();
        expect(within(rowOf('Sale')).getByText('Not posted')).toBeInTheDocument();
        expect(within(rowOf('Sale')).getByText('Not recorded yet')).toBeInTheDocument();
        expect(within(rowOf('Refund')).getByText('Posted')).toBeInTheDocument();
        expect(within(rowOf('Refund')).getByText('Z-9')).toBeInTheDocument();
        expect(
            within(rowOf('Refund')).getByText(/Recorded by Ibrahim on 01 Oct 2026/)
        ).toBeInTheDocument();
        expect(screen.getByText('Wrong account')).toBeInTheDocument();
        expect(screen.getAllByText('Posted').length).toBeGreaterThan(1);
    });

    it('shows the customer with its GST and state, the partner and the gateway beside the order, and never a vendor or a commission mode', async () => {
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');
        await screen.findByText('Electricity Bill');

        expect(screen.getByText(/07BBBBB0000B1Z5/)).toHaveTextContent('State: Delhi');
        expect(screen.getByText('Gulf Reach')).toBeInTheDocument();
        expect(screen.getByText('Cashfree')).toBeInTheDocument();
        expect(screen.queryByText('Vendor')).not.toBeInTheDocument();
        expect(screen.queryByText('Commission')).not.toBeInTheDocument();
        expect(screen.queryByText(/Margin/)).not.toBeInTheDocument();
    });

    it('lays out the suggested rows when the lines cannot be worked out, with blanks where the order knows nothing', async () => {
        (previewManualJournal as Mock).mockResolvedValue({
            ok: false,
            suggested: true,
            lineItems: [
                { accountId: null, accountName: 'Cashfree', direction: 'debit', amount: 1180 },
                { accountId: 'A1', accountName: 'Commission', direction: 'credit', amount: null },
            ],
            split: {
                paymentThroughGateway: 1180,
                vendorPayable: null,
                commissionExcludingGST: null,
                couponTotalDiscount: 5,
            },
            journalAccountIds: null,
            balanced: false,
            reason: 'No COA accounts found for PG vendor',
        });
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');
        await screen.findByText('Electricity Bill');
        fireEvent.click(screen.getByRole('button', { name: 'Record Sale' }));

        expect(await screen.findByLabelText('Debit for line 1')).toHaveValue('1180.00');
        expect(screen.getByLabelText('Credit for line 2')).toHaveValue('');
        expect(screen.getByRole('button', { name: 'Move line 1' })).toHaveAttribute(
            'aria-disabled',
            'false'
        );
        expect(screen.getByRole('button', { name: 'Move line 2' })).toHaveAttribute(
            'title',
            'Drag to reorder'
        );
        expect(screen.getByLabelText('Payment Through Gateway')).toHaveValue('1180.00');
        expect(screen.getByLabelText('Vendor Payable')).toHaveValue('90.00');
        expect(screen.getByLabelText('Commission Excl. GST')).toHaveValue('');
        expect(screen.getByLabelText('Coupon Discount (Total)')).toHaveValue('5.00');
        expect(
            screen.getByText(/only the rows the order itself knows are suggested/)
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Post to the books' })).toBeDisabled();
    });

    it('explains why an event cannot be recorded and refuses one already in the books', async () => {
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');
        await screen.findByText('Electricity Bill');

        expect(screen.getByRole('button', { name: 'Record Sale' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Record Refund' })).toBeDisabled();
        const adminRefund = screen.getByRole('button', { name: 'Record Admin refund' });
        expect(adminRefund).toBeDisabled();

        fireEvent.pointerEnter(adminRefund);
        expect(
            await screen.findByText('The records show no admin refund on this order')
        ).toBeInTheDocument();
    });

    it('prefills the lines from the worker, needs a reason, and posts what is on screen', async () => {
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');
        await screen.findByText('Electricity Bill');

        fireEvent.click(screen.getByRole('button', { name: 'Record Sale' }));

        expect(await screen.findByText('Record the sale entry')).toBeInTheDocument();
        await waitFor(() =>
            expect(previewManualJournal).toHaveBeenCalledWith(
                expect.objectContaining({
                    corporateTxnId: 'TXN-1',
                    journalKey: 'transaction',
                    journalData: { vendorPayable: 90, commissionIncludingGST: 10 },
                })
            )
        );
        expect(await screen.findByLabelText('Credit for line 1')).toHaveValue('100.00');
        expect(screen.getByText('Balanced')).toBeInTheDocument();

        const post = screen.getByRole('button', { name: 'Post to the books' });
        expect(post).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Reason'), {
            target: { value: 'Worker never ran' },
        });
        expect(post).toBeEnabled();

        fireEvent.click(post);

        await waitFor(() =>
            expect(postManualJournal).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                corporateTxnId: 'TXN-1',
                journalKey: 'transaction',
                journalDate: '2026-09-10',
                lineItems: [
                    { accountId: 'A1', direction: 'credit', amount: 100, description: undefined },
                    { accountId: 'A2', direction: 'debit', amount: 100, description: undefined },
                ],
                journalData: { vendorPayable: 90, commissionIncludingGST: 10 },
                journalAccountIds: { paymentGateway: 'A2' },
                reason: 'Worker never ran',
            })
        );
        expect(await screen.findByText('Posted to the books')).toBeInTheDocument();
        expect(screen.getByText('Entry reference Z-NEW.')).toBeInTheDocument();
        expect(screen.queryByText('Record the sale entry')).not.toBeInTheDocument();
        await waitFor(() => expect(getManualJournal).toHaveBeenCalledTimes(2));
    });

    it('refuses to post unbalanced lines and shows the books’ refusal', async () => {
        (postManualJournal as Mock).mockResolvedValue({
            success: false,
            action: 'recorded',
            reason: 'Account is inactive',
        });
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');
        await screen.findByText('Electricity Bill');
        fireEvent.click(screen.getByRole('button', { name: 'Record Sale' }));
        await screen.findByLabelText('Credit for line 1');
        fireEvent.change(screen.getByLabelText('Reason'), {
            target: { value: 'Worker never ran' },
        });

        fireEvent.change(screen.getByLabelText('Credit for line 1'), { target: { value: '90' } });
        fireEvent.blur(screen.getByLabelText('Credit for line 1'));
        expect(await screen.findByText('Not balanced')).toBeInTheDocument();
        expect(screen.getByText('Differs from split')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Post to the books' })).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Credit for line 1'), { target: { value: '100' } });
        fireEvent.blur(screen.getByLabelText('Credit for line 1'));
        await screen.findByText('Balanced');
        fireEvent.click(screen.getByRole('button', { name: 'Post to the books' }));

        expect(await screen.findByText('Not posted')).toBeInTheDocument();
        expect(screen.getByText('Account is inactive')).toBeInTheDocument();
    });

    it('opens the editor for the event named in the link, and nothing for one already in the books', async () => {
        const { unmount } = renderPage(
            '/system-user/accounting/manual-operations/journal/TXN-1?event=transaction'
        );
        expect(await screen.findByText('Record the sale entry')).toBeInTheDocument();
        await waitFor(() => expect(previewManualJournal).toHaveBeenCalled());
        unmount();

        renderPage('/system-user/accounting/manual-operations/journal/TXN-1?event=refund');
        await screen.findByText('Electricity Bill');
        expect(screen.queryByText('Record the refund entry')).not.toBeInTheDocument();
    });

    it('stays closed once Close is pressed, even when the link opened it', async () => {
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1?event=transaction');
        expect(await screen.findByText('Record the sale entry')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(screen.queryByText('Record the sale entry')).not.toBeInTheDocument();
        await screen.findByText('Electricity Bill');
        expect(screen.queryByText('Record the sale entry')).not.toBeInTheDocument();
    });

    it('keeps a viewer from posting', async () => {
        const viewer = stateWith(false);
        (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(viewer));
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1?event=transaction');
        await screen.findByText('Electricity Bill');

        expect(screen.getByRole('button', { name: 'Record Sale' })).toBeDisabled();
        expect(screen.queryByText('Record the sale entry')).not.toBeInTheDocument();
        expect(previewManualJournal).not.toHaveBeenCalled();
    });

    it('says when the order does not exist and when recording is paused', async () => {
        (getManualJournal as Mock).mockResolvedValue(null);
        const { unmount } = renderPage('/system-user/accounting/manual-operations/journal/NOPE');
        expect(await screen.findByText('No order with transaction id NOPE')).toBeInTheDocument();
        unmount();

        (getManualJournal as Mock).mockResolvedValue({ ...LOOKUP, recordingPaused: true });
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');
        expect(
            await screen.findByText(/Journal recording is paused across the platform/)
        ).toBeInTheDocument();
    });

    it('shows the posting message when the worker is still busy', async () => {
        (postManualJournal as Mock).mockResolvedValue({
            success: false,
            pending: true,
            reason: 'Still posting — refresh in a moment to see the outcome',
        });
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');
        await screen.findByText('Electricity Bill');
        fireEvent.click(screen.getByRole('button', { name: 'Record Sale' }));
        await screen.findByLabelText('Credit for line 1');
        fireEvent.change(screen.getByLabelText('Reason'), {
            target: { value: 'Worker never ran' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Post to the books' }));

        expect(await screen.findByText('Still posting')).toBeInTheDocument();
        await waitFor(() => expect(getManualJournal).toHaveBeenCalledTimes(2));
    });
});

const SETUP: ManualJournalSetup = {
    paymentThrough: 'GATEWAY',
    orderAmount: 1000,
    pgAmount: 1180,
    gateway: { name: 'Cashfree', accountId: 'A2' },
    subscription: { is: false, billingType: null },
    vendor: { present: true },
    commission: {
        present: true,
        type: 'FLAT',
        mode: 'PRINCIPAL_MARKUP',
        value: 50,
        fixed: 0,
        inclusiveOfGst: true,
    },
    mixed: { principalAmount: null, marginAmount: null },
    platformFee: { type: 'PERCENTAGE', value: 18 },
    partner: { present: true, sharePercentage: 10, gatewayCharge: { percentage: 1.95, fixed: 3 } },
    coupon: { used: false, totalDiscount: null },
    gstRatePct: 18,
};

const TEMPLATE: ManualJournalSplitTemplate = {
    split: {
        totalTransactionAmount: 1180,
        paymentThroughGateway: 1180,
        principalSalesPayable: 950,
        principalCommissionExcludingGST: 42.37,
        outputGSTonPrincipalCommission: 7.63,
    },
    enabledKeys: [
        'totalTransactionAmount',
        'paymentThroughGateway',
        'principalSalesPayable',
        'principalCommissionExcludingGST',
        'outputGSTonPrincipalCommission',
    ],
    facts: {
        commissionMode: 'PRINCIPAL_MARKUP',
        isInterState: true,
        vendorIsInterState: false,
        salesIsInterState: true,
        partnerIsInterState: false,
        gstRatePct: 18,
        paymentGatewayName: 'Cashfree',
    },
    journalAccountIds: { paymentGateway: 'A2' },
};

const UNSPLIT_LOOKUP: ManualJournalLookup = { ...LOOKUP, split: {}, setup: SETUP };

const combobox = (name: string) => screen.getByRole('combobox', { name });

// antd buttons carry their icon's label in the accessible name, and role queries crawl the
// whole set-up form; the text is enough to reach the button.
const button = (text: string) => screen.getByText(text).closest('button') as HTMLButtonElement;

describe('setting an order up when its figures were never worked out', () => {
    const openSale = async (lookup: ManualJournalLookup = UNSPLIT_LOOKUP) => {
        (getManualJournal as Mock).mockResolvedValue(lookup);
        (generateManualJournalSplit as Mock).mockResolvedValue(TEMPLATE);
        renderPage('/system-user/accounting/manual-operations/journal/TXN-1');
        await screen.findByText('Electricity Bill');
        fireEvent.click(screen.getByRole('button', { name: 'Record Sale' }));
        await screen.findByText('Record the sale entry');
    };

    it('opens with the set-up prefilled and keeps the figures and the lines locked until each step is done', async () => {
        await openSale();

        expect(screen.getByText('Set-up')).toBeInTheDocument();
        expect(screen.getByLabelText('Order Amount')).toHaveValue('1000.00');
        expect(screen.getByLabelText('Paid Via Gateway')).toBeDisabled();
        expect(screen.getByLabelText('Partner Share (%)')).toHaveValue('10.00');
        expect(screen.getByLabelText('Gateway Charge (%)')).toHaveValue('1.95');
        expect(screen.getByLabelText('Gateway Charge Per Transaction (₹)')).toHaveValue('3.00');
        expect(combobox('Partner Behind The Order')).toBeDisabled();
        expect(previewManualJournal).not.toHaveBeenCalled();
        expect(screen.getByText(SPLIT_NOT_GENERATED_TEXT)).toBeInTheDocument();
        expect(screen.getByLabelText('Principal Sales Payable')).toBeDisabled();
        expect(button('Rebuild lines from split')).toBeDisabled();
        expect(screen.getByText(LINES_NOT_BUILT_TEXT)).toBeInTheDocument();
        expect(button('Add line')).toBeDisabled();
    });

    it('generates the figures from the set-up, rebuilds the lines from them and posts the facts with the figures', async () => {
        await openSale();

        fireEvent.click(button('Generate split figures'));
        await waitFor(() =>
            expect(generateManualJournalSplit).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                corporateTxnId: 'TXN-1',
                journalKey: 'transaction',
                setup: SETUP,
            })
        );
        await waitFor(() =>
            expect(screen.getByLabelText('Principal Sales Payable')).toHaveValue('950.00')
        );
        expect(screen.getByLabelText('Principal Sales Payable')).toBeEnabled();
        expect(screen.getByLabelText('Vendor Payable')).toBeDisabled();
        expect(screen.getByLabelText('Vendor Payable')).toHaveValue('');
        expect(screen.queryByText(SPLIT_NOT_GENERATED_TEXT)).not.toBeInTheDocument();
        expect(button('Add line')).toBeDisabled();

        fireEvent.click(button('Rebuild lines from split'));
        await waitFor(() =>
            expect(previewManualJournal).toHaveBeenCalledWith(
                expect.objectContaining({
                    journalKey: 'transaction',
                    journalData: { ...TEMPLATE.facts, ...TEMPLATE.split },
                })
            )
        );
        expect(await screen.findByLabelText('Credit for line 1')).toHaveValue('100.00');
        expect(button('Add line')).toBeEnabled();

        fireEvent.change(screen.getByLabelText('Reason'), {
            target: { value: 'Never worked out' },
        });
        fireEvent.click(button('Post to the books'));
        await waitFor(() =>
            expect(postManualJournal).toHaveBeenCalledWith(
                expect.objectContaining({
                    journalData: { ...TEMPLATE.facts, ...TEMPLATE.split },
                    journalAccountIds: { paymentGateway: 'A2' },
                    reason: 'Never worked out',
                })
            )
        );
    });

    it('locks the figures and the lines again when the set-up changes after they were generated', async () => {
        await openSale();
        fireEvent.click(button('Generate split figures'));
        await waitFor(() =>
            expect(screen.getByLabelText('Principal Sales Payable')).toHaveValue('950.00')
        );
        fireEvent.click(button('Rebuild lines from split'));
        await screen.findByLabelText('Credit for line 1');

        fireEvent.change(screen.getByLabelText('Order Amount'), { target: { value: '1200' } });
        fireEvent.blur(screen.getByLabelText('Order Amount'));

        expect(await screen.findByText(/generate the split figures again/)).toBeInTheDocument();
        expect(screen.getByLabelText('Principal Sales Payable')).toBeDisabled();
        expect(screen.getByLabelText('Principal Sales Payable')).toHaveValue('');
        expect(screen.queryByLabelText('Credit for line 1')).not.toBeInTheDocument();
        expect(screen.getByText(LINES_NOT_BUILT_TEXT)).toBeInTheDocument();
        expect(button('Rebuild lines from split')).toBeDisabled();
        expect(button('Post to the books')).toBeDisabled();
    });

    it('greys out what does not apply: a subscription, or a sale with no vendor, carries no commission or platform fee', async () => {
        await openSale({
            ...UNSPLIT_LOOKUP,
            setup: {
                ...SETUP,
                subscription: { is: true, billingType: 'ANNUALLY' },
                vendor: { present: false },
            },
        });

        expect(combobox('Billing Cycle')).toBeEnabled();
        expect(combobox('Vendor Involved')).toBeDisabled();
        expect(combobox('Commission Charged')).toBeDisabled();
        expect(combobox('Commission Mode')).toBeDisabled();
        expect(screen.getByLabelText('Commission Value')).toBeDisabled();
        expect(combobox('Platform Fee Type')).toBeDisabled();
        expect(screen.getByLabelText('Platform Fee Value (%)')).toBeDisabled();
        expect(screen.getByLabelText('Sold As Principal')).toBeDisabled();
        expect(screen.getByLabelText('Coupon Total')).toBeDisabled();
        expect(screen.getByLabelText('Partner Share (%)')).toBeEnabled();
    });

    it('asks what was sold each way only for a mixed order, and takes the gateway amount only when the wallet paid part', async () => {
        await openSale({
            ...UNSPLIT_LOOKUP,
            setup: {
                ...SETUP,
                paymentThrough: 'BOTH',
                pgAmount: 700,
                commission: { ...SETUP.commission, mode: 'MIXED' },
                mixed: { principalAmount: 600, marginAmount: 400 },
                coupon: { used: true, totalDiscount: 50 },
            },
        });

        expect(screen.getByLabelText('Sold As Principal')).toHaveValue('600.00');
        expect(screen.getByLabelText('Sold As Principal')).toBeEnabled();
        expect(screen.getByLabelText('Sold On Margin')).toBeEnabled();
        expect(screen.getByLabelText('Paid Via Gateway')).toHaveValue('700.00');
        expect(screen.getByLabelText('Paid Via Gateway')).toBeEnabled();
        expect(screen.getByLabelText('Commission Value')).toBeEnabled();
        expect(screen.getByLabelText('Coupon Total')).toBeEnabled();
    });

    it('shows no set-up for an order that already carries its figures', async () => {
        await openSale(LOOKUP);

        expect(screen.queryByText('Set-up')).not.toBeInTheDocument();
        expect(screen.queryByText('Generate split figures')).not.toBeInTheDocument();
        expect(await screen.findByLabelText('Credit for line 1')).toHaveValue('100.00');
    });
});

describe('the deep link and the permission label', () => {
    it('exposes the wording the ledgers and the drawer rely on', () => {
        expect(NO_PERMISSION_TEXT).toBe(
            'Your role can view journals here but cannot post or change them'
        );
    });
});
