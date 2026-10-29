import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { getGstinLookupApi } from '../../api/eInvoice';
import useGstinLookup from '../../hooks/useGstinLookup';
import { mapGstinApiToDetails } from '../../utils/gstinLookupMapper';

vi.mock('../../api/eInvoice', () => ({
    getGstinLookupApi: vi.fn(),
}));

vi.mock('../../utils/gstinLookupMapper', () => ({
    mapGstinApiToDetails: vi.fn(() => ({ name: 'mapped' })),
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

describe('useGstinLookup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns api data and stores mapped details on success', async () => {
        (getGstinLookupApi as Mock).mockResolvedValue({ raw: true });
        const { result } = renderHook(() => useGstinLookup());

        let returned: any;
        await act(async () => {
            returned = await result.current.search('29ABCDE1234F1Z5');
        });

        expect(getGstinLookupApi).toHaveBeenCalledWith({
            userId: 'u1',
            userType: 'admin',
            gstin: '29ABCDE1234F1Z5',
        });
        expect(mapGstinApiToDetails).toHaveBeenCalledWith({ raw: true });
        expect(result.current.details).toEqual({ name: 'mapped' });
        expect(returned).toEqual({ raw: true });
    });

    it('shows error toast and returns null on failure', async () => {
        (getGstinLookupApi as Mock).mockResolvedValue(null);
        const { result } = renderHook(() => useGstinLookup());

        let returned: any;
        await act(async () => {
            returned = await result.current.search('BAD');
        });

        expect(returned).toBeNull();
        expect(result.current.details).toBeNull();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'GSTIN not found or invalid', variant: 'error' })
        );
    });

    it('toggles isSearching during the call', async () => {
        let resolveCall: (value: any) => void = () => undefined;
        (getGstinLookupApi as Mock).mockImplementation(
            () => new Promise(res => {
                resolveCall = res;
            })
        );
        const { result } = renderHook(() => useGstinLookup());

        let searchPromise: Promise<any> = Promise.resolve(null);
        await act(async () => {
            searchPromise = result.current.search('g');
        });
        expect(result.current.isSearching).toBe(true);

        await act(async () => {
            resolveCall({ raw: true });
            await searchPromise;
        });
        expect(result.current.isSearching).toBe(false);
    });
});
