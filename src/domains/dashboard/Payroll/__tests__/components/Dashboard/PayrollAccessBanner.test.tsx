import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';

import PayrollAccessBanner from '../../../components/Dashboard/PayrollAccessBanner';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('@src/hooks/useSubscriptionAddons', () => ({
    default: vi.fn(),
}));

vi.mock('../../../hooks/dashboardHooks/useGetEmployeeCount', () => ({
    default: () => ({ count: 5, isLoading: false }),
}));

const addonData = {
    unitPrice: 99,
    maxLimit: 3,
    freeBaseLimit: 3,
    addonLimit: 0,
    packageId: 1,
    isDynamicUnitPricing: false,
    isAddonPurchaseAllowed: true,
};

const mockAddonDetails = (value: Record<string, unknown>) =>
    vi.mocked(useGetAddonDetails).mockReturnValue({
        purchaseData: { addOns: null },
        refresh: vi.fn(),
        ...value,
    } as any);

describe('PayrollAccessBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing while add-on details are loading', () => {
        mockAddonDetails({ addonData: undefined, isLoading: true });

        const { container } = render(<PayrollAccessBanner />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the add-on details could not be loaded', () => {
        mockAddonDetails({ addonData: undefined, isLoading: false });

        const { container } = render(<PayrollAccessBanner />);

        expect(container).toBeEmptyDOMElement();
    });

    it('prompts to buy add-ons when employees exceed the plan and add-ons are allowed', () => {
        mockAddonDetails({ addonData, isLoading: false });

        render(<PayrollAccessBanner />);

        expect(screen.getByText(/Buy 2 more addons monthly/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Buy addons' })).toBeInTheDocument();
    });

    it('prompts to view plans when employees exceed the plan and add-ons are not allowed', () => {
        mockAddonDetails({
            addonData: { ...addonData, unitPrice: 0, isAddonPurchaseAllowed: false },
            isLoading: false,
        });

        render(<PayrollAccessBanner />);

        expect(screen.getByText(/outgrown your current plan/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'View plans' })).toBeInTheDocument();
    });
});
