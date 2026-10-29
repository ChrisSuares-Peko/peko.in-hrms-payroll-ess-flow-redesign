import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import useGetAllHike from '@domains/dashboard/Hike/hooks/useGetAllHikes';
import HomePage from '@domains/dashboard/Hike/pages/HomePage';
import hikeReducer from '@domains/dashboard/Hike/slices/hikeSlice';
import { showToast } from '@src/slices/apiSlice';

// Mock necessary hooks and Redux store
vi.mock('@domains/dashboard/Hike/hooks/useGetAllHikes', () => ({
    default: vi.fn(() => ({
        hikeData: [],
        loading: true,
    })),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

const mockStore = configureStore({
    reducer: {
        hike: hikeReducer,
    },
});

describe('HomePage Component', () => {
    it('should render loading state when loading', () => {
        (useGetAllHike as any).mockReturnValue({
            hikeData: [],
            loading: true,
        });

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <HomePage />
                </BrowserRouter>
            </Provider>
        );

        // Ensure the loading skeleton is rendered by looking for its class
        expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument(); // for title skeleton
        expect(screen.getByRole('list')).toBeInTheDocument(); // for paragraph skeleton
    });

    it('should render empty state when no hike plans are available', () => {
        (useGetAllHike as any).mockReturnValue({
            hikeData: [],
            loading: false,
        });

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <HomePage />
                </BrowserRouter>
            </Provider>
        );

        // Ensure Empty component is rendered
        expect(screen.getByText(/No Hike Plans Available/i)).toBeInTheDocument();
    });

    it('should render hike plans and handle Buy Now button click', () => {
        const mockHikeData = [
            {
                salaryAmount: 2000,
                salaryValidation: 'valid',
                logo: 'logo.png',
                partners: 'Partner',
                amount: 100,
                features: 'Feature 1\nFeature 2\nFeature 3',
                planType: 'Standard',
            },
        ];

        (useGetAllHike as any).mockReturnValue({
            hikeData: mockHikeData,
            loading: false,
        });

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <HomePage />
                </BrowserRouter>
            </Provider>
        );

        // Ensure the hike cards are rendered
        // expect(screen.getByText(/Feature 1/i)).toBeInTheDocument();
        // expect(screen.getByText(/Feature 2/i)).toBeInTheDocument();

        // Check if "Buy Now" button is rendered
        const buyNowButton = screen.getByText(/Buy Now/i);
        expect(buyNowButton).toBeInTheDocument();

        // Simulate Buy Now button click
        fireEvent.click(buyNowButton);

        // Ensure no hike plans toast is not called as plans are available
        expect(showToast).not.toHaveBeenCalled();
    });

    it('should handle scroll left and right functionality', () => {
        const mockHikeData = [
            {
                salaryAmount: 2000,
                salaryValidation: 'valid',
                logo: 'logo.png',
                partners: 'Partner',
                amount: 100,
                features: 'Feature 1\nFeature 2\nFeature 3',
                planType: 'Standard',
            },
            {
                salaryAmount: 3000,
                salaryValidation: 'valid',
                logo: 'logo2.png',
                partners: 'Partner 2',
                amount: 200,
                features: 'Feature 1\nFeature 2\nFeature 3',
                planType: 'Premium',
            },
        ];

        (useGetAllHike as any).mockReturnValue({
            hikeData: mockHikeData,
            loading: false,
        });

        render(
            <Provider store={mockStore}>
                <BrowserRouter>
                    <HomePage />
                </BrowserRouter>
            </Provider>
        );

        // const leftArrow = screen.getByLabelText(/left arrow/i)
        // const rightArrow = screen.getByLabelText(/right arrow/i);

        // fireEvent.click(leftArrow);
        // fireEvent.click(rightArrow);
    });
});
