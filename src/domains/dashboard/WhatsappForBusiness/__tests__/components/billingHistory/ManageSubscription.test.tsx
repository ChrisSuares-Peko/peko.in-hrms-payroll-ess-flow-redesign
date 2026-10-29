import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';

import ManageSubscription from '../../../components/billingHistory/ManageSubscription';
import { useGetActiveSubscription } from '../../../hooks/useGetActiveSubscription';
import { useReActivateBillingApi } from '../../../hooks/useReActivateBilling';

const mockReactivateBilling = vi.fn();

vi.mock('../../../hooks/useGetActiveSubscription', () => ({
    useGetActiveSubscription: vi.fn(() => ({
        data: {},
        isLoading: false,
        error: null,
        refresh: vi.fn(),
    })),
}));
vi.mock('../../../hooks/useReActivateBilling', () => ({
    useReActivateBillingApi: vi.fn(() => ({
        reactivateBilling: mockReactivateBilling,
        isLoading: false,
    })),
}));
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        reducer: {
            user: { username: 'testUser' },
        },
    })),
}));
describe('ManageSubscription Component', () => {
    const mockSetRefresh = vi.fn();

    const mockSubscriptionData = {
        activeSubscriptions: {
            billingPlan: 'Premium',
            subscriptionAmountPaid: '1500',
            status: 'ACTIVE',
            subscriptionStartDate: '2024-01-01T00:00:00Z',
            subscriptionEndDate: '2024-12-31T23:59:59Z',
            billingType: 'monthly',
            projectId: 'test_project_123',
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays skeleton loader while loading', () => {
        (useGetActiveSubscription as Mock).mockReturnValue({ isLoading: true });
        render(<ManageSubscription setRefresh={mockSetRefresh} />);
        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('renders subscription details correctly', () => {
        (useGetActiveSubscription as Mock).mockReturnValue({
            data: mockSubscriptionData,
            isLoading: false,
        });

        render(<ManageSubscription setRefresh={mockSetRefresh} />);

        expect(screen.getByText('Whatsapp for business - Premium')).toBeInTheDocument();
        expect(screen.getByText('INR 1500.00')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Card - Auto')).toBeInTheDocument();
    });

    it('shows "Cancel my plan" button for active subscriptions', () => {
        (useGetActiveSubscription as Mock).mockReturnValue({
            data: mockSubscriptionData,
            isLoading: false,
        });

        render(<ManageSubscription setRefresh={mockSetRefresh} />);
        expect(screen.getByText(/Cancel my plan/i)).toBeInTheDocument();
    });

    it('shows "Re Activate plan" button for inactive subscriptions', () => {
        (useGetActiveSubscription as Mock).mockReturnValue({
            data: {
                ...mockSubscriptionData,
                activeSubscriptions: {
                    ...mockSubscriptionData.activeSubscriptions,
                    status: 'INACTIVE',
                },
            },
            isLoading: false,
        });

        render(<ManageSubscription setRefresh={mockSetRefresh} />);
        expect(screen.getByText(/Re Activate plan/i)).toBeInTheDocument();
    });

    it('opens confirmation modal when "Cancel my plan" is clicked', async () => {
        (useGetActiveSubscription as Mock).mockReturnValue({
            data: mockSubscriptionData,
            isLoading: false,
        });

        render(<ManageSubscription setRefresh={mockSetRefresh} />);
        fireEvent.click(screen.getByText(/Cancel my plan/i));

        await waitFor(() => {
            expect(
                screen.getByText(/Are you sure you want to cancel your monthly subscription\?/i)
            ).toBeInTheDocument();
        });
    });

    it('calls reactivateBilling when "Re Activate plan" is clicked', async () => {
        (useGetActiveSubscription as Mock).mockReturnValue({
            data: {
                ...mockSubscriptionData,
                activeSubscriptions: {
                    ...mockSubscriptionData.activeSubscriptions,
                    status: 'INACTIVE',
                },
            },
            isLoading: false,
        });
        (useReActivateBillingApi as Mock).mockReturnValue({
            reactivateBilling: mockReactivateBilling,
        });

        render(<ManageSubscription setRefresh={mockSetRefresh} />);
        fireEvent.click(screen.getByText(/Re Activate plan/i));

        await waitFor(() => expect(mockReactivateBilling).toHaveBeenCalledWith('test_project_123'));
    });
});
