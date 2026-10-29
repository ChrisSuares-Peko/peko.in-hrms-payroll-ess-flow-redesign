import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { downloadThirdPartySales, getThirdPartySales } from '../api/thirdPartySales';
import ThirdPartySales from '../pages/ThirdPartySales';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../api/thirdPartySales', () => ({
    getThirdPartySales: vi.fn(),
    downloadThirdPartySales: vi.fn(),
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const PAID = {
    id: 301,
    linkId: 'PYT_TXN0301',
    reference: 'REF301',
    corporateName: 'Acme Traders',
    corporateUsername: 'acme',
    customerName: 'Rahul',
    customerPhone: '9876543210',
    purpose: 'Invoice 42',
    kind: 'invoice',
    raisedBy: 'corporate',
    provider: 'NuPay',
    amount: 1499,
    outcome: 'paid',
    settlement: 'settled',
    createdAt: '2026-09-03T04:00:00.000Z',
    eventDate: '2026-09-04T10:30:00.000Z',
    paidAt: '2026-09-04T10:30:00.000Z',
    settledAt: '2026-09-05T03:00:00.000Z',
    utr: 'UTR123',
    settlementUtr: 'SUTR123',
    expiresAt: '2026-09-10T04:00:00.000Z',
    linkUrl: 'https://pay.example/abc',
};

const ADMIN_RAISED = {
    id: 302,
    linkId: '1738000000000',
    reference: '1738000000000',
    corporateName: 'Billed Corp',
    corporateUsername: null,
    customerName: null,
    customerPhone: null,
    purpose: null,
    kind: 'payment_link',
    raisedBy: 'admin',
    provider: 'Decentro',
    amount: 41,
    outcome: 'pending',
    settlement: 'processing',
    createdAt: '2026-09-06T04:00:00.000Z',
    eventDate: '2026-09-06T04:00:00.000Z',
    paidAt: null,
    settledAt: null,
    utr: null,
    settlementUtr: null,
    expiresAt: null,
    linkUrl: null,
};

const EXPIRED = {
    id: 303,
    linkId: 'PYT_TXN0303',
    reference: 'REF303',
    corporateName: 'Acme Traders',
    corporateUsername: 'acme',
    customerName: 'Meera',
    customerPhone: '9123456789',
    purpose: 'Deposit',
    kind: 'payment_link',
    raisedBy: 'corporate',
    provider: 'Decentro',
    amount: 250,
    outcome: 'expired',
    settlement: null,
    createdAt: '2026-09-02T04:00:00.000Z',
    eventDate: '2026-09-02T04:00:00.000Z',
    paidAt: null,
    settledAt: null,
    utr: null,
    settlementUtr: null,
    expiresAt: '2026-09-03T04:00:00.000Z',
    linkUrl: 'https://pay.example/exp',
};

const RESPONSE = {
    entries: [PAID, ADMIN_RAISED, EXPIRED],
    recordsTotal: 3,
    totals: { links: 3, collected: 1499, pending: 41, failed: 0, expired: 250 },
    page: 1,
    itemsPerPage: 10,
    kind: 'payment-links',
};

const PAGE = '/system-user/accounting/third-party-sales';
const SEEDED = `${PAGE}/payment-links?from=2026-09-01&to=2026-09-16`;

const realGetComputedStyle = window.getComputedStyle.bind(window);

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 2400, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (getThirdPartySales as Mock).mockResolvedValue(RESPONSE);
});

const renderAt = (path = SEEDED) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={`${PAGE}/:kind?`} element={<ThirdPartySales />} />
            </Routes>
        </MemoryRouter>
    );

const rowOf = async (text: string) => (await screen.findByText(text)).closest('tr') as HTMLElement;

