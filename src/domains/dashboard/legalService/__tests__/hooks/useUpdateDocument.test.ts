import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { updateLegalDocument } from '../../api';
import useUpdateDocument from '../../hooks/useUpdateDocument';

vi.mock('../../api', () => ({
    updateLegalDocument: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
    useAppDispatch: () => dispatchMock,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useUpdateDocument', () => {
    it('should call updateLegalDocument with correct payload and return data on success', async () => {
        const mockData = { id: 5, message: 'Document updated successfully' };
        (updateLegalDocument as Mock).mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useUpdateDocument());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.updateDocument({
                documentId: 'doc-1',
                editorHtml: '<p>Updated</p>',
            });
        });

        expect(updateLegalDocument).toHaveBeenCalledWith({
            userId: 1,
            userType: 'merchant',
            documentId: 'doc-1',
            editorHtml: '<p>Updated</p>',
        });
        expect(returnValue).toEqual(mockData);
    });

    it('should dispatch success toast when API returns data', async () => {
        (updateLegalDocument as Mock).mockResolvedValueOnce({ message: 'Updated!' });

        const { result } = renderHook(() => useUpdateDocument());

        await act(async () => {
            await result.current.updateDocument({ documentId: 'doc-1', editorHtml: '<p>x</p>' });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Updated!', variant: 'success' })
        );
    });

    it('should dispatch default success toast when message is missing', async () => {
        (updateLegalDocument as Mock).mockResolvedValueOnce({ id: 1 });

        const { result } = renderHook(() => useUpdateDocument());

        await act(async () => {
            await result.current.updateDocument({ documentId: 'doc-1', editorHtml: '<p>x</p>' });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Document updated successfully', variant: 'success' })
        );
    });

    it('should dispatch error toast and return null when API returns false', async () => {
        (updateLegalDocument as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useUpdateDocument());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.updateDocument({
                documentId: 'doc-1',
                editorHtml: '<p>x</p>',
            });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Failed to update document', variant: 'error' })
        );
        expect(returnValue).toBeNull();
    });

    it('should toggle isLoading correctly', async () => {
        let resolveApi: (v: any) => void;
        (updateLegalDocument as Mock).mockReturnValue(
            new Promise(r => {
                resolveApi = r;
            })
        );

        const { result } = renderHook(() => useUpdateDocument());

        act(() => {
            result.current.updateDocument({ documentId: 'doc-1', editorHtml: '<p>x</p>' });
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolveApi({ id: 1 });
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
