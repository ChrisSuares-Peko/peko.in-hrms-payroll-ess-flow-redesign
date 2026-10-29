import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import CouponCodeCard from '../../components/CouponCodeCard';

// Mock the `showToast` action
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(() => ({ type: 'SHOW_TOAST' })), // Ensure it returns a plain object
}));

const mockStore = configureStore([]);

describe('CouponCodeCard Component', () => {
    let store: any;
    const mockDispatch = vi.fn(); // Mock dispatch function

    beforeEach(() => {
        store = mockStore({});
        vi.clearAllMocks();
        store.dispatch = mockDispatch; // Override store dispatch
    });

    it('should allow copying the coupon code to clipboard', async () => {
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn(),
            },
        });

        const mockCreditsData = [
            {
                serviceName: 'Spotify',
                discount: 15,
                couponCode: 'SPOTIFY15',
                isClaimed: false,
                validity: '2024-10-20',
                discountType: 'FLAT',
            },
        ];

        render(
            <Provider store={store}>
                <CouponCodeCard creditsData={mockCreditsData} isAnimate={false} />
            </Provider>
        );

        const copyButton = screen.getByText('SPOTIFY15');
        fireEvent.click(copyButton);

        // Check if clipboard was written
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('SPOTIFY15');

        // Check if showToast was dispatched correctly
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SHOW_TOAST', // This ensures Redux doesn't throw an error
        });
    });
});
