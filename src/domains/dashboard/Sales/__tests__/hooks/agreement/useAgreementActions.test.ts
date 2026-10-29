import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createAgreementApi,
    getAgreementDocumentApi,
    sendSignRequestApi,
    updateAgreementApi,
    uploadDocumentApi,
} from '../../../api/agreements';
import useAgreementActions from '../../../hooks/agreement/useAgreementActions';

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: vi.fn(),
}));
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/agreements', () => ({
    createAgreementApi: vi.fn(),
    updateAgreementApi: vi.fn(),
    uploadDocumentApi: vi.fn(),
    sendSignRequestApi: vi.fn(),
    getAgreementDocumentApi: vi.fn(),
}));
vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'user-1', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useAgreementActions - createAgreement', () => {
    it('returns data, dispatches success toast and calls onSuccess on success', async () => {
        const onSuccess = vi.fn();
        (createAgreementApi as any).mockResolvedValueOnce({
            status: true,
            message: 'Created',
            data: { id: 42 },
        });

        const { result } = renderHook(() => useAgreementActions(onSuccess));

        let returned: any;
        await act(async () => {
            returned = await result.current.createAgreement({ title: 'A' } as any);
        });

        expect(createAgreementApi).toHaveBeenCalledWith({
            userId: 'user-1',
            userType: 'merchant',
            title: 'A',
        });
        expect(showToast).toHaveBeenCalledWith({ description: 'Created', variant: 'success' });
        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(returned).toEqual({ id: 42 });
        expect(result.current.isLoading).toBe(false);
    });

    it('shows error toast and returns null when status is false', async () => {
        const onSuccess = vi.fn();
        (createAgreementApi as any).mockResolvedValueOnce({
            status: false,
            message: 'Bad',
        });

        const { result } = renderHook(() => useAgreementActions(onSuccess));

        let returned: any = 'unset';
        await act(async () => {
            returned = await result.current.createAgreement({} as any);
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'Bad', variant: 'error' });
        expect(onSuccess).not.toHaveBeenCalled();
        expect(returned).toBeNull();
    });

    it('returns null and shows no toast when API returns falsy', async () => {
        (createAgreementApi as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useAgreementActions());

        let returned: any = 'unset';
        await act(async () => {
            returned = await result.current.createAgreement({} as any);
        });

        expect(showToast).not.toHaveBeenCalled();
        expect(returned).toBeNull();
    });
});

describe('useAgreementActions - updateAgreement', () => {
    it('returns true and triggers onSuccess on success', async () => {
        const onSuccess = vi.fn();
        (updateAgreementApi as any).mockResolvedValueOnce({
            status: true,
            message: 'Updated',
        });

        const { result } = renderHook(() => useAgreementActions(onSuccess));

        let returned: any;
        await act(async () => {
            returned = await result.current.updateAgreement(7, { title: 'B' } as any);
        });

        expect(updateAgreementApi).toHaveBeenCalledWith(7, {
            userId: 'user-1',
            userType: 'merchant',
            title: 'B',
        });
        expect(onSuccess).toHaveBeenCalledWith();
        expect(returned).toBe(true);
    });

    it('returns false and shows error toast on failure', async () => {
        (updateAgreementApi as any).mockResolvedValueOnce({ status: false, message: 'Nope' });

        const { result } = renderHook(() => useAgreementActions());

        let returned: any;
        await act(async () => {
            returned = await result.current.updateAgreement('id', {} as any);
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'Nope', variant: 'error' });
        expect(returned).toBe(false);
    });
});

