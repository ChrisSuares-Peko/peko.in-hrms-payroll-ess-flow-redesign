import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { paths } from '@src/routes/paths';

import ESignLimitBar from '../../../components/landingPage/ESignLimitBar';

// Mock hooks and functions
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('@utils/calculatePercentage', () => ({
    calculatePercentage: vi.fn(() => 50), // Mock percentage calculation to always return 50%
}));

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        user: { roleName: 'admin' }, // Mock user role
    },
});

describe('ESignLimitBar Component', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as unknown as any).mockReturnValue(mockNavigate);
    });

    it('renders the eSign Limit text and progress bar', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ESignLimitBar
                        count={5}
                        countLoading={false}
                        addOnLoading={false}
                        addonData={{ maxLimit: 10, unitPrice: 0, packageId: 1, freeBaseLimit: 10, addonLimit: 0, isDynamicUnitPricing: false }}
                    />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('eSign Limit')).toBeInTheDocument();
        expect(screen.getByText('5 Signs used of 10 Signs')).toBeInTheDocument();
    });

    it('renders the Upgrade button and handles click event', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ESignLimitBar
                        count={5}
                        countLoading={false}
                        addOnLoading={false}
                        addonData={{ maxLimit: 10, unitPrice: 0, packageId: 1, freeBaseLimit: 10, addonLimit: 0, isDynamicUnitPricing: false }}
                    />
                </MemoryRouter>
            </Provider>
        );

        const upgradeButton = screen.getByRole('button', { name: /Upgrade/i });
        expect(upgradeButton).toBeInTheDocument();

        fireEvent.click(upgradeButton);
        expect(mockNavigate).toHaveBeenCalledWith(paths.eSign.settings);
    });

    it('displays a loading skeleton when count or addon data is loading', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <ESignLimitBar
                        count={5}
                        countLoading
                        addOnLoading
                        addonData={{ maxLimit: 10, unitPrice: 0, packageId: 1, freeBaseLimit: 10, addonLimit: 0, isDynamicUnitPricing: false }}
                    />
                </MemoryRouter>
            </Provider>
        );

        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });
});
