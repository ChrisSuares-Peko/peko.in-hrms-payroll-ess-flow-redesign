import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getApplications, getApplicationDetail } from '../../api';
import { useApplicationTracking } from '../../hooks/useApplicationTracking';
import { setCurrentApplicationDetail, setApplications } from '../../slices/incorporationSlice';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('../../api', () => ({
    getApplications: vi.fn(),
    getApplicationDetail: vi.fn(),
}));

const mockGetApplications = getApplications as Mock;
const mockGetDetail = getApplicationDetail as Mock;

const mockState = (incorporation: any) => {
    (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
        cb({ reducer: { auth: { id: 7, role: 'corporate' }, incorporation } })
    );
};

describe('useApplicationTracking', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fast-path: fetches detail directly when submittedApplication is known', async () => {
        mockState({
            applications: [],
            currentApplicationDetail: null,
            isLoading: false,
            submittedApplication: { applicationId: 'INC/2026/00001' },
        });
        mockGetDetail.mockResolvedValue({ applicationId: 'INC/2026/00001', status: 'SUBMITTED' });

        const { result } = renderHook(() => useApplicationTracking());
        await act(async () => {
            await result.current.fetchApplications();
        });

        expect(getApplicationDetail).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            applicationId: 'INC/2026/00001',
        });
        expect(getApplications).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
            setCurrentApplicationDetail({ applicationId: 'INC/2026/00001', status: 'SUBMITTED' } as any)
        );
    });

    it('fallback: lists applications then fetches the latest one when no submittedApplication', async () => {
        mockState({
            applications: [],
            currentApplicationDetail: null,
            isLoading: false,
            submittedApplication: null,
        });
        mockGetApplications.mockResolvedValue({ applications: [{ applicationId: 'INC/2026/00009' }] });
        mockGetDetail.mockResolvedValue({ applicationId: 'INC/2026/00009', status: 'UNDER_REVIEW' });

        const { result } = renderHook(() => useApplicationTracking());
        await act(async () => {
            await result.current.fetchApplications();
        });

        expect(getApplications).toHaveBeenCalledWith({ userId: 7, userType: 'corporate' });
        expect(mockDispatch).toHaveBeenCalledWith(setApplications([{ applicationId: 'INC/2026/00009' }] as any));
        expect(getApplicationDetail).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            applicationId: 'INC/2026/00009',
        });
    });

    it('fetchApplicationDetail loads a specific application by id', async () => {
        mockState({
            applications: [],
            currentApplicationDetail: null,
            isLoading: false,
            submittedApplication: null,
        });
        mockGetDetail.mockResolvedValue({ applicationId: 'INC/2026/00005', status: 'APPROVED' });

        const { result } = renderHook(() => useApplicationTracking());
        await act(async () => {
            await result.current.fetchApplicationDetail('INC/2026/00005');
        });

        expect(getApplicationDetail).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            applicationId: 'INC/2026/00005',
        });
        expect(mockDispatch).toHaveBeenCalledWith(
            setCurrentApplicationDetail({ applicationId: 'INC/2026/00005', status: 'APPROVED' } as any)
        );
    });
});
