import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { KybChecklistDocument, uploadKybDocuments } from '../../../api/admin/kybStatusApi';
import { useSubmitKybDocuments } from '../../../hooks/admin/useSubmitKybDocuments';

const makeDoc = (key: string, documentName: string): KybChecklistDocument => ({
    key,
    documentName,
    label: documentName.replace(/_/g, ' '),
    uploadLabel: `Upload ${documentName}`,
    hint: 'hint',
    required: true,
});

const UPLOADABLE = [
    makeDoc('coi', 'Certificate_Of_Incorporation'),
    makeDoc('gst', 'GST_Certificate'),
    makeDoc('cancelled-cheque', 'Cancelled_Cheque'),
];

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'SHOW_TOAST', payload })),
}));

vi.mock('../../../api/admin/kybStatusApi', () => ({
    uploadKybDocuments: vi.fn(),
}));

const mockDispatch = vi.fn();
const mockState = () => ({
    reducer: { auth: { role: 'admin', id: 5 } },
});

// Every KYB_DOCUMENTS entry present, as Formik's validationSchema guarantees by the time onSubmit fires.
const allDocsValues = () =>
    Object.fromEntries(
        UPLOADABLE.map(doc => [
            `doc_${doc.key}`,
            { base64: `base64-${doc.key}`, format: 'pdf', name: `${doc.key}.pdf` },
        ])
    );

describe('useSubmitKybDocuments', () => {
    let onSubmitted: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockState()));
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        onSubmitted = vi.fn();
    });

    it('starts with submitLoading=false', () => {
        const { result } = renderHook(() => useSubmitKybDocuments(onSubmitted, UPLOADABLE));
        expect(result.current.submitLoading).toBe(false);
    });

    it('uploads each document one at a time, mapped to documentName/fileBase/fileFormat via KYB_DOCUMENT_NAME_MAP', async () => {
        (uploadKybDocuments as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => useSubmitKybDocuments(onSubmitted, UPLOADABLE));

        await result.current.handleSubmit(allDocsValues());

        expect(uploadKybDocuments).toHaveBeenCalledTimes(UPLOADABLE.length);
        UPLOADABLE.forEach((doc, index) => {
            expect(uploadKybDocuments).toHaveBeenNthCalledWith(index + 1, 'admin', 5, [
                {
                    documentName: doc.documentName,
                    fileBase: `base64-${doc.key}`,
                    fileFormat: 'pdf',
                },
            ]);
        });
    });

    it('omits documents that are absent from values', async () => {
        (uploadKybDocuments as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => useSubmitKybDocuments(onSubmitted, UPLOADABLE));

        const values = allDocsValues();
        delete values[`doc_${UPLOADABLE[0].key}`];

        await result.current.handleSubmit(values);

        expect(uploadKybDocuments).toHaveBeenCalledTimes(UPLOADABLE.length - 1);
        const uploadedNames = (uploadKybDocuments as Mock).mock.calls.map(
            call => call[2][0].documentName
        );
        expect(uploadedNames).not.toContain(UPLOADABLE[0].documentName);
    });

    it('stops uploading at the first failure and does not advance', async () => {
        (uploadKybDocuments as Mock)
            .mockResolvedValueOnce({ status: true })
            .mockResolvedValueOnce(false);
        const { result } = renderHook(() => useSubmitKybDocuments(onSubmitted, UPLOADABLE));

        await result.current.handleSubmit(allDocsValues());

        expect(uploadKybDocuments).toHaveBeenCalledTimes(2);
        expect(showToast).toHaveBeenCalledWith(
            expect.objectContaining({
                variant: 'error',
                description: expect.stringContaining(UPLOADABLE[1].documentName),
            })
        );
        expect(onSubmitted).not.toHaveBeenCalled();
    });

    it('hands the whole form on to the caller once every document is stored', async () => {
        (uploadKybDocuments as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => useSubmitKybDocuments(onSubmitted, UPLOADABLE));
        const values = allDocsValues();

        await result.current.handleSubmit(values);

        expect(onSubmitted).toHaveBeenCalledWith(values);
    });

    it('shows an error toast and does not advance when the upload fails', async () => {
        (uploadKybDocuments as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useSubmitKybDocuments(onSubmitted, UPLOADABLE));

        await result.current.handleSubmit(allDocsValues());

        expect(showToast).toHaveBeenCalledWith(
            expect.objectContaining({
                variant: 'error',
                description: expect.stringContaining('upload'),
            })
        );
        expect(onSubmitted).not.toHaveBeenCalled();
        expect(result.current.submitLoading).toBe(false);
    });

    it('sets submitLoading=true while the request is in flight', async () => {
        (uploadKybDocuments as Mock).mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => useSubmitKybDocuments(onSubmitted, UPLOADABLE));

        result.current.handleSubmit(allDocsValues());
        await waitFor(() => expect(result.current.submitLoading).toBe(true));
    });
});
