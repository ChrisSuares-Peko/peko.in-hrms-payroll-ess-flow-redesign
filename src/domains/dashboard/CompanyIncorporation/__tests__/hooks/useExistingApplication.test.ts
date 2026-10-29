import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getApplications } from '../../api';
import { useExistingApplication } from '../../hooks/useExistingApplication';
import { setApplications } from '../../slices/incorporationSlice';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('../../api', () => ({
    getApplications: vi.fn(),
}));

const mockGetApplications = getApplications as Mock;

const mockSelector = (applications: any[]) => {
    (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
        cb({ reducer: { auth: { id: 7, role: 'corporate' }, incorporation: { applications } } })
    );
};

describe('useExistingApplication', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches applications and stores them', async () => {
        mockSelector([]);
        mockGetApplications.mockResolvedValue({ applications: [{ applicationId: 'INC/2026/00001' }] });

        const { result } = renderHook(() => useExistingApplication());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getApplications).toHaveBeenCalledWith({ userId: 7, userType: 'corporate' });
        expect(mockDispatch).toHaveBeenCalledWith(setApplications([{ applicationId: 'INC/2026/00001' }] as any));
    });

    it('returns the most recently created application as existingApplication', async () => {
        mockGetApplications.mockResolvedValue({ applications: [] });
        mockSelector([
            { applicationId: 'OLD', createdAt: '2026-01-01T00:00:00Z' },
            { applicationId: 'NEW', createdAt: '2026-03-01T00:00:00Z' },
        ]);

        const { result } = renderHook(() => useExistingApplication());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.existingApplication?.applicationId).toBe('NEW');
    });

    it('returns null existingApplication when the list is empty', async () => {
        mockGetApplications.mockResolvedValue({ applications: [] });
        mockSelector([]);

        const { result } = renderHook(() => useExistingApplication());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.existingApplication).toBeNull();
    });
});
