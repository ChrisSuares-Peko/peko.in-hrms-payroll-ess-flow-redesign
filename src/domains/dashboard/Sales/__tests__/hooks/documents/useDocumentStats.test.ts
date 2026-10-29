import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getInvoiceStats, getQuotationStats, getSalesOrderStats } from '../../../api/documents';
import useDocumentStats from '../../../hooks/documents/useDocumentStats';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../../../api/documents', () => ({
    getInvoiceStats: vi.fn(),
    getSalesOrderStats: vi.fn(),
    getQuotationStats: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
});

describe('useDocumentStats', () => {
    it('fetches invoice stats when documentType is INVOICE', async () => {
        const stats = { totalInvoices: 5, totalPaid: 100, totalDueAmount: 50 };
        (getInvoiceStats as any).mockResolvedValueOnce(stats);

        const { result } = renderHook(() => useDocumentStats('INVOICE'));

        await waitFor(() => expect(result.current.stats).toEqual(stats));

        expect(getInvoiceStats).toHaveBeenCalledWith({ userId: 'u', userType: 'merchant' });
        expect(getSalesOrderStats).not.toHaveBeenCalled();
        expect(getQuotationStats).not.toHaveBeenCalled();
    });

    it('fetches sales order stats when documentType is SALES_ORDER', async () => {
        const stats = { totalOrders: 3 };
        (getSalesOrderStats as any).mockResolvedValueOnce(stats);

        const { result } = renderHook(() => useDocumentStats('SALES_ORDER'));

        await waitFor(() => expect(result.current.stats).toEqual(stats));

        expect(getSalesOrderStats).toHaveBeenCalledWith({ userId: 'u', userType: 'merchant' });
    });

    it('fetches quotation stats when documentType is QUOTATION', async () => {
        const stats = { totalQuotations: 2 };
        (getQuotationStats as any).mockResolvedValueOnce(stats);

        const { result } = renderHook(() => useDocumentStats('QUOTATION'));

        await waitFor(() => expect(result.current.stats).toEqual(stats));

        expect(getQuotationStats).toHaveBeenCalledWith({ userId: 'u', userType: 'merchant' });
    });

    it('keeps stats null when API returns falsy', async () => {
        (getInvoiceStats as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useDocumentStats('INVOICE'));

        // Wait one microtask cycle for useEffect to settle.
        await waitFor(() => expect(getInvoiceStats).toHaveBeenCalled());
        expect(result.current.stats).toBeNull();
    });
});
