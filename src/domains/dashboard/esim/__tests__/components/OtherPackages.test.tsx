import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import OtherPackages from '@src/domains/dashboard/esim/components/details/OtherPackages';
import { Package } from '@src/domains/dashboard/esim/types/packagesList';

// Mock necessary functions
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom'); // Use importActual to preserve the original module
    return {
        ...actual,
        useNavigate: vi.fn(), // Mock only useNavigate
    };
});

// Ensure defaultProps is correctly typed as an object
const defaultPackages: Package[] = [
    {
        id: '1',
        title: 'Package 1',
        data: '5GB',
        voice: '100',
        text: '50',
        day: 30,
        price: 100,
        type: '',
        amount: 0,
        is_unlimited: false,
        short_info: null,
        qr_installation: '',
        manual_installation: '',
        net_price: 0,
    },
    {
        id: '2',
        title: 'Package 2',
        data: '10GB',
        voice: '200',
        text: '100',
        day: 60,
        price: 200,
        type: '',
        amount: 0,
        is_unlimited: false,
        short_info: null,
        qr_installation: '',
        manual_installation: '',
        net_price: 0,
    },
];

const defaultState = {
    country: 'UAE',
    esimType: 'local',
    region: 'Middle East',
};

interface DefaultProps {
    packages: Package[];
    conversionRate: number;
    state: typeof defaultState;
}

const defaultProps: DefaultProps = {
    packages: defaultPackages,
    conversionRate: 3.67,
    state: defaultState,
};

describe('OtherPackages Component', () => {
    it('should render available packages with correct details', () => {
        render(
            <Router>
                <OtherPackages {...defaultProps} />
            </Router>
        );

        expect(screen.getByText('Other available Packages (2)')).toBeInTheDocument();
        expect(screen.getByText('Package 1')).toBeInTheDocument();
        expect(screen.getByText('Package 2')).toBeInTheDocument();
        expect(screen.getByText('Data: 5GB')).toBeInTheDocument();
        expect(screen.getByText('Data: 10GB')).toBeInTheDocument();
        expect(screen.getByText('Voice: 100 min')).toBeInTheDocument();
        expect(screen.getByText('Voice: 200 min')).toBeInTheDocument();
        expect(screen.getByText('SMS: 50')).toBeInTheDocument();
        expect(screen.getByText('SMS: 100')).toBeInTheDocument();
        expect(screen.getByText('Validity: 30 Days')).toBeInTheDocument();
        expect(screen.getByText('Validity: 60 Days')).toBeInTheDocument();
        expect(screen.getByText('Buy for INR 367.00')).toBeInTheDocument();
        expect(screen.getByText('Buy for INR 734.00')).toBeInTheDocument();
    });

    it('should handle empty packages list', () => {
        const emptyPackagesProps: DefaultProps = {
            ...defaultProps,
            packages: [], // Ensure packages is an array
        };

        render(
            <Router>
                <OtherPackages {...emptyPackagesProps} />
            </Router>
        );

        expect(screen.queryByText('Other available Packages (0)')).toBeInTheDocument();
        expect(screen.queryByText('Package 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Package 2')).not.toBeInTheDocument();
    });

    it('should navigate to the package detail page on Buy button click', () => {
        const mockNavigate = vi.fn();
        (vi.mocked(useNavigate) as any).mockReturnValue(mockNavigate);

        render(
            <Router>
                <OtherPackages {...defaultProps} />
            </Router>
        );

        const buyButton = screen.getByText('Buy for INR 367.00');
        fireEvent.click(buyButton);

        expect(mockNavigate).toHaveBeenCalledWith(
            '/corporate-travel/eSIM/packages/replace-package',
            {
                state: {
                    price: 100,
                    title: 'Package 1',
                    data: '5GB',
                    item: '1',
                    country: 'UAE',
                    esimType: 'local',
                    id: '1',
                    region: 'Middle East',
                },
            }
        );
    });
});
