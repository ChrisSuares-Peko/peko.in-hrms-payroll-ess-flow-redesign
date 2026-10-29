import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import useVendors from '@src/domains/admin/reports/hooks/useVendors';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import { useAppSelector } from '@src/hooks/store';

import { downloadOtherSales, getOtherSales } from '../api/otherSales';
import OtherSales from '../pages/OtherSales';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/domains/admin/reports/hooks/useVendors', () => ({ default: vi.fn() }));

vi.mock('@src/domains/admin/users/hooks/usePartnersForCorporate', () => ({ default: vi.fn() }));

vi.mock('../api/otherSales', () => ({ getOtherSales: vi.fn(), downloadOtherSales: vi.fn() }));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const STATE = {
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
                                category: 'Operations',
                                hasAccess: true,
                                services: [
                                    { service: 'Other Sales', hasAccess: true, update: false },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    },
};

const RESPONSE = {
    entries: [
        {
            id: 41,
            corporateTxnId: '1789647165639',
            transactionDate: '2026-09-22T10:00:00.000Z',
            service: 'Data Cards',
            vendorId: 9,
            vendorName: 'Markup Fixture',
            partnerName: 'Gulf Reach',
            totalAmount: 1080,
            platformFee: 80,
            markup: 118,
            couponDiscount: 100,
            status: 'SUCCESS',
            posting: { state: 'posted', note: null, detail: null },
        },
        {
            id: 42,
            corporateTxnId: '1789647165640',
            transactionDate: '2026-09-21T10:00:00.000Z',
            service: 'Data Cards',
            vendorId: 9,
            vendorName: 'Markup Fixture',
            partnerName: null,
            totalAmount: 236,
            platformFee: 0,
            markup: 36,
            couponDiscount: 0,
            status: 'REFUNDED',
            posting: { state: 'notPosted', note: 'Refund: Not recorded yet', detail: null },
        },
    ],
    recordsTotal: 2,
    totals: {
        totalAmount: 1316,
        platformFee: 80,
        markup: 154,
        couponDiscount: 100,
    },
    page: 1,
    itemsPerPage: 10,
};

const realGetComputedStyle = window.getComputedStyle.bind(window);

beforeAll(() => {
    window.getComputedStyle = ((el: Element) =>
        realGetComputedStyle(el)) as typeof window.getComputedStyle;
    // GenericTable folds any column past the viewport into the expandable row, and jsdom
    // is 1024 wide by default, which is narrower than this table.
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (useVendors as unknown as Mock).mockReturnValue({
        dropDownData: [{ id: 9, vendorName: 'Markup Fixture' }],
        loading: false,
    });
    (usePartnersForCorporate as unknown as Mock).mockReturnValue({
        partnerData: [
            { value: 'default', label: 'Default' },
            { value: 55, label: 'Gulf Reach' },
        ],
        loading: false,
        categoryDatas: [],
    });
    (getOtherSales as Mock).mockResolvedValue(RESPONSE);
});

const renderPage = () =>
    render(
        <MemoryRouter>
            <OtherSales />
        </MemoryRouter>
    );

