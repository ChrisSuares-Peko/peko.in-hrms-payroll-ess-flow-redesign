import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createDocument,
    getAllCustomersForSelect,
    getDocumentById,
    getNextDocumentNumberApi,
    updateDocument,
} from '../../api/documents';
import { getProfileAddressesApi } from '../../api/settings';
import useCreateDocument from '../../hooks/useCreateDocument';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../api/settings', () => ({
    getProfileAddressesApi: vi.fn(),
    getSettingsApi: vi.fn(),
}));
vi.mock('../../api/catalog', () => ({
    createCatalogItem: vi.fn(),
}));
vi.mock('../../api/documents', () => ({
    getAllCustomersForSelect: vi.fn(),
    getDocumentById: vi.fn(),
    getNextDocumentNumberApi: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
}));

const mockDispatch = vi.fn();

const baseFormValues: any = {
    buyer: { name: 'Acme', state: 'KL' },
    document: {
        type: 'DOMESTIC',
        documentPrefix: 'INV-',
        documentDate: '2026-01-01',
        documentNumber: '101',
        currency: 'INR',
        dueDate: '2026-01-15',
    },
    items: [{ name: 'Item', quantity: '1', unitPrice: '100', discount: '0', taxRate: '0' }],
    additional: {
        termsAndConditions: 't',
        notes: 'n',
        shippingCost: '0',
        amountPaid: '0',
        paymentMode: 'Cash',
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
    (getProfileAddressesApi as any).mockResolvedValue([]);
    (getAllCustomersForSelect as any).mockResolvedValue([]);
    (getNextDocumentNumberApi as any).mockResolvedValue({ nextNumber: 9 });
});

describe('useCreateDocument', () => {
    it('fetches next document number on mount when not editing', async () => {
        const { result } = renderHook(() => useCreateDocument('INVOICE'));

        await waitFor(() => expect(result.current.nextDocumentNumber).toBe('9'));

        expect(getNextDocumentNumberApi).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            documentType: 'INVOICE',
        });
    });

    it('skips fetching next number when documentId is provided (edit mode)', async () => {
        (getDocumentById as any).mockResolvedValueOnce({
            customerId: 'c',
            name: 'Acme',
            invoiceType: 'DOMESTIC',
            prefix: 'INV-',
            invoiceNumber: '101',
            invoiceDate: '2026-01-01',
            dueDate: '2026-01-15',
            currency: 'INR',
            items: [],
            termsAndConditions: '',
            notes: '',
            shippingCost: '0',
            amountPaid: '0',
            paymentMode: 'Cash',
        });

        const { result } = renderHook(() => useCreateDocument('INVOICE', 'doc-1'));

        await waitFor(() => expect(result.current.editInitialValues).not.toBeNull());

        expect(getNextDocumentNumberApi).not.toHaveBeenCalled();
        expect(result.current.editInitialValues?.document.documentPrefix).toBe('INV-');
    });

    it('shows error toast when getDocumentById returns falsy in edit mode', async () => {
        (getDocumentById as any).mockResolvedValueOnce(null);

        renderHook(() => useCreateDocument('INVOICE', 'doc-1'));

        await waitFor(() =>
            expect(showToast).toHaveBeenCalledWith({
                description: 'Failed to load Invoice.',
                variant: 'error',
            })
        );
    });

    it('populates convertInitialValues from fromSourceId', async () => {
        (getDocumentById as any).mockResolvedValueOnce({
            customerId: 'c',
            name: 'Acme',
            items: [{ name: 'X' }],
            termsAndConditions: 't',
            notes: 'n',
            shippingCost: '0',
            amountPaid: '0',
            paymentMode: 'Cash',
        });

        const { result } = renderHook(() => useCreateDocument('INVOICE', undefined, 'src-1'));

        await waitFor(() => expect(result.current.convertInitialValues).not.toBeNull());

        expect(result.current.convertInitialValues?.buyer?.name).toBe('Acme');
        expect(result.current.convertInitialValues?.items).toHaveLength(1);
    });

    it('handleDocument calls createDocument and shows success toast in create mode', async () => {
        (createDocument as any).mockResolvedValueOnce({ status: true, data: { id: 'new-1' } });

        const { result } = renderHook(() => useCreateDocument('INVOICE'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const onSuccess = vi.fn();
        await act(async () => {
            await result.current.handleDocument(baseFormValues, onSuccess);
        });

        expect(createDocument).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'u',
                userType: 'merchant',
                documentType: 'INVOICE',
                invoiceType: 'DOMESTIC',
                prefix: 'INV-',
                invoiceNumber: '101',
            })
        );
        expect(showToast).toHaveBeenCalledWith({
            description: 'Invoice created successfully',
            variant: 'success',
        });
        expect(onSuccess).toHaveBeenCalledWith('new-1');
    });

    it('handleDocument calls updateDocument and uses update toast in edit mode', async () => {
        (getDocumentById as any).mockResolvedValueOnce({
            customerId: 'c',
            name: 'Acme',
            invoiceType: 'DOMESTIC',
            prefix: 'INV-',
            invoiceNumber: '101',
            invoiceDate: '2026-01-01',
            dueDate: '2026-01-15',
            currency: 'INR',
            items: [],
            termsAndConditions: '',
            notes: '',
            shippingCost: '0',
            amountPaid: '0',
            paymentMode: 'Cash',
        });
        (updateDocument as any).mockResolvedValueOnce({ status: true, data: { id: 'doc-1' } });

        const { result } = renderHook(() => useCreateDocument('INVOICE', 'doc-1'));

        await waitFor(() => expect(result.current.editInitialValues).not.toBeNull());
        (showToast as any).mockClear();

        await act(async () => {
            await result.current.handleDocument(baseFormValues);
        });

        expect(updateDocument).toHaveBeenCalledWith(
            expect.objectContaining({ documentId: 'doc-1' })
        );
        expect(showToast).toHaveBeenCalledWith({
            description: 'Invoice updated successfully',
            variant: 'success',
        });
    });

    it('handleDocument shows error toast on status false', async () => {
        (createDocument as any).mockResolvedValueOnce({ status: false, message: 'denied' });

        const { result } = renderHook(() => useCreateDocument('INVOICE'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleDocument(baseFormValues);
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'denied', variant: 'error' });
    });

    it('shows error toast when fetchCustomers returns falsy', async () => {
        (getAllCustomersForSelect as any).mockResolvedValueOnce(null);

        renderHook(() => useCreateDocument('INVOICE'));

        await waitFor(() =>
            expect(showToast).toHaveBeenCalledWith({
                description: 'Something went wrong while fetching customers.',
                variant: 'error',
            })
        );
    });
});
