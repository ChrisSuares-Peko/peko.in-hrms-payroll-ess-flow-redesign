import '@testing-library/jest-dom/vitest';

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import FeeDetails from '../pages/FeeDetails';
import SubscriptionDetails from '../pages/SubscriptionDetails';
import Transactions from '../pages/Transactions';

const DOCUMENTS = {
    subscriber: { invoice: false, planInvoice: false, receipt: false },
    vendor: { invoice: false },
};

const POSTED = { state: 'posted', note: null, detail: null };
const PAUSED = {
    state: 'notPosted',
    note: 'Recording paused',
    detail: 'Journal recording is currently paused',
};

vi.mock('../hooks/useTransactions', () => ({
    default: () => ({
        isLoading: false,
        count: 2,
        totals: { count: 2, totalAmount: 1600 },
        tableData: [
            {
                id: 1,
                transactionDate: '2026-09-20T10:00:00.000Z',
                corporateTxnId: 'T-POSTED',
                credential: { id: 7, username: '100000919', name: 'Acme Corp' },
                serviceOperator: { id: 3, serviceProvider: 'Electricity Bill' },
                order: {
                    id: 1,
                    amountInINR: 500,
                    paymentMode: 'PAYMENT GATEWAY',
                    status: 'SUCCESS',
                },
                posting: POSTED,
                documents: DOCUMENTS,
            },
            {
                id: 2,
                transactionDate: '2026-09-21T10:00:00.000Z',
                corporateTxnId: 'T-REFUND',
                credential: { id: 7, username: '100000919', name: 'Acme Corp' },
                serviceOperator: { id: 3, serviceProvider: 'Electricity Bill' },
                order: { id: 2, amountInINR: 1100, paymentMode: 'WALLET', status: 'REFUNDED' },
                posting: { state: 'notPosted', note: 'Refund: Not recorded yet', detail: null },
                documents: DOCUMENTS,
            },
        ],
    }),
}));

vi.mock('../hooks/useFeeDetails', () => ({
    default: () => ({
        isLoading: false,
        count: 1,
        tableData: [
            {
                id: 5,
                corporateTxnId: 'F-PAUSED',
                transactionDate: '2026-09-20T10:00:00.000Z',
                service: 'Data Cards',
                vendorName: 'Acme Vendor',
                orderValue: 1080,
                feeExcludingGST: 100,
                feeIncludingGST: 118,
                feeReversed: 0,
                feeNet: 118,
                posting: PAUSED,
                documents: DOCUMENTS,
            },
        ],
    }),
}));

vi.mock('../hooks/useFeeDetailsExport', () => ({
    default: () => ({ exportingFormat: null, exportAs: vi.fn() }),
}));

vi.mock('../hooks/useSubscriptionDetailsExport', () => ({
    default: () => ({ exportingFormat: null, exportAs: vi.fn() }),
}));

vi.mock('../hooks/useSubscriptionDetails', () => ({
    default: () => ({
        isLoading: false,
        count: 1,
        tableData: [
            {
                id: 9,
                corporateTxnId: 'S-POSTED',
                transactionDate: '2026-09-20T10:00:00.000Z',
                subscriberUsername: '100000919',
                subscriberName: 'Acme Corp',
                partnerName: null,
                plan: 'Peko+',
                billingType: 'MONTHLY',
                orderValue: 236,
                netRevenue: 200,
                posting: POSTED,
                documents: DOCUMENTS,
            },
        ],
    }),
}));

vi.mock('@src/domains/admin/reports/hooks/useVendors', () => ({
    default: () => ({ dropDownData: [] }),
}));
vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({
    default: () => ({ partnerData: [] }),
}));
vi.mock('@src/domains/admin/reports/hooks/useDownloadOrderDocument', () => ({
    useDownloadOrderDocument: () => ({ loadingKey: null, downloadDocument: vi.fn() }),
}));

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

const rowOf = (text: string) => screen.getByText(text).closest('tr') as HTMLElement;

describe('the dashboard drill-down pages', () => {
    it('say on every transaction whether it reached the books, before the documents', async () => {
        render(
            <MemoryRouter>
                <Transactions />
            </MemoryRouter>
        );

        await screen.findByText('T-POSTED');
        expect(within(rowOf('T-POSTED')).getByText('Posted')).toBeInTheDocument();
        expect(within(rowOf('T-REFUND')).getByText('Not posted')).toBeInTheDocument();
        expect(within(rowOf('T-REFUND')).getByText('Refund: Not recorded yet')).toBeInTheDocument();
        expect(screen.getAllByText('Documents').length).toBeGreaterThan(0);
    });

    it('say on every commission row whether it reached the books and why not', async () => {
        render(
            <MemoryRouter>
                <FeeDetails feeType="commission" />
            </MemoryRouter>
        );

        await screen.findByText('F-PAUSED');
        expect(within(rowOf('F-PAUSED')).getByText('Not posted')).toBeInTheDocument();
        expect(within(rowOf('F-PAUSED')).getByText('Recording paused')).toBeInTheDocument();
        expect(screen.getAllByText('Invoice').length).toBeGreaterThan(0);
    });

    it('say on every subscription whether it reached the books', async () => {
        render(
            <MemoryRouter>
                <SubscriptionDetails />
            </MemoryRouter>
        );

        await screen.findByText('S-POSTED');
        expect(within(rowOf('S-POSTED')).getByText('Posted')).toBeInTheDocument();
    });
});
