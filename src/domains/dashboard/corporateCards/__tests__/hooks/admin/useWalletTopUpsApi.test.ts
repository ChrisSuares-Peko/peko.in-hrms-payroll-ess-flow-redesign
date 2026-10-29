import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getWalletTopUps } from '../../../api/admin/walletApi';
import { useWalletTopUpsApi } from '../../../hooks/admin/useWalletTopUpsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@utils/dateFormat', () => ({
    formattedDateOnly: vi.fn((d: Date) => d.toISOString().split('T')[0]),
}));

vi.mock('../../../api/admin/walletApi', () => ({
    getWallet: vi.fn(),
    getWalletTopUps: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const makeTopUpItem = (overrides = {}) => ({
    id: 1,
    date: '2024-01-15',
    reference: 'REF-001',
    method: 'NEFT',
    status: 'Completed',
    amount: 100000,
    ...overrides,
});

describe('useWalletTopUpsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=true and topUps=[]', () => {
        (getWalletTopUps as Mock).mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => useWalletTopUpsApi());
        expect(result.current.isLoading).toBe(true);
        expect(result.current.topUps).toEqual([]);
    });

    it('maps rows correctly and sets isLoading=false', async () => {
        const item = makeTopUpItem();
        (getWalletTopUps as Mock).mockResolvedValue({ data: { rows: [item] } });

        const { result } = renderHook(() => useWalletTopUpsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.topUps).toHaveLength(1);
        const tu = result.current.topUps[0];
        expect(tu.key).toBe('1');
        expect(tu.reference).toBe('REF-001');
        expect(tu.source).toBe('NEFT');
        expect(tu.status).toBe('Completed');
    });

    it('prefixes amount with "+"', async () => {
        (getWalletTopUps as Mock).mockResolvedValue({
            data: { rows: [makeTopUpItem({ amount: 50000 })] },
        });
        const { result } = renderHook(() => useWalletTopUpsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.topUps[0].amount).toMatch(/^\+/);
    });

    it('defaults reference to "—" when reference is null/empty', async () => {
        (getWalletTopUps as Mock).mockResolvedValue({
            data: { rows: [makeTopUpItem({ reference: null })] },
        });
        const { result } = renderHook(() => useWalletTopUpsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.topUps[0].reference).toBe('—');
    });

    it('defaults date to empty string when date is null', async () => {
        (getWalletTopUps as Mock).mockResolvedValue({
            data: { rows: [makeTopUpItem({ date: null })] },
        });
        const { result } = renderHook(() => useWalletTopUpsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.topUps[0].date).toBe('');
    });

    it('calls getWalletTopUps with role and id', async () => {
        (getWalletTopUps as Mock).mockResolvedValue(false);
        renderHook(() => useWalletTopUpsApi());
        await waitFor(() => expect(getWalletTopUps).toHaveBeenCalledWith('admin', 1));
    });

    it('keeps topUps=[] and sets isLoading=false when API returns false', async () => {
        (getWalletTopUps as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useWalletTopUpsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.topUps).toEqual([]);
    });

    it('refetch re-calls getWalletTopUps and updates topUps', async () => {
        (getWalletTopUps as Mock)
            .mockResolvedValueOnce({ data: { rows: [makeTopUpItem({ id: 1 })] } })
            .mockResolvedValueOnce({
                data: { rows: [makeTopUpItem({ id: 1 }), makeTopUpItem({ id: 2 })] },
            });

        const { result } = renderHook(() => useWalletTopUpsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.topUps).toHaveLength(1);

        await act(async () => {
            await result.current.refetch();
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.topUps).toHaveLength(2);
    });
});
