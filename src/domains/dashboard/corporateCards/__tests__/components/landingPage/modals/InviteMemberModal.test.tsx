import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import InviteMemberModal from '../../../../components/landingPage/modals/InviteMemberModal';
import { useInviteMemberApi } from '../../../../hooks/user/useInviteMemberApi';

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------

vi.mock('../../../../hooks/user/useInviteMemberApi', () => ({
    useInviteMemberApi: vi.fn(),
}));

// The role select is fed by the server presets; this test is about the form, not the fetch.
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockSubmitInvite = vi.fn();
const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

const defaultHookReturn = {
    isLoading: false,
    submitInvite: mockSubmitInvite,
};

const renderOpen = () =>
    render(<InviteMemberModal open onClose={mockOnClose} onSuccess={mockOnSuccess} />);

const fillForm = () => {
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'john@peko.one' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InviteMemberModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useInviteMemberApi as Mock).mockReturnValue(defaultHookReturn);
    });

    describe('when closed', () => {
        it('does not render the modal body when open=false', () => {
            render(
                <InviteMemberModal open={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
            );
            expect(screen.queryByText('Invite a new member')).toBeNull();
        });
    });

    describe('rendering', () => {
        it('renders the modal title', () => {
            renderOpen();
            expect(screen.getByText('Invite a new member')).toBeInTheDocument();
        });

        it('renders the introductory description text', () => {
            renderOpen();
            expect(screen.getByText(/they'll get an email/i)).toBeInTheDocument();
        });

        it('renders the roles-permissions note, pointing at where the roles are listed', () => {
            renderOpen();
            expect(screen.getByText(/settings → roles & permissions/i)).toBeInTheDocument();
        });

        it('renders every form field', () => {
            renderOpen();
            expect(screen.getByLabelText('First name')).toBeInTheDocument();
            expect(screen.getByLabelText('Last name')).toBeInTheDocument();
            expect(screen.getByLabelText('Work email')).toBeInTheDocument();
            expect(screen.getByLabelText('Mobile number')).toBeInTheDocument();
        });

        // Role is now assignable at invite time; Department stays hidden at its fixed default.
        it('renders a Role select and keeps Department hidden', () => {
            renderOpen();
            expect(screen.getByLabelText('Role')).toBeInTheDocument();
            expect(screen.queryByLabelText('Department')).toBeNull();
        });

        it('offers the server role presets, and defaults to Employee', () => {
            renderOpen();
            // antd renders the selected value as text inside the Select.
            expect(screen.getByText('Employee')).toBeInTheDocument();
        });

        it('renders the Cancel and Send invite buttons (single step, no Next/Go back)', () => {
            renderOpen();
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /send invite/i })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /^next$/i })).toBeNull();
            expect(screen.queryByRole('button', { name: /go back/i })).toBeNull();
        });

        it('caps First name and Last name at 50 characters', () => {
            renderOpen();
            expect(screen.getByLabelText('First name')).toHaveAttribute('maxLength', '50');
            expect(screen.getByLabelText('Last name')).toHaveAttribute('maxLength', '50');
        });

        it('caps Work email at 100 and Mobile number at 10 characters', () => {
            renderOpen();
            expect(screen.getByLabelText('Work email')).toHaveAttribute('maxLength', '100');
            expect(screen.getByLabelText('Mobile number')).toHaveAttribute('maxLength', '10');
        });
    });

    // Mobile number was the only field in the form with no onChange filter, so letters and symbols typed
    // freely and only failed on submit.
    describe('mobile number input filtering', () => {
        it('strips letters and symbols as they are typed', () => {
            renderOpen();
            const mobile = screen.getByLabelText('Mobile number');
            fireEvent.change(mobile, { target: { value: '98abc!76@5' } });
            expect(mobile).toHaveValue('98765');
        });

        it('keeps a valid 10-digit number untouched', () => {
            renderOpen();
            const mobile = screen.getByLabelText('Mobile number');
            fireEvent.change(mobile, { target: { value: '9876543210' } });
            expect(mobile).toHaveValue('9876543210');
        });

        it('rejects an all-letter entry outright', () => {
            renderOpen();
            const mobile = screen.getByLabelText('Mobile number');
            fireEvent.change(mobile, { target: { value: 'abcdefghij' } });
            expect(mobile).toHaveValue('');
        });

        it('offers the numeric keypad on touch devices', () => {
            renderOpen();
            expect(screen.getByLabelText('Mobile number')).toHaveAttribute('inputmode', 'numeric');
        });

        it('still flags a short number on submit', async () => {
            renderOpen();
            fireEvent.change(screen.getByLabelText('Mobile number'), {
                target: { value: '98765' },
            });
            fireEvent.click(screen.getByRole('button', { name: /send invite/i }));
            expect(
                await screen.findByText('Enter a valid 10-digit mobile number')
            ).toBeInTheDocument();
        });
    });

    describe('validation', () => {
        it('rejects a trailing space in First name', async () => {
            renderOpen();
            const firstName = screen.getByLabelText('First name');
            fireEvent.change(firstName, { target: { value: 'John ' } });
            fireEvent.blur(firstName);
            expect(
                await screen.findByText('First name cannot end with a space')
            ).toBeInTheDocument();
        });

        it('rejects a too-short First name', async () => {
            renderOpen();
            const firstName = screen.getByLabelText('First name');
            fireEvent.change(firstName, { target: { value: 'ab' } });
            fireEvent.blur(firstName);
            expect(
                await screen.findByText('First name must be at least 3 characters')
            ).toBeInTheDocument();
        });

        it('rejects a too-short Last name', async () => {
            renderOpen();
            const lastName = screen.getByLabelText('Last name');
            fireEvent.change(lastName, { target: { value: 'ab' } });
            fireEvent.blur(lastName);
            expect(
                await screen.findByText('Last name must be at least 3 characters')
            ).toBeInTheDocument();
        });
    });

    describe('hidden department and role defaults', () => {
        it('submits IT / Employee without the user entering either', async () => {
            renderOpen();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /send invite/i }));
            await waitFor(() => {
                expect(mockSubmitInvite).toHaveBeenCalledWith(
                    expect.objectContaining({ department: 'IT', role: 'Employee' })
                );
            });
        });

        it('restores the defaults after the modal is closed and reopened', async () => {
            const { rerender } = render(
                <InviteMemberModal open onClose={mockOnClose} onSuccess={mockOnSuccess} />
            );
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
            rerender(<InviteMemberModal open onClose={mockOnClose} onSuccess={mockOnSuccess} />);

            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /send invite/i }));
            await waitFor(() => {
                expect(mockSubmitInvite).toHaveBeenCalledWith(
                    expect.objectContaining({ department: 'IT', role: 'Employee' })
                );
            });
        });
    });

    describe('actions', () => {
        it('calls onClose when Cancel is clicked', () => {
            renderOpen();
            fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('shows a loading indicator on the Send invite button when isLoading=true', () => {
            (useInviteMemberApi as Mock).mockReturnValue({ ...defaultHookReturn, isLoading: true });
            renderOpen();
            expect(screen.getByRole('button', { name: /send invite/i })).toHaveClass(
                'ant-btn-loading'
            );
        });

        it('submits the details and, on success, calls onSuccess then closes', async () => {
            mockSubmitInvite.mockResolvedValue(true);
            renderOpen();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /send invite/i }));

            await waitFor(() => expect(mockSubmitInvite).toHaveBeenCalled());
            expect(mockSubmitInvite).toHaveBeenCalledWith(
                expect.objectContaining({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@peko.one',
                    mobileNo: '9876543210',
                    role: 'Employee',
                })
            );
            await waitFor(() => {
                expect(mockOnSuccess).toHaveBeenCalled();
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('does not call onSuccess or close when the invite fails', async () => {
            mockSubmitInvite.mockResolvedValue(false);
            renderOpen();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /send invite/i }));

            await waitFor(() => expect(mockSubmitInvite).toHaveBeenCalled());
            expect(mockOnSuccess).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });
});
