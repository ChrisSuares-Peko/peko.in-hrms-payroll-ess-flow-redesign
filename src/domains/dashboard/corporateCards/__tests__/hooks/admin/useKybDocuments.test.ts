import { act, renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import {
    deleteKybDocuments,
    getUploadedKybDocuments,
    KybChecklistDocument,
    uploadKybDocuments,
} from '../../../api/admin/kybStatusApi';
import { useKybDocuments } from '../../../hooks/admin/useKybDocuments';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'SHOW_TOAST', payload })),
}));

vi.mock('../../../api/admin/kybStatusApi', () => ({
    getUploadedKybDocuments: vi.fn(),
    uploadKybDocuments: vi.fn(),
    deleteKybDocuments: vi.fn(),
}));

const GST: KybChecklistDocument = {
    key: 'gst',
    documentName: 'GST_Certificate',
    label: 'GST Certificate',
    uploadLabel: 'Upload GST Certificate',
    hint: 'hint',
    required: true,
};

const file = (name: string) => ({ base64: `base64-${name}`, format: 'pdf', name });

const mockDispatch = vi.fn();

const renderDocuments = (enabled = true) => renderHook(() => useKybDocuments(enabled));

describe('useKybDocuments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: { role: 'admin', id: 5 } } })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        (getUploadedKybDocuments as Mock).mockResolvedValue({ data: { corporateDocuments: {} } });
        (uploadKybDocuments as Mock).mockResolvedValue({ status: true });
        (deleteKybDocuments as Mock).mockResolvedValue({ status: true });
    });

    it('restores what the corporate already uploaded, so a refresh does not lose it', async () => {
        (getUploadedKybDocuments as Mock).mockResolvedValue({
            data: {
                corporateDocuments: {
                    GST_Certificate: {
                        fileName: 'gst.pdf',
                        documentType: 'pdf',
                        expiryDate: null,
                        status: 'UPLOADED',
                        uploadedAt: '2026-08-14T06:00:00.000Z',
                    },
                },
            },
        });

        const { result } = renderDocuments();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getUploadedKybDocuments).toHaveBeenCalledWith('admin', 5);
        expect(result.current.uploaded.GST_Certificate.fileName).toBe('gst.pdf');
        expect(result.current.isSaved(GST)).toBe(true);
    });

    it('does not fetch when it is not the corporate admin path', async () => {
        const { result } = renderDocuments(false);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getUploadedKybDocuments).not.toHaveBeenCalled();
    });

    it('flags a failed restore instead of presenting the step as empty', async () => {
        (getUploadedKybDocuments as Mock).mockResolvedValue(false);

        const { result } = renderDocuments();

        await waitFor(() => expect(result.current.restoreFailed).toBe(true));
        expect(result.current.uploaded).toEqual({});
    });

    it('uploads a document the moment it is chosen, and marks it saved', async () => {
        const { result } = renderDocuments();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.saveDocument(GST, file('gst.pdf'));
        });

        expect(uploadKybDocuments).toHaveBeenCalledWith('admin', 5, [
            {
                documentName: 'GST_Certificate',
                fileBase: 'base64-gst.pdf',
                fileFormat: 'pdf',
                fileName: 'gst.pdf',
            },
        ]);
        expect(result.current.states.GST_Certificate).toBe('saved');
        expect(result.current.isSaved(GST)).toBe(true);
        expect(result.current.uploaded.GST_Certificate.fileName).toBe('gst.pdf');
    });

    it('marks a document that could not be saved as failed, and does not count it as saved', async () => {
        (uploadKybDocuments as Mock).mockResolvedValue(false);
        const { result } = renderDocuments();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.saveDocument(GST, file('gst.pdf'));
        });

        expect(result.current.states.GST_Certificate).toBe('failed');
        expect(result.current.isSaved(GST)).toBe(false);
    });

    it('does not count a saved document as saved while a replacement is in flight', async () => {
        (getUploadedKybDocuments as Mock).mockResolvedValue({
            data: {
                corporateDocuments: {
                    GST_Certificate: {
                        fileName: 'old.pdf',
                        documentType: 'pdf',
                        expiryDate: null,
                        status: 'UPLOADED',
                        uploadedAt: null,
                    },
                },
            },
        });
        let release: (value: unknown) => void = () => {};
        (uploadKybDocuments as Mock).mockImplementation(
            () =>
                new Promise(resolve => {
                    release = resolve;
                })
        );
        const { result } = renderDocuments();
        await waitFor(() => expect(result.current.isSaved(GST)).toBe(true));

        act(() => {
            result.current.saveDocument(GST, file('new.pdf'));
        });

        await waitFor(() => expect(result.current.states.GST_Certificate).toBe('saving'));
        expect(result.current.isSaved(GST)).toBe(false);

        await act(async () => {
            release({ status: true });
        });
        await waitFor(() => expect(result.current.isSaved(GST)).toBe(true));
    });

    it('never leaves a failed replacement looking like the old document is still good', async () => {
        (getUploadedKybDocuments as Mock).mockResolvedValue({
            data: {
                corporateDocuments: {
                    GST_Certificate: {
                        fileName: 'old.pdf',
                        documentType: 'pdf',
                        expiryDate: null,
                        status: 'UPLOADED',
                        uploadedAt: null,
                    },
                },
            },
        });
        (uploadKybDocuments as Mock).mockResolvedValue(false);
        const { result } = renderDocuments();
        await waitFor(() => expect(result.current.isSaved(GST)).toBe(true));

        await act(async () => {
            await result.current.saveDocument(GST, file('new.pdf'));
        });

        expect(result.current.isSaved(GST)).toBe(false);
    });

    it('sends replacements one at a time, so the last file chosen is the one stored', async () => {
        const order: string[] = [];
        (uploadKybDocuments as Mock).mockImplementation(async (_role, _id, documents) => {
            order.push(documents[0].fileName);
            return { status: true };
        });
        const { result } = renderDocuments();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            const first = result.current.saveDocument(GST, file('first.pdf'));
            const second = result.current.saveDocument(GST, file('second.pdf'));
            await Promise.all([first, second]);
        });

        expect(order).toEqual(['first.pdf', 'second.pdf']);
        expect(result.current.uploaded.GST_Certificate.fileName).toBe('second.pdf');
    });

    it('removes a saved document server-side, not just from the screen', async () => {
        (getUploadedKybDocuments as Mock).mockResolvedValue({
            data: {
                corporateDocuments: {
                    GST_Certificate: {
                        fileName: 'gst.pdf',
                        documentType: 'pdf',
                        expiryDate: null,
                        status: 'UPLOADED',
                        uploadedAt: null,
                    },
                },
            },
        });
        const { result } = renderDocuments();
        await waitFor(() => expect(result.current.isSaved(GST)).toBe(true));

        await act(async () => {
            await result.current.removeDocument(GST);
        });

        expect(deleteKybDocuments).toHaveBeenCalledWith('admin', 5, ['GST_Certificate']);
        expect(result.current.uploaded.GST_Certificate).toBeUndefined();
        expect(result.current.isSaved(GST)).toBe(false);
    });

    it('keeps the document when the removal failed, rather than pretending it is gone', async () => {
        (getUploadedKybDocuments as Mock).mockResolvedValue({
            data: {
                corporateDocuments: {
                    GST_Certificate: {
                        fileName: 'gst.pdf',
                        documentType: 'pdf',
                        expiryDate: null,
                        status: 'UPLOADED',
                        uploadedAt: null,
                    },
                },
            },
        });
        (deleteKybDocuments as Mock).mockResolvedValue(false);
        const { result } = renderDocuments();
        await waitFor(() => expect(result.current.isSaved(GST)).toBe(true));

        await act(async () => {
            await result.current.removeDocument(GST);
        });

        expect(result.current.uploaded.GST_Certificate).toBeDefined();
        expect(result.current.isSaved(GST)).toBe(true);
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SHOW_TOAST' }));
    });
});
