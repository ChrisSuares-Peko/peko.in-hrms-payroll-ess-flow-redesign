import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    downloadPaymentGatewayLedgerTab,
    getPaymentGatewaySettlements,
    getPaymentGatewayTransactions,
} from '../api/paymentGatewayLedger';
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
    downloadPaymentGatewayLedgerTab: vi.fn(),
}));

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const RANGE = { from: '2026-09-06', to: '2026-10-06' };

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
    gatewayAccountId: '4003352000000058004',
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

const SETTLEMENTS = (received: unknown[], fees: unknown[]) => ({
    entries: received,
    recordsTotal: received.length,
    feeEntries: fees,
    feeRecordsTotal: fees.length,
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

vi.setConfig({ testTimeout: 20000 });

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (getPaymentGatewayTransactions as Mock).mockResolvedValue(TRANSACTIONS);
    (getPaymentGatewaySettlements as Mock).mockResolvedValue(
        SETTLEMENTS([entry(3, 'RECEIPT', 'RCPT-5435')], [entry(4, 'FEE', 'FEE-sdf5')])
    );
});

const renderPanel = (tab: LedgerTabKey) =>
    render(
        <MemoryRouter>
            <PaymentGatewayTabPanel
                gatewayId="4003352000000058004"
                gatewayName="Cashfree"
                tab={tab}
                range={RANGE}
                canUpdate
                onChanged={vi.fn()}
            />
        </MemoryRouter>
    );

// The Received table sits above the Bills table, and each carries its own pair of buttons.
const buttonsOf = (table: 'received' | 'fees') => {
    const index = table === 'received' ? 0 : 1;
    return {
        excel: screen.getAllByRole('button', { name: /Export Excel/ })[index],
        pdf: screen.getAllByRole('button', { name: /Download PDF/ })[index],
    };
};

describe('Payment gateway ledger export — Transactions', () => {
    it('offers Excel and PDF, and no CSV', async () => {
        renderPanel('transactions');

        await screen.findByText('1791277831861');
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeEnabled();
        expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
    });

    it('downloads the transactions for the gateway and the dates on screen, and saves the file', async () => {
        const blob = new Blob(['x']);
        (downloadPaymentGatewayLedgerTab as Mock).mockResolvedValue(blob);
        renderPanel('transactions');

        await screen.findByText('1791277831861');
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalled());
        expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            gatewayId: '4003352000000058004',
            tab: 'transactions',
            from: '2026-09-06',
            to: '2026-10-06',
            format: 'pdf',
        });
        await waitFor(() =>
            expect(saveAs).toHaveBeenCalledWith(
                blob,
                'Cashfree Transactions 2026-09-06 to 2026-10-06.pdf'
            )
        );
    });

    it('disables the buttons when there is nothing to export', async () => {
        (getPaymentGatewayTransactions as Mock).mockResolvedValue({
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
});

describe('Payment gateway ledger export — Received & Bills', () => {
    it('puts a pair of buttons on each table, and keeps the buttons that record entries', async () => {
        renderPanel('received-and-bills');

        await screen.findByText('RCPT-5435');
        expect(screen.getAllByRole('button', { name: /Export Excel/ })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: /Download PDF/ })).toHaveLength(2);
        expect(screen.getByRole('button', { name: /Record receipt/ })).toBeInTheDocument();
        const recordFee = screen.getByRole('button', { name: /Record fee/ });
        expect(
            within(recordFee.parentElement as HTMLElement).getByRole('button', {
                name: /Export Excel/,
            })
        ).toBe(buttonsOf('fees').excel);
    });

    it('downloads the received table from the buttons beside it', async () => {
        const blob = new Blob(['x']);
        (downloadPaymentGatewayLedgerTab as Mock).mockResolvedValue(blob);
        renderPanel('received-and-bills');

        await screen.findByText('RCPT-5435');
        fireEvent.click(buttonsOf('received').excel);

        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalled());
        expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledWith(
            expect.objectContaining({ tab: 'received', format: 'excel' })
        );
        await waitFor(() =>
            expect(saveAs).toHaveBeenCalledWith(
                blob,
                'Cashfree Received 2026-09-06 to 2026-10-06.xlsx'
            )
        );
    });

    it('downloads the bills and fees table from the buttons beside it', async () => {
        const blob = new Blob(['x']);
        (downloadPaymentGatewayLedgerTab as Mock).mockResolvedValue(blob);
        renderPanel('received-and-bills');

        await screen.findByText('FEE-sdf5');
        fireEvent.click(buttonsOf('fees').pdf);

        await waitFor(() => expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalled());
        expect(downloadPaymentGatewayLedgerTab).toHaveBeenCalledWith(
            expect.objectContaining({ tab: 'fees', format: 'pdf' })
        );
        await waitFor(() =>
            expect(saveAs).toHaveBeenCalledWith(
                blob,
                'Cashfree Fees Charged 2026-09-06 to 2026-10-06.pdf'
            )
        );
    });

    it('disables only the buttons of a table that has nothing in it', async () => {
        (getPaymentGatewaySettlements as Mock).mockResolvedValue(
            SETTLEMENTS([entry(3, 'RECEIPT', 'RCPT-5435')], [])
        );
        renderPanel('received-and-bills');

        await screen.findByText('RCPT-5435');
        const [receivedExcel, feesExcel] = screen.getAllByRole('button', { name: /Export Excel/ });
        expect(receivedExcel).toBeEnabled();
        expect(feesExcel).toBeDisabled();
    });
});
