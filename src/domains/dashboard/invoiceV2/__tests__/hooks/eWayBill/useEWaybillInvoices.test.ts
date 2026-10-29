import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getEInvoiceAllApi } from '../../../api/eInvoice';
import useEWaybillInvoices from '../../../hooks/eWayBill/useEWaybillInvoices';

vi.mock('../../../api/eInvoice', () => ({
    getEInvoiceAllApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

const makeRow = (id: number) => ({
    id,
    prefix: 'INV',
    docNo: String(id),
    docDate: '2026-05-01',
    irn: `irn-${id}`,
    totalAmount: 1000,
    buyerDetails: { legalName: 'Buyer', gstin: 'g' },
});

describe('useEWaybillInvoices', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches first page on mount and maps invoices', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({
            eInvoices: [makeRow(1)],
            recordsTotal: 5,
        });

        const { result } = renderHook(() => useEWaybillInvoices(''));

        await waitFor(() => expect(result.current.invoices).toHaveLength(1));
        expect(result.current.invoices[0]).toMatchObject({
            id: '1',
            invoiceNo: 'INV1',
            buyerName: 'Buyer',
            irn: 'irn-1',
        });
        expect(result.current.recordsTotal).toBe(5);
    });

    it('exposes hasMore=true when fewer fetched than total', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({
            eInvoices: [makeRow(1)],
            recordsTotal: 10,
        });
        const { result } = renderHook(() => useEWaybillInvoices(''));
        await waitFor(() => expect(result.current.invoices).toHaveLength(1));
        expect(result.current.hasMore).toBe(true);
    });

    it('appends invoices when loadMore is called', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValueOnce({
            eInvoices: [makeRow(1)],
            recordsTotal: 5,
        });
        const { result } = renderHook(() => useEWaybillInvoices(''));
        await waitFor(() => expect(result.current.invoices).toHaveLength(1));

        (getEInvoiceAllApi as Mock).mockResolvedValueOnce({
            eInvoices: [makeRow(2)],
            recordsTotal: 5,
        });

        await act(async () => {
            result.current.loadMore();
        });

        await waitFor(() => expect(result.current.invoices).toHaveLength(2));
        expect(result.current.invoices[1].invoiceNo).toBe('INV2');
    });

    it('passes trimmed searchText param when provided', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({ eInvoices: [], recordsTotal: 0 });
        renderHook(() => useEWaybillInvoices('  abc  '));
        await waitFor(() =>
            expect(getEInvoiceAllApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ searchText: 'abc' }),
                })
            )
        );
    });

    it('omits searchText param when blank', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({ eInvoices: [], recordsTotal: 0 });
        renderHook(() => useEWaybillInvoices('   '));
        await waitFor(() => expect(getEInvoiceAllApi).toHaveBeenCalled());
        const callArg = (getEInvoiceAllApi as Mock).mock.calls[0][0];
        expect(callArg.params.searchText).toBeUndefined();
    });
});
