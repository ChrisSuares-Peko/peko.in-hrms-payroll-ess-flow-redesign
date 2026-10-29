import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAllDocuments } from '../../../api/documents';
import useCustomerQuotations from '../../../hooks/agreement/useCustomerQuotations';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../../../api/documents', () => ({
    getAllDocuments: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
});

describe('useCustomerQuotations', () => {
    it('returns empty quotations and skips API when no customerId', async () => {
        const { result } = renderHook(() => useCustomerQuotations(undefined));

        await waitFor(() => {
            expect(getAllDocuments).not.toHaveBeenCalled();
        });
        expect(result.current.quotations).toEqual([]);
    });

    it('fetches and maps quotation rows', async () => {
        (getAllDocuments as any).mockResolvedValueOnce({
            invoiceData: [
                {
                    id: 11,
                    prefix: 'Q-',
                    invoiceNumber: '101',
                    name: 'Acme',
                    invoiceDate: '2026-01-10',
                    createdAt: '2026-01-09',
                    totalAmount: '5000.50',
                    status: 'PENDING',
                    subtotal: '4500',
                    tax: '500.50',
                    discount: '0',
                    items: [{ name: 'Item' }],
                },
            ],
        });

        const { result } = renderHook(() => useCustomerQuotations('cust-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getAllDocuments).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            documentType: 'QUOTATION',
            customerId: 'cust-1',
            itemsPerPage: 100,
        });
        expect(result.current.quotations).toEqual([
            {
                id: '11',
                displayId: 'Q-101',
                customer: 'Acme',
                date: '10 Jan 2026',
                amount: 5000.5,
                status: 'PENDING',
                rawId: 11,
                subtotal: 4500,
                tax: 500.5,
                discount: 0,
                items: [{ name: 'Item' }],
            },
        ]);
    });

    it('passes searchText to the API when provided', async () => {
        (getAllDocuments as any).mockResolvedValueOnce({ invoiceData: [] });

        renderHook(() => useCustomerQuotations('cust-1', 'rent'));

        await waitFor(() =>
            expect(getAllDocuments).toHaveBeenCalledWith(
                expect.objectContaining({ searchText: 'rent' })
            )
        );
    });

    it('uses createdAt when invoiceDate missing and defaults numeric fields', async () => {
        (getAllDocuments as any).mockResolvedValueOnce({
            invoiceData: [
                {
                    id: 22,
                    prefix: null,
                    invoiceNumber: '5',
                    name: 'X',
                    createdAt: '2026-02-15',
                    totalAmount: 'NaN',
                    status: 'DRAFT',
                },
            ],
        });

        const { result } = renderHook(() => useCustomerQuotations('c'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const row = result.current.quotations[0];
        expect(row.displayId).toBe('5');
        expect(row.date).toBe('15 Feb 2026');
        expect(row.amount).toBe(0);
        expect(row.subtotal).toBe(0);
        expect(row.tax).toBe(0);
        expect(row.discount).toBe(0);
        expect(row.items).toEqual([]);
    });

    it('keeps quotations empty if API returns falsy', async () => {
        (getAllDocuments as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useCustomerQuotations('c'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.quotations).toEqual([]);
    });
});