describe('OtherSales', () => {
    it('lists every sale with its breakdown', async () => {
        renderPage();

        expect(await screen.findByText('1789647165639')).toBeInTheDocument();
        expect(screen.getAllByText('Data Cards').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Markup Fixture').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 1,080.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 118.00').length).toBeGreaterThan(0);
    });

    it('leaves the vendor payable out of the columns, the totals and the note', async () => {
        renderPage();

        await screen.findByText('1789647165639');
        expect(screen.queryAllByText('Vendor Payable')).toHaveLength(0);
        expect(screen.getByText(/Totals cover/)).not.toHaveTextContent(/vendor payable/i);
    });

    it('names the partner, or says the sale came through Peko itself', async () => {
        renderPage();

        await screen.findByText('1789647165639');
        expect(screen.getAllByText('Gulf Reach').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Peko (Default)').length).toBeGreaterThan(0);
    });

    it('marks a sale that came back', async () => {
        renderPage();

        await screen.findByText('1789647165639');
        expect(screen.getAllByText('Refunded').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Success').length).toBeGreaterThan(0);
    });

    it('shows the coupon as money taken off, and a dash when there was none', async () => {
        renderPage();

        await screen.findByText('1789647165639');
        expect(screen.getAllByText('- ₹ 100.00')[0]).toHaveClass('text-red-600');
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });

    it('totals the period above the table and says what the totals cover', async () => {
        renderPage();

        await screen.findByText('1789647165639');
        expect(screen.getAllByText('₹ 1,316.00').length).toBeGreaterThan(0);
        expect(screen.getAllByText('₹ 154.00').length).toBeGreaterThan(0);
        expect(screen.getByText(/Totals cover/)).toBeInTheDocument();
    });

    it('asks for the last month by default', async () => {
        renderPage();

        await waitFor(() => expect(getOtherSales).toHaveBeenCalled());
        expect(getOtherSales).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 7,
                userType: 'system_user',
                page: 1,
                itemsPerPage: 10,
            })
        );
        const call = (getOtherSales as Mock).mock.calls[0][0];
        expect(call.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(call.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('sends the vendor and the partner the admin picked', async () => {
        renderPage();

        await screen.findByText('1789647165639');

        fireEvent.mouseDown(screen.getByText('All vendors'));
        fireEvent.click(await screen.findByTitle('Markup Fixture'));
        await waitFor(() =>
            expect(getOtherSales).toHaveBeenCalledWith(expect.objectContaining({ vendorId: 9 }))
        );

        fireEvent.mouseDown(screen.getByText('All partners'));
        fireEvent.click(await screen.findByTitle('Gulf Reach'));
        await waitFor(() =>
            expect(getOtherSales).toHaveBeenCalledWith(
                expect.objectContaining({ vendorId: 9, partnerId: 55 })
            )
        );
    });

    it('asks for the internal purchase accounts when picked, and when the address says so', async () => {
        renderPage();
        await screen.findByText('1789647165639');

        fireEvent.mouseDown(screen.getByText('All accounts'));
        fireEvent.click(await screen.findByTitle('Internal purchase accounts'));
        await waitFor(() =>
            expect(getOtherSales).toHaveBeenLastCalledWith(
                expect.objectContaining({ accounts: 'internal', page: 1 })
            )
        );

        render(
            <MemoryRouter
                initialEntries={[
                    '/system-user/accounting/other-sales?from=2026-09-01&to=2026-09-16&accounts=internal',
                ]}
            >
                <OtherSales />
            </MemoryRouter>
        );
        await waitFor(() =>
            expect(getOtherSales).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    accounts: 'internal',
                    from: '2026-09-01',
                    to: '2026-09-16',
                })
            )
        );
    });

    it('offers Peko itself, named as the Partner column names it, and every partner', async () => {
        renderPage();

        await screen.findByText('1789647165639');
        fireEvent.mouseDown(screen.getByText('All partners'));

        expect(await screen.findByTitle('Peko (Default)')).toBeInTheDocument();
        expect(await screen.findByTitle('Gulf Reach')).toBeInTheDocument();
        expect(screen.queryByTitle('Default')).not.toBeInTheDocument();
    });

    it('asks for the sales Peko made to its own customers when Peko (Default) is picked', async () => {
        renderPage();
        await screen.findByText('1789647165639');

        fireEvent.mouseDown(screen.getByText('All partners'));
        fireEvent.click(await screen.findByTitle('Peko (Default)'));

        await waitFor(() =>
            expect(getOtherSales).toHaveBeenLastCalledWith(
                expect.objectContaining({ partnerId: 'default', page: 1 })
            )
        );
    });

    it('exports the same Peko (Default) sales the table is showing', async () => {
        (downloadOtherSales as Mock).mockResolvedValue(new Blob(['x']));
        renderPage();
        await screen.findByText('1789647165639');

        fireEvent.mouseDown(screen.getByText('All partners'));
        fireEvent.click(await screen.findByTitle('Peko (Default)'));
        await waitFor(() =>
            expect(getOtherSales).toHaveBeenLastCalledWith(
                expect.objectContaining({ partnerId: 'default' })
            )
        );
        fireEvent.click(screen.getByRole('button', { name: /Export Excel/ }));

        await waitFor(() =>
            expect(downloadOtherSales).toHaveBeenCalledWith(
                expect.objectContaining({ partnerId: 'default', format: 'excel' })
            )
        );
    });

    it('says so when nothing matches', async () => {
        (getOtherSales as Mock).mockResolvedValue({
            entries: [],
            recordsTotal: 0,
            totals: {
                totalAmount: 0,
                platformFee: 0,
                markup: 0,
                couponDiscount: 0,
            },
            page: 1,
            itemsPerPage: 10,
        });
        renderPage();

        expect(await screen.findByText('No other sales in this period.')).toBeInTheDocument();
    });

    it('lists a sale whose journal never ran with every amount dashed, the full amount included', async () => {
        (getOtherSales as Mock).mockResolvedValue({
            ...RESPONSE,
            entries: [
                {
                    id: 43,
                    corporateTxnId: 'OS-NOJOURNAL',
                    transactionDate: '2026-09-23T10:00:00.000Z',
                    service: 'Data Cards',
                    vendorId: 9,
                    vendorName: 'Markup Fixture',
                    partnerName: null,
                    totalAmount: null,
                    platformFee: null,
                    markup: null,
                    couponDiscount: null,
                    status: 'SUCCESS',
                    posting: {
                        state: 'notPosted',
                        note: 'Service set not to post',
                        detail: 'recordJournalEntry is disabled for this service operator',
                    },
                },
            ],
            recordsTotal: 1,
        });
        renderPage();

        const row = (await screen.findByText('OS-NOJOURNAL')).closest('tr') as HTMLElement;
        expect(within(row).queryByText('₹ 1,180.00')).not.toBeInTheDocument();
        expect(within(row).queryByText('₹ 0.00')).not.toBeInTheDocument();
        expect(within(row).getAllByText('—').length).toBeGreaterThanOrEqual(4);
        expect(screen.getByText('Service set not to post')).toBeInTheDocument();
    });

    it('says whether each sale reached the books, naming the refund when that is the part missing', async () => {
        renderPage();

        const posted = (await screen.findByText('1789647165639')).closest('tr') as HTMLElement;
        const refunded = screen.getByText('1789647165640').closest('tr') as HTMLElement;
        expect(within(posted).getByText('Posted')).toBeInTheDocument();
        expect(within(refunded).getByText('Not posted')).toBeInTheDocument();
        expect(within(refunded).getByText('Refund: Not recorded yet')).toBeInTheDocument();
    });
});

