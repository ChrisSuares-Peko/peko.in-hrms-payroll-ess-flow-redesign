import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { getAllPaymentLinks, resendPaymentLinkApi } from '../../api/index';
import { useAllpaymentLinks } from '../../hooks/useGetAllPaymentLinksApi';

vi.mock('../../api/index', () => ({
    getAllPaymentLinks: vi.fn(),
    resendPaymentLinkApi: vi.fn(),
}));
const dispatchMock = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        id: 'user123',
        role: 'admin',
    })),
    useAppDispatch: () => dispatchMock,
}));

describe('useAllpaymentLinks', () => {
    const mockData = {
        data: [
            { id: 1, reference_id: '123ABC', amount: '5000', status: 'paid' },
            { id: 2, reference_id: '456DEF', amount: '10000', status: 'pending' },
        ],
        recordsTotal: 2,
        statistics: { totalPaid: 5000, totalPending: 10000 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch payment links data on mount', async () => {
        (getAllPaymentLinks as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() =>
            useAllpaymentLinks({
                searchText: '',
                itemsPerPage: 10,
                page: 1,
                sort: 'DESC',
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(getAllPaymentLinks).toHaveBeenCalledTimes(1);
        expect(result.current.tableData).toEqual(mockData.data);
        expect(result.current.count).toBe(2);
        expect(result.current.statisticsData).toEqual(mockData.statistics);
    });

    it('should handle API failure gracefully', async () => {
        (getAllPaymentLinks as Mock).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useAllpaymentLinks({
                searchText: '',
                itemsPerPage: 10,
                page: 1,
                sort: 'DESC',
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(getAllPaymentLinks).toHaveBeenCalledTimes(1);
        expect(result.current.tableData).toEqual([]);
        expect(result.current.count).toBe(1);
        expect(result.current.statisticsData).toBeUndefined();
    });

    it('should refresh data when setRefresh is called', async () => {
        (getAllPaymentLinks as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() =>
            useAllpaymentLinks({
                searchText: '',
                itemsPerPage: 10,
                page: 1,
                sort: 'DESC',
            })
        );

        await waitFor(() => expect(getAllPaymentLinks).toHaveBeenCalledTimes(1));

        act(() => {
            result.current.setRefresh(true);
        });

        await waitFor(() => expect(getAllPaymentLinks).toHaveBeenCalledTimes(2));
    });

    it('should call resendPaymentLinkApi and show success toast on successful resend', async () => {
        (resendPaymentLinkApi as Mock).mockResolvedValue({});

        const { result } = renderHook(() =>
            useAllpaymentLinks({
                searchText: '',
                itemsPerPage: 10,
                page: 1,
                sort: 'DESC',
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        await act(async () => {
            await result.current.resendPaymentLink(1);
        });

        expect(resendPaymentLinkApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            paymentLinkId: 1,
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({
                description: 'Payment link sent successfully.',
                variant: 'success',
            })
        );
    });

    it('should handle resend API failure properly', async () => {
        (resendPaymentLinkApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useAllpaymentLinks({
                searchText: '',
                itemsPerPage: 10,
                page: 1,
                sort: 'DESC',
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        await act(async () => {
            await result.current.resendPaymentLink(1);
        });

        expect(resendPaymentLinkApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            paymentLinkId: 1,
        });

        expect(dispatchMock).not.toHaveBeenCalled();
    });
});
