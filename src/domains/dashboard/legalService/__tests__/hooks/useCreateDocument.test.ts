import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { createLegalDocument } from '../../api';
import useCreateDocument from '../../hooks/useCreateDocument';

vi.mock('../../api', () => ({
    createLegalDocument: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
    useAppDispatch: () => dispatchMock,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useCreateDocument', () => {
    it('should call createLegalDocument with the editor payload and return data on success', async () => {
        const mockData = { id: 10, message: 'Document saved as draft' };
        (createLegalDocument as Mock).mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useCreateDocument());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.saveDocument({
                title: 'NDA Agreement',
                editorHtml: '<p>NDA</p>',
            });
        });

        expect(createLegalDocument).toHaveBeenCalledWith({
            userId: 1,
            userType: 'merchant',
            title: 'NDA Agreement',
            editorHtml: '<p>NDA</p>',
        });
        expect(returnValue).toEqual(mockData);
    });

    it('should dispatch success toast with the API message', async () => {
        (createLegalDocument as Mock).mockResolvedValueOnce({ id: 1, message: 'Saved!' });

        const { result } = renderHook(() => useCreateDocument());

        await act(async () => {
            await result.current.saveDocument({ title: 'Doc', editorHtml: '<p>Doc</p>' });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Saved!', variant: 'success' })
        );
    });

    it('should dispatch default success toast when message is missing', async () => {
        (createLegalDocument as Mock).mockResolvedValueOnce({ id: 1 });

        const { result } = renderHook(() => useCreateDocument());

        await act(async () => {
            await result.current.saveDocument({ title: 'Doc', editorHtml: '<p>Doc</p>' });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Document saved as draft', variant: 'success' })
        );
    });

    it('should dispatch error toast and return null when API returns false', async () => {
        (createLegalDocument as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useCreateDocument());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.saveDocument({
                title: 'Doc',
                editorHtml: '<p>Doc</p>',
            });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Failed to save document', variant: 'error' })
        );
        expect(returnValue).toBeNull();
    });

    it('should set isLoading to true during call and false after', async () => {
        let resolveApi: (v: any) => void;
        (createLegalDocument as Mock).mockReturnValue(
            new Promise(r => {
                resolveApi = r;
            })
        );

        const { result } = renderHook(() => useCreateDocument());

        act(() => {
            result.current.saveDocument({ title: 'Doc', editorHtml: '<p>Doc</p>' });
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolveApi({ id: 1 });
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
