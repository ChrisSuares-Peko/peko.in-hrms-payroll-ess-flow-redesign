import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getChallanOrders } from '../../api/index';
import useChallanOrders from '../../hooks/useChallanOrders';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../../api/index', () => ({ getChallanOrders: vi.fn() }));

describe('useChallanOrders', () => {
    const role = 'CORPORATE';
    const id = 42;

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
            cb({ reducer: { auth: { role, id } } })
        );
    });

    it('fetches orders on mount for the logged-in corporate and stores them', async () => {
        const orders = [{ orderId: '1', orderDate: '2026-01-01', amount: 500, status: 'Assigned' }];
        (getChallanOrders as Mock).mockResolvedValue(orders);

        const { result } = renderHook(() => useChallanOrders());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getChallanOrders).toHaveBeenCalledWith({ userId: id, userType: role });
        expect(result.current.orders).toEqual(orders);
    });

    it('falls back to an empty array when the api fails (returns false)', async () => {
        (getChallanOrders as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useChallanOrders());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.orders).toEqual([]);
    });
});
