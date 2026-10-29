import React from 'react';

import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';

import ManageSubscription from '../../pages/ManageSubscription';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { role: 'admin', id: '12345' },
                user: { user: { firstName: 'John' } },
            },
        }),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ md: true }),
}));

vi.mock('../../hooks/useGetGarageUsage', () => ({
    default: () => ({
        details: { fleetsUsed: 2, driversUsed: 1 },
    }),
}));

vi.mock('@src/hooks/useSubscriptionAddons', () => ({
    default: vi.fn(),
}));

vi.mock('antd', async importOriginal => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        Progress: () => <div data-testid="progress" />,
    };
});

vi.stubGlobal('Moengage', undefined);

const addonData = {
    unitPrice: 1000,
    maxLimit: 10,
    packageId: 'pkg123',
    isAddonPurchaseAllowed: true,
};

const purchaseData = {
    currentSubscription: {
        package: { packageName: 'Turbo Basic' },
        billingType: 'monthly',
    },
    isGroupSubscription: false,
    addOns: {
        package: { packageName: 'Add-on Turbo Plus' },
    },
};

const mockStore = configureStore([]);
let store: any;

const renderPage = () =>
    render(
        <Provider store={store}>
            <BrowserRouter>
                <ManageSubscription />
            </BrowserRouter>
        </Provider>
    );

beforeEach(() => {
    store = mockStore({});
    mockNavigate.mockClear();
    vi.mocked(useGetAddonDetails).mockReturnValue({
        addonData,
        purchaseData,
        isLoading: false,
    } as any);
});

describe('ManageSubscription Component', () => {
    test('renders heading', () => {
        renderPage();
        expect(screen.getByText('Manage Subscription')).toBeInTheDocument();
    });

    test('updates fleet count and total amount when input is typed', () => {
        renderPage();

        const input = screen.getByPlaceholderText('Enter number of vehicles and drivers');
        fireEvent.change(input, { target: { value: '3' } });

        expect(screen.getByText(/3,000/)).toBeInTheDocument();
    });

    test('navigates to review order page on Continue click', () => {
        renderPage();

        const input = screen.getByPlaceholderText('Enter number of vehicles and drivers');
        fireEvent.change(input, { target: { value: '2' } });

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/plans/review-order');
    });

    test('shows the upgrade notice instead of the purchase input when add-ons are not allowed', () => {
        vi.mocked(useGetAddonDetails).mockReturnValue({
            addonData: { ...addonData, unitPrice: 0, isAddonPurchaseAllowed: false },
            purchaseData,
            isLoading: false,
        } as any);

        renderPage();

        expect(
            screen.getByText(
                /Purchase an individual or group subscription to buy additional vehicles and drivers/
            )
        ).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText('Enter number of vehicles and drivers')
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    });
});
