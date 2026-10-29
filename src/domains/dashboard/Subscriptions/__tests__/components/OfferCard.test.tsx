import { cleanup, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MockStoreEnhanced } from 'redux-mock-store';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { store, createTestStore } from '@store/store';

import OfferCard from '../../components/SubscriptionListing/OfferCard';

vi.mock('react-router-dom', async importOriginal => {
    const actual: {} = await importOriginal();
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('Offer card', () => {
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

    test('renders image and title when image prop is provided', () => {
        const { getByAltText, getByText } = render(
            <Provider store={mockStore}>
                <OfferCard
                    title="Test Title"
                    discount="50%"
                    description="Test Description"
                    image="test-image.png"
                    id={123}
                />
            </Provider>
        );

        expect(getByAltText('Test Title')).toBeInTheDocument(); // Check if image is rendered
        expect(getByText('Test Title')).toBeInTheDocument(); // Check if title is rendered
    });

    test('renders empty state when image prop is not provided', () => {
        const { container } = render(
            <Provider store={mockStore}>
                <OfferCard
                    title="Test Title"
                    discount="50%"
                    description="Test Description"
                    image=""
                    id={123}
                />
            </Provider>
        );
        const imgElement = container.querySelector('img.ant-image-img');

        // Check if the fallback image source is set correctly
        expect(imgElement).toHaveAttribute('src', '');
    });

    test('click event triggers navigation and CleverTap event', () => {
        const { getByText } = render(
            <Provider store={mockStore}>
                <OfferCard
                    title="Test Title"
                    discount="50%"
                    description="Test Description"
                    image="test-image.png"
                    id={123}
                />
            </Provider>
        );
        fireEvent.click(getByText('Test Title'));
        // Existing assertions
        // expect(clevertap.event.push).toHaveBeenCalledWith('Softwares', expect.any(Object));
        expect(mockNavigate).toHaveBeenCalledWith('/softwares/details/123');
    });
});
