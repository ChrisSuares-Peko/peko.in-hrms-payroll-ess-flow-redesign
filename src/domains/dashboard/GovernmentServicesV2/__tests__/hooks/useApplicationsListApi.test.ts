import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAllGovernmentServiceApplicationsV2Api } from '../../apis';
import useApplicationsListApi from '../../hooks/useApplicationsListApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getAllGovernmentServiceApplicationsV2Api: vi.fn(),
}));

let mockState = { reducer: { auth: { role: 'corporate', id: 1 } } };

describe('useApplicationsListApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockState = { reducer: { auth: { role: 'corporate', id: 1 } } };
        (useAppSelector as Mock).mockImplementation((selector) => selector(mockState));
    });

    it('starts loading and then exposes the applications array', async () => {
        const applications = [
            { id: 1, serviceName: 'Trademark Registration', status: 'DRAFT', isFormSubmissionComplete: false },
        ];
        (getAllGovernmentServiceApplicationsV2Api as Mock).mockResolvedValue({ total: 1, applications });

        const { result } = renderHook(() => useApplicationsListApi());
        expect(result.current.isLoading).toBe(true);
        expect(result.current.applications).toEqual([]);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.applications).toEqual(applications);
        expect(getAllGovernmentServiceApplicationsV2Api).toHaveBeenCalledWith(1, 'corporate');
    });

    it('handles the empty fallback result', async () => {
        (getAllGovernmentServiceApplicationsV2Api as Mock).mockResolvedValue({ total: 0, applications: [] });

        const { result } = renderHook(() => useApplicationsListApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.applications).toEqual([]);
    });

    it('refetches when the role changes', async () => {
        (getAllGovernmentServiceApplicationsV2Api as Mock).mockResolvedValue({ total: 0, applications: [] });

        const { result, rerender } = renderHook(() => useApplicationsListApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        mockState = { reducer: { auth: { role: 'vendor', id: 1 } } };
        rerender();
        await waitFor(() => expect(getAllGovernmentServiceApplicationsV2Api).toHaveBeenCalledTimes(2));
        expect(getAllGovernmentServiceApplicationsV2Api).toHaveBeenLastCalledWith(1, 'vendor');
    });
});
