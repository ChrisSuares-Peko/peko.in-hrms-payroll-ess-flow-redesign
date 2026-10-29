import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';

import SubscriptionSettings from '../../../components/organizationSettings/SubscriptionSettings';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('react-svg', () => ({
    ReactSVG: () => null,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: any) =>
        selector({ reducer: { user: { user: { roleName: 'admin' } } } }),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ md: true }),
}));

vi.mock('@src/hooks/useSubscriptionAddons', () => ({
    default: vi.fn(),
}));

vi.mock('@src/domains/dashboard/settings/api/subscription', () => ({
    cancelSubscriptionPatch: vi.fn(),
}));

vi.mock('../../../hooks/dashboardHooks/useGetEmployeeCount', () => ({
    default: () => ({ count: 2, date: undefined, isLoading: false }),
}));

vi.mock('../../../components/organizationSettings/PlanDetails', () => ({
    default: () => <div>PlanDetails</div>,
}));

const purchaseData = {
    currentSubscription: { package: { id: 1, packageName: 'Peko Go' } },
    addOns: null,
    isGroupSubscription: true,
};

const allowedAddon = {
    unitPrice: 99,
    maxLimit: 10,
    freeBaseLimit: 10,
    addonLimit: 0,
    packageId: 1,
    isDynamicUnitPricing: false,
    isAddonPurchaseAllowed: true,
};

const chargeNote = /Note: You will be charged/;
const upgradeNotice = /Purchase an individual or group subscription to buy additional employees/;

const mockAddonDetails = (value: Record<string, unknown>) =>
    vi.mocked(useGetAddonDetails).mockReturnValue({ refresh: vi.fn(), ...value } as any);

describe('Payroll SubscriptionSettings — additional employees', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows skeletons instead of the add-on options while add-on details load', () => {
        mockAddonDetails({ addonData: undefined, purchaseData: undefined, isLoading: true });

        const { container } = render(<SubscriptionSettings />);

        expect(screen.getByText('Manage Additional Employees')).toBeInTheDocument();
        expect(container.querySelectorAll('.ant-skeleton')).toHaveLength(2);
        expect(screen.queryByText(chargeNote)).not.toBeInTheDocument();
        expect(screen.queryByText(upgradeNotice)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    });

    it('shows the purchase form when add-ons are allowed', () => {
        mockAddonDetails({ addonData: allowedAddon, purchaseData, isLoading: false });

        render(<SubscriptionSettings />);

        expect(screen.getByText(chargeNote)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
        expect(screen.queryByText(upgradeNotice)).not.toBeInTheDocument();
    });

    it('keeps the purchase form on screen while a refresh is in flight', () => {
        mockAddonDetails({ addonData: allowedAddon, purchaseData, isLoading: true });

        const { container } = render(<SubscriptionSettings />);

        expect(container.querySelectorAll('.ant-skeleton')).toHaveLength(0);
        expect(screen.getByText(chargeNote)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('shows the upgrade notice when add-ons are not allowed', () => {
        mockAddonDetails({
            addonData: { ...allowedAddon, unitPrice: 0, isAddonPurchaseAllowed: false },
            purchaseData,
            isLoading: false,
        });

        render(<SubscriptionSettings />);

        expect(screen.getByText(upgradeNotice)).toBeInTheDocument();
        expect(screen.queryByText(chargeNote)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    });

    it('shows the upgrade notice when the add-on details could not be loaded', () => {
        mockAddonDetails({ addonData: undefined, purchaseData, isLoading: false });

        render(<SubscriptionSettings />);

        expect(screen.getByText(upgradeNotice)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    });
});
