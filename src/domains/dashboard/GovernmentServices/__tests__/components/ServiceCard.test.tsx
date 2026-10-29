import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import { ApplicationListItem } from '../../apis';
import ServiceCard from '../../components/explore/ServiceCard';
import { Service } from '../../types';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

const mockService: Service = {
    id: 1,
    name: 'MSME Registration',
    slug: 'msme-registration',
    accessKey: 'govt_msme',
    description: 'Register your MSME business',
    category: 'Registration',
    tab: 'Mandatory',
    duration: '2-5 days',
    price: 999,
    govtFee: 'Free',
};

const mockActiveApplication: ApplicationListItem = {
    id: 10,
    applicationNumber: 'APP001',
    service: 'govt_msme',
    status: 'SUBMITTED',
    currentStep: 1,
    adminNotes: null,
    remarks: null,
    approvedDocument: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
};

describe('ServiceCard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
    });

    it('renders service name, category, and description', () => {
        render(
            <BrowserRouter>
                <ServiceCard service={mockService} />
            </BrowserRouter>
        );

        expect(screen.getByText('MSME Registration')).toBeInTheDocument();
        expect(screen.getByText('Registration')).toBeInTheDocument();
        expect(screen.getByText('Register your MSME business')).toBeInTheDocument();
    });

    it('renders duration and price', () => {
        render(
            <BrowserRouter>
                <ServiceCard service={mockService} />
            </BrowserRouter>
        );

        expect(screen.getByText('2-5 days')).toBeInTheDocument();
        expect(screen.getByText(/999/)).toBeInTheDocument();
    });

    it('shows "Apply Now" button when no application is provided', () => {
        render(
            <BrowserRouter>
                <ServiceCard service={mockService} />
            </BrowserRouter>
        );

        expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /track application/i })).not.toBeInTheDocument();
    });

    it('shows "Track Application" button when an active application exists', () => {
        render(
            <BrowserRouter>
                <ServiceCard service={mockService} application={mockActiveApplication} />
            </BrowserRouter>
        );

        expect(screen.getByRole('button', { name: /track application/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /apply now/i })).not.toBeInTheDocument();
    });

    it('shows "Apply Now" when application status is DRAFT (not a track status)', () => {
        const draftApplication: ApplicationListItem = { ...mockActiveApplication, status: 'DRAFT' };
        render(
            <BrowserRouter>
                <ServiceCard service={mockService} application={draftApplication} />
            </BrowserRouter>
        );

        expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument();
    });

    it('dispatches setSelectedService and navigates when "Apply Now" is clicked', () => {
        render(
            <BrowserRouter>
                <ServiceCard service={mockService} />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /apply now/i }));

        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('dispatches setSelectedApplication and navigates when "Track Application" is clicked', () => {
        render(
            <BrowserRouter>
                <ServiceCard service={mockService} application={mockActiveApplication} />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /track application/i }));

        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('10'));
    });

    it('shows "Track Application" for each active status variant', () => {
        const trackStatuses = ['SUBMITTED', 'IN_REVIEW', 'REUPLOAD', 'REJECTED', 'ACTION_REQUIRED', 'APPROVED', 'COMPLETED'];

        trackStatuses.forEach((status) => {
            const { unmount } = render(
                <BrowserRouter>
                    <ServiceCard
                        service={mockService}
                        application={{ ...mockActiveApplication, status }}
                    />
                </BrowserRouter>
            );
            expect(screen.getByRole('button', { name: /track application/i })).toBeInTheDocument();
            unmount();
        });
    });
});
