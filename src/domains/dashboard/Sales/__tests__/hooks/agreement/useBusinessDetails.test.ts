import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getProfileAddressesApi, getProfileCompanyApi } from '../../../api/settings';
import { useBusinessDetails } from '../../../hooks/agreement/useBusinessDetails';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../../../api/settings', () => ({
    getProfileCompanyApi: vi.fn(),
    getProfileAddressesApi: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
});

describe('useBusinessDetails', () => {
    it('skips fetching when skip = true', async () => {
        const { result } = renderHook(() => useBusinessDetails(true));

        await waitFor(() => {
            expect(getProfileCompanyApi).not.toHaveBeenCalled();
            expect(getProfileAddressesApi).not.toHaveBeenCalled();
        });
        expect(result.current.profile).toBeNull();
        expect(result.current.address).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('fetches profile and chooses default address (default === 1)', async () => {
        const profile = { name: 'Co' };
        const addresses = [
            { id: '1', default: 0, state: 'KL' },
            { id: '2', default: 1, state: 'DL' },
        ];
        (getProfileCompanyApi as any).mockResolvedValueOnce(profile);
        (getProfileAddressesApi as any).mockResolvedValueOnce(addresses);

        const { result } = renderHook(() => useBusinessDetails());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.profile).toEqual(profile);
        expect(result.current.address).toEqual(addresses[1]);
    });

    it('falls back to first address when none is marked default', async () => {
        const addresses = [
            { id: '1', default: 0, state: 'KL' },
            { id: '2', default: 0, state: 'DL' },
        ];
        (getProfileCompanyApi as any).mockResolvedValueOnce({ name: 'Co' });
        (getProfileAddressesApi as any).mockResolvedValueOnce(addresses);

        const { result } = renderHook(() => useBusinessDetails());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.address).toEqual(addresses[0]);
    });

    it('leaves address null when address list is empty', async () => {
        (getProfileCompanyApi as any).mockResolvedValueOnce({ name: 'Co' });
        (getProfileAddressesApi as any).mockResolvedValueOnce([]);

        const { result } = renderHook(() => useBusinessDetails());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.address).toBeNull();
    });

    it('catches errors silently and stops loading', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (getProfileCompanyApi as any).mockRejectedValueOnce(new Error('boom'));

        const { result } = renderHook(() => useBusinessDetails());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(errorSpy).toHaveBeenCalled();
        expect(result.current.profile).toBeNull();

        errorSpy.mockRestore();
    });

    it('does not fetch when id or role is missing', async () => {
        (useAppSelector as any).mockReturnValue({ id: '', role: '' });

        renderHook(() => useBusinessDetails());

        await waitFor(() => {
            expect(getProfileCompanyApi).not.toHaveBeenCalled();
        });
    });
});
