import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import EditMemberModal from '../../../../components/landingPage/modals/EditMemberModal';
import { useUpdateMemberRole } from '../../../../hooks/admin/useUpdateMemberRole';

vi.mock('../../../../hooks/admin/useUpdateMemberRole', () => ({
    useUpdateMemberRole: vi.fn(),
}));

// The role options come from the server presets; this test is about the form, not the fetch.
vi.mock('../../../../hooks/admin/useRoleCatalogue', () => ({
    useRoleCatalogue: () => ({
        roles: [
            {
                roleName: 'Admin',
                description: 'Full control.',
                isDefault: false,
                actsAsCorporateAdmin: true,
                permissionCount: 39,
                permissions: { version: 1, services: [] },
            },
            {
                roleName: 'Employee',
                description: 'Self-service only.',
                isDefault: true,
                actsAsCorporateAdmin: false,
                permissionCount: 8,
                permissions: { version: 1, services: [] },
            },
        ],
        activeRoleName: 'Admin',
        setActiveRoleName: vi.fn(),
        activeRole: null,
        isLoading: false,
    }),
}));

vi.mock('../../../../components/common/modalProps', () => ({
    MODAL_CLOSE_ICON: null,
    ROUNDED_MODAL_CLASSNAMES: {},
}));

const mockSubmitRole = vi.fn();
const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

const member = (over = {}) =>
    ({
        key: '42',
        name: 'Aarav Sharma',
        email: 'aarav@peko.in',
        mobileNo: '9876543210',
        role: 'Employee',
        kycStatus: 'Not started',
        ...over,
    }) as any;

const renderOpen = (over = {}) =>
    render(
        <EditMemberModal
            open
            member={member(over)}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
        />
    );

beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitRole.mockResolvedValue(true);
    (useUpdateMemberRole as unknown as Mock).mockReturnValue({
        submitRole: mockSubmitRole,
        isLoading: false,
    });
});

describe('EditMemberModal', () => {
    it('renders nothing when closed', () => {
        render(<EditMemberModal open={false} member={member()} onClose={mockOnClose} />);

        expect(screen.queryByText(/change what this member can do/i)).not.toBeInTheDocument();
    });

    it('titles the modal with the member name', () => {
        renderOpen();

        expect(screen.getByText('Edit Aarav Sharma')).toBeInTheDocument();
    });

    it('renders a Role field', () => {
        renderOpen();

        expect(screen.getByLabelText('Role')).toBeInTheDocument();
    });

    // These had inputs but no column, table or endpoint behind them — Save accepted them and threw them away.
    // They must not come back without somewhere to store them.
    it('does NOT offer Team, Make team lead or Department', () => {
        renderOpen();

        expect(screen.queryByLabelText('Team')).toBeNull();
        expect(screen.queryByLabelText('Department')).toBeNull();
        expect(screen.queryByText(/make team lead/i)).toBeNull();
        expect(screen.queryAllByRole('switch')).toHaveLength(0);
    });

    it('prefills the member current role so Save is a deliberate change', async () => {
        renderOpen({ role: 'Admin' });

        await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument());
    });

    // A blanket PUT would re-send the role when the admin only fixed a typo — and the server refuses a
    // self-role-change, so that would fail a save they never asked for.
    it('sends nothing when nothing was edited', async () => {
        renderOpen();

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => expect(mockSubmitRole).toHaveBeenCalledWith(42, {}));
    });

    it('sends only the field that actually changed', async () => {
        renderOpen();

        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Aarav S Sharma' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() =>
            expect(mockSubmitRole).toHaveBeenCalledWith(42, { name: 'Aarav S Sharma' })
        );
    });

    it('saves an edited mobile number', async () => {
        renderOpen();

        fireEvent.change(screen.getByLabelText('Mobile number'), {
            target: { value: '9000000001' },
        });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() =>
            expect(mockSubmitRole).toHaveBeenCalledWith(42, { mobileNo: '9000000001' })
        );
    });

    it('rejects a mobile number that is not 10 digits', async () => {
        renderOpen();

        fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '12345' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => expect(screen.getByText(/must be 10 digits/i)).toBeInTheDocument());
        expect(mockSubmitRole).not.toHaveBeenCalled();
    });

    it('refreshes the list and closes only after a successful save', async () => {
        renderOpen();

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('stays open when the save is refused, so the change is not silently lost', async () => {
        mockSubmitRole.mockResolvedValue(false);
        renderOpen();

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => expect(mockSubmitRole).toHaveBeenCalled());
        expect(mockOnSuccess).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    // Name and mobile are the identity Pine Labs verified. After KYC completes, changing them here would
    // leave our record disagreeing with the issuer's, so they are shown but locked.
    describe('once KYC is complete', () => {
        const completed = { kycStatus: 'Completed' };

        it('locks name and mobile but still allows a role change', async () => {
            renderOpen(completed);

            expect(screen.getByLabelText('Name')).toBeDisabled();
            expect(screen.getByLabelText('Mobile number')).toBeDisabled();
            expect(screen.getByText(/only their role can be changed/i)).toBeInTheDocument();
        });

        it('never sends name or mobile even if the values differ', async () => {
            renderOpen({ ...completed, role: 'Employee' });

            fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

            await waitFor(() => expect(mockSubmitRole).toHaveBeenCalled());
            const [, changes] = mockSubmitRole.mock.calls[0];
            expect(changes).not.toHaveProperty('name');
            expect(changes).not.toHaveProperty('mobileNo');
        });
    });

    // Email is the member's LOGIN username, and the update endpoint writes only the member row — never the
    // credential. An editable field here would change the address on screen while sign-in kept the old one.
    it('shows the email but never lets it be edited', () => {
        renderOpen();

        const email = screen.getByDisplayValue('aarav@peko.in');
        expect(email).toBeDisabled();
        expect(screen.getByText(/sign-in address and cannot be changed/i)).toBeInTheDocument();
    });

    it('closes on Cancel without saving', () => {
        renderOpen();

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(mockOnClose).toHaveBeenCalled();
        expect(mockSubmitRole).not.toHaveBeenCalled();
    });
});
