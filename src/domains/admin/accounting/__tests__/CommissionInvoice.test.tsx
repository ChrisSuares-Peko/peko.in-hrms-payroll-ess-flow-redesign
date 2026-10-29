import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    getCommissionInvoice,
    previewCommissionInvoice,
    saveCommissionInvoiceBilledTo,
    searchCommissionInvoices,
    sendCommissionInvoice,
} from '../api/commissionInvoice';
import CommissionInvoice from '../pages/CommissionInvoice';
import { CommissionInvoice as Invoice } from '../types/commissionInvoice';

const dispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => dispatch }));

vi.mock('../api/commissionInvoice', () => ({
    searchCommissionInvoices: vi.fn(),
    getCommissionInvoice: vi.fn(),
    previewCommissionInvoice: vi.fn(),
    saveCommissionInvoiceBilledTo: vi.fn(),
    sendCommissionInvoice: vi.fn(),
}));

vi.setConfig({ testTimeout: 20000 });

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
                                category: 'Ledgers',
                                hasAccess: true,
                                services: [{ service: 'Vendors', hasAccess: true, update }],
                            },
                        ],
                    },
                ],
            },
        },
    },
});

const STATE = stateWith(true);
const READONLY_STATE = stateWith(false);

const BILLED_TO = {
    companyName: 'Cleartrip Private Limited',
    address: 'Old address',
    state: 'Kerala',
    gstin: '32BBBBB0000B1Z5',
};

const IGST = [{ label: 'IGST (18%)', amount: 18 }];

const CGST_SGST = [
    { label: 'CGST (9%)', amount: 9 },
    { label: 'SGST (9%)', amount: 9 },
];

const INVOICE: Invoice = {
    source: 'order',
    id: 'TXN-1',
    vendor: { id: 1, name: 'Cleartrip', emails: ['ap@cleartrip.test', 'finance@cleartrip.test'] },
    documentTitle: 'Tax Invoice',
    invoiceNumber: 'INV-9',
    issuedDate: '2026-10-01',
    total: 118,
    originalBilledTo: BILLED_TO,
    billedTo: BILLED_TO,
    placeOfSupply: 'Kerala (32)',
    taxCase: 'IGST',
    taxLines: IGST,
    states: [
        { code: '07', name: 'Delhi' },
        { code: '32', name: 'Kerala' },
    ],
    edited: null,
    sends: [],
    html: '<p>Billed to Old address</p>',
};

const MATCH = {
    source: 'order' as const,
    id: 'TXN-1',
    vendorId: 1,
    vendorName: 'Cleartrip',
    invoiceNumber: 'INV-9',
    issuedDate: '2026-10-01',
    total: 118,
};

const PAGE = '/system-user/accounting/manual-operations/commission-invoice';

const renderAt = (path = PAGE) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path={PAGE} element={<CommissionInvoice />} />
            </Routes>
        </MemoryRouter>
    );

const searchFor = (value: string) => {
    const input = screen.getByLabelText('Transaction id or entry number');
    fireEvent.change(input, { target: { value } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as Mock).mockImplementation((selector: any) => selector(STATE));
    (searchCommissionInvoices as Mock).mockResolvedValue([MATCH]);
    (getCommissionInvoice as Mock).mockResolvedValue(INVOICE);
    (previewCommissionInvoice as Mock).mockResolvedValue({
        html: '<p>Billed to New address</p>',
        placeOfSupply: 'Kerala (32)',
        taxCase: 'IGST',
        taxLines: IGST,
    });
    (saveCommissionInvoiceBilledTo as Mock).mockResolvedValue({
        invoice: { ...INVOICE, billedTo: { ...BILLED_TO, address: 'New address' } },
        message: 'Invoice billed-to updated successfully',
    });
    (sendCommissionInvoice as Mock).mockResolvedValue({
        invoice: {
            ...INVOICE,
            sends: [
                { to: ['ap@cleartrip.test'], at: '2026-10-26T09:00:00.000Z', byName: 'Ibrahim' },
            ],
        },
        message: 'Invoice sent to ap@cleartrip.test, finance@cleartrip.test',
    });
});

