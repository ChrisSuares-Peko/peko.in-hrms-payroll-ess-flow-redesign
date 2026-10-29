import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { requestPhysicalCard } from '../../../api/user/cardsApi';
import { useRequestPhysicalCardApi } from '../../../hooks/user/useRequestPhysicalCardApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/cardsApi', () => ({
    requestPhysicalCard: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'user', id: 20 } } };

const makePayload = (overrides = {}) => ({
    cardId: 'card-42',
    addressLine1: '123 Main St',
    city: 'Mumbai',
    state: 'MH',
    pinCode: '400001',
    ...overrides,
});

describe('useRequestPhysicalCardApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=false', () => {
        const { result } = renderHook(() => useRequestPhysicalCardApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading=true during the call and false after', async () => {
        let resolve!: (v: any) => void;
        (requestPhysicalCard as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useRequestPhysicalCardApi());
        act(() => {
            result.current.submitRequestPhysicalCard(makePayload() as any);
        });
        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolve({ data: {} });
        });
        expect(result.current.isLoading).toBe(false);
    });

    it('calls requestPhysicalCard with role, id and payload', async () => {
        (requestPhysicalCard as Mock).mockResolvedValue({ data: {} });
        const { result } = renderHook(() => useRequestPhysicalCardApi());
        const payload = makePayload() as any;

        await act(async () => {
            await result.current.submitRequestPhysicalCard(payload);
        });

        expect(requestPhysicalCard).toHaveBeenCalledWith('user', 20, payload);
    });

    it('returns the API response on success', async () => {
        const resp = { data: { requestId: 7 } };
        (requestPhysicalCard as Mock).mockResolvedValue(resp);
        const { result } = renderHook(() => useRequestPhysicalCardApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitRequestPhysicalCard(makePayload() as any);
        });

        expect(returned).toEqual(resp);
    });

    it('returns falsy and sets isLoading=false when API fails', async () => {
        (requestPhysicalCard as Mock).mockResolvedValue(null);
        const { result } = renderHook(() => useRequestPhysicalCardApi());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitRequestPhysicalCard(makePayload() as any);
        });

        expect(returned).toBeFalsy();
        expect(result.current.isLoading).toBe(false);
    });
});