describe('useAgreementActions - uploadDocument', () => {
    it('returns true and shows success toast on success', async () => {
        (uploadDocumentApi as any).mockResolvedValueOnce({
            status: true,
            message: 'Uploaded',
        });

        const { result } = renderHook(() => useAgreementActions());

        let returned: any;
        await act(async () => {
            returned = await result.current.uploadDocument(1, { documentBase64: 'abc' });
        });

        expect(uploadDocumentApi).toHaveBeenCalledWith(1, {
            userId: 'user-1',
            userType: 'merchant',
            documentBase64: 'abc',
        });
        expect(showToast).toHaveBeenCalledWith({ description: 'Uploaded', variant: 'success' });
        expect(returned).toBe(true);
    });

    it('returns false on failed status', async () => {
        (uploadDocumentApi as any).mockResolvedValueOnce({ status: false, message: 'Err' });

        const { result } = renderHook(() => useAgreementActions());

        let returned: any;
        await act(async () => {
            returned = await result.current.uploadDocument(1, { documentBase64: 'x' });
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'Err', variant: 'error' });
        expect(returned).toBe(false);
    });
});

describe('useAgreementActions - downloadAgreement', () => {
    it('does nothing when documentUrl is empty', async () => {
        const { result } = renderHook(() => useAgreementActions());

        await act(async () => {
            await result.current.downloadAgreement('', 'file');
        });

        expect(getAgreementDocumentApi).not.toHaveBeenCalled();
        expect(result.current.isDownloading).toBe(false);
    });

    it('shows error toast when fetch throws', async () => {
        (getAgreementDocumentApi as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useAgreementActions());

        await act(async () => {
            await result.current.downloadAgreement('agreement-123', 'file');
        });

        expect(showToast).toHaveBeenCalledWith({
            description: 'Failed to download document.',
            variant: 'error',
        });
        expect(result.current.isDownloading).toBe(false);
    });

    it('downloads via saveAs on success', async () => {
        const blob = new Blob(['x']);
        (getAgreementDocumentApi as any).mockResolvedValueOnce(blob);
        const { saveAs } = await import('file-saver');

        const { result } = renderHook(() => useAgreementActions());

        await act(async () => {
            await result.current.downloadAgreement('agreement-123', 'file');
        });

        expect(saveAs).toHaveBeenCalledWith(blob, 'file.pdf');
        expect(result.current.isDownloading).toBe(false);
    });
});

describe('useAgreementActions - sendSignRequest', () => {
    it('returns true and uses provided message when API succeeds', async () => {
        (sendSignRequestApi as any).mockResolvedValueOnce({
            status: true,
            message: 'Sent!',
        });

        const { result } = renderHook(() => useAgreementActions());

        let returned: any;
        await act(async () => {
            returned = await result.current.sendSignRequest({ agreementId: 1 } as any);
        });

        expect(sendSignRequestApi).toHaveBeenCalledWith({
            userId: 'user-1',
            userType: 'merchant',
            agreementId: 1,
        });
        expect(showToast).toHaveBeenCalledWith({ description: 'Sent!', variant: 'success' });
        expect(returned).toBe(true);
    });

    it('falls back to default success message when message is missing', async () => {
        (sendSignRequestApi as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useAgreementActions());

        await act(async () => {
            await result.current.sendSignRequest({} as any);
        });

        expect(showToast).toHaveBeenCalledWith({
            description: 'Agreement sent for signature successfully',
            variant: 'success',
        });
    });

    it('returns false and shows error toast on failure', async () => {
        (sendSignRequestApi as any).mockResolvedValueOnce({ status: false, message: 'fail' });

        const { result } = renderHook(() => useAgreementActions());

        let returned: any;
        await act(async () => {
            returned = await result.current.sendSignRequest({} as any);
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'fail', variant: 'error' });
        expect(returned).toBe(false);
    });

    it('toggles isSendingSignRequest during the call', async () => {
        (sendSignRequestApi as any).mockImplementationOnce(
            () =>
                new Promise(resolve =>
                    setTimeout(() => resolve({ status: true, message: 'ok' }), 30)
                )
        );

        const { result } = renderHook(() => useAgreementActions());

        let promise: Promise<any>;
        act(() => {
            promise = result.current.sendSignRequest({} as any);
        });

        await waitFor(() => expect(result.current.isSendingSignRequest).toBe(true));

        await act(async () => {
            await promise;
        });

        expect(result.current.isSendingSignRequest).toBe(false);
    });
});
