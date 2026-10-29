import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getPaymentOnboardingStatus } from '../../../api/onboarding';
import useVirtualAccounts from '../../../hooks/manageBankAccounts/useVirtualAccounts';

vi.mock('../../../api/onboarding', () => ({
    getPaymentOnboardingStatus: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useVirtualAccounts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should map activated onboarding into a virtual account entry', async () => {
        (getPaymentOnboardingStatus as Mock).mockResolvedValue({
            status: true,
            data: {
                id: 77,
                activatedAt: '2024-02-01',
                businessName: 'Acme',
                bankName: 'Bank',
                virtualAccountNumber: 'VA77',
                ifsc: 'IFSC77',
            },
        });

        const { result } = renderHook(() => useVirtualAccounts());

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(result.current.accounts).toEqual([
            {
                id: '77',
                name: 'Acme',
                bankName: 'Bank',
                accountNumber: 'VA77',
                ifsc: 'IFSC77',
                currency: 'INR',
                type: 'Domestic',
            },
        ]);
    });

    it('should return empty accounts when onboarding is not activated', async () => {
        (getPaymentOnboardingStatus as Mock).mockResolvedValue({
            status: true,
            data: { id: 1 },
        });

        const { result } = renderHook(() => useVirtualAccounts());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(result.current.accounts).toEqual([]);
    });
});
