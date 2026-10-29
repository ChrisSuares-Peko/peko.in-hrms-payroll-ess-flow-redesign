import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { updateCardSettings } from '../../../api/admin/cardLimitsApi';
import { useUpdateCardSettingsApi } from '../../../hooks/admin/useUpdateCardSettingsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/cardLimitsApi', () => ({
    updateCardSettings: vi.fn(),
    getCardLimitCards: vi.fn(),
    getCardAudit: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const makePayload = (overrides = {}) => ({
    cardLimit: 100000,
    perTxnLimit: 10000,
    atmEnabled: false,
    ...overrides,
});

describe('useUpdateCardSettingsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useUpdateCardSettingsApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading=true during the call and false after', async () => {
        let resolve!: (v: any) => void;
        (updateCardSettings as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useUpdateCardSettingsApi());
        act(() => {
            result.current.submitSettings('card-1', makePayload() as any);
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('calls updateCardSettings with role, id, cardIssuanceId and payload', async () => {
        (updateCardSettings as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useUpdateCardSettingsApi());
        const payload = makePayload() as any;

        await act(async () => {
            await result.current.submitSettings('card-42', payload);
        });

        expect(updateCardSettings).toHaveBeenCalledWith('admin', 1, 'card-42', payload);
    });

    it('returns the API response on success', async () => {
        const resp = { data: { updated: true } };
        (updateCardSettings as Mock).mockResolvedValue(resp);
        const { result } = renderHook(() => useUpdateCardSettingsApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitSettings('card-1', makePayload() as any);
        });

        expect(returned).toEqual(resp);
    });

    it('returns falsy and sets isLoading=false when API fails', async () => {
        (updateCardSettings as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useUpdateCardSettingsApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitSettings('card-1', makePayload() as any);
        });

        expect(returned).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });
});
