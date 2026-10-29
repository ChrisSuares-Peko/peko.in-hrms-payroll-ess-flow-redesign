import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { resendCardMemberInvite } from '../../../api/user/cardMembersApi';
import PeopleLandingPage from '../../../components/landingPage/PeopleLandingPage';
import { useApprovalRequestsApi } from '../../../hooks/admin/useApprovalRequestsApi';
import { useCardUsersApi } from '../../../hooks/admin/useCardUsersApi';
import { Member } from '../../../utils/types';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ reducer: { auth: { role: 'corporate', id: 7 } } }),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
    default: (state = {}) => state,
}));

vi.mock('@src/domains/auth/hooks/useSwitchRole', () => ({
    default: () => ({ switchRole: vi.fn(), isSwitching: false }),
}));

// Corporate Cards has its own member endpoints. The Settings sub-corporate ones answered "user not found"
// for every card member, because a card member has no sub-corporate row.
vi.mock('../../../api/user/cardMembersApi', () => ({
    resendCardMemberInvite: vi.fn().mockResolvedValue({}),
    revokeCardMember: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

vi.mock('../../../hooks/admin/useCardUsersApi', () => ({
    useCardUsersApi: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Component mocks
// ---------------------------------------------------------------------------

vi.mock('../../../components/landingPage/PeopleHeader', () => ({
    default: ({ onInviteMember }: any) => (
        <div data-testid="people-header">
            <button type="button" data-testid="invite-member-btn" onClick={onInviteMember}>
                Invite member
            </button>
        </div>
    ),
}));

vi.mock('../../../components/common/PageTabs', () => ({
    default: ({ tabs, activeKey, onChange }: any) => (
        <div data-testid="page-tabs">
            {tabs.map((tab: any) => (
                <button
                    type="button"
                    key={tab.key}
                    data-testid={`tab-${tab.key}`}
                    data-active={String(activeKey === tab.key)}
                    onClick={() => onChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    ),
}));

vi.mock('../../../hooks/admin/useApprovalRequestsApi', () => ({
    useApprovalRequestsApi: vi.fn(() => ({
        rows: [],
        total: 0,
        isLoading: false,
        approvingIds: [],
        rejectingIds: [],
        approve: vi.fn(),
        reject: vi.fn(),
    })),
}));

vi.mock('../../../components/landingPage/MembershipRequestsTable', () => ({
    default: () => <div data-testid="membership-requests-table" />,
}));

vi.mock('../../../components/landingPage/MembersTable', () => ({
    default: ({ members, isLoading, onEdit, onRemove, onResendInvite, resendingKey }: any) => (
        <div
            data-testid="members-table"
            data-loading={String(isLoading)}
            data-resending-key={resendingKey ?? ''}
        >
            {(members ?? []).map((m: any) => (
                <div key={m.key} data-testid={`member-row-${m.key}`}>
                    <span>{m.name}</span>
                    <button
                        type="button"
                        data-testid={`edit-btn-${m.key}`}
                        onClick={() => onEdit(m)}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        data-testid={`remove-btn-${m.key}`}
                        onClick={() => onRemove(m)}
                    >
                        Remove
                    </button>
                    <button
                        type="button"
                        data-testid={`resend-btn-${m.key}`}
                        onClick={() => onResendInvite(m)}
                    >
                        Resend
                    </button>
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../components/landingPage/modals/InviteMemberModal', () => ({
    default: ({ open, onClose, onSuccess }: any) =>
        open ? (
            <div data-testid="invite-member-modal">
                <button type="button" data-testid="close-invite-btn" onClick={onClose}>
                    Close invite
                </button>
                <button type="button" data-testid="invite-success-btn" onClick={onSuccess}>
                    Success
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../components/landingPage/modals/EditMemberModal', () => ({
    default: ({ open, member, onClose }: any) =>
        open ? (
            <div data-testid="edit-member-modal" data-member-name={member?.name}>
                <button type="button" data-testid="close-edit-btn" onClick={onClose}>
                    Close edit
                </button>
            </div>
        ) : null,
}));

vi.mock('../../../components/landingPage/modals/RemoveMemberModal', () => ({
    default: ({ open, member, onClose }: any) =>
        open ? (
            <div data-testid="remove-member-modal" data-member-name={member?.name}>
                <button type="button" data-testid="close-remove-btn" onClick={onClose}>
                    Close remove
                </button>
            </div>
        ) : null,
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const makeMember = (overrides: Partial<Member> = {}): Member => ({
    key: 'm1',
    name: 'Alice Adams',
    email: 'alice@test.com',
    role: 'Employee',
    cards: 1,
    accountStatus: 'Active',
    kycStatus: 'Completed',
    joined: '2024-01-01',
    ...overrides,
});

const defaultApiReturn = {
    members: [],
    isLoading: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PeopleLandingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useCardUsersApi as Mock).mockReturnValue(defaultApiReturn);
    });

    // -----------------------------------------------------------------------
    describe('layout', () => {
        it('renders the people header', () => {
            render(<PeopleLandingPage />);
            expect(screen.getByTestId('people-header')).toBeInTheDocument();
        });

        it('renders the page tabs', () => {
            render(<PeopleLandingPage />);
            expect(screen.getByTestId('page-tabs')).toBeInTheDocument();
        });

        it('shows the Members tab and hides the Teams tab (Teams hidden for now)', () => {
            render(<PeopleLandingPage />);
            expect(screen.getByTestId('tab-members')).toBeInTheDocument();
            expect(screen.queryByTestId('tab-teams')).toBeNull();
        });

        it('shows the Members tab as active by default', () => {
            render(<PeopleLandingPage />);
            expect(screen.getByTestId('tab-members').dataset.active).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    describe('tab switching', () => {
        it('shows MembersTable when the Members tab is active', () => {
            render(<PeopleLandingPage />);
            expect(screen.getByTestId('members-table')).toBeInTheDocument();
        });

        // The members table used to be the "if" of a ternary whose "else" was the Teams grid, so the
        // membership queue rendered a grid of hardcoded teams underneath it.
        it('shows only the request queue on the membership tab', () => {
            render(<PeopleLandingPage />);
            fireEvent.click(screen.getByTestId('tab-membership-requests'));

            expect(screen.getByTestId('membership-requests-table')).toBeInTheDocument();
            expect(screen.queryByTestId('members-table')).toBeNull();
        });

        // Without the status filter the server returns decided requests too, and the queue offered
        // Approve/Reject on them — which the server refused with "already been decided".
        it('asks the server for pending membership requests only', () => {
            render(<PeopleLandingPage />);

            const [requestType, , , , filters] = (useApprovalRequestsApi as Mock).mock.calls[0];
            expect(requestType).toBe('MEMBERSHIP');
            expect(filters).toEqual({ status: 'PENDING' });
        });
    });

    // -----------------------------------------------------------------------
    describe('MembersTable integration', () => {
        it('passes members from the API to MembersTable', () => {
            const members = [
                makeMember({ key: 'm1' }),
                makeMember({ key: 'm2', name: 'Bob Baker' }),
            ];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);
            expect(screen.getByTestId('member-row-m1')).toBeInTheDocument();
            expect(screen.getByTestId('member-row-m2')).toBeInTheDocument();
        });

        it('passes isLoading=true to MembersTable while data is loading', () => {
            (useCardUsersApi as Mock).mockReturnValue({ members: [], isLoading: true });
            render(<PeopleLandingPage />);
            expect(screen.getByTestId('members-table').dataset.loading).toBe('true');
        });
    });

    // -----------------------------------------------------------------------
    describe('InviteMemberModal', () => {
        it('InviteMemberModal is closed initially', () => {
            render(<PeopleLandingPage />);
            expect(screen.queryByTestId('invite-member-modal')).toBeNull();
        });

        it('opens InviteMemberModal when Invite member is clicked', () => {
            render(<PeopleLandingPage />);
            fireEvent.click(screen.getByTestId('invite-member-btn'));
            expect(screen.getByTestId('invite-member-modal')).toBeInTheDocument();
        });

        it('closes InviteMemberModal when its close button is clicked', () => {
            render(<PeopleLandingPage />);
            fireEvent.click(screen.getByTestId('invite-member-btn'));
            fireEvent.click(screen.getByTestId('close-invite-btn'));
            expect(screen.queryByTestId('invite-member-modal')).toBeNull();
        });

        it('refreshes the members list after a successful invite', () => {
            render(<PeopleLandingPage />);
            fireEvent.click(screen.getByTestId('invite-member-btn'));
            fireEvent.click(screen.getByTestId('invite-success-btn'));
            expect(useCardUsersApi).toHaveBeenCalledWith(1, undefined, 1);
        });
    });

    // -----------------------------------------------------------------------
    describe('EditMemberModal', () => {
        it('EditMemberModal is closed initially', () => {
            render(<PeopleLandingPage />);
            expect(screen.queryByTestId('edit-member-modal')).toBeNull();
        });

        it('opens EditMemberModal with the correct member when Edit is clicked', () => {
            const members = [makeMember({ key: 'm1', name: 'Alice Adams' })];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);

            fireEvent.click(screen.getByTestId('edit-btn-m1'));
            const modal = screen.getByTestId('edit-member-modal');
            expect(modal).toBeInTheDocument();
            expect(modal.dataset.memberName).toBe('Alice Adams');
        });

        it('closes EditMemberModal when its close button is clicked', () => {
            const members = [makeMember({ key: 'm1' })];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);

            fireEvent.click(screen.getByTestId('edit-btn-m1'));
            fireEvent.click(screen.getByTestId('close-edit-btn'));
            expect(screen.queryByTestId('edit-member-modal')).toBeNull();
        });

        it('only one modal is open at a time (edit closes when invite opens)', () => {
            const members = [makeMember({ key: 'm1' })];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);

            fireEvent.click(screen.getByTestId('edit-btn-m1'));
            expect(screen.getByTestId('edit-member-modal')).toBeInTheDocument();

            // Close edit and open invite
            fireEvent.click(screen.getByTestId('close-edit-btn'));
            fireEvent.click(screen.getByTestId('invite-member-btn'));
            expect(screen.queryByTestId('edit-member-modal')).toBeNull();
            expect(screen.getByTestId('invite-member-modal')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    describe('RemoveMemberModal', () => {
        it('RemoveMemberModal is closed initially', () => {
            render(<PeopleLandingPage />);
            expect(screen.queryByTestId('remove-member-modal')).toBeNull();
        });

        it('opens RemoveMemberModal with the correct member when Remove is clicked', () => {
            const members = [makeMember({ key: 'm1', name: 'Bob Baker', cards: 0 })];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);

            fireEvent.click(screen.getByTestId('remove-btn-m1'));
            const modal = screen.getByTestId('remove-member-modal');
            expect(modal).toBeInTheDocument();
            expect(modal.dataset.memberName).toBe('Bob Baker');
        });

        it('closes RemoveMemberModal when its close button is clicked', () => {
            const members = [makeMember({ key: 'm1', cards: 0 })];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);

            fireEvent.click(screen.getByTestId('remove-btn-m1'));
            fireEvent.click(screen.getByTestId('close-remove-btn'));
            expect(screen.queryByTestId('remove-member-modal')).toBeNull();
        });
    });

    // -----------------------------------------------------------------------
    describe('resend invitation', () => {
        it('calls the card-member resend with the member id when Resend is clicked', async () => {
            const members = [makeMember({ key: '42', inviteStatus: 'PENDING' })];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);

            fireEvent.click(screen.getByTestId('resend-btn-42'));
            await waitFor(() => expect(resendCardMemberInvite).toHaveBeenCalledWith('42'));
        });

        it('shows a success toast when the resend succeeds', async () => {
            const members = [makeMember({ key: '42', inviteStatus: 'PENDING' })];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);

            fireEvent.click(screen.getByTestId('resend-btn-42'));
            await waitFor(() =>
                expect(showToast).toHaveBeenCalledWith({
                    variant: 'success',
                    description: 'Invitation resent successfully.',
                })
            );
        });

        it('does not show a success toast when the resend fails', async () => {
            (resendCardMemberInvite as Mock).mockResolvedValueOnce(false);
            const members = [makeMember({ key: '42', inviteStatus: 'PENDING' })];
            (useCardUsersApi as Mock).mockReturnValue({ members, isLoading: false });
            render(<PeopleLandingPage />);

            fireEvent.click(screen.getByTestId('resend-btn-42'));
            await waitFor(() => expect(resendCardMemberInvite).toHaveBeenCalled());
            expect(showToast).not.toHaveBeenCalled();
        });
    });
});