describe('ThirdPartySales', () => {
    it('opens on the Payment Links tab and lists every link with what happened to it', async () => {
        renderAt();

        const paid = await rowOf('PYT_TXN0301');
        expect(screen.getByText('Payment Links', { selector: 'button' })).toBeInTheDocument();
        expect(
            screen.getByText(/Money corporates collect from their own customers/)
        ).toBeInTheDocument();
        expect(within(paid).getByText('Acme Traders')).toBeInTheDocument();
        expect(within(paid).getByText('acme')).toBeInTheDocument();
        expect(within(paid).getByText('Rahul')).toBeInTheDocument();
        expect(within(paid).getByText('9876543210')).toBeInTheDocument();
        expect(within(paid).getByText('Invoice link')).toBeInTheDocument();
        expect(within(paid).getByText('Corporate')).toBeInTheDocument();
        expect(within(paid).getByText('NuPay')).toBeInTheDocument();
        expect(within(paid).getByText('₹ 1,499.00')).toBeInTheDocument();
        expect(within(paid).getByText('Paid')).toBeInTheDocument();
        expect(within(paid).getByText('UTR123')).toBeInTheDocument();

        const adminRaised = await rowOf('1738000000000');
        expect(within(adminRaised).getByText('Billed Corp')).toBeInTheDocument();
        expect(within(adminRaised).getByText('Admin')).toBeInTheDocument();
        expect(within(adminRaised).getByText('Payment link')).toBeInTheDocument();
        expect(within(adminRaised).getByText('Decentro')).toBeInTheDocument();
        expect(within(adminRaised).getByText('Pending')).toBeInTheDocument();

        const expired = await rowOf('PYT_TXN0303');
        expect(within(expired).getByText('Expired')).toBeInTheDocument();
        expect(within(expired).getByText('₹ 250.00')).toBeInTheDocument();
    });

    it('totals the period above the table and says what the totals cover', async () => {
        renderAt();

        await screen.findByText('PYT_TXN0301');
        expect(screen.getByText('Links')).toBeInTheDocument();
        expect(screen.getByText('Collected')).toBeInTheDocument();
        expect(screen.getAllByText('₹ 1,499.00').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('₹ 250.00').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('₹ 41.00', { selector: '.font-semibold' })).toBeInTheDocument();
        expect(screen.getByText(/Totals cover/)).toHaveTextContent(
            /Collected adds up the links that were paid/
        );
    });

    it('asks for the dates the dashboard card was computed from, under the kind in the address', async () => {
        renderAt();

        await waitFor(() => expect(getThirdPartySales).toHaveBeenCalled());
        const call = (getThirdPartySales as Mock).mock.calls[0][0];
        expect(call).toMatchObject({
            userId: 7,
            userType: 'system_user',
            kind: 'payment-links',
            page: 1,
            itemsPerPage: 10,
            searchText: '',
            from: '2026-09-01',
            to: '2026-09-16',
        });
        expect(call.status).toBeUndefined();
    });

    it('asks for the last month by default when opened on its own', async () => {
        renderAt(`${PAGE}/payment-links`);

        await waitFor(() => expect(getThirdPartySales).toHaveBeenCalled());
        const call = (getThirdPartySales as Mock).mock.calls[0][0];
        expect(call.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(call.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('opens on Payment Links when the address names no kind, or one it does not know, keeping the dates', async () => {
        renderAt(`${PAGE}?from=2026-09-01&to=2026-09-16`);

        await waitFor(() =>
            expect(getThirdPartySales).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 'payment-links',
                    from: '2026-09-01',
                    to: '2026-09-16',
                })
            )
        );
        expect(screen.getByText('Payment Links', { selector: 'button' })).toBeInTheDocument();
    });

    it('does the same for a kind it does not know yet', async () => {
        renderAt(`${PAGE}/qr-codes?from=2026-09-01&to=2026-09-16`);

        await waitFor(() =>
            expect(getThirdPartySales).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: 'payment-links',
                    from: '2026-09-01',
                    to: '2026-09-16',
                })
            )
        );
    });

    it('sends the status the admin picked and goes back to the first page', async () => {
        renderAt();
        await screen.findByText('PYT_TXN0301');

        fireEvent.mouseDown(screen.getByText('All statuses'));
        fireEvent.click(await screen.findByTitle('Expired'));

        await waitFor(() =>
            expect(getThirdPartySales).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'expired', page: 1 })
            )
        );
    });

    it('asks for the internal purchase accounts from the address and the picker', async () => {
        renderAt(`${SEEDED}&accounts=internal`);
        await screen.findByText('PYT_TXN0301');

        await waitFor(() =>
            expect(getThirdPartySales).toHaveBeenLastCalledWith(
                expect.objectContaining({ accounts: 'internal' })
            )
        );

        fireEvent.mouseDown(screen.getByText('Internal purchase accounts'));
        fireEvent.click(await screen.findByTitle('All accounts'));
        await waitFor(() =>
            expect(getThirdPartySales).toHaveBeenLastCalledWith(
                expect.not.objectContaining({ accounts: 'internal' })
            )
        );
    });

    it('says so when nothing matches', async () => {
        (getThirdPartySales as Mock).mockResolvedValue({
            ...RESPONSE,
            entries: [],
            recordsTotal: 0,
            totals: { links: 0, collected: 0, pending: 0, failed: 0, expired: 0 },
        });
        renderAt();

        expect(await screen.findByText('No payment links in this period.')).toBeInTheDocument();
    });
});

describe('ThirdPartySales export', () => {
    it('offers Excel and PDF, and no CSV', async () => {
        renderAt();

        await screen.findByText('PYT_TXN0301');
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeEnabled();
        expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
    });

    it('downloads the format clicked with the filters the table is showing, and saves it', async () => {
        const blob = new Blob(['x']);
        (downloadThirdPartySales as Mock).mockResolvedValue(blob);
        renderAt();

        await screen.findByText('PYT_TXN0301');
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadThirdPartySales).toHaveBeenCalled());
        expect(downloadThirdPartySales).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            kind: 'payment-links',
            searchText: '',
            from: '2026-09-01',
            to: '2026-09-16',
            status: undefined,
            format: 'pdf',
        });
        await waitFor(() =>
            expect(saveAs).toHaveBeenCalledWith(
                blob,
                'Third-Party Sales (Payment Links) 2026-09-01 to 2026-09-16.pdf'
            )
        );
    });

    it('disables the buttons when there is nothing to export', async () => {
        (getThirdPartySales as Mock).mockResolvedValue({
            ...RESPONSE,
            entries: [],
            recordsTotal: 0,
        });
        renderAt();

        await screen.findByText('No payment links in this period.');
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });
});
