import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { downloadOrderJournals, getAllData } from '../../api/orderJournal';
import OrderJournalsReport from '../../components/OrderJournal/OrderJournalsReport';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}));
vi.mock('@src/hooks/useScreenSize', () => ({ default: () => ({ xs: false }) }));
vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({
    default: () => ({ partnerData: [{ value: '55', label: 'Gulf Reach' }] }),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('../../api/orderJournal', async importOriginal => ({
    ...(await importOriginal<typeof import('../../api/orderJournal')>()),
    getAllData: vi.fn(),
    downloadOrderJournals: vi.fn(),
}));

const STATE = {
    reducer: {
        auth: { role: 'system_user', id: 7 },
        user: { user: {} },
    },
};

const RESPONSE = {
    result: [
        {
            id: 1,
            corporateTxnId: '1791277831861',
            transactionDate: '2026-09-22T10:00:00.000Z',
            credential: { username: '100000919' },
            serviceOperator: { serviceProvider: 'Peko Go' },
            order: {
                id: 1,
                amountInINR: 1155.27,
                paymentMode: 'WALLET',
                status: 'SUCCESS',
                journalRecordStatus: { transaction: true },
                journalData: null,
            },
            documents: {
                subscriber: { invoice: true, planInvoice: false, receipt: false },
                vendor: { invoice: false },
            },
        },
    ],
    totalData: 1,
};

const realGetComputedStyle = window.getComputedStyle.bind(window);

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (getAllData as Mock).mockResolvedValue(RESPONSE);
});

const renderPage = (url = '/') =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <OrderJournalsReport />
        </MemoryRouter>
    );

describe('Order Journals export', () => {
    it('offers Excel and PDF, and no CSV', async () => {
        renderPage();

        await screen.findByText('1791277831861');
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeEnabled();
        expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
    });

    it('downloads the format clicked with the filters the table is showing, and saves it', async () => {
        const blob = new Blob(['x']);
        (downloadOrderJournals as Mock).mockResolvedValue(blob);
        renderPage();

        await screen.findByText('1791277831861');
        const shown = (getAllData as Mock).mock.calls.at(-1)?.[0];
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadOrderJournals).toHaveBeenCalled());
        expect(downloadOrderJournals).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            searchText: shown.searchText,
            from: shown.from,
            to: shown.to,
            sort: shown.sort,
            sortField: shown.sortField,
            status: shown.status,
            journalKey: shown.journalKey,
            partnerId: shown.partnerId,
            format: 'pdf',
        });
        await waitFor(() =>
            expect(saveAs).toHaveBeenCalledWith(
                blob,
                `Order Journals ${shown.from} to ${shown.to}.pdf`
            )
        );
    });

    it('carries the journal type and status a dashboard card opened the page with', async () => {
        (downloadOrderJournals as Mock).mockResolvedValue(new Blob(['x']));
        renderPage('/?journalKey=refund&status=failed&from=2026-09-01&to=2026-09-16');

        await screen.findByText('1791277831861');
        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() => expect(downloadOrderJournals).toHaveBeenCalled());
        expect(downloadOrderJournals).toHaveBeenCalledWith(
            expect.objectContaining({
                journalKey: 'refund',
                status: 'failed',
                from: '2026-09-01',
                to: '2026-09-16',
                format: 'excel',
            })
        );
        await waitFor(() =>
            expect(saveAs).toHaveBeenCalledWith(
                expect.anything(),
                'Order Journals 2026-09-01 to 2026-09-16.xlsx'
            )
        );
    });

    it('disables the buttons when there is nothing to export', async () => {
        (getAllData as Mock).mockResolvedValue({ result: [], totalData: 0 });
        renderPage();

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled()
        );
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeDisabled();
    });
});
