import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { ApplicationListItem } from '../../apis';
import MyApplications from '../../components/home/sections/MyApplications';
import { useMyApplicationsApi } from '../../hooks';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../hooks', () => ({
    useMyApplicationsApi: vi.fn(),
}));

const mockApplications: ApplicationListItem[] = [
    {
        id: 1,
        applicationNumber: 'APP001',
        service: 'govt_msme',
        status: 'SUBMITTED',
        currentStep: 1,
        adminNotes: null,
        remarks: null,
        approvedDocument: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-15T00:00:00Z',
    },
    {
        id: 2,
        applicationNumber: 'APP002',
        service: 'govt_trademark',
        status: 'APPROVED',
        currentStep: 3,
        adminNotes: null,
        remarks: null,
        approvedDocument: null,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-20T00:00:00Z',
    },
];

const mockServicesList = [
    {
        id: 1,
        name: 'MSME Registration',
        accessKey: 'govt_msme',
        slug: 'msme',
        description: '',
        category: 'Registration',
        tab: 'Mandatory',
        duration: '2-5 days',
        price: 999,
        govtFee: 'Free',
    },
    {
        id: 2,
        name: 'Trademark Registration',
        accessKey: 'govt_trademark',
        slug: 'trademark',
        description: '',
        category: 'Registration',
        tab: 'Mandatory',
        duration: '12-18 months',
        price: 4999,
        govtFee: 4500,
    },
];

describe('MyApplications Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useAppSelector as Mock).mockReturnValue(mockServicesList);
    });

    it('renders loading skeletons when isLoading is true', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({ applications: [], isLoading: true });

        render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        // Skeleton renders without the "My Applications" heading
        expect(screen.queryByText(/My Applications/i)).not.toBeInTheDocument();
    });

    it('renders nothing when there are no applications', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({ applications: [], isLoading: false });

        const { container } = render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        expect(container.firstChild).toBeNull();
    });

    it('renders the "My Applications" heading when applications exist', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({
            applications: mockApplications,
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        expect(screen.getByText('My Applications')).toBeInTheDocument();
    });

    it('renders application cards with application numbers', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({
            applications: mockApplications,
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        expect(screen.getByText(/APP001/)).toBeInTheDocument();
        expect(screen.getByText(/APP002/)).toBeInTheDocument();
    });

    it('resolves service name from servicesList for each application', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({
            applications: mockApplications,
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        expect(screen.getByText('MSME Registration')).toBeInTheDocument();
        expect(screen.getByText('Trademark Registration')).toBeInTheDocument();
    });

    it('shows correct status label for SUBMITTED application', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({
            applications: [mockApplications[0]],
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows correct status label for APPROVED application', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({
            applications: [mockApplications[1]],
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    it('dispatches and navigates when an application card is clicked', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({
            applications: [mockApplications[0]],
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText(/APP001/));

        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('falls back to accessKey as name when service not in servicesList', () => {
        (useMyApplicationsApi as Mock).mockReturnValue({
            applications: [
                { ...mockApplications[0], service: 'govt_unknown' },
            ],
            isLoading: false,
        });

        render(
            <BrowserRouter>
                <MyApplications />
            </BrowserRouter>
        );

        expect(screen.getByText('govt_unknown')).toBeInTheDocument();
    });
});
