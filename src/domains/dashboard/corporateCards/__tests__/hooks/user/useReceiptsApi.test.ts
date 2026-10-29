import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getReceipts,
    uploadReceipt,
    deleteReceipt as deleteReceiptApi,
} from '../../../api/user/receiptsApi';
import { useReceiptsApi } from '../../../hooks/user/useReceiptsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((opts: any) => ({ type: 'SHOW_TOAST', payload: opts })),
}));

vi.mock('@utils/dateFormat', () => ({
    formattedDateOnly: vi.fn((d: Date) => d.toISOString().split('T')[0]),
}));

vi.mock('../../../api/user/receiptsApi', () => ({
    getReceipts: vi.fn(),
    uploadReceipt: vi.fn(),
    deleteReceipt: vi.fn(),
}));

const mockDispatch = vi.fn();
const mockAuth = { reducer: { auth: { role: 'user', id: 1 } } };

const makeReceiptItem = (overrides = {}) => ({
    id: 10,
    fileName: 'receipt.pdf',
    createdAt: '2024-01-15T10:00:00Z',
    uploadedByRole: 'CARDHOLDER',
    fileUrl: 'https://example.com/receipt.pdf',
    mimeType: 'application/pdf',
    ...overrides,
});

describe('useReceiptsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    });

    // -----------------------------------------------------------------------
    describe('initial state', () => {
        it('starts with receipts=[], isLoading=false, uploading=false when transactionId is null', () => {
            (getReceipts as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useReceiptsApi(null));
            expect(result.current.receipts).toEqual([]);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.uploading).toBe(false);
        });

        it('does not call getReceipts when transactionId is null', async () => {
            renderHook(() => useReceiptsApi(null));
            // allow any pending microtasks to flush
            await new Promise(r => setTimeout(r, 0));
            expect(getReceipts).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe('fetch on mount', () => {
        it('calls getReceipts with role, id and transactionId', async () => {
            (getReceipts as Mock).mockResolvedValue(false);
            renderHook(() => useReceiptsApi('txn-99'));
            await waitFor(() => expect(getReceipts).toHaveBeenCalledWith('user', 1, 'txn-99'));
        });

        it('maps API items and sets receipts on success', async () => {
            const item = makeReceiptItem();
            (getReceipts as Mock).mockResolvedValue({ data: { receipts: [item] } });
            const { result } = renderHook(() => useReceiptsApi('txn-1'));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.receipts).toHaveLength(1);
            const r = result.current.receipts[0];
            expect(r.key).toBe('10');
            expect(r.id).toBe(10);
            expect(r.fileName).toBe('receipt.pdf');
            expect(r.mimeType).toBe('application/pdf');
        });

        it('maps uploadedByRole ADMIN → "Admin"', async () => {
            (getReceipts as Mock).mockResolvedValue({
                data: { receipts: [makeReceiptItem({ uploadedByRole: 'ADMIN' })] },
            });
            const { result } = renderHook(() => useReceiptsApi('txn-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.receipts[0].uploadedBy).toBe('Admin');
        });

        it('maps uploadedByRole CARDHOLDER → "Cardholder"', async () => {
            (getReceipts as Mock).mockResolvedValue({
                data: { receipts: [makeReceiptItem({ uploadedByRole: 'CARDHOLDER' })] },
            });
            const { result } = renderHook(() => useReceiptsApi('txn-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.receipts[0].uploadedBy).toBe('Cardholder');
        });

        it('sets receipts=[] when API returns false', async () => {
            (getReceipts as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useReceiptsApi('txn-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.receipts).toEqual([]);
        });
    });

    // -----------------------------------------------------------------------
    describe('upload', () => {
        const makeFile = (name = 'receipt.pdf', type = 'application/pdf') => {
            const blob = new Blob(['pdf-content'], { type });
            return new File([blob], name, { type });
        };

        it('does nothing when transactionId is null', async () => {
            const { result } = renderHook(() => useReceiptsApi(null));
            await act(async () => {
                await result.current.upload(makeFile());
            });
            expect(uploadReceipt).not.toHaveBeenCalled();
        });

        it('sets uploading=true during upload and false after', async () => {
            (getReceipts as Mock).mockResolvedValue(false);
            let resolve: ((v: any) => void) | undefined;
            (uploadReceipt as Mock).mockImplementation(
                () =>
                    new Promise(r => {
                        resolve = r;
                    })
            );

            const { result } = renderHook(() => useReceiptsApi('txn-1'));
            act(() => {
                result.current.upload(makeFile());
            });
            expect(result.current.uploading).toBe(true);

            // fileToBase64 uses FileReader (async macrotask); wait until uploadReceipt is called
            await waitFor(() => expect(resolve).toBeDefined());
            await act(async () => {
                resolve!(false);
            });
            expect(result.current.uploading).toBe(false);
        });

        it('dispatches success toast and refetches on successful upload', async () => {
            (getReceipts as Mock).mockResolvedValue({ data: { receipts: [] } });
            (uploadReceipt as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() => useReceiptsApi('txn-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.upload(makeFile());
            });

            expect(showToast).toHaveBeenCalledWith({
                variant: 'success',
                description: 'Receipt uploaded.',
            });
            expect(mockDispatch).toHaveBeenCalled();
            // getReceipts called once on mount + once after upload
            expect(getReceipts).toHaveBeenCalledTimes(2);
        });

        it('does not dispatch toast when upload fails', async () => {
            (getReceipts as Mock).mockResolvedValue(false);
            (uploadReceipt as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useReceiptsApi('txn-1'));
            await act(async () => {
                await result.current.upload(makeFile());
            });

            expect(showToast).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe('remove', () => {
        it('does nothing when transactionId is null', async () => {
            const { result } = renderHook(() => useReceiptsApi(null));
            await act(async () => {
                await result.current.remove(10);
            });
            expect(deleteReceiptApi).not.toHaveBeenCalled();
        });

        it('calls deleteReceipt with correct args', async () => {
            (getReceipts as Mock).mockResolvedValue(false);
            (deleteReceiptApi as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useReceiptsApi('txn-5'));
            await act(async () => {
                await result.current.remove(99);
            });

            expect(deleteReceiptApi).toHaveBeenCalledWith('user', 1, 'txn-5', 99);
        });

        it('dispatches success toast and refetches on successful delete', async () => {
            (getReceipts as Mock).mockResolvedValue({ data: { receipts: [] } });
            (deleteReceiptApi as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() => useReceiptsApi('txn-5'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.remove(99);
            });

            expect(showToast).toHaveBeenCalledWith({
                variant: 'success',
                description: 'Receipt deleted.',
            });
            expect(getReceipts).toHaveBeenCalledTimes(2);
        });

        it('does not dispatch toast when delete fails', async () => {
            (getReceipts as Mock).mockResolvedValue(false);
            (deleteReceiptApi as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useReceiptsApi('txn-5'));
            await act(async () => {
                await result.current.remove(99);
            });

            expect(showToast).not.toHaveBeenCalled();
        });
    });
});
