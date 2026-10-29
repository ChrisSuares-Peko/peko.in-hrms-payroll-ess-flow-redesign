import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { saveAs } from 'file-saver';
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

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const RANGE = { from: '2026-09-06', to: '2026-10-06' };

const POSTED = { state: 'posted', note: null, detail: null };

const page = (entries: unknown[]) => ({
    entries,
    recordsTotal: entries.length,
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
        id: '5-0',
        transactionDate: '2026-09-30T08:00:00.000Z',
        reference: '1790765440435',
        type: 'Admin withdrawal',
        particulars: 'Funds withdrawn by Peko Payments Services LLC',
        remark: null,
        debit: 10000,
        credit: null,
        balanceAfter: 36000,
        posting: { state: 'notApplicable', note: null, detail: null },
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
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (getSubscriberTransactions as Mock).mockResolvedValue(TRANSACTIONS);
    (getSubscriberWallet as Mock).mockResolvedValue(WALLET);
    (getSubscriberBills as Mock).mockResolvedValue(BILLS);
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

const TABS = [
    ['transactions', 'Transactions', '1791277831861'],
    ['wallet', 'Cashbacks & Rewards', '1790765440435'],
    ['bills', 'Bills', '1791277613418'],
] as [LedgerTabKey, string, string][];

describe('Subscriber ledger export', () => {
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
        'downloads the %s for the subscriber and the dates on screen, and saves the file',
        async (tab, label, reference) => {
            const blob = new Blob(['x']);
            (downloadSubscriberLedgerTab as Mock).mockResolvedValue(blob);
            renderPanel(tab);

            await screen.findByText(reference);
            fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

            await waitFor(() => expect(downloadSubscriberLedgerTab).toHaveBeenCalled());
            expect(downloadSubscriberLedgerTab).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                credentialId: '100000838',
                tab,
                from: '2026-09-06',
                to: '2026-10-06',
                format: 'excel',
            });
            await waitFor(() =>
                expect(saveAs).toHaveBeenCalledWith(
                    blob,
                    `Faris Rahamn ${label} 2026-09-06 to 2026-10-06.xlsx`
                )
            );
        }
    );

    it('keeps Adjust wallet and Wallet report beside the export buttons on the Wallet tab', async () => {
        renderPanel('wallet');

        await screen.findByText('1790765440435');
        expect(screen.getByRole('button', { name: /Adjust wallet/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Wallet report/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeInTheDocument();
    });

    it('does not put the wallet links on the other tabs', async () => {
        renderPanel('transactions');

        await screen.findByText('1791277831861');
        expect(screen.queryByRole('button', { name: /Adjust wallet/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Wallet report/ })).not.toBeInTheDocument();
    });

    it('disables the buttons when there is nothing to export', async () => {
        (getSubscriberTransactions as Mock).mockResolvedValue(page([]));
        renderPanel('transactions');

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled()
        );
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });
});
