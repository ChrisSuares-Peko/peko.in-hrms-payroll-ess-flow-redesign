import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getEInvoiceAllApi } from '../../../api/eInvoice';
import useRecentEInvoices from '../../../hooks/eInvoiceDashboard/useRecentEInvoices';

vi.mock('../../../api/eInvoice', () => ({
    getEInvoiceAllApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

const sampleRow = {
    id: 1,
    prefix: 'INV',
    docNo: '001',
    docDate: '2026-05-01',
    buyerDetails: { legalName: 'Acme', gstin: '29ABCDE1234F1Z5' },
    supplyType: 'B2B',
    totalAmount: 1000,
    status: 'ACTIVE' as const,
};

describe('useRecentEInvoices', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches recent invoices and maps to rows', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({ eInvoices: [sampleRow] });

        const { result } = renderHook(() => useRecentEInvoices());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toHaveLength(1);
        expect(result.current.rows[0]).toMatchObject({
            id: '1',
            invoiceId: 'INV001',
            buyerName: 'Acme',
            buyerGstin: '29ABCDE1234F1Z5',
            supply: 'B2B',
            status: 'Active',
        });
    });

    it('uses docNo alone when prefix is missing', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({
            eInvoices: [{ ...sampleRow, prefix: '' }],
        });

        const { result } = renderHook(() => useRecentEInvoices());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows[0].invoiceId).toBe('001');
    });

    it('maps non-ACTIVE status to "Cancelled"', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({
            eInvoices: [{ ...sampleRow, status: 'CANCELLED' }],
        });

        const { result } = renderHook(() => useRecentEInvoices());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows[0].status).toBe('Cancelled');
    });

    it('keeps rows empty when api returns null', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useRecentEInvoices());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toEqual([]);
    });

    it('requests page 1 with descending order on id', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({ eInvoices: [] });
        renderHook(() => useRecentEInvoices());
        await waitFor(() =>
            expect(getEInvoiceAllApi).toHaveBeenCalledWith({
                userId: 'u1',
                userType: 'admin',
                params: {
                    page: 1,
                    itemsPerPage: 5,
                    sort: 'DESC',
                    sortField: 'id',
                    from: '',
                    to: '',
                },
            })
        );
    });
});
