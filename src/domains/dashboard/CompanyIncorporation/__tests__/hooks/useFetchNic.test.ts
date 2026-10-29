import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getNIc } from '../../api';
import { useNIC } from '../../hooks/useFetchNic';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api', () => ({
    getNIc: vi.fn(),
}));

const mockGetNIc = getNIc as Mock;

describe('useNIC', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
            cb({ reducer: { auth: { id: 7, role: 'corporate' } } })
        );
    });

    it('fetches NIC options for the given parent and exposes them', async () => {
        mockGetNIc.mockResolvedValue([{ code: '681', description: 'Real estate' }]);

        const { result } = renderHook(() => useNIC('L'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(getNIc).toHaveBeenCalledWith({ userId: 7, userType: 'corporate', parent: 'L' });
        expect(result.current.data).toEqual([{ code: '681', description: 'Real estate' }]);
    });

    it('skips the API call when parent is an empty string', async () => {
        const { result } = renderHook(() => useNIC(''));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(getNIc).not.toHaveBeenCalled();
        expect(result.current.data).toEqual([]);
    });

    it('falls back to an empty array when the API returns false', async () => {
        mockGetNIc.mockResolvedValue(false);

        const { result } = renderHook(() => useNIC('L'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toEqual([]);
    });
});
