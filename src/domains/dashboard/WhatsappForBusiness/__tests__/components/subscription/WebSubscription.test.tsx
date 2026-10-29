import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, Mock, vi, beforeEach } from 'vitest';

import { paths } from '@src/routes/paths';

import WebSubscription from '../../../components/subscription/WebSubscription';
import { useGetDetailsSubscription } from '../../../hooks/useGetDetailsSubscription';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});
// Mock API Hook
vi.mock('../../../hooks/useGetDetailsSubscription', () => ({
    useGetDetailsSubscription: vi.fn(),
}));

describe('WebSubscription Component', () => {
    let mockNavigate: any;
    beforeEach(() => {
        mockNavigate = vi.fn();

        (useNavigate as unknown as any).mockReturnValue(mockNavigate);
    });
    const defaultProps = {
        title: 'Test Subscription',
        serviceKey: '123',
        serviceName: 'Test Service',
        serviceDetails: 'This is a test service description.',
        subDescription: 'Test sub description.',
    };

    it('renders loading state correctly', () => {
        (useGetDetailsSubscription as Mock).mockReturnValue({ data: null, isLoading: true });

        render(
            <MemoryRouter>
                <WebSubscription {...defaultProps} />
            </MemoryRouter>
        );

        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('displays ServiceUnavailable when data is empty', () => {
        (useGetDetailsSubscription as Mock).mockReturnValue({ data: null, isLoading: false });

        render(
            <MemoryRouter>
                <WebSubscription {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.getByText(/No services found/i)).toBeInTheDocument();
    });

    it('renders subscription details when data is available', () => {
        (useGetDetailsSubscription as Mock).mockReturnValue({
            data: { someKey: 'value' },
            isLoading: false,
        });

        render(
            <MemoryRouter>
                <WebSubscription {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.getByText('Test Subscription')).toBeInTheDocument();
        expect(screen.getByText('This is a test service description.')).toBeInTheDocument();
        expect(screen.getByText('Test sub description.')).toBeInTheDocument();
    });

    it('calls navigate when "Select plan and subscribe" button is clicked', () => {
        (useGetDetailsSubscription as Mock).mockReturnValue({
            data: { someKey: 'value' },
            isLoading: false,
        });

        render(
            <MemoryRouter>
                <WebSubscription {...defaultProps} />
            </MemoryRouter>
        );

        const button = screen.getByText(/Select plan and subscribe/i);
        fireEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith(paths.whatsappForBusiness.planDetails);
    });

    it('ensures "Request for demo" link has the correct phone number', () => {
        (useGetDetailsSubscription as Mock).mockReturnValue({
            data: { someKey: 'value' },
            isLoading: false,
        });

        render(
            <MemoryRouter>
                <WebSubscription {...defaultProps} />
            </MemoryRouter>
        );

        const demoLink = screen.getByText(/Request for demo/i).closest('a');
        expect(demoLink).toHaveAttribute('href', 'tel:02248930373');
    });
});
