import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getLandingConfig } from '../../api';
import { useLandingConfig } from '../../hooks/useLandingConfig';
import { setLandingConfig, setError } from '../../slices/incorporationSlice';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('../../api', () => ({
    getLandingConfig: vi.fn(),
}));

const mockGetLandingConfig = getLandingConfig as Mock;

const mockSelector = (incorporation: any) => {
    (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
        cb({ reducer: { auth: { id: 7, role: 'corporate' }, incorporation } })
    );
};

describe('useLandingConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and stores the config when none is loaded yet', async () => {
        mockSelector({ landingConfig: null, isLoading: false });
        mockGetLandingConfig.mockResolvedValue({ incorporationFee: 10000 });

        renderHook(() => useLandingConfig());

        await waitFor(() => {
            expect(getLandingConfig).toHaveBeenCalledWith({ userId: 7, userType: 'corporate' });
        });
        expect(mockDispatch).toHaveBeenCalledWith(setLandingConfig({ incorporationFee: 10000 } as any));
        expect(mockDispatch).toHaveBeenCalledWith(setError(null));
    });

    it('dispatches an error when the fetch fails', async () => {
        mockSelector({ landingConfig: null, isLoading: false });
        mockGetLandingConfig.mockResolvedValue(false);

        renderHook(() => useLandingConfig());

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith(setError('Failed to load landing configuration'));
        });
    });

    it('does not refetch when a config is already present', async () => {
        mockSelector({ landingConfig: { incorporationFee: 10000 }, isLoading: false });

        renderHook(() => useLandingConfig());

        await waitFor(() => expect(getLandingConfig).not.toHaveBeenCalled());
    });
});
