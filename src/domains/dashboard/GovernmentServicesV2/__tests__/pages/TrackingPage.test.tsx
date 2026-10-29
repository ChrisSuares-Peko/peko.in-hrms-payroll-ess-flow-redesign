import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { EngagementStatus, getEngagementStatusApi } from '../../apis';
import TrackingPage from '../../pages/TrackingPage';

const mockNavigate = vi.fn();
let mockLocationState: unknown = null;

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../apis', () => ({
    getEngagementStatusApi: vi.fn(),
}));

const application = {
    id: 7,
    applicationId: 'IF-12345',
    engagementId: 'ENG-9',
    status: 'COMPLETED',
    paymentStatus: 'COMPLETED',
    createdOn: '2026-03-15T10:00:00.000Z',
    serviceName: 'Trademark Registration',
    legalBusinessName: 'Peko Pvt Ltd',
};

const engagement = {
    rm: 'Anita Sharma',
    micro_status: 'Not Updated',
    last_notes: 'Documents verified',
    pending_with: '',
    engagement_status: 'In Progress',
} as unknown as EngagementStatus;

const authState = { reducer: { auth: { id: 42, role: 'user' } } };

// antd's first render is slow on a cold, parallel run — the 5s default flakes.
vi.setConfig({ testTimeout: 30000 });

describe('TrackingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocationState = { application };
        (useAppSelector as Mock).mockImplementation((selector: (s: typeof authState) => unknown) =>
            selector(authState)
        );
        (getEngagementStatusApi as Mock).mockResolvedValue(engagement);
    });

    it('redirects to My Applications when no application is in route state', () => {
        mockLocationState = null;

        const { container } = render(<TrackingPage />);

        expect(container).toBeEmptyDOMElement();
        expect(mockNavigate).toHaveBeenCalledWith(
            `${paths.dashboard.governmentServices}/${paths.governmentServices.applications}`,
            { replace: true }
        );
        expect(getEngagementStatusApi).not.toHaveBeenCalled();
    });

    it('shows a spinner while the engagement status loads', () => {
        (getEngagementStatusApi as Mock).mockReturnValue(new Promise(() => {}));

        const { container } = render(<TrackingPage />);

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
        expect(screen.queryByText('Application Submitted')).not.toBeInTheDocument();
    });

    it('fetches the engagement with the user and engagement id', async () => {
        render(<TrackingPage />);

        await waitFor(() => expect(getEngagementStatusApi).toHaveBeenCalledWith(42, 'user', 'ENG-9'));
    });

    it('renders the application header and tracking steps once loaded', async () => {
        render(<TrackingPage />);

        expect(await screen.findByText('Application Submitted')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Trademark Registration' })).toBeInTheDocument();
        expect(screen.getByText('Peko Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText(/IndiaFilings Application ID: IF-12345/)).toBeInTheDocument();
        expect(screen.getByText(/^Submitted on /)).toHaveTextContent('2026');
        expect(screen.getByText('Filed with our filing partner')).toBeInTheDocument();
        expect(screen.getByText('Processing with Government')).toBeInTheDocument();
        expect(screen.getByText('Trademark Registered')).toBeInTheDocument();
        expect(screen.getByText('Handled by Anita Sharma')).toBeInTheDocument();
        expect(screen.getByText('Status: In Progress • Documents verified')).toBeInTheDocument();
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getAllByText('Completed')).toHaveLength(2);
    });

    it('shows the delayed state with pending-with details', async () => {
        (getEngagementStatusApi as Mock).mockResolvedValue({
            ...engagement,
            pending_with: 'Pending with Government',
            micro_status: 'Awaiting examination',
        });

        render(<TrackingPage />);

        expect(await screen.findByText('Delayed')).toBeInTheDocument();
        expect(screen.getByText('Pending with Government - Awaiting examination')).toBeInTheDocument();
        expect(screen.getByText("What's happening now?")).toBeInTheDocument();
    });

    it('skips the engagement fetch and renders steps when there is no engagement id', async () => {
        mockLocationState = { application: { ...application, engagementId: null, applicationId: null } };

        render(<TrackingPage />);

        expect(await screen.findByText('Application Submitted')).toBeInTheDocument();
        expect(getEngagementStatusApi).not.toHaveBeenCalled();
        expect(screen.queryByText(/IndiaFilings Application ID/)).not.toBeInTheDocument();
        expect(screen.getByText(/Trademark Registry reviews/)).toBeInTheDocument();
    });

    it('falls back to default service and business names', async () => {
        mockLocationState = { application: { ...application, serviceName: null, legalBusinessName: null } };

        render(<TrackingPage />);

        expect(await screen.findByRole('heading', { name: 'Trademark Registration' })).toBeInTheDocument();
        expect(screen.getByText('Application')).toBeInTheDocument();
    });

    it('navigates back to explore from the dashboard button', async () => {
        render(<TrackingPage />);

        fireEvent.click(await screen.findByRole('button', { name: 'Back to dashboard' }));

        expect(mockNavigate).toHaveBeenCalledWith(`${paths.dashboard.governmentServices}/explore`);
    });
});
