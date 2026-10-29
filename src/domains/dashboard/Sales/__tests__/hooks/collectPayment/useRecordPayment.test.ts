import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllDocuments } from '../../../api/documents';
import useRecordPayment from '../../../hooks/collectPayment/useRecordPayment';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/documents', () => ({
    getAllDocuments: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useRecordPayment', () => {
    it('fetches outstanding invoices on mount and maps rows', async () => {
        (getAllDocuments as any).mockResolvedValueOnce({
            invoiceData: [
                {
                    id: '1',
                    prefix: 'INV-',
                    invoiceNumber: '101',
                    name: 'Acme',
                    phoneNumber: '999',
                    createdAt: '2026-01-01',
                    totalAmount: '500',
                    invoiceType: 'DOMESTIC',
                    documentType: 'INVOICE',
                    status: 'Pending',
                    invoiceDate: '2026-01-01',
                    dueDate: '2026-01-15',
                    amountDue: '500',
                },
            ],
            recordsTotal: 1,
        });

        const { result } = renderHook(() => useRecordPayment(true));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getAllDocuments).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'u',
                userType: 'merchant',
                status: 'Pending,Overdue',
                documentType: 'INVOICE',
            })
        );
        expect(result.current.invoices[0]).toMatchObject({
            id: '1',
            prefix: 'INV-',
            documentNumber: '101',
            transactionType: 'DOMESTIC',
            amountDue: '500',
        });
        expect(result.current.totalRecords).toBe(1);
    });

    it('shows error toast when API returns falsy', async () => {
        (getAllDocuments as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useRecordPayment(true));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).toHaveBeenCalledWith({
            description: 'Something went wrong while fetching invoices.',
            variant: 'error',
        });
        expect(result.current.invoices).toEqual([]);
    });

    it('refetches when setRefresh(true) is called', async () => {
        (getAllDocuments as any).mockResolvedValue({ invoiceData: [], recordsTotal: 0 });

        const { result } = renderHook(() => useRecordPayment(true));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const initialCalls = (getAllDocuments as any).mock.calls.length;

        await act(async () => {
            result.current.setPage(2);
        });

        await waitFor(() => {
            expect((getAllDocuments as any).mock.calls.length).toBeGreaterThan(initialCalls);
        });
    });
});
