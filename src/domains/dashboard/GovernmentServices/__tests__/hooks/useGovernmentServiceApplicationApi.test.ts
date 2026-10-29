import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getGovernmentServiceApplicationApi,
    getGovernmentServiceApplicationByIdApi,
    submitGovernmentServiceApplicationApi,
} from '../../apis';
import { useGovernmentServiceApplication } from '../../hooks/useGovernmentServiceApplicationApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload) => ({ type: 'api/showToast', payload })),
}));

vi.mock('../../apis', () => ({
    getGovernmentServiceApplicationApi: vi.fn(),
    getGovernmentServiceApplicationByIdApi: vi.fn(),
    submitGovernmentServiceApplicationApi: vi.fn(),
}));

const mockDispatch = vi.fn();

const mockDraft = {
    id: 1,
    applicationNumber: 'APP001',
    currentStep: 1,
    status: 'DRAFT',
    formData: {},
    approvedDocument: null,
};

describe('useGovernmentServiceApplication Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
    });

    describe('fetchDraft', () => {
        it('calls getGovernmentServiceApplicationApi with correct params and returns data', async () => {
            (getGovernmentServiceApplicationApi as Mock).mockResolvedValue(mockDraft);

            const { result } = renderHook(() => useGovernmentServiceApplication());

            let data: any;
            await act(async () => {
                data = await result.current.fetchDraft('govt_msme');
            });

            expect(getGovernmentServiceApplicationApi).toHaveBeenCalledWith('123', 'admin', 'govt_msme');
            expect(data).toEqual(mockDraft);
        });

        it('returns null when API returns null', async () => {
            (getGovernmentServiceApplicationApi as Mock).mockResolvedValue(null);

            const { result } = renderHook(() => useGovernmentServiceApplication());

            let data: any;
            await act(async () => {
                data = await result.current.fetchDraft('govt_msme');
            });

            expect(data).toBeNull();
        });

        it('sets isDraftLoading true during fetch and false after', async () => {
            let resolveFn: (value: any) => void;
            const mockPromise = new Promise((resolve) => {
                resolveFn = resolve;
            });
            (getGovernmentServiceApplicationApi as Mock).mockReturnValue(mockPromise);

            const { result } = renderHook(() => useGovernmentServiceApplication());

            act(() => {
                result.current.fetchDraft('govt_msme');
            });

            expect(result.current.isDraftLoading).toBe(true);

            await act(async () => {
                resolveFn!(mockDraft);
            });

            expect(result.current.isDraftLoading).toBe(false);
        });
    });

    describe('fetchApplicationById', () => {
        it('calls getGovernmentServiceApplicationByIdApi with correct params', async () => {
            (getGovernmentServiceApplicationByIdApi as Mock).mockResolvedValue(mockDraft);

            const { result } = renderHook(() => useGovernmentServiceApplication());

            let data: any;
            await act(async () => {
                data = await result.current.fetchApplicationById(42);
            });

            expect(getGovernmentServiceApplicationByIdApi).toHaveBeenCalledWith('123', 'admin', 42);
            expect(data).toEqual(mockDraft);
        });

        it('returns null when API returns null', async () => {
            (getGovernmentServiceApplicationByIdApi as Mock).mockResolvedValue(null);

            const { result } = renderHook(() => useGovernmentServiceApplication());

            let data: any;
            await act(async () => {
                data = await result.current.fetchApplicationById(99);
            });

            expect(data).toBeNull();
        });
    });

    describe('submitApplication', () => {
        it('calls submitGovernmentServiceApplicationApi with correct payload', async () => {
            (submitGovernmentServiceApplicationApi as Mock).mockResolvedValue({
                applicationId: '1',
                status: 'SUBMITTED',
            });

            const { result } = renderHook(() => useGovernmentServiceApplication());

            await act(async () => {
                await result.current.submitApplication(
                    'govt_msme',
                    { step1: { name: 'Test' } },
                    5,
                    'SUBMITTED'
                );
            });

            expect(submitGovernmentServiceApplicationApi).toHaveBeenCalledWith({
                userId: '123',
                userType: 'admin',
                accessKey: 'govt_msme',
                formData: { step1: { name: 'Test' } },
                applicationId: 5,
                status: 'SUBMITTED',
            });
        });

        it('dispatches success toast and sets isSuccess true on success', async () => {
            (submitGovernmentServiceApplicationApi as Mock).mockResolvedValue({
                applicationId: '1',
                status: 'SUBMITTED',
            });

            const { result } = renderHook(() => useGovernmentServiceApplication());

            await act(async () => {
                await result.current.submitApplication('govt_msme', {});
            });

            expect(mockDispatch).toHaveBeenCalled();
            expect(showToast).toHaveBeenCalledWith(
                expect.objectContaining({ variant: 'success' })
            );
            expect(result.current.isSuccess).toBe(true);
        });

        it('does not dispatch toast and keeps isSuccess false on failure', async () => {
            (submitGovernmentServiceApplicationApi as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useGovernmentServiceApplication());

            await act(async () => {
                await result.current.submitApplication('govt_msme', {});
            });

            expect(mockDispatch).not.toHaveBeenCalled();
            expect(result.current.isSuccess).toBe(false);
        });

        it('sets isLoading true during submission and false after', async () => {
            let resolveFn: (value: any) => void;
            const mockPromise = new Promise((resolve) => {
                resolveFn = resolve;
            });
            (submitGovernmentServiceApplicationApi as Mock).mockReturnValue(mockPromise);

            const { result } = renderHook(() => useGovernmentServiceApplication());

            act(() => {
                result.current.submitApplication('govt_msme', {});
            });

            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                resolveFn!(false);
            });

            expect(result.current.isLoading).toBe(false);
        });

        it('returns the API response', async () => {
            const mockResponse = { applicationId: '42', status: 'SUBMITTED' };
            (submitGovernmentServiceApplicationApi as Mock).mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useGovernmentServiceApplication());

            let response: any;
            await act(async () => {
                response = await result.current.submitApplication('govt_msme', {});
            });

            expect(response).toEqual(mockResponse);
        });
    });
});
