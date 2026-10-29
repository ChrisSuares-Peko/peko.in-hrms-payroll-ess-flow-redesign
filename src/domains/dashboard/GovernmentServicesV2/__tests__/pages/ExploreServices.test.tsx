import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import useGovtServicesListApi from '../../hooks/useGovtServicesListApi';
import ExploreServices from '../../pages/ExploreServices';
import { Service } from '../../types';

const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../hooks/useGovtServicesListApi', () => ({ default: vi.fn() }));

vi.mock('../../components/ConsultExpertCard', () => ({
    default: () => <div data-testid="consult-expert" />,
}));

const makeService = (overrides: Partial<Service> = {}): Service => ({
    id: 10,
    serviceId: 100,
    name: 'Trademark Registration',
    slug: 'trademark-registration',
    accessKey: 'govt_trademark_registration',
    description: 'Register your trademark',
    category: 'Registration',
    tab: 'Mandatory',
    duration: '7 days',
    price: 5000,
    govtFee: 4500,
    ...overrides,
});

// antd's first render is slow on a cold, parallel run — the 5s default flakes.
vi.setConfig({ testTimeout: 30000 });

describe('ExploreServices', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useGovtServicesListApi as Mock).mockReturnValue({
            services: [makeService(), makeService({ id: 11, name: 'Trademark Objection', description: 'Reply' })],
            isLoading: false,
        });
    });

    it('renders the header and consult card', () => {
        render(<ExploreServices />);

        expect(screen.getByRole('heading', { name: 'Government Services' })).toBeInTheDocument();
        expect(screen.getByTestId('consult-expert')).toBeInTheDocument();
    });

    it('shows a skeleton while services load', () => {
        (useGovtServicesListApi as Mock).mockReturnValue({ services: [], isLoading: true });

        const { container } = render(<ExploreServices />);

        expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
        expect(screen.queryByText('No services found')).not.toBeInTheDocument();
    });

    it('shows the empty state when no services match', () => {
        (useGovtServicesListApi as Mock).mockReturnValue({ services: [], isLoading: false });

        render(<ExploreServices />);

        expect(screen.getByText('No services found')).toBeInTheDocument();
    });

    it('renders a card per service', () => {
        render(<ExploreServices />);

        expect(screen.getByText('Trademark Registration')).toBeInTheDocument();
        expect(screen.getByText('Trademark Objection')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Apply Now' })).toHaveLength(2);
    });

    it('queries without a search term initially and passes typed search text', () => {
        render(<ExploreServices />);

        expect(useGovtServicesListApi).toHaveBeenLastCalledWith({ searchText: undefined });

        fireEvent.change(screen.getByPlaceholderText(/Search registrations/), { target: { value: 'Trademark' } });

        expect(useGovtServicesListApi).toHaveBeenLastCalledWith({ searchText: 'Trademark' });
    });

    it('navigates to My Applications', () => {
        render(<ExploreServices />);

        fireEvent.click(screen.getByRole('button', { name: 'My Applications' }));

        expect(mockNavigate).toHaveBeenCalledWith(
            `${paths.dashboard.governmentServices}/${paths.governmentServices.applications}`
        );
    });

    it('selects the service and opens its detail page from Apply Now', () => {
        render(<ExploreServices />);

        fireEvent.click(screen.getAllByRole('button', { name: 'Apply Now' })[0]);

        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: makeService() }));
        expect(mockNavigate).toHaveBeenCalledWith(
            `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/10`
        );
    });
});
