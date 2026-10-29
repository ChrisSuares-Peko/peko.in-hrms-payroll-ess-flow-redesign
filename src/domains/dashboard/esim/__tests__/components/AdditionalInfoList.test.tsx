import { configureStore } from '@reduxjs/toolkit';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, afterEach } from 'vitest';

import '@testing-library/jest-dom/vitest';
import AdditionalInfoList from '@src/domains/dashboard/esim/components/details/AdditionalInfoList';
import { Country } from '@src/domains/dashboard/esim/types/packagesList';
import { useAppSelector } from '@src/hooks/store';

// Mock necessary hooks and functions
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

// Mock the showToast function similar to your approach in the Bookingfields test
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn().mockImplementation(message => {
        const toastElement = document.createElement('div');
        toastElement.textContent = message.description;
        document.body.appendChild(toastElement);
    }),
}));

// Define initial state for the mock store
const initialState = {
    reducer: {
        esim: {
            searchData: {
                esimType: 'local', // Default value, can be overridden in tests
            },
        },
    },
};

// Create the mock store with the initial state
const mockStore = configureStore({
    reducer: {
        reducer: (state = initialState) => state,
    },
});

describe('AdditionalInfoList Component', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    const defaultProps = {
        network: 'Test Network',
        planType: 'Prepaid',
        eKyc: true,
        topUpOption: false,
        countries: [{ title: 'Country1' }, { title: 'Country2' }] as Country[],
    };

    it('should render additional information correctly', () => {
        // Mock useAppSelector to return the expected state
        (useAppSelector as any).mockReturnValue({
            esimType: 'local',
        });

        render(
            <Provider store={mockStore}>
                <AdditionalInfoList {...defaultProps} />
            </Provider>
        );

        expect(screen.getByText('Service Operator')).toBeInTheDocument();
        expect(screen.getByText('Test Network')).toBeInTheDocument();
        expect(screen.getByText('Sim Type')).toBeInTheDocument();
        expect(screen.getByText('Prepaid')).toBeInTheDocument();
        expect(screen.getByText('eKYC (Identity Verification)')).toBeInTheDocument();
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByText('Top-up Option')).toBeInTheDocument();
        expect(screen.getByText('Not Available')).toBeInTheDocument();
        expect(screen.getByText('Country1, Country2')).toBeInTheDocument();
    });

    it('should render with different esimType', () => {
        // Mock useAppSelector to return different state
        (useAppSelector as any).mockReturnValue({
            esimType: 'international',
        });

        render(
            <Provider store={mockStore}>
                <AdditionalInfoList {...defaultProps} />
            </Provider>
        );

        expect(screen.getByText('Countries')).toBeInTheDocument();
        // You can add more specific checks based on how the component differs
    });

    it('should handle empty countries list', () => {
        const emptyProps = {
            ...defaultProps,
            countries: [],
        };

        render(
            <Provider store={mockStore}>
                <AdditionalInfoList {...emptyProps} />
            </Provider>
        );

        expect(screen.getByText('Countries')).toBeInTheDocument();
        // Should not find any country names
        expect(screen.queryByText('Country1, Country2')).not.toBeInTheDocument();
    });

    it('should handle undefined props gracefully', () => {
        const undefinedProps = {
            network: undefined,
            planType: undefined,
            eKyc: undefined,
            topUpOption: undefined,
            countries: undefined,
        };

        render(
            <Provider store={mockStore}>
                <AdditionalInfoList {...undefinedProps} />
            </Provider>
        );

        expect(screen.getByText('Service Operator')).toBeInTheDocument();
        expect(screen.getByText('Sim Type')).toBeInTheDocument();
        expect(screen.getByText('eKYC (Identity Verification)')).toBeInTheDocument();
        expect(screen.getByText('Top-up Option')).toBeInTheDocument();
        expect(screen.getByText('Countries')).toBeInTheDocument();
    });
});
