import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { exportPaymentTransactions, getPaymentLinkTransactions } from '../../api/payments';
import usePaymentTracking from '../../hooks/usePaymentTracking';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../../api/payments', () => ({
    getPaymentLinkTransactions: vi.fn(),
    exportPaymentTransactions: vi.fn(),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const baseFilters: any = { page: 1, itemsPerPage: 10, searchText: '' };

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
});

describe('usePaymentTracking', () => {
    it('fetches and maps payment rows on mount', async () => {
        (getPaymentLinkTransactions as any).mockResolvedValueOnce({
            transactions: [
                {
                    key: 'k1',
                    transactionId: 'T-1',
                    customerName: 'Acme',
                    prefix: 'INV-',
                    invoiceNumber: '101',
                    reference: 'REF-1',
                    amount: 500,
                    paymentMethod: 'UPI',
                    dateTime: '2026-01-01',
                    status: 'SUCCESS',
                },
            ],
            pagination: { total: 1 },
        });

        const { result } = renderHook(() => usePaymentTracking(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.rows).toEqual([
            {
                id: 'k1',
                paymentId: 'T-1',
                customer: 'Acme',
                invoiceRef: 'INV-101',
                amount: 500,
                method: 'UPI',
                date: '2026-01-01',
                status: 'SUCCESS',
            },
        ]);
        expect(result.current.total).toBe(1);
    });

    it('falls back to reference when prefix and invoiceNumber are missing', async () => {
        (getPaymentLinkTransactions as any).mockResolvedValueOnce({
            transactions: [
                {
                    key: 'k1',
                    transactionId: 'T-1',
                    customerName: null,
                    prefix: null,
                    invoiceNumber: null,
                    reference: 'REF-1',
                    amount: 100,
                    paymentMethod: null,
                    dateTime: '',
                    status: 'unknown',
                },
            ],
            pagination: { total: 1 },
        });

        const { result } = renderHook(() => usePaymentTracking(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.rows[0]).toMatchObject({
            customer: '-',
            invoiceRef: 'REF-1',
            method: '-',
            status: 'PENDING',
        });
    });

    it('does not throw when API returns falsy', async () => {
        (getPaymentLinkTransactions as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => usePaymentTracking(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.rows).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('handleExport saves a blob via saveAs when API returns buffer data', async () => {
        (getPaymentLinkTransactions as any).mockResolvedValueOnce({
            transactions: [],
            pagination: { total: 0 },
        });
        (exportPaymentTransactions as any).mockResolvedValueOnce({
            pdfBuffer: { data: [1, 2, 3] },
        });
        const { saveAs } = await import('file-saver');

        const { result } = renderHook(() => usePaymentTracking(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleExport('pdf');
        });

        expect(saveAs).toHaveBeenCalled();
        const filename = (saveAs as any).mock.calls[0][1];
        expect(filename).toBe('payment-records.pdf');
        expect(result.current.exportingType).toBeNull();
    });

    it('handleExport renames excel to xlsx', async () => {
        (getPaymentLinkTransactions as any).mockResolvedValueOnce({
            transactions: [],
            pagination: { total: 0 },
        });
        (exportPaymentTransactions as any).mockResolvedValueOnce({
            buffer: { data: [9] },
        });
        const { saveAs } = await import('file-saver');

        const { result } = renderHook(() => usePaymentTracking(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleExport('excel');
        });

        const filename = (saveAs as any).mock.calls[0][1];
        expect(filename).toBe('payment-records.xlsx');
    });

    it('handleExport silently no-ops when buffer data is empty', async () => {
        (getPaymentLinkTransactions as any).mockResolvedValueOnce({
            transactions: [],
            pagination: { total: 0 },
        });
        (exportPaymentTransactions as any).mockResolvedValueOnce({
            pdfBuffer: { data: [] },
        });
        const { saveAs } = await import('file-saver');

        const { result } = renderHook(() => usePaymentTracking(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        (saveAs as any).mockClear();

        await act(async () => {
            await result.current.handleExport('csv');
        });

        expect(saveAs).not.toHaveBeenCalled();
    });
});
