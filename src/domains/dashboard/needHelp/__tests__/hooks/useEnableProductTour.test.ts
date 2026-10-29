import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { alterProductTour } from '@src/slices/userSlice';

import { updateProductTour } from '../../api/index';
import useEnableProductTour from '../../hooks/useEnableProductTour';

vi.mock('../../api/index', () => ({
    updateProductTour: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(() => ({
        role: 'admin',
        id: '12345',
    })),
}));

vi.mock('@src/routes/paths', () => ({
    paths: { dashboard: { home: '/dashboard' } },
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

describe('useEnableProductTour Hook', () => {
    let dispatchMock: any;
    let navigateMock: any;

    beforeEach(() => {
        dispatchMock = vi.fn();
        navigateMock = vi.fn();

        (useAppDispatch as any).mockReturnValue(dispatchMock);
        (useNavigate as any).mockReturnValue(navigateMock);
        vi.clearAllMocks();
    });

    it('should call updateProductTour API and update Redux store on success', async () => {
        (updateProductTour as any).mockResolvedValue({
            result: { productTour: true },
        });

        const { result } = renderHook(() => useEnableProductTour());

        await act(async () => {
            await result.current.handleUpdateTour();
        });

        expect(updateProductTour).toHaveBeenCalledWith({
            userId: '12345',
            userType: 'admin',
            type: 'All',
        });
        // @ts-ignore
        expect(dispatchMock).toHaveBeenCalledWith(alterProductTour(true));
        expect(navigateMock).toHaveBeenCalledWith('/dashboard');
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure without crashing', async () => {
        (updateProductTour as any).mockResolvedValue(false);

        const { result } = renderHook(() => useEnableProductTour());

        await act(async () => {
            await result.current.handleUpdateTour();
        });

        expect(updateProductTour).toHaveBeenCalled();
        expect(dispatchMock).not.toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading correctly during API call', async () => {
        (updateProductTour as any).mockResolvedValue({ result: { productTour: true } });

        const { result } = renderHook(() => useEnableProductTour());

        act(() => {
            result.current.handleUpdateTour();
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await result.current.handleUpdateTour();
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should handle an invalid response and not dispatch actions or navigate', async () => {
        (updateProductTour as any).mockResolvedValue(null);

        const { result } = renderHook(() => useEnableProductTour());

        await act(async () => {
            await result.current.handleUpdateTour();
        });

        expect(dispatchMock).not.toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
    });
});
