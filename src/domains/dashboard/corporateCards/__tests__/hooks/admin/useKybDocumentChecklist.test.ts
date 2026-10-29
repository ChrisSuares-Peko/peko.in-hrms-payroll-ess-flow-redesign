import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getKybDocumentChecklist } from '../../../api/admin/kybStatusApi';
import { useKybDocumentChecklist } from '../../../hooks/admin/useKybDocumentChecklist';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/kybStatusApi', () => ({
    getKybDocumentChecklist: vi.fn(),
}));

const doc = (key: string, label: string, required = true) => ({
    key,
    documentName: label.replace(/[^A-Za-z]+/g, '_'),
    label,
    uploadLabel: `Upload ${label}`,
    hint: 'hint',
    required,
});

const CATALOGUE = [
    {
        value: 'PRIVATE_PUBLIC_LIMITED',
        label: 'Private / Public Limited',
        documents: [doc('coi', 'Certificate of Incorporation'), doc('moa', 'MoA')],
    },
    {
        value: 'PROPRIETORSHIP',
        label: 'Proprietorship',
        documents: [doc('gst', 'GST Certificate')],
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
        fn({ reducer: { auth: { role: 'corporate', id: 1347 } } })
    );
});

describe('useKybDocumentChecklist', () => {
    it('fetches the catalogue for the session corporate', async () => {
        (getKybDocumentChecklist as Mock).mockResolvedValue({ data: { businessTypes: CATALOGUE } });

        const { result } = renderHook(() => useKybDocumentChecklist());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getKybDocumentChecklist).toHaveBeenCalledWith('corporate', 1347);
        expect(result.current.businessTypes).toHaveLength(2);
    });

    it('exposes the business types as select options', async () => {
        (getKybDocumentChecklist as Mock).mockResolvedValue({ data: { businessTypes: CATALOGUE } });

        const { result } = renderHook(() => useKybDocumentChecklist());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.options).toEqual([
            { label: 'Private / Public Limited', value: 'PRIVATE_PUBLIC_LIMITED' },
            { label: 'Proprietorship', value: 'PROPRIETORSHIP' },
        ]);
    });

    it('resolves the documents for a chosen type', async () => {
        (getKybDocumentChecklist as Mock).mockResolvedValue({ data: { businessTypes: CATALOGUE } });

        const { result } = renderHook(() => useKybDocumentChecklist());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.documentsFor('PROPRIETORSHIP').map(d => d.label)).toEqual([
            'GST Certificate',
        ]);
    });

    // An unknown or absent type must yield nothing, never another type's list.
    it('returns no documents for an unknown or missing type', async () => {
        (getKybDocumentChecklist as Mock).mockResolvedValue({ data: { businessTypes: CATALOGUE } });

        const { result } = renderHook(() => useKybDocumentChecklist());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.documentsFor('SOMETHING_NEW')).toEqual([]);
        expect(result.current.documentsFor(undefined)).toEqual([]);
    });

    describe('when the call fails', () => {
        it('reports the failure instead of an empty checklist that looks legitimate', async () => {
            (getKybDocumentChecklist as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useKybDocumentChecklist());

            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.failed).toBe(true);
            expect(result.current.options).toEqual([]);
        });

        it('recovers on a retry', async () => {
            (getKybDocumentChecklist as Mock).mockResolvedValueOnce(false);
            const { result } = renderHook(() => useKybDocumentChecklist());
            await waitFor(() => expect(result.current.failed).toBe(true));

            (getKybDocumentChecklist as Mock).mockResolvedValue({
                data: { businessTypes: CATALOGUE },
            });
            await result.current.refetch();

            await waitFor(() => expect(result.current.failed).toBe(false));
            expect(result.current.options).toHaveLength(2);
        });
    });
});
