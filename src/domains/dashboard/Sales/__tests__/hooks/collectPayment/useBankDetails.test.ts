import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';

import { getPrimaryBankApi } from '../../../api/collectPayment';
import useBankDetails from '../../../hooks/collectPayment/useBankDetails';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('../../../api/collectPayment', () => ({
    getPrimaryBankApi: vi.fn(),
    getBankDetailsOtpApi: vi.fn(),
    addDomesticBankApi: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useBankDetails', () => {
    it('initialises with null primaryBank and isFetching false', () => {
        const { result } = renderHook(() => useBankDetails());

        expect(result.current.primaryBank).toBeNull();
        expect(result.current.isFetching).toBe(false);
        expect(getPrimaryBankApi).not.toHaveBeenCalled();
    });

    it('fetchDetails populates primaryBank on success', async () => {
        const bank = {
            id: 5,
            accountHolderName: 'Acme',
            accountNumber: '1234',
            bankName: 'HDFC',
            ifscCode: 'HDFC0001234',
            accountType: 'savings',
            default: 1,
            status: 1,
        };
        (getPrimaryBankApi as any).mockResolvedValueOnce(bank);

        const { result } = renderHook(() => useBankDetails());

        await act(async () => {
            await result.current.fetchDetails();
        });

        expect(result.current.primaryBank).toEqual(bank);
        expect(result.current.isFetching).toBe(false);
    });

    it('fetchDetails sets primaryBank to null when API returns null', async () => {
        (getPrimaryBankApi as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useBankDetails());

        await act(async () => {
            await result.current.fetchDetails();
        });

        expect(result.current.primaryBank).toBeNull();
    });

    it('fetchDetails uses cache on second call without force', async () => {
        const bank = { id: 1, accountHolderName: 'X', accountNumber: '1', bankName: 'B', ifscCode: 'C', accountType: 'savings', default: 1, status: 1 };
        (getPrimaryBankApi as any).mockResolvedValue(bank);

        const { result } = renderHook(() => useBankDetails());

        await act(async () => { await result.current.fetchDetails(); });
        await act(async () => { await result.current.fetchDetails(); });

        expect(getPrimaryBankApi).toHaveBeenCalledTimes(1);
    });

    it('fetchDetails bypasses cache when force=true', async () => {
        const bank = { id: 1, accountHolderName: 'X', accountNumber: '1', bankName: 'B', ifscCode: 'C', accountType: 'savings', default: 1, status: 1 };
        (getPrimaryBankApi as any).mockResolvedValue(bank);

        const { result } = renderHook(() => useBankDetails());

        await act(async () => { await result.current.fetchDetails(); });
        await act(async () => { await result.current.fetchDetails(true); });

        expect(getPrimaryBankApi).toHaveBeenCalledTimes(2);
    });

    it('isFetching is true while fetchDetails is in flight', async () => {
        let resolve: (v: any) => void = () => {};
        (getPrimaryBankApi as any).mockReturnValueOnce(new Promise(r => { resolve = r; }));

        const { result } = renderHook(() => useBankDetails());

        act(() => { result.current.fetchDetails(); });

        await waitFor(() => expect(result.current.isFetching).toBe(true));

        await act(async () => { resolve(null); });

        await waitFor(() => expect(result.current.isFetching).toBe(false));
    });
});
