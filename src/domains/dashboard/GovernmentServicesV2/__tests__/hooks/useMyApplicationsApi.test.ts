import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAllGovernmentServiceApplicationsApi } from '../../apis';
import useMyApplicationsApi from '../../hooks/useMyApplicationsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getAllGovernmentServiceApplicationsApi: vi.fn(),
}));

let mockState = { reducer: { auth: { role: 'corporate', id: 1 } } };

describe('useMyApplicationsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockState = { reducer: { auth: { role: 'corporate', id: 1 } } };
        (useAppSelector as Mock).mockImplementation((selector) => selector(mockState));
    });

    it('starts loading and then exposes the fetched applications', async () => {
        const rows = [{ id: 1, applicationNumber: 'APP-1' }];
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue(rows);

        const { result } = renderHook(() => useMyApplicationsApi());
        expect(result.current.isLoading).toBe(true);
        expect(result.current.applications).toEqual([]);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.applications).toEqual(rows);
        expect(getAllGovernmentServiceApplicationsApi).toHaveBeenCalledWith(1, 'corporate');
    });

    it('stays empty when the API returns []', async () => {
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue([]);

        const { result } = renderHook(() => useMyApplicationsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.applications).toEqual([]);
    });

    it('refetches when the user changes', async () => {
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue([]);

        const { result, rerender } = renderHook(() => useMyApplicationsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockState = { reducer: { auth: { role: 'corporate', id: 2 } } };
        rerender();
        await waitFor(() => expect(getAllGovernmentServiceApplicationsApi).toHaveBeenCalledTimes(2));
        expect(getAllGovernmentServiceApplicationsApi).toHaveBeenLastCalledWith(2, 'corporate');
    });
});
