import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { EngagementStatus, getEngagementStatusApi } from '../../apis';
import RelationshipManagerCard from '../../components/RelationshipManagerCard';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn((selector: (state: unknown) => unknown) =>
        selector({ reducer: { auth: { id: 42, role: 'corporate' } } })
    ),
}));

vi.mock('../../apis', () => ({
    getEngagementStatusApi: vi.fn(),
}));

const makeEngagement = (overrides: Partial<EngagementStatus> = {}): EngagementStatus => ({
    eid: 1,
    gid: 1,
    name: '',
    business_name: '',
    rm: 'Priya Sharma',
    rmgid: 1,
    rm_profile: '',
    rm_role: 'Senior RM',
    rmsim: 9876543210,
    rmemail: 'priya@example.com',
    serviceid: 1,
    service: '',
    next_followup: '2099-12-31',
    micro_status: 'Awaiting documents',
    last_notes: 'Called the client',
    pending_with: '',
    eng_status: 1,
    engagement_status: 'In Progress',
    completed_on: '',
    date_started: '',
    ...overrides,
});

const mockApi = getEngagementStatusApi as Mock;

describe('RelationshipManagerCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the assignment-pending fallback without an engagementId and skips the API', () => {
        render(<RelationshipManagerCard />);

        expect(screen.getByText('Your Relationship Manager')).toBeInTheDocument();
        expect(screen.getByText('Being assigned…')).toBeInTheDocument();
        expect(screen.getByText('Relationship Manager')).toBeInTheDocument();
        expect(screen.getAllByText('—')).toHaveLength(4); // phone, email, status, next update
        expect(
            screen.getByText('Your RM will guide you through the rest of the registration. Reach out anytime.')
        ).toBeInTheDocument();
        expect(mockApi).not.toHaveBeenCalled();
    });

    it('shows a skeleton while the engagement is loading', () => {
        mockApi.mockReturnValue(new Promise(() => {}));
        const { container } = render(<RelationshipManagerCard engagementId="ENG-1" />);

        expect(container.querySelector('.ant-skeleton')).not.toBeNull();
        expect(screen.queryByText('Being assigned…')).not.toBeInTheDocument();
    });

    it('fetches with the auth user and renders live RM details', async () => {
        mockApi.mockResolvedValue(makeEngagement());
        render(<RelationshipManagerCard engagementId="ENG-1" />);

        expect(await screen.findByText('Priya Sharma')).toBeInTheDocument();
        expect(mockApi).toHaveBeenCalledWith(42, 'corporate', 'ENG-1');
        expect(screen.getByText('Senior RM')).toBeInTheDocument();
        expect(screen.getByText('9876543210')).toBeInTheDocument();
        expect(screen.getByText('priya@example.com')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Awaiting documents')).toBeInTheDocument();
        expect(screen.getByText('Latest update: Called the client')).toBeInTheDocument();
        expect(screen.getByText('2099-12-31')).toBeInTheDocument();
    });

    it('treats an "Unassigned" RM and "Not Updated" notes as absent', async () => {
        mockApi.mockResolvedValue(
            makeEngagement({
                rm: 'Unassigned',
                rm_role: null,
                rmsim: null,
                micro_status: 'Not Updated',
                last_notes: 'Not Updated',
                next_followup: '2000-01-01',
            })
        );
        render(<RelationshipManagerCard engagementId="ENG-1" />);

        expect(await screen.findByText('Being assigned…')).toBeInTheDocument();
        expect(screen.getByText('Relationship Manager')).toBeInTheDocument();
        // Generic support email still shows while unassigned
        expect(screen.getByText('priya@example.com')).toBeInTheDocument();
        expect(screen.queryByText('Not Updated')).not.toBeInTheDocument();
        expect(screen.queryByText(/Latest update:/)).not.toBeInTheDocument();
        // phone + past next-followup fall back to the dash
        expect(screen.getAllByText('—')).toHaveLength(2);
    });

    it('falls back to the static state when the API returns null', async () => {
        mockApi.mockResolvedValue(null);
        render(<RelationshipManagerCard engagementId="ENG-1" />);

        expect(await screen.findByText('Being assigned…')).toBeInTheDocument();
        await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(4));
    });
});
