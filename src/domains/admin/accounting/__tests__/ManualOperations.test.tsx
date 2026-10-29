import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    MANUAL_OPERATIONS,
    manualJournalPath,
    manualOperationPath,
} from '../config/manualOperations';
import ManualOperationProfiles from '../pages/ManualOperationProfiles';
import ManualOperations, { NO_OPERATION_MATCH } from '../pages/ManualOperations';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => vi.fn() }));

vi.mock('../pages/VendorLedgerList', () => ({
    default: ({ openTab, intro }: { openTab?: string; intro?: string }) => (
        <div>
            Vendor list opening {openTab} — {intro}
        </div>
    ),
}));
vi.mock('../pages/PartnerLedgerList', () => ({
    default: ({ openTab }: { openTab?: string }) => <div>Partner list opening {openTab}</div>,
}));
vi.mock('../pages/PaymentGatewayLedgerList', () => ({
    default: ({ openTab }: { openTab?: string }) => <div>Gateway list opening {openTab}</div>,
}));
vi.mock('../pages/SubscriberLedgerList', () => ({
    default: ({ openTab }: { openTab?: string }) => <div>Subscriber list opening {openTab}</div>,
}));

const ledgerLeaves = (labels: string[]) => ({
    reducer: {
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
                                services: labels.map(service => ({ service, hasAccess: true })),
                            },
                        ],
                    },
                ],
            },
        },
    },
});

const ALL_LEDGERS = ['Vendors', 'Subscribers', 'Partners', 'Payment Gateways'];

const setLedgers = (labels: string[]) => {
    const state = ledgerLeaves(labels);
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
};

const renderCards = () =>
    render(
        <MemoryRouter>
            <ManualOperations />
        </MemoryRouter>
    );

const renderPicker = (key: string) =>
    render(
        <MemoryRouter initialEntries={[manualOperationPath(key)]}>
            <Routes>
                <Route
                    path="/system-user/accounting/manual-operations"
                    element={<div>Cards page</div>}
                />
                <Route
                    path="/system-user/accounting/manual-operations/:operation"
                    element={<ManualOperationProfiles />}
                />
            </Routes>
        </MemoryRouter>
    );

beforeEach(() => {
    vi.clearAllMocks();
    setLedgers(ALL_LEDGERS);
});

describe('ManualOperations', () => {
    it('offers one card per operation, grouped by what it is for, each opening its own page', () => {
        renderCards();

        ['Orders', 'Vendors', 'Partners', 'Payment Gateways', 'Subscribers'].forEach(group =>
            expect(screen.getByText(group)).toBeInTheDocument()
        );
        expect(screen.getByText('Journal')).toBeInTheDocument();
        expect(
            screen.getByText(/Record an accounting entry the pipeline never posted/)
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Open Journal')).toHaveAttribute(
            'href',
            '/system-user/accounting/manual-operations/journal'
        );
        expect(screen.getByLabelText('Open Vendor Deposits')).toHaveAttribute(
            'href',
            '/system-user/accounting/manual-operations/vendor-deposits'
        );
        expect(screen.getAllByLabelText(/^Open /)).toHaveLength(MANUAL_OPERATIONS.length);
    });

    it('narrows the cards by what is typed, and says so when nothing matches', () => {
        renderCards();
        const search = screen.getByLabelText('Search operations');

        fireEvent.change(search, { target: { value: 'opening' } });
        expect(screen.getAllByLabelText(/^Open /).map(link => link.textContent)).toHaveLength(3);
        expect(screen.getByText('Vendor Opening Balances')).toBeInTheDocument();
        expect(screen.queryByText('Journal')).not.toBeInTheDocument();
        expect(screen.queryByText('Orders')).not.toBeInTheDocument();

        fireEvent.change(search, { target: { value: 'Payment Gateways' } });
        expect(screen.getAllByLabelText(/^Open Gateway/)).toHaveLength(3);

        fireEvent.change(search, { target: { value: 'nothing like this' } });
        expect(screen.getByText(NO_OPERATION_MATCH)).toBeInTheDocument();
    });

    it('shows only the operations whose profiles the role can open', () => {
        setLedgers(['Vendors']);
        renderCards();

        expect(screen.getByText('Journal')).toBeInTheDocument();
        expect(screen.getByText('Vendor Deposits')).toBeInTheDocument();
        expect(screen.queryByText('Partner Payouts')).not.toBeInTheDocument();
        expect(screen.queryByText('Gateway Fees')).not.toBeInTheDocument();
        expect(screen.queryByText('Subscribers')).not.toBeInTheDocument();
    });

    it('keeps the journal links and gives every other operation its own path', () => {
        expect(MANUAL_OPERATIONS.map(operation => operation.key)).toEqual([
            'journal',
            'commission-invoice',
            'vendor-deposits',
            'vendor-credit-notes',
            'vendor-commissions',
            'vendor-cost-of-sales',
            'vendor-debit-notes',
            'vendor-opening-balances',
            'partner-payouts',
            'partner-debit-notes',
            'partner-opening-balances',
            'gateway-receipts',
            'gateway-fees',
            'gateway-opening-balances',
            'subscriber-wallet-adjustments',
        ]);
        expect(manualJournalPath()).toBe('/system-user/accounting/manual-operations/journal');
        expect(manualJournalPath('TXN 1', 'refund')).toBe(
            '/system-user/accounting/manual-operations/journal/TXN%201?event=refund'
        );
        expect(manualOperationPath('gateway-fees')).toBe(
            '/system-user/accounting/manual-operations/gateway-fees'
        );
    });
});

describe('ManualOperationProfiles', () => {
    it.each([
        ['vendor-deposits', 'Vendor list opening deposits'],
        ['vendor-commissions', 'Vendor list opening commissions'],
        ['vendor-cost-of-sales', 'Vendor list opening cost-of-sales'],
        ['partner-debit-notes', 'Partner list opening debit-notes'],
        ['gateway-fees', 'Gateway list opening received-and-bills'],
        ['subscriber-wallet-adjustments', 'Subscriber list opening wallet'],
    ])('lists the profiles for %s and opens the tab where it is recorded', (key, text) => {
        renderPicker(key);

        expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
    });

    it('tells the profile list what the operation is for', () => {
        renderPicker('vendor-credit-notes');

        expect(
            screen.getByText(
                /Pick the vendor whose credit notes you want to record, correct or delete/
            )
        ).toBeInTheDocument();
    });

    it('sends an unknown operation, and the journal, back to the cards', () => {
        renderPicker('no-such-operation');
        expect(screen.getByText('Cards page')).toBeInTheDocument();
    });
});

describe('the operation cards', () => {
    it('keep their order inside each group', () => {
        renderCards();
        const vendorGroup = screen.getByText('Vendors').closest('.ant-flex') as HTMLElement;

        expect(
            within(vendorGroup)
                .getAllByLabelText(/^Open /)
                .map(link => link.getAttribute('aria-label'))
        ).toEqual([
            'Open Vendor Deposits',
            'Open Vendor Credit Notes',
            'Open Vendor Commissions',
            'Open Vendor Cost of Sales',
            'Open Vendor Debit Notes',
            'Open Vendor Opening Balances',
        ]);
    });
});
