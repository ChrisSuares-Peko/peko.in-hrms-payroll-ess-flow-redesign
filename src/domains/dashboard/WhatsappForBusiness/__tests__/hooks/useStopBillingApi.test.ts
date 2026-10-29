import { renderHook, act } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { stopBillingProject } from '../../api/index';
import { useStopBillingApi } from '../../hooks/useStopBilling';

vi.mock('../../api/index', () => ({
    stopBillingProject: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useStopBillingApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 'user-123' });
    });

    it('should initialize with isLoading as false', () => {
        const { result } = renderHook(() => useStopBillingApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to true when stopBilling is called', async () => {
        (stopBillingProject as Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useStopBillingApi());

        act(() => {
            result.current.stopBilling(123);
        });

        expect(result.current.isLoading).toBe(true);
    });

    it('should call stopBillingProject with correct parameters', async () => {
        (stopBillingProject as Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useStopBillingApi());

        await act(async () => {
            await result.current.stopBilling(123);
        });

        expect(stopBillingProject).toHaveBeenCalledWith({
            userId: 'user-123',
            userType: 'admin',
            id: 'project-123',
        });
    });

    it('should return true when API call is successful', async () => {
        (stopBillingProject as Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useStopBillingApi());

        let response;
        await act(async () => {
            response = await result.current.stopBilling(123);
        });

        expect(response).toBe(true);
        expect(result.current.isLoading).toBe(false);
    });

    it('should return false when API call fails', async () => {
        (stopBillingProject as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useStopBillingApi());

        let response;
        await act(async () => {
            response = await result.current.stopBilling(123);
        });

        expect(response).toBe(false);
        expect(result.current.isLoading).toBe(false);
    });

    it('should reset isLoading to false after API call completes', async () => {
        (stopBillingProject as Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useStopBillingApi());

        await act(async () => {
            await result.current.stopBilling(123);
        });

        expect(result.current.isLoading).toBe(false);
    });
});
