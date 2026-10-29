import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getPaymentMethodsApi } from '../../api/paymentMethods';
import useGetPaymentMethods from '../../hooks/paymentMethods/useGetPaymentMethods';
import { FilterType } from '../../types/paymentMethods';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({ reducer: { auth: { id: 5, role: 'system_user' } } }),
}));
vi.mock('../../api/paymentMethods', () => ({ getPaymentMethodsApi: vi.fn() }));

const settings = {
    isGatewayPaymentAvailable: true,
    isWalletPaymentAvailable: false,
    isCouponApplicable: true,
};

const responseWith = (ids: number[]) => ({
    paymentMethods: settings,
    data: { recordsFiltered: ids.length, recordsTotal: ids.length, rows: ids.map(id => ({ id })) },
});

const filters = (overrides: Partial<FilterType> = {}): FilterType => ({
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    sort: 'DESC',
    ...overrides,
});

describe('useGetPaymentMethods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads the rows and the global settings', async () => {
        (getPaymentMethodsApi as Mock).mockResolvedValue(responseWith([1, 2]));
        const filter = filters();
        const { result } = renderHook(() => useGetPaymentMethods(filter));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getPaymentMethodsApi).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 5, userType: 'system_user', page: 1 })
        );
        expect(result.current.tableData).toEqual([{ id: 1 }, { id: 2 }]);
        expect(result.current.count).toBe(2);
        expect(result.current.globalSettings).toEqual(settings);
    });

    it('ignores a slower response for filters that were replaced', async () => {
        let resolveFirst: (value: unknown) => void = () => {};
        (getPaymentMethodsApi as Mock)
            .mockReturnValueOnce(
                new Promise(resolve => {
                    resolveFirst = resolve;
                })
            )
            .mockResolvedValueOnce(responseWith([2]));
        const { result, rerender } = renderHook(({ filter }) => useGetPaymentMethods(filter), {
            initialProps: { filter: filters() },
        });

        rerender({ filter: filters({ pgProvider: 'ccavenue_pg' }) });
        await waitFor(() => expect(result.current.tableData).toEqual([{ id: 2 }]));
        await act(async () => {
            resolveFirst(responseWith([1]));
        });

        expect(result.current.tableData).toEqual([{ id: 2 }]);
    });

    it('refreshes the rows in place without showing the loading state', async () => {
        (getPaymentMethodsApi as Mock).mockResolvedValue(responseWith([1]));
        const filter = filters();
        const { result } = renderHook(() => useGetPaymentMethods(filter));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let resolveRefresh: (value: unknown) => void = () => {};
        (getPaymentMethodsApi as Mock).mockReturnValueOnce(
            new Promise(resolve => {
                resolveRefresh = resolve;
            })
        );
        act(() => result.current.refetchRowsInPlace());

        expect(result.current.isLoading).toBe(false);
        await act(async () => {
            resolveRefresh(responseWith([1, 3]));
        });
        expect(result.current.tableData).toEqual([{ id: 1 }, { id: 3 }]);
    });

    it('keeps the last rows when loading fails', async () => {
        (getPaymentMethodsApi as Mock).mockResolvedValueOnce(responseWith([1]));
        const filter = filters();
        const { result } = renderHook(() => useGetPaymentMethods(filter));
        await waitFor(() => expect(result.current.tableData).toEqual([{ id: 1 }]));

        (getPaymentMethodsApi as Mock).mockResolvedValueOnce(false);
        await act(async () => {
            result.current.reload();
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.tableData).toEqual([{ id: 1 }]);
    });
});
