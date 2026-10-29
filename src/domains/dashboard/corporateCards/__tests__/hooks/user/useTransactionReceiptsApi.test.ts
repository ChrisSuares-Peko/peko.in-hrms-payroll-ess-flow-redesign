import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    getTransactionReceipts,
    uploadTransactionReceipt,
    deleteTransactionReceipt,
} from '../../../api/user/transactionsApi';
import { useTransactionReceiptsApi } from '../../../hooks/user/useTransactionReceiptsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@utils/dateFormat', () => ({
    formattedDateOnly: vi.fn((d: Date) => d.toISOString().split('T')[0]),
}));

vi.mock('../../../api/user/transactionsApi', () => ({
    getTransactionReceipts: vi.fn(),
    uploadTransactionReceipt: vi.fn(),
    deleteTransactionReceipt: vi.fn(),
}));

// Use an admin roleName so apiRole=ADMIN can also be tested.
const makeAuthState = (roleName = 'Cardholder') => ({
    reducer: { auth: { role: 'user', id: 2, roleName } },
});

const makeReceiptItem = (overrides = {}) => ({
    id: 5,
    fileName: 'doc.pdf',
    createdAt: '2024-03-10T08:00:00Z',
    uploadedByRole: 'CARDHOLDER',
    fileUrl: 'https://s3.example.com/doc.pdf',
    mimeType: 'application/pdf',
    ...overrides,
});

