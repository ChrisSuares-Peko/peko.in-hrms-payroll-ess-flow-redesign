import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';

import SubscriptionSettings from '../../../components/settings/SubscriptionSettings';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn().mockReturnValue({
        user: { roleName: 'admin' },
    }),
}));
vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ md: true }),
}));
vi.mock('../../../hooks/useGetESignCount', () => ({
    default: () => ({
        count: 5,
        lastAdded: '2024-01-01',
        isLoading: false,
    }),
}));
vi.mock('@src/hooks/useSubscriptionAddons', () => ({
    default: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const purchaseData = {
    currentSubscription: {
        billingType: 'monthly',
        subscriptionAmountPaid: 500,
        maxLimit: 100,
        status: 'active',
        subscriptionStartDate: '2023-01-01',
        subscriptionEndDate: '2023-12-31',
        package: { packageName: 'Basic Plan' },
    },
    isGroupSubscription: false,
};

const addonData = { maxLimit: 50, unitPrice: 10, isAddonPurchaseAllowed: true };

const upgradeNotice = /Purchase an individual or group subscription to buy additional eSigns/;

const mockStore = configureStore();
const store = mockStore({});

const renderSettings = () =>
    render(
        <Provider store={store}>
            <MemoryRouter>
                <SubscriptionSettings />
            </MemoryRouter>
        </Provider>
    );

describe('SubscriptionSettings Component', () => {
    beforeEach(() => {
        vi.mocked(useGetAddonDetails).mockReturnValue({
            addonData,
            purchaseData,
            isLoading: false,
        } as any);
    });

    it('renders the component correctly', () => {
        renderSettings();

        expect(screen.getByText('Basic Plan - Monthly')).toBeInTheDocument();
        expect(screen.getByText(/₹ 500/i)).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    it('displays an error if Continue is clicked without selecting eSigns', () => {
        renderSettings();

        fireEvent.click(screen.getByText('Continue'));

        expect(screen.getByText('Please select number of additional eSigns.')).toBeInTheDocument();
    });

    it('shows skeletons instead of the limit and purchase options while add-on details load', () => {
        vi.mocked(useGetAddonDetails).mockReturnValue({
            addonData: undefined,
            purchaseData: undefined,
            isLoading: true,
        } as any);

        const { container } = renderSettings();

        expect(screen.getByText('Manage Additional eSign')).toBeInTheDocument();
        expect(screen.queryByText('Continue')).not.toBeInTheDocument();
        expect(screen.queryByText(upgradeNotice)).not.toBeInTheDocument();
        expect(screen.queryByText(/used of/)).not.toBeInTheDocument();
        expect(container.querySelectorAll('.ant-skeleton')).toHaveLength(3);
    });

    it('shows the upgrade notice instead of the purchase options when add-ons are not allowed', () => {
        vi.mocked(useGetAddonDetails).mockReturnValue({
            addonData: { ...addonData, unitPrice: 0, isAddonPurchaseAllowed: false },
            purchaseData,
            isLoading: false,
        } as any);

        renderSettings();

        expect(screen.getByText(upgradeNotice)).toBeInTheDocument();
        expect(screen.queryByText('Continue')).not.toBeInTheDocument();
    });

    it('shows the upgrade notice when the add-on details could not be loaded', () => {
        vi.mocked(useGetAddonDetails).mockReturnValue({
            addonData: undefined,
            purchaseData,
            isLoading: false,
        } as any);

        renderSettings();

        expect(screen.getByText(upgradeNotice)).toBeInTheDocument();
        expect(screen.queryByText('Continue')).not.toBeInTheDocument();
    });
});
