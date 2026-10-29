import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { subscriptionTransactionListing } from '../../api/index';
import { useSubscriptionApi } from '../../hooks/useSubscriptionApi';

// Mock API response
const mockSubscriptionData = {
    totalData: 2,
    result: [
        {
            transactionDate: '2024-02-15',
            corporateTxnId: 'SUB123',
            orderResponse: JSON.stringify({
                billingType: 'monthly',
                serviceName: 'Netflix',
            }),
            amountInINR: 799,
            paymentMode: 'credit_card',
            status: 'Active',
            corporateCashback: 100,
            subCorporateUser: { name: 'Alice Doe' },
        },
        {
            transactionDate: '2024-02-16',
            corporateTxnId: 'SUB124',
            orderResponse: JSON.stringify({
                billingType: 'yearly',
                serviceName: 'Spotify',
            }),
            amountInINR: 1299,
            paymentMode: 'debit_card',
            status: 'Inactive',
            corporateCashback: 150,
            subCorporateUser: { name: 'Bob Smith' },
        },
    ],
};

// Mock the API call
vi.mock('../../api/index', () => ({
    subscriptionTransactionListing: vi.fn(),
}));

// Mock useAppSelector to return user auth data
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useSubscriptionApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches subscription data and updates state correctly', async () => {
        // Mock user auth state
        (useAppSelector as any).mockReturnValue({ role: 'admin', id: 1 });

        // Mock API response
        (subscriptionTransactionListing as any).mockResolvedValue(mockSubscriptionData);

        // Render hook
        const { result } = renderHook(() =>
            useSubscriptionApi(
                'test',
                'Streaming',
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
        expect(result.current.subscriptionLoading).toBe(true);
        expect(result.current.subscriptionData).toEqual([]);

        // Wait for data fetch
        await act(async () => {});

        // Verify updated state
        expect(result.current.subscriptionLoading).toBe(false);
        expect(result.current.subscriptionCount).toBe(2);
        expect(result.current.subscriptionData).toEqual([
            {
                date: '2024-02-15',
                transactionID: 'SUB123',
                serviceName: 'Netflix',
                amount: 799,
                paymentMode: 'Credit_card',
                status: 'Active',
                billingType: 'Monthly',
                download: 'Download invoice',
                cashback: 100,
                accountNumber: '',
                subCorporateName: 'Alice Doe',
            },
            {
                date: '2024-02-16',
                transactionID: 'SUB124',
                serviceName: 'Spotify',
                amount: 1299,
                paymentMode: 'Debit_card',
                status: 'Inactive',
                billingType: 'Yearly',
                download: 'Download invoice',
                cashback: 150,
                accountNumber: '',
                subCorporateName: 'Bob Smith',
            },
        ]);
    });

    it('handles API failure gracefully', async () => {
        // Mock API failure response
        (subscriptionTransactionListing as any).mockResolvedValue(false);

        // Render hook
        const { result } = renderHook(() =>
            useSubscriptionApi(
                'test',
                'Streaming',
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
        expect(result.current.subscriptionLoading).toBe(false);
        expect(result.current.subscriptionCount).toBeUndefined();
        expect(result.current.subscriptionData).toEqual([]);
    });
});
