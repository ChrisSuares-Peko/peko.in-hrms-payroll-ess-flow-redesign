import { renderHook, act, cleanup, waitFor } from '@testing-library/react';
import { vi, describe, it, Mock, expect, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { setPaymentData } from '@src/slices/payment';

import { fetchBill } from '../../api/index';
import usePaymentApi from '../../hooks/useFetchBillApi';

vi.mock('../../utils/data', () => ({
    billPayments: [
        {
            accessKey: 'testAccessKey',
            apiUrl: '/test-api-url',
            title: 'Test Service',
        },
    ],
}));

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

vi.mock('../../api/index', () => ({
    fetchBill: vi.fn(),
}));

const mockUseAppSelector = useAppSelector as Mock;
const mockGetSurcharge = getSurcharge as Mock;
const mockFetchBill = fetchBill as Mock;

describe('usePaymentApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        mockUseAppSelector.mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should initialize with loading state as false', () => {
        const { result } = renderHook(() => usePaymentApi());
        expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state when handlePayment is called', async () => {
        const { result } = renderHook(() => usePaymentApi());

        act(() => {
            result.current.handlePayment({}, 'testAccessKey');
        });

        expect(result.current.isLoading).toBe(true);
    });

    it('should call fetchBill with correct parameters', async () => {
        mockFetchBill.mockResolvedValue(false);

        const { result } = renderHook(() => usePaymentApi());

        await act(async () => {
            await result.current.handlePayment({ serviceProvider: 'biller1' }, 'testAccessKey');
        });

        await waitFor(() => {
            expect(mockFetchBill).toHaveBeenCalledWith({
                apiPath: '/test-api-url',
                userId: '123',
                userType: 'admin',
                billerId: 'biller1',
                customerParams: { input: [] },
            });
        });
    });

    it('should handle API failure gracefully', async () => {
        mockFetchBill.mockResolvedValue(false);

        const { result } = renderHook(() => usePaymentApi());

        await act(async () => {
            await result.current.handlePayment({ serviceProvider: 'biller1' }, 'testAccessKey');
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should fetch surcharge and calculate total amount correctly', async () => {
        mockFetchBill.mockResolvedValue({
            requestId: 'req123',
            billAmount: '1000',
            customerName: 'John Doe',
            dueDate: '2025-02-10',
            billDate: '2025-02-05',
        });

        mockGetSurcharge.mockResolvedValue({
            surcharge: '50',
            corporateCashback: '10',
        });

        const { result } = renderHook(() => usePaymentApi());

        await act(async () => {
            await result.current.handlePayment({ serviceProvider: 'biller1' }, 'testAccessKey');
        });

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith(
                setPaymentData(
                    expect.objectContaining({
                        totalAmount: 1050,
                        earningCashbackAmount: 10,
                    })
                )
            );
        });
    });

    it('should navigate to payments page after successful payment setup', async () => {
        mockFetchBill.mockResolvedValue({
            requestId: 'req123',
            billAmount: '1000',
            customerName: 'John Doe',
            dueDate: '2025-02-10',
            billDate: '2025-02-05',
        });

        mockGetSurcharge.mockResolvedValue(false);

        const { result } = renderHook(() => usePaymentApi());

        await act(async () => {
            await result.current.handlePayment({ serviceProvider: 'biller1' }, 'testAccessKey');
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/payments');
        });
    });

    // it('should calculate minimum and maximum amount correctly based on bill exactness', async () => {
    //     mockFetchBill.mockResolvedValue({
    //         requestId: 'req123',
    //         billAmount: '500',
    //         exactness: 'BELOW',
    //     });

    //     mockGetSurcharge.mockResolvedValue(false);

    //     const { result } = renderHook(() => usePaymentApi());

    //     await act(async () => {
    //         await result.current.handlePayment({ serviceProvider: 'biller1' }, 'testAccessKey');
    //     });

    //     await waitFor(() => {
    //         expect(mockDispatch).toHaveBeenCalledWith(
    //             setPaymentData({
    //                 minimumAmount: undefined,
    //                 maximumAmount: undefined,
    //                 billSummary: [
    //                     {
    //                         key: 'Service Name',
    //                         value: 'Test Service',
    //                     },
    //                     {
    //                         key: 'Amount',
    //                         value: '500',
    //                     },
    //                 ],
    //                 earningCashbackAmount: 0,
    //                 payload: {
    //                     accessKey: 'testAccessKey',
    //                     amount: 500,
    //                     billerId: 'biller1',
    //                     billerResponse: {
    //                         billAmount: '500',
    //                         exactness: 'BELOW',
    //                     },
    //                     requestId: 'req123',
    //                     customerParams: {
    //                         input: [],
    //                     },
    //                     paymentSummary: [{ key: 'Platform fee (inclusive of GST)', value: 0 }],
    //                     title: 'Recharge Summary',
    //                     totalAmount: 500,
    //                     url: 'payment//test-api-url/payment',
    //                 },
    //             })
    //         );
    //     });
    // });

    it('should handle empty surcharge response correctly', async () => {
        mockFetchBill.mockResolvedValue({
            requestId: 'req123',
            billAmount: '2000',
            customerName: 'John Doe',
        });

        mockGetSurcharge.mockResolvedValue(false);

        const { result } = renderHook(() => usePaymentApi());

        await act(async () => {
            await result.current.handlePayment({ serviceProvider: 'biller1' }, 'testAccessKey');
        });

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith(
                setPaymentData(
                    expect.objectContaining({
                        totalAmount: 2000,
                        earningCashbackAmount: 0,
                    })
                )
            );
        });
    });

    it('sends a Traffic Challan beneficiary to the challan page instead of the BBPS bill flow', async () => {
        const { result } = renderHook(() => usePaymentApi());

        await act(async () => {
            await result.current.handleBeneficiaryPayment({
                accessKey: 'droom_traffic_challan',
                billerId: null,
                serviceProvider: '',
                customerParams: [{ name: 'vehicleNumber', value: 'BR28S5870' }],
            } as any);
        });

        expect(mockNavigate).toHaveBeenCalledWith(
            '/utility-payments/traffic-challan?vehicle=BR28S5870'
        );
        expect(mockFetchBill).not.toHaveBeenCalled();
    });
});
