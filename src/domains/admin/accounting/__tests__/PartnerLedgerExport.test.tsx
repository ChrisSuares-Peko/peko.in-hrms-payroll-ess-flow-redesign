import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    downloadPartnerLedgerTab,
    getPartnerDebitNotes,
    getPartnerPayouts,
    getPartnerSubscriptions,
    getPartnerTransactions,
} from '../api/partnerLedger';
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
    downloadPartnerLedgerTab: vi.fn(),
}));

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const RANGE = { from: '2026-09-06', to: '2026-10-06' };

const POSTED = { state: 'posted', note: null, detail: null };

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
            posting: { state: 'notApplicable', note: null, detail: null },
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
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (getPartnerTransactions as Mock).mockResolvedValue(TRANSACTIONS);
    (getPartnerSubscriptions as Mock).mockResolvedValue(SUBSCRIPTIONS);
    (getPartnerPayouts as Mock).mockResolvedValue(PAYOUTS);
    (getPartnerDebitNotes as Mock).mockResolvedValue(DEBIT_NOTES);
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

const TABS = [
    ['transactions', 'Transactions', '1791282332879'],
    ['own-subscriptions', 'Own Subscriptions', '1789639023559'],
    ['payments', 'Payments', 'NEFT-9001'],
    ['debit-notes', 'Debit Notes', 'DN-1042'],
] as [LedgerTabKey, string, string][];

describe('Partner ledger export', () => {
    it.each(TABS)(
        'offers Excel and PDF on the %s tab, and no CSV',
        async (tab, _label, reference) => {
            renderPanel(tab);

            await screen.findByText(reference);
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeEnabled();
            expect(screen.getByRole('button', { name: /Download PDF/ })).toBeEnabled();
            expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
        }
    );

    it.each(TABS)(
        'downloads the %s for the partner and the dates on screen, and saves the file',
        async (tab, label, reference) => {
            const blob = new Blob(['x']);
            (downloadPartnerLedgerTab as Mock).mockResolvedValue(blob);
            renderPanel(tab);

            await screen.findByText(reference);
            fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

            await waitFor(() => expect(downloadPartnerLedgerTab).toHaveBeenCalled());
            expect(downloadPartnerLedgerTab).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                partnerId: '3126',
                tab,
                from: '2026-09-06',
                to: '2026-10-06',
                format: 'pdf',
            });
            await waitFor(() =>
                expect(saveAs).toHaveBeenCalledWith(
                    blob,
                    `Cent Saarthi ${label} 2026-09-06 to 2026-10-06.pdf`
                )
            );
        }
    );

    it('keeps Record payout and Set opening balance beside the export buttons on the Payments tab', async () => {
        (getPartnerPayouts as Mock).mockResolvedValue({
            ...PAYOUTS,
            openingBalanceSet: false,
        });
        renderPanel('payments');

        await screen.findByText('NEFT-9001');
        expect(screen.getByRole('button', { name: /Set opening balance/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Record payout/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeInTheDocument();
    });

    it('keeps Record debit note beside the export buttons on the Debit Notes tab, with no opening balance button', async () => {
        renderPanel('debit-notes');

        await screen.findByText('DN-1042');
        expect(screen.getByRole('button', { name: /Record debit note/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Record payout/ })).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /Set opening balance/ })
        ).not.toBeInTheDocument();
    });

    it('does not put the payout buttons on the other tabs', async () => {
        renderPanel('transactions');

        await screen.findByText('1791282332879');
        expect(screen.queryByRole('button', { name: /Record payout/ })).not.toBeInTheDocument();
    });

    it('disables the buttons when there is nothing to export', async () => {
        (getPartnerTransactions as Mock).mockResolvedValue(page([]));
        renderPanel('transactions');

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled()
        );
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });
});
