import { render, fireEvent, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MockStoreEnhanced } from 'redux-mock-store';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { store, createTestStore } from '@store/store';

import OfferLessCard from '../../components/SubscriptionListing/OfferLessCard';

vi.mock('react-router-dom', async importOriginal => {
    const actual: {} = await importOriginal();
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('Offer Less card', () => {
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

    test('renders OfferLessCard with no image', () => {
        const { container } = render(
            <Provider store={mockStore}>
                <OfferLessCard
                    discount=""
                    title="Test Title"
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

    test('renders OfferLessCard and triggers events on click', () => {
        const { getByText } = render(
            <Provider store={mockStore}>
                <OfferLessCard
                    discount=""
                    title="Test Title"
                    description="Test Description"
                    image="test-image-url"
                    id={123}
                />
            </Provider>
        );

        expect(getByText('Test Title')).toBeInTheDocument();

        // Simulate click event
        fireEvent.click(getByText('Test Title'));

        expect(mockNavigate).toHaveBeenCalledWith('/softwares/details/123');
    });

    test('handles click event with various titles', () => {
        const titles = ['Title A', 'Title B', 'Title C'];

        titles.forEach(title => {
            const { getByText } = render(
                <Provider store={mockStore}>
                    <OfferLessCard
                        discount=""
                        title={title}
                        description="Test Description"
                        image="test-image-url"
                        id={123}
                    />
                </Provider>
            );

            fireEvent.click(getByText(title));

            expect(mockNavigate).toHaveBeenCalledWith(`/softwares/details/123`);
        });
    });
});
