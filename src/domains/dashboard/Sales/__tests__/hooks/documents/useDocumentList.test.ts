import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteDocumentApi, getAllDocuments } from '../../../api/documents';
import useDocumentList from '../../../hooks/documents/useDocumentList';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/documents', () => ({
    getAllDocuments: vi.fn(),
    deleteDocumentApi: vi.fn(),
}));

const mockDispatch = vi.fn();
const baseFilters: any = { page: 1, itemsPerPage: 10, searchText: '' };

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useDocumentList', () => {
    it('fetches and maps documents on mount', async () => {
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
                    status: 'DRAFT',
                    invoiceDate: '2026-01-01',
                    dueDate: '2026-01-15',
                    amountDue: '500',
                },
            ],
            recordsTotal: 1,
        });

        const { result } = renderHook(() => useDocumentList(baseFilters, 'INVOICE'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getAllDocuments).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'u',
                userType: 'merchant',
                documentType: 'INVOICE',
                page: 1,
            })
        );
        expect(result.current.list).toEqual({
            DocumentData: [
                {
                    id: '1',
                    prefix: 'INV-',
                    documentNumber: '101',
                    name: 'Acme',
                    phoneNumber: '999',
                    createdAt: '2026-01-01',
                    totalAmount: '500',
                    transactionType: 'DOMESTIC',
                    documentType: 'INVOICE',
                    status: 'DRAFT',
                    documentDate: '2026-01-01',
                    dueDate: '2026-01-15',
                    amountDue: '500',
                },
            ],
            recordsTotal: 1,
        });
    });

    it('shows generic error toast when fetch returns falsy', async () => {
        (getAllDocuments as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useDocumentList(baseFilters, 'INVOICE'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).toHaveBeenCalledWith({
            description: 'Something went wrong while fetching documents.',
            variant: 'error',
        });
        expect(result.current.list).toBeUndefined();
    });

    it('deletes document, shows success toast, and refetches', async () => {
        (getAllDocuments as any).mockResolvedValue({ invoiceData: [], recordsTotal: 0 });
        (deleteDocumentApi as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useDocumentList(baseFilters, 'INVOICE'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const initialCalls = (getAllDocuments as any).mock.calls.length;

        await act(async () => {
            await result.current.deleteDocument('doc-1');
        });

        expect(deleteDocumentApi).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            documentId: 'doc-1',
        });
        expect(showToast).toHaveBeenCalledWith({
            description: 'Document deleted successfully',
            variant: 'success',
        });
        await waitFor(() => {
            expect((getAllDocuments as any).mock.calls.length).toBeGreaterThan(initialCalls);
        });
    });

    it('shows error toast when delete fails', async () => {
        (getAllDocuments as any).mockResolvedValue({ invoiceData: [], recordsTotal: 0 });
        (deleteDocumentApi as any).mockResolvedValueOnce({ status: false, message: 'no' });

        const { result } = renderHook(() => useDocumentList(baseFilters, 'INVOICE'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.deleteDocument('doc-1');
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'no', variant: 'error' });
    });
});