describe('CommissionInvoice', () => {
    it('finds the invoice behind a transaction id, opens the only match and shows it with its billed-to', async () => {
        renderAt();

        searchFor(' TXN-1 ');

        await waitFor(() =>
            expect(searchCommissionInvoices).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'TXN-1' })
            )
        );
        await waitFor(() =>
            expect(getCommissionInvoice).toHaveBeenCalledWith(
                expect.objectContaining({ vendorId: '1', source: 'order', id: 'TXN-1' })
            )
        );
        const frame = await screen.findByTitle('Invoice preview');
        expect(frame).toHaveAttribute('srcdoc', expect.stringContaining('Old address'));
        expect(screen.getByText('Tax Invoice INV-9')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Vendor’s registered name')).toHaveValue(
            'Cleartrip Private Limited'
        );
        expect(screen.getByPlaceholderText('Street, building, area')).toHaveValue('Old address');
        expect(screen.getByText('Kerala (32)')).toBeInTheDocument();
        expect(
            screen.getByText('Place of supply: Kerala (32) · Tax: IGST (18%)')
        ).toBeInTheDocument();
        expect(screen.getByText('ap@cleartrip.test')).toBeInTheDocument();
        expect(screen.getByText('finance@cleartrip.test')).toBeInTheDocument();
    });

    it('lists every match when a reference is shared by several vendors, and opens the one chosen', async () => {
        (searchCommissionInvoices as Mock).mockResolvedValue([
            { ...MATCH, source: 'manual', id: '12', invoiceNumber: 'CM-14' },
            {
                ...MATCH,
                source: 'manual',
                id: '13',
                vendorId: 2,
                vendorName: 'Amer Hub',
                invoiceNumber: 'CM-14',
            },
        ]);
        renderAt();

        searchFor('CM-14');

        expect(await screen.findByText('Amer Hub')).toBeInTheDocument();
        expect(screen.getAllByText('Recorded by hand')).toHaveLength(2);
        expect(getCommissionInvoice).not.toHaveBeenCalled();

        fireEvent.click(screen.getAllByRole('button', { name: 'Open CM-14' })[1]);

        await waitFor(() =>
            expect(getCommissionInvoice).toHaveBeenCalledWith(
                expect.objectContaining({ vendorId: '2', source: 'manual', id: '13' })
            )
        );
    });

    it('says when nothing matches', async () => {
        (searchCommissionInvoices as Mock).mockResolvedValue([]);
        renderAt();

        searchFor('TXN-404');

        expect(await screen.findByText('No commission invoice for TXN-404')).toBeInTheDocument();
    });

    it('opens straight from a link that names the invoice', async () => {
        renderAt(`${PAGE}?vendor=1&source=order&id=TXN-1`);

        expect(await screen.findByTitle('Invoice preview')).toBeInTheDocument();
        expect(getCommissionInvoice).toHaveBeenCalledWith(
            expect.objectContaining({ vendorId: '1', source: 'order', id: 'TXN-1' })
        );
        expect(searchCommissionInvoices).not.toHaveBeenCalled();
    });

    it('previews the billed-to as it is typed, then saves it and says so', async () => {
        renderAt(`${PAGE}?vendor=1&source=order&id=TXN-1`);
        await screen.findByTitle('Invoice preview');

        const save = screen.getByRole('button', { name: 'Save changes' });
        expect(save).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('Street, building, area'), {
            target: { value: 'New address' },
        });

        await waitFor(() =>
            expect(previewCommissionInvoice).toHaveBeenCalledWith(
                expect.objectContaining({
                    vendorId: '1',
                    source: 'order',
                    id: 'TXN-1',
                    billedTo: { ...BILLED_TO, address: 'New address' },
                })
            )
        );
        await waitFor(() =>
            expect(screen.getByTitle('Invoice preview')).toHaveAttribute(
                'srcdoc',
                expect.stringContaining('New address')
            )
        );
        expect(save).toBeEnabled();

        fireEvent.click(save);

        await waitFor(() =>
            expect(saveCommissionInvoiceBilledTo).toHaveBeenCalledWith(
                expect.objectContaining({ billedTo: { ...BILLED_TO, address: 'New address' } })
            )
        );
        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        description: 'Invoice billed-to updated successfully',
                        variant: 'success',
                    }),
                })
            )
        );
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    });

    it('moves the place of supply and the tax split with the state picked', async () => {
        (previewCommissionInvoice as Mock).mockResolvedValue({
            html: '<p>Billed to Delhi</p>',
            placeOfSupply: 'Delhi (07)',
            taxCase: 'CGST+SGST',
            taxLines: CGST_SGST,
        });
        renderAt(`${PAGE}?vendor=1&source=order&id=TXN-1`);
        await screen.findByTitle('Invoice preview');

        fireEvent.mouseDown(screen.getByText('Kerala (32)'));
        fireEvent.click(await screen.findByText('Delhi (07)'));

        await waitFor(() =>
            expect(previewCommissionInvoice).toHaveBeenCalledWith(
                expect.objectContaining({ billedTo: { ...BILLED_TO, state: 'Delhi' } })
            )
        );
        expect(
            await screen.findByText('Place of supply: Delhi (07) · Tax: CGST (9%) + SGST (9%)')
        ).toBeInTheDocument();
        expect(screen.getByTitle('Invoice preview')).toHaveAttribute(
            'srcdoc',
            expect.stringContaining('Billed to Delhi')
        );
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
    });

    it('sends the invoice to the vendor’s emails on file and lists the send', async () => {
        renderAt(`${PAGE}?vendor=1&source=order&id=TXN-1`);
        await screen.findByTitle('Invoice preview');

        fireEvent.click(screen.getByRole('button', { name: 'Send invoice' }));

        await waitFor(() =>
            expect(sendCommissionInvoice).toHaveBeenCalledWith(
                expect.objectContaining({
                    vendorId: '1',
                    source: 'order',
                    id: 'TXN-1',
                    to: ['ap@cleartrip.test', 'finance@cleartrip.test'],
                })
            )
        );
        expect(await screen.findByText('Sent before')).toBeInTheDocument();
        expect(screen.getByText(/ap@cleartrip.test on .* by Ibrahim/)).toBeInTheDocument();
    });

    it('keeps saving and sending off for a role that cannot update vendors', async () => {
        (useAppSelector as Mock).mockImplementation((selector: any) => selector(READONLY_STATE));
        renderAt(`${PAGE}?vendor=1&source=order&id=TXN-1`);
        await screen.findByTitle('Invoice preview');

        fireEvent.change(screen.getByPlaceholderText('Street, building, area'), {
            target: { value: 'New address' },
        });

        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Send invoice' })).toBeDisabled();
    });
});