describe('OtherSales export', () => {
    it('offers Excel and PDF, and no CSV', async () => {
        renderPage();

        await screen.findByText('1789647165639');
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Download PDF/ })).toBeEnabled();
        expect(screen.queryByRole('button', { name: /CSV/ })).not.toBeInTheDocument();
    });

    it('downloads the format clicked with the filters the table is showing, and saves it', async () => {
        const blob = new Blob(['x']);
        (downloadOtherSales as Mock).mockResolvedValue(blob);
        renderPage();

        await screen.findByText('1789647165639');
        const shown = (getOtherSales as Mock).mock.calls.at(-1)?.[0];
        fireEvent.click(screen.getByRole('button', { name: /Download PDF/ }));

        await waitFor(() => expect(downloadOtherSales).toHaveBeenCalled());
        expect(downloadOtherSales).toHaveBeenCalledWith({
            userId: 7,
            userType: 'system_user',
            searchText: shown.searchText,
            from: shown.from,
            to: shown.to,
            vendorId: shown.vendorId,
            partnerId: shown.partnerId,
            format: 'pdf',
        });
        await waitFor(() =>
            expect(saveAs).toHaveBeenCalledWith(
                blob,
                `Other Sales ${shown.from} to ${shown.to}.pdf`
            )
        );
    });

    it('disables the buttons when there is nothing to export', async () => {
        (getOtherSales as Mock).mockResolvedValue({ ...RESPONSE, entries: [], recordsTotal: 0 });
        renderPage();

        await screen.findByText('No other sales in this period.');
        expect(screen.getByRole('button', { name: /Export Excel/ })).toBeDisabled();
    });
});
