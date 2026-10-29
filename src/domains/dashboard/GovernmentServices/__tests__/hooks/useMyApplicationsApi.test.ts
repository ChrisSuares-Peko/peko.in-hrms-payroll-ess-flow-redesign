import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getAllGovernmentServiceApplicationsApi, ApplicationListItem } from '../../apis';
import useMyApplicationsApi from '../../hooks/useMyApplicationsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getAllGovernmentServiceApplicationsApi: vi.fn(),
}));

const mockApplications: ApplicationListItem[] = [
    {
        id: 1,
        applicationNumber: 'APP001',
        service: 'govt_msme',
        status: 'SUBMITTED',
        currentStep: 1,
        adminNotes: null,
        remarks: null,
        approvedDocument: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
    },
    {
        id: 2,
        applicationNumber: 'APP002',
        service: 'govt_trademark',
        status: 'IN_REVIEW',
        currentStep: 2,
        adminNotes: 'Under review',
        remarks: null,
        approvedDocument: null,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-10T00:00:00Z',
    },
];

describe('useMyApplicationsApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
    });

    it('calls getAllGovernmentServiceApplicationsApi with correct params on mount', async () => {
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue(mockApplications);

        renderHook(() => useMyApplicationsApi());

        await act(async () => {});

        expect(getAllGovernmentServiceApplicationsApi).toHaveBeenCalledWith('123', 'admin');
    });

    it('returns applications after successful fetch', async () => {
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue(mockApplications);

        const { result } = renderHook(() => useMyApplicationsApi());

        await act(async () => {});

        expect(result.current.applications).toEqual(mockApplications);
        expect(result.current.applications).toHaveLength(2);
    });

    it('returns empty array when API returns empty', async () => {
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue([]);

        const { result } = renderHook(() => useMyApplicationsApi());

        await act(async () => {});

        expect(result.current.applications).toEqual([]);
    });

    it('starts with isLoading true', () => {
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue([]);

        const { result } = renderHook(() => useMyApplicationsApi());

        expect(result.current.isLoading).toBe(true);
    });

    it('sets isLoading to false after fetch completes', async () => {
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue(mockApplications);

        const { result } = renderHook(() => useMyApplicationsApi());

        await act(async () => {});

        expect(result.current.isLoading).toBe(false);
    });

    it('re-fetches when auth id changes', async () => {
        (getAllGovernmentServiceApplicationsApi as Mock).mockResolvedValue([]);
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });

        const { rerender } = renderHook(() => useMyApplicationsApi());
        await act(async () => {});

        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '456' });
        rerender();
        await act(async () => {});

        expect(getAllGovernmentServiceApplicationsApi).toHaveBeenCalledTimes(2);
        expect(getAllGovernmentServiceApplicationsApi).toHaveBeenLastCalledWith('456', 'admin');
    });
});
