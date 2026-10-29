import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { paths } from '@src/routes/paths';

import { GovernmentServiceApplicationV2Item } from '../../apis';
import useApplicationsListApi from '../../hooks/useApplicationsListApi';
import MyApplications from '../../pages/MyApplications';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../hooks/useApplicationsListApi', () => ({ default: vi.fn() }));

const makeRow = (
    overrides: Partial<GovernmentServiceApplicationV2Item> = {}
): GovernmentServiceApplicationV2Item => ({
    id: 1,
    applicationId: 'IF-100',
    vendorCatalogId: '25',
    serviceId: 100,
    serviceName: 'Trademark Registration',
    variantName: 'Standard',
    legalBusinessName: 'Peko Pvt Ltd',
    amount: '5000',
    status: 'DRAFT',
    paymentStatus: 'PENDING',
    gid: null,
    engagementId: null,
    createdOn: '2026-03-15T10:00:00.000Z',
    isFormSubmissionComplete: false,
    ...overrides,
});

const serviceUrl = `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/25`;

const expectedFallbackService = {
    id: 25,
    serviceId: 100,
    name: 'Trademark Registration',
    slug: '',
    accessKey: '25',
    description: '',
    category: 'Standard',
    tab: 'Mandatory',
    duration: '',
    price: 5000,
    govtFee: 'Free',
};

const setRows = (rows: GovernmentServiceApplicationV2Item[], isLoading = false) =>
    (useApplicationsListApi as Mock).mockReturnValue({ applications: rows, isLoading });

const continueButton = () => screen.getByRole('button', { name: /Continue application/ });

// antd's first render is slow on a cold, parallel run — the 5s default flakes.
vi.setConfig({ testTimeout: 30000 });

describe('MyApplications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a skeleton while loading', () => {
        setRows([], true);

        const { container } = render(<MyApplications />);

        expect(container.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('shows the empty state when there are no applications', () => {
        setRows([]);

        render(<MyApplications />);

        expect(screen.getByText('No applications yet')).toBeInTheDocument();
    });

    it('renders a trademark registration row with its details and Incompleted badge', () => {
        setRows([makeRow()]);

        render(<MyApplications />);

        expect(screen.getByText('Trademark Registration')).toBeInTheDocument();
        expect(screen.getByText('Standard')).toBeInTheDocument();
        expect(screen.getByText('Peko Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('IF-100')).toBeInTheDocument();
        expect(screen.getByText('Incompleted')).toBeInTheDocument();
        expect(continueButton()).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /View Details/ })).not.toBeInTheDocument();
    });

    it('renders placeholders for missing service name, proposed name and application id', () => {
        setRows([
            makeRow({
                serviceName: null,
                legalBusinessName: null,
                applicationId: null,
                variantName: null,
            }),
        ]);

        render(<MyApplications />);

        expect(screen.getByText('Government Service')).toBeInTheDocument();
        expect(screen.getAllByText('—')).toHaveLength(2);
    });

    it('resumes a DRAFT registration on the service page with resumeExisting state', () => {
        setRows([makeRow({ id: 9, status: 'DRAFT' })]);

        render(<MyApplications />);
        fireEvent.click(continueButton());

        expect(mockNavigate).toHaveBeenCalledWith(serviceUrl, {
            state: {
                resumeExisting: true,
                applicationRowId: 9,
                fallbackService: expectedFallbackService,
            },
        });
    });

    it('sends a SUBMITTED registration straight to the register form with state', () => {
        setRows([
            makeRow({
                id: 9,
                status: 'SUBMITTED',
                paymentStatus: 'COMPLETED',
                engagementId: 'ENG-1',
            }),
        ]);

        render(<MyApplications />);
        fireEvent.click(continueButton());

        expect(mockNavigate).toHaveBeenCalledWith(
            `${serviceUrl}/${paths.governmentServices.register}`,
            {
                state: { applicationRowId: 9, fallbackService: expectedFallbackService },
            }
        );
    });

    it('falls back to a zero price when the amount is not numeric', () => {
        setRows([makeRow({ status: 'SUBMITTED', amount: 'abc' })]);

        render(<MyApplications />);
        fireEvent.click(continueButton());

        expect(mockNavigate).toHaveBeenCalledWith(
            `${serviceUrl}/${paths.governmentServices.register}`,
            expect.objectContaining({
                state: expect.objectContaining({
                    fallbackService: expect.objectContaining({ price: 0 }),
                }),
            })
        );
    });

    it('routes a SUBMITTED objection row to the objection form with its own fallback service', () => {
        setRows([makeRow({ id: 3, status: 'SUBMITTED', serviceName: 'Trademark Objection' })]);

        render(<MyApplications />);
        fireEvent.click(continueButton());

        expect(mockNavigate).toHaveBeenCalledWith(
            `${serviceUrl}/${paths.governmentServices.objection}`,
            {
                state: {
                    applicationRowId: 3,
                    fallbackService: { ...expectedFallbackService, name: 'Trademark Objection' },
                },
            }
        );
    });

    it('hides Continue when the row has no vendor catalog id', () => {
        setRows([makeRow({ vendorCatalogId: null })]);

        render(<MyApplications />);

        expect(
            screen.queryByRole('button', { name: /Continue application/ })
        ).not.toBeInTheDocument();
    });

    it('opens tracking with the row in state for a completed form submission', () => {
        const row = makeRow({
            id: 5,
            status: 'COMPLETED',
            paymentStatus: 'COMPLETED',
            engagementId: 'ENG-5',
            isFormSubmissionComplete: true,
        });
        setRows([row]);

        render(<MyApplications />);

        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /Continue application/ })
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /View Details/ }));

        expect(mockNavigate).toHaveBeenCalledWith(
            `${paths.dashboard.governmentServices}/${paths.governmentServices.tracking}`,
            { state: { application: row } }
        );
    });

    it('filters rows by status client-side', () => {
        setRows([
            makeRow({ id: 1, legalBusinessName: 'Draft Co' }),
            makeRow({ id: 2, legalBusinessName: 'Done Co', isFormSubmissionComplete: true }),
        ]);

        const { container } = render(<MyApplications />);

        expect(screen.getByText('Draft Co')).toBeInTheDocument();
        expect(screen.getByText('Done Co')).toBeInTheDocument();

        fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element);
        const dropdown = document.querySelector('.ant-select-dropdown') as HTMLElement;
        fireEvent.click(within(dropdown).getByText('Completed'));

        expect(screen.queryByText('Draft Co')).not.toBeInTheDocument();
        expect(screen.getByText('Done Co')).toBeInTheDocument();
    });
});
