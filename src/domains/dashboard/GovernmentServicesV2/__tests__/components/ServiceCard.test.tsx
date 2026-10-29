import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { paths } from '@src/routes/paths';

import { ApplicationListItem } from '../../apis';
import ServiceCard from '../../components/explore/ServiceCard';
import { setSelectedApplication, setSelectedService } from '../../slices';
import { Service } from '../../types';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
}));

const service: Service = {
    id: 7,
    serviceId: 101,
    name: 'Trademark Registration',
    slug: 'trademark-registration',
    accessKey: 'cat-7',
    description: 'Protect your brand name and logo',
    category: 'Intellectual Property',
    tab: 'Mandatory' as Service['tab'],
    duration: '5-7 days',
    price: 1499,
    govtFee: 4500,
};

const makeApplication = (status: string): ApplicationListItem => ({
    id: 55,
    applicationNumber: 'APP055',
    service: 'cat-7',
    status,
    currentStep: 1,
    adminNotes: null,
    remarks: null,
    approvedDocument: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
});

const renderCard = (application?: ApplicationListItem) =>
    render(
        <MemoryRouter>
            <ServiceCard service={service} application={application} />
        </MemoryRouter>
    );

describe('ServiceCard (V2 explore)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the service name and description', () => {
        renderCard();

        expect(screen.getByText('Trademark Registration')).toBeInTheDocument();
        expect(screen.getByText('Protect your brand name and logo')).toBeInTheDocument();
    });

    it('shows Apply Now without an application and navigates to the service detail', () => {
        renderCard();

        expect(screen.queryByRole('button', { name: /Track Application/ })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Apply Now/ }));

        expect(mockDispatch).toHaveBeenCalledWith(setSelectedService(service));
        expect(mockNavigate).toHaveBeenCalledWith(
            `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/7`
        );
    });

    it.each(['DRAFT', 'PENDING_PAYMENT'])('shows Apply Now for a non-trackable "%s" application', (status) => {
        renderCard(makeApplication(status));

        expect(screen.getByRole('button', { name: /Apply Now/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Track Application/ })).not.toBeInTheDocument();
    });

    it.each(['SUBMITTED', 'IN_REVIEW', 'REUPLOAD', 'REJECTED', 'ACTION_REQUIRED', 'APPROVED', 'COMPLETED'])(
        'shows Track Application for a "%s" application',
        (status) => {
            renderCard(makeApplication(status));

            expect(screen.getByRole('button', { name: /Track Application/ })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Apply Now/ })).not.toBeInTheDocument();
        }
    );

    it('dispatches the application and navigates to its tracking page on Track Application', () => {
        const application = makeApplication('IN_REVIEW');
        renderCard(application);

        fireEvent.click(screen.getByRole('button', { name: /Track Application/ }));

        expect(mockDispatch).toHaveBeenCalledWith(setSelectedApplication(application));
        expect(mockNavigate).toHaveBeenCalledWith(
            `${paths.dashboard.governmentServices}/${paths.governmentServices.application}/55`
        );
    });
});