describe('useTransactionReceiptsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn(makeAuthState('Cardholder'))
        );
    });

    // -----------------------------------------------------------------------
    describe('initial state when transactionId is null', () => {
        it('does not call getTransactionReceipts', async () => {
            renderHook(() => useTransactionReceiptsApi(null));
            await new Promise(r => setTimeout(r, 0));
            expect(getTransactionReceipts).not.toHaveBeenCalled();
        });

        it('returns receipts=[], isLoading=false, isUploading=false', () => {
            const { result } = renderHook(() => useTransactionReceiptsApi(null));
            expect(result.current.receipts).toEqual([]);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isUploading).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    describe('fetch on mount', () => {
        it('calls getTransactionReceipts with role, id, transactionId', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue(false);
            renderHook(() => useTransactionReceiptsApi('txn-10'));
            await waitFor(() =>
                expect(getTransactionReceipts).toHaveBeenCalledWith('user', 2, 'txn-10')
            );
        });

        it('maps API items to ReceiptFile objects', async () => {
            const item = makeReceiptItem({
                id: 5,
                fileName: 'doc.pdf',
                mimeType: 'application/pdf',
            });
            (getTransactionReceipts as Mock).mockResolvedValue({ data: { receipts: [item] } });
            const { result } = renderHook(() => useTransactionReceiptsApi('txn-1'));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.receipts).toHaveLength(1);
            expect(result.current.receipts[0].key).toBe('5');
            expect(result.current.receipts[0].fileName).toBe('doc.pdf');
            expect(result.current.receipts[0].mimeType).toBe('application/pdf');
        });

        it('uppercases the first letter of uploadedByRole for uploadedBy', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue({
                data: { receipts: [makeReceiptItem({ uploadedByRole: 'ADMIN' })] },
            });
            const { result } = renderHook(() => useTransactionReceiptsApi('txn-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.receipts[0].uploadedBy).toBe('Admin');
        });

        it('returns receipts=[] when API returns false', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useTransactionReceiptsApi('txn-1'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.receipts).toEqual([]);
        });
    });

    // -----------------------------------------------------------------------
    describe('deleteReceipt', () => {
        it('returns false immediately when transactionId is null', async () => {
            const { result } = renderHook(() => useTransactionReceiptsApi(null));
            let ret: boolean;
            await act(async () => {
                ret = await result.current.deleteReceipt(5);
            });
            expect(ret!).toBe(false);
            expect(deleteTransactionReceipt).not.toHaveBeenCalled();
        });

        it('calls deleteTransactionReceipt with correct args', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue(false);
            (deleteTransactionReceipt as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useTransactionReceiptsApi('txn-3'));
            await act(async () => {
                await result.current.deleteReceipt(99);
            });

            expect(deleteTransactionReceipt).toHaveBeenCalledWith('user', 2, 'txn-3', 99);
        });

        it('refetches after a successful delete', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue({ data: { receipts: [] } });
            (deleteTransactionReceipt as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() => useTransactionReceiptsApi('txn-3'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            await act(async () => {
                await result.current.deleteReceipt(5);
            });

            expect(getTransactionReceipts).toHaveBeenCalledTimes(2);
        });

        it('returns true on success and false on failure', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue(false);
            (deleteTransactionReceipt as Mock)
                .mockResolvedValueOnce({ data: {} })
                .mockResolvedValueOnce(false);

            const { result } = renderHook(() => useTransactionReceiptsApi('txn-3'));
            let r1: boolean;
            let r2: boolean;
            await act(async () => {
                r1 = await result.current.deleteReceipt(1);
            });
            await act(async () => {
                r2 = await result.current.deleteReceipt(2);
            });
            expect(r1!).toBe(true);
            expect(r2!).toBe(false);
        });
    });

    // -----------------------------------------------------------------------
    describe('upload', () => {
        const makeFile = () => new File(['data'], 'receipt.png', { type: 'image/png' });

        it('returns false when transactionId is null', async () => {
            const { result } = renderHook(() => useTransactionReceiptsApi(null));
            let ret: boolean;
            await act(async () => {
                ret = await result.current.upload(makeFile());
            });
            expect(ret!).toBe(false);
            expect(uploadTransactionReceipt).not.toHaveBeenCalled();
        });

        it('sets isUploading=true during upload and false after', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue(false);
            let resolve: ((v: any) => void) | undefined;
            (uploadTransactionReceipt as Mock).mockImplementation(
                () =>
                    new Promise(r => {
                        resolve = r;
                    })
            );

            const { result } = renderHook(() => useTransactionReceiptsApi('txn-2'));
            act(() => {
                result.current.upload(makeFile());
            });
            expect(result.current.isUploading).toBe(true);

            // fileToBase64 uses FileReader (async macrotask); wait until uploadTransactionReceipt is called
            await waitFor(() => expect(resolve).toBeDefined());
            await act(async () => {
                resolve!(false);
            });
            expect(result.current.isUploading).toBe(false);
        });

        it('uses CARDHOLDER role by default for non-admin users', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue(false);
            (uploadTransactionReceipt as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useTransactionReceiptsApi('txn-2'));
            await act(async () => {
                await result.current.upload(makeFile());
            });

            expect(uploadTransactionReceipt).toHaveBeenCalledWith(
                'user',
                2,
                'txn-2',
                expect.objectContaining({ role: 'CARDHOLDER' })
            );
        });

        it('uses ADMIN role when uploadAsRole is explicitly passed', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue(false);
            (uploadTransactionReceipt as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useTransactionReceiptsApi('txn-2'));
            await act(async () => {
                await result.current.upload(makeFile(), 'ADMIN');
            });

            expect(uploadTransactionReceipt).toHaveBeenCalledWith(
                'user',
                2,
                'txn-2',
                expect.objectContaining({ role: 'ADMIN' })
            );
        });

        it('refetches and returns true on success', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue({ data: { receipts: [] } });
            (uploadTransactionReceipt as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() => useTransactionReceiptsApi('txn-2'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            let ret: boolean;
            await act(async () => {
                ret = await result.current.upload(makeFile());
            });

            expect(ret!).toBe(true);
            expect(getTransactionReceipts).toHaveBeenCalledTimes(2);
        });

        it('returns false and does not refetch when upload fails', async () => {
            (getTransactionReceipts as Mock).mockResolvedValue({ data: { receipts: [] } });
            (uploadTransactionReceipt as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useTransactionReceiptsApi('txn-2'));
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            let ret: boolean;
            await act(async () => {
                ret = await result.current.upload(makeFile());
            });

            expect(ret!).toBe(false);
            expect(getTransactionReceipts).toHaveBeenCalledTimes(1);
        });
    });
});
