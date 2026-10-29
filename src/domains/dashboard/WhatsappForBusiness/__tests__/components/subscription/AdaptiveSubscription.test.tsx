import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdaptiveSubscription from '../../../components/subscription/AdaptiveSubscription';
import { useGetDetailsSubscription } from '../../../hooks/useGetDetailsSubscription';
import { PackagePrices } from '../../../types';

// Mock dependencies`
vi.mock('../../../hooks/useGetDetailsSubscription', () => ({
    useGetDetailsSubscription: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

describe('AdaptiveSubscription Component', () => {
    let mockNavigate: any;
    beforeEach(() => {
        mockNavigate = vi.fn();

        vi.mocked(useGetDetailsSubscription).mockReturnValue({
            data: {
                id: 0,
                packageName: '',
                packagePrices: { monthly: 10, annually: 100 } as PackagePrices,
                description: '',
                discount: { monthly: 1, annually: 10 },
                priorityLevel: 0,
            },
            isLoading: false,
            packages: undefined,
            deduction: undefined,
        });
        (useNavigate as unknown as any).mockReturnValue(mockNavigate);
    });

    it('renders loading state', () => {
        vi.mocked(useGetDetailsSubscription).mockReturnValue({
            isLoading: true,
            data: undefined,
            packages: undefined,
            deduction: undefined,
        });

        render(
            <AdaptiveSubscription
                title="Test Title"
                serviceName="Test Service"
                serviceDetails="Details"
            />,
            {
                wrapper: MemoryRouter,
            }
        );

        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('renders ServiceUnavailable when no data is available', () => {
        vi.mocked(useGetDetailsSubscription).mockReturnValue({
            data: undefined,
            isLoading: false,
            packages: undefined,
            deduction: undefined,
        });

        render(
            <AdaptiveSubscription
                title="Test Title"
                serviceName="Test Service"
                serviceDetails="Details"
            />,
            {
                wrapper: MemoryRouter,
            }
        );

        expect(screen.getByText('No services found')).toBeInTheDocument();
    });

    it('renders title, service details, and sub-description', () => {
        render(
            <AdaptiveSubscription
                title="Test Title"
                serviceName="Test Service"
                serviceDetails="Test Service Details"
                subDescription="Test Sub Description"
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Service Details')).toBeInTheDocument();
        expect(screen.getByText('Test Sub Description')).toBeInTheDocument();
    });

    it('navigates to the correct path when "Select plan and subscribe" button is clicked', () => {
        render(
            <AdaptiveSubscription
                title="Test Title"
                serviceName="Test Service"
                serviceDetails="Details"
            />,
            { wrapper: MemoryRouter }
        );

        const subscribeButton = screen.getByRole('button', { name: /select plan and subscribe/i });
        fireEvent.click(subscribeButton);

        expect(mockNavigate).toHaveBeenCalledWith('plan-details');
    });

    it('renders the "Get Peko Plus" link with the correct path', () => {
        render(
            <AdaptiveSubscription
                title="Test Title"
                serviceName="Test Service"
                serviceDetails="Details"
            />,
            { wrapper: MemoryRouter }
        );

        const pekoPlusLink = screen.getByRole('link', { name: /get peko plus/i });
        expect(pekoPlusLink).toHaveAttribute('href', '/plans');
    });

    it('renders the "Request for demo" link with the correct phone number', () => {
        render(
            <AdaptiveSubscription
                title="Test Title"
                serviceName="Test Service"
                serviceDetails="Details"
            />,
            { wrapper: MemoryRouter }
        );

        const demoLink = screen.getByRole('link', { name: /request for demo/i });
        expect(demoLink).toHaveAttribute('href', 'tel:02248930373');
    });
});
