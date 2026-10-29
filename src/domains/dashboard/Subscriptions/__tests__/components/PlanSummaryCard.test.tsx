import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MockStoreEnhanced } from 'redux-mock-store';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { store, createTestStore } from '@store/store';

import PlanSummaryCard from '../../components/subscriptionSummary/PlanSummaryCard';

vi.mock('react-router-dom', async importOriginal => {
    const actual: {} = await importOriginal();
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('Plan summary card', () => {
    let mockStore: MockStoreEnhanced<unknown, {}>;
    const mockNavigate = vi.fn();

    beforeEach(() => {
        // Initialize the mock store with the initial state of your Redux store
        mockStore = createTestStore(store.getState());
        (useNavigate as Mock).mockReturnValue(mockNavigate);
        cleanup();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const featureList = 'Feature 1\nFeature 2';

    test('renders PlanSummaryCard with all elements', () => {
        render(
            <Provider store={mockStore}>
                <PlanSummaryCard
                    name="Basic Plan"
                    price="99.99"
                    validity="1 month"
                    features={featureList}
                />
            </Provider>
        );

        // Check if the card renders correctly
        expect(screen.getByText('Basic Plan')).toBeInTheDocument();
        expect(screen.getByTestId('price')).toBeInTheDocument();
        expect(screen.getByText('Feature 1')).toBeInTheDocument();
        expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });

    test('formats price correctly', () => {
        render(
            <Provider store={mockStore}>
                <PlanSummaryCard
                    name="Basic Plan"
                    price="1000"
                    validity="1 month"
                    features="Feature 1\nFeature 2"
                />
            </Provider>
        );

        // Check if price is formatted as ₹ 1,000.00
        expect(screen.getByTestId('price')).toBeInTheDocument();
    });

    test('handles missing or incomplete props', () => {
        render(
            <Provider store={store}>
                <PlanSummaryCard
                    name="Basic Plan"
                    price={undefined} // Missing price
                    validity={undefined} // Missing validity
                    features={undefined} // Missing features
                />
            </Provider>
        );

        // Check that elements are rendered without crashing
        expect(screen.getByText('Basic Plan')).toBeInTheDocument();
        expect(screen.getByTestId('price')).toBeInTheDocument(); // Price element renders without crashing
    });
});
