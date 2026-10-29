import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { reportListing } from '../../api/index';
import { useGetReportsApi } from '../../hooks/useGetReportsApi';

// Mock API response
const mockReportData = {
    totalData: 2,
    result: [
        {
            transactionDate: '2024-02-15',
            corporateTxnId: 'REP123',
            transactionCategory: 'Shopping',
            serviceOperator: { serviceProvider: 'Amazon' },
            order: {
                amountInINR: 500,
                paymentMode: 'credit_card',
                status: 'Success',
                accountNo: '123456789',
                subCorporateUser: { name: 'John Doe' },
            },
            corporateCashback: 50,
        },
        {
            transactionDate: '2024-02-16',
            corporateTxnId: 'REP124',
            transactionCategory: 'Food',
            serviceOperator: { serviceProvider: 'Uber Eats' },
            order: {
                amountInINR: 200,
                paymentMode: 'debit_card',
                status: 'Pending',
                accountNo: '987654321',
                subCorporateUser: { name: 'Jane Doe' },
            },
            corporateCashback: 20,
        },
    ],
};

// Mock the API call
vi.mock('../../api/index', () => ({
    reportListing: vi.fn(),
}));

// Mock useAppSelector to return user auth data
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useGetReportsApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches report data and updates state correctly', async () => {
        (useAppSelector as any).mockReturnValue({ role: 'admin', id: 1 });
        (reportListing as any).mockResolvedValue(mockReportData);

        const { result } = renderHook(() =>
            useGetReportsApi(
                'test',
                'Shopping',
                'asc',
                1,
                10,
                '',
                '2024-02-01',
                '2024-02-28',
                'date'
            )
        );

        expect(result.current.orderLoading).toBe(true);
        expect(result.current.orderData).toEqual([]);

        await act(async () => {});

        expect(result.current.orderLoading).toBe(false);
        expect(result.current.orderCount).toBe(2);
        expect(result.current.orderData).toEqual([
            {
                date: '2024-02-15',
                transactionID: 'REP123',
                category: 'Shopping',
                operator: 'Amazon',
                amount: 500,
                paymentMode: 'Credit_card',
                cashback: 50,
                status: 'Success',
                download: 'Download invoice',
                accountNumber: '123456789',
                subCorporateName: 'John Doe',
            },
            {
                date: '2024-02-16',
                transactionID: 'REP124',
                category: 'Food',
                operator: 'Uber Eats',
                amount: 200,
                paymentMode: 'Debit_card',
                cashback: 20,
                status: 'Pending',
                download: 'Download invoice',
                accountNumber: '987654321',
                subCorporateName: 'Jane Doe',
            },
        ]);
    });

    it('shows the instrument the customer paid with as sent, and falls back to the payment mode', async () => {
        (useAppSelector as any).mockReturnValue({ role: 'corporate', id: 1 });
        const [first, second] = mockReportData.result;
        (reportListing as any).mockResolvedValue({
            totalData: 2,
            result: [
                {
                    ...first,
                    order: {
                        ...first.order,
                        paymentMode: 'PAYMENT GATEWAY + WALLET',
                        paymentInstrument: 'UPI + Wallet',
                    },
                },
                {
                    ...second,
                    order: {
                        ...second.order,
                        paymentMode: 'PAYMENT GATEWAY',
                        paymentInstrument: null,
                    },
                },
            ],
        });

        const { result } = renderHook(() =>
            useGetReportsApi('', '', 'DESC', 1, 10, '', '2024-02-01', '2024-02-28', '')
        );
        await act(async () => {});

        expect(result.current.orderData.map(row => row.paymentMode)).toEqual([
            'UPI + Wallet',
            'Payment gateway',
        ]);
    });

    it('handles API failure gracefully', async () => {
        (reportListing as any).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useGetReportsApi(
                'test',
                'Shopping',
                'asc',
                1,
                10,
                '',
                '2024-02-01',
                '2024-02-28',
                'date'
            )
        );

        await act(async () => {});

        expect(result.current.orderLoading).toBe(false);
        expect(result.current.orderCount).toBeUndefined();
        expect(result.current.orderData).toEqual([]);
    });
});
