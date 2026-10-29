import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { terminateCard } from '../../../api/admin/requestsApi';
import { useTerminateCardApi } from '../../../hooks/admin/useTerminateCardApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/requestsApi', () => ({
    terminateCard: vi.fn(),
    listRequests: vi.fn(),
    approveRequest: vi.fn(),
    rejectRequest: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

describe('useTerminateCardApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useTerminateCardApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading=true during the call and false after', async () => {
        let resolve!: (v: any) => void;
        (terminateCard as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useTerminateCardApi());
        act(() => {
            result.current.submitTerminate(42);
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('calls terminateCard with role, id, cardIssuanceId and reason', async () => {
        (terminateCard as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useTerminateCardApi());

        await act(async () => {
            await result.current.submitTerminate(99, 'Lost card');
        });

        expect(terminateCard).toHaveBeenCalledWith('admin', 1, 99, 'Lost card');
    });

    it('calls terminateCard without reason when omitted', async () => {
        (terminateCard as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useTerminateCardApi());

        await act(async () => {
            await result.current.submitTerminate(55);
        });

        expect(terminateCard).toHaveBeenCalledWith('admin', 1, 55, undefined);
    });

    it('returns the API response on success', async () => {
        const resp = { data: { terminated: true } };
        (terminateCard as Mock).mockResolvedValue(resp);
        const { result } = renderHook(() => useTerminateCardApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitTerminate(42);
        });

        expect(returned).toEqual(resp);
    });

    it('returns falsy and sets isLoading=false when API fails', async () => {
        (terminateCard as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useTerminateCardApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitTerminate(42);
        });

        expect(returned).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });
});
