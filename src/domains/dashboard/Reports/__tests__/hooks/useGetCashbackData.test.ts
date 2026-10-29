import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { CashbackListing } from '../../api/index';
import { useGetCashbackData } from '../../hooks/useGetCashbackData';

// Mock API response
const mockCashbackData = {
    totalData: 2,
    result: [
        {
            transactionDate: '2024-02-15',
            corporateTxnId: 'TXN123',
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
            corporateTxnId: 'TXN124',
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
    CashbackListing: vi.fn(),
}));

// Mock useAppSelector to return user auth data
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useGetCashbackData Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches cashback data and updates state correctly', async () => {
        // Mock user auth state
        (useAppSelector as any).mockReturnValue({ role: 'admin', id: 1 });

        // Mock API response
        (CashbackListing as any).mockResolvedValue(mockCashbackData);

        // Render hook
        const { result } = renderHook(() =>
            useGetCashbackData(
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

        // Verify initial state
        expect(result.current.cashbackLoading).toBe(true);
        expect(result.current.cashbackdata).toEqual([]);

        // Wait for data fetch
        await act(async () => {});

        // Verify updated state
        expect(result.current.cashbackLoading).toBe(false);
        expect(result.current.cashbackCount).toBe(2);
        expect(result.current.cashbackdata).toEqual([
            {
                date: '2024-02-15',
                transactionID: 'TXN123',
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
                transactionID: 'TXN124',
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

    it('handles API failure gracefully', async () => {
        // Mock API failure response
        (CashbackListing as any).mockResolvedValue(false);

        // Render hook
        const { result } = renderHook(() =>
            useGetCashbackData(
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

        // Wait for data fetch
        await act(async () => {});

        // Verify state after failure
        expect(result.current.cashbackLoading).toBe(false);
        expect(result.current.cashbackCount).toBeUndefined();
        expect(result.current.cashbackdata).toEqual([]);
    });
});
