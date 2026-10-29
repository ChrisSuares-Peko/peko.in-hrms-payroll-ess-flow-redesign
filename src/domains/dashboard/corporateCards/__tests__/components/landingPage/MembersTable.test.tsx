import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import MembersTable, { MembersTableProps } from '../../../components/landingPage/MembersTable';
import { Member } from '../../../utils/types';

// GenericTable sizes its column set against window.innerWidth, so with the real one a wide table drops
// columns into the expandable row and header assertions become a function of the jsdom viewport. Mocking
// it exercises the column definitions themselves, which is what this table owns.
vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource }: any) => (
        <div data-testid="generic-table">
            <div data-testid="headers">
                {(columns ?? []).map((c: any) => (
                    <span key={c.key} data-testid={`header-${c.key}`}>
                        {c.title}
                    </span>
                ))}
            </div>
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid={`row-${row.key}`}>
                    {(columns ?? []).map((c: any) => (
                        <span key={c.key} data-testid={`cell-${c.key}-${row.key}`}>
                            {c.render ? c.render(row[c.dataIndex], row) : row[c.dataIndex]}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    ),
}));

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

const renderTable = (members: Member[], overrides: Partial<MembersTableProps> = {}) =>
    render(
        <MembersTable
            members={members}
            onEdit={vi.fn()}
            onRemove={vi.fn()}
            onResendInvite={vi.fn()}
            onCompleteKyc={vi.fn()}
            {...overrides}
            page={1}
            pageSize={10}
            total={members.length}
            onPageChange={vi.fn()}
        />
    );

describe('MembersTable', () => {
    describe('status columns', () => {
        it('renders an Account status column', () => {
            renderTable([makeMember()]);
            expect(screen.getByTestId('header-accountStatus')).toHaveTextContent('Account status');
        });

        it('renders a KYC status column', () => {
            renderTable([makeMember()]);
            expect(screen.getByTestId('header-kycStatus')).toHaveTextContent('KYC status');
        });

        // The Team column it replaced was never backed by data — useCardUsersApi hardcoded team: '-',
        // so every row rendered a literal dash.
        it('no longer renders a Team column', () => {
            renderTable([makeMember()]);
            expect(screen.queryByTestId('header-team')).toBeNull();
        });

        it('shows the KYC status label for the row', () => {
            renderTable([makeMember({ kycStatus: 'Not started' })]);
            expect(screen.getByTestId('cell-kycStatus-m1')).toHaveTextContent('Not started');
        });

        // cardStatus was a rollup of the member's issuances (ACTIVE/INACTIVE/NONE), which duplicated the
        // Cards count and said nothing about whether the member can be issued a card at all.
        it('no longer renders a Card status column', () => {
            renderTable([makeMember()]);
            expect(screen.queryByTestId('header-cardStatus')).toBeNull();
        });

        it('keeps the Cards count column', () => {
            renderTable([makeMember({ cards: 3 })]);
            expect(screen.getByTestId('cell-cards-m1')).toHaveTextContent('3');
        });

        it('shows the account status label for the row', () => {
            renderTable([makeMember({ accountStatus: 'Pending' })]);
            expect(screen.getByTestId('cell-accountStatus-m1')).toHaveTextContent('Pending');
        });

        // Two independent statuses that can read the same word — they must not be sourced from one field.
        it('renders the account and KYC statuses independently', () => {
            renderTable([makeMember({ accountStatus: 'Active', kycStatus: 'Rejected' })]);
            expect(screen.getByTestId('cell-accountStatus-m1')).toHaveTextContent('Active');
            expect(screen.getByTestId('cell-kycStatus-m1')).toHaveTextContent('Rejected');
        });
    });

    // Gated on whether the person has set a password, not on the membership status: nothing moves a stored
    // status when someone completes the reset, so Resend was offered for ever and the server then refused it
    // with "This member has already set their password."
    describe('row actions', () => {
        it('offers Resend invitation while the invite is outstanding', () => {
            renderTable([makeMember({ hasSetPassword: false })]);
            expect(
                screen.getByRole('button', { name: /resend invitation to alice adams/i })
            ).toBeInTheDocument();
        });

        it('does not offer Resend invitation once the member has set a password', () => {
            renderTable([makeMember({ hasSetPassword: true })]);
            expect(screen.queryByRole('button', { name: /resend invitation/i })).toBeNull();
        });

        // Fails closed: an older server that does not send the field must not have the action offered, or
        // every click ends in a refusal.
        it('does not offer Resend invitation when the server did not say', () => {
            renderTable([makeMember({})]);
            expect(screen.queryByRole('button', { name: /resend invitation/i })).toBeNull();
        });
    });
});

// The account holder is listed as a member (the server pins their row first), but three of the actions are
// wrong for them and one is only theirs. The server refuses all of it too — this is the visible half.
describe('MembersTable — the account owner', () => {
    // The server sends isSelf on the account holder's row too — their row IS their membership — so the
    // fixture carries both, and the component gates on the one flag.
    const owner = (overrides: Partial<Member> = {}) =>
        makeMember({
            key: 'owner-500',
            name: 'Asha Owner',
            role: 'Admin',
            isAccountOwner: true,
            isSelf: true,
            ...overrides,
        });

    // Soft-deleting the row that carries their card is unrecoverable, so it is not offered at all.
    it('offers no Remove action', () => {
        renderTable([owner()]);

        expect(screen.queryByLabelText('Remove Asha Owner')).not.toBeInTheDocument();
    });

    it('still offers Remove for an ordinary member — including one whose role is Admin', () => {
        renderTable([makeMember({ name: 'Ravi Member', role: 'Admin' })]);

        expect(screen.getByLabelText('Remove Ravi Member')).toBeInTheDocument();
    });

    // They created the account; there was never an invitation.
    it('offers no Resend action even while the row reads PENDING', () => {
        renderTable([owner({ hasSetPassword: false })]);

        expect(screen.queryByLabelText('Resend invitation to Asha Owner')).not.toBeInTheDocument();
    });

    // 'Initiated' and 'Pending' are a KYC that was started and never finished — the state that most needs the
    // issuer's link. Excluding them left the account holder looking at a Pending status with nothing to click.
    it.each([['Not started'], ['Rejected'], ['Initiated'], ['Pending']] as const)(
        'offers Complete KYC when their KYC is %s',
        kycStatus => {
            renderTable([owner({ kycStatus })]);

            expect(screen.getByLabelText('Complete your KYC')).toBeInTheDocument();
        }
    );

    it('offers no Complete KYC once their KYC is Completed', () => {
        renderTable([owner({ kycStatus: 'Completed' })]);

        expect(screen.queryByLabelText('Complete your KYC')).not.toBeInTheDocument();
    });

    // KYC is self-service: the issuer OTPs the handset on the row, so it is never started for someone else.
    it('never offers Complete KYC on an ordinary member row', () => {
        renderTable([makeMember({ kycStatus: 'Not started' })]);

        expect(screen.queryByLabelText('Complete your KYC')).not.toBeInTheDocument();
    });

    it('calls back with the owner row when Complete KYC is clicked', () => {
        const onCompleteKyc = vi.fn();
        renderTable([owner({ kycStatus: 'Not started' })], { onCompleteKyc });

        fireEvent.click(screen.getByLabelText('Complete your KYC'));

        expect(onCompleteKyc).toHaveBeenCalledWith(expect.objectContaining({ key: 'owner-500' }));
    });

    // Clicking it switches the session to Employee mode, so the button shows the switch in flight.
    it('shows the action as loading while the mode switch is in flight', () => {
        renderTable([owner({ kycStatus: 'Not started' })], { isStartingKyc: true });

        expect(screen.getByLabelText('Complete your KYC').closest('button')).toHaveClass(
            'ant-btn-loading'
        );
    });
});

// A sub-corporate Admin administers People without owning the account. Their own row is pinned first by the
// server, and it earns the same self-treatment: they cannot remove or re-invite themselves, and only they can
// start their own KYC.
describe('MembersTable — a sub-corporate Admin own row', () => {
    const self = (overrides: Partial<Member> = {}) =>
        makeMember({
            key: 'me-77',
            name: 'Priya Admin',
            role: 'Admin',
            isSelf: true,
            ...overrides,
        });

    it('offers no Remove action on their own row', () => {
        renderTable([self()]);

        expect(screen.queryByLabelText('Remove Priya Admin')).not.toBeInTheDocument();
    });

    it('offers no Resend action on their own row', () => {
        renderTable([self({ hasSetPassword: false })]);

        expect(screen.queryByLabelText('Resend invitation to Priya Admin')).not.toBeInTheDocument();
    });

    it('offers Complete KYC on their own row', () => {
        renderTable([self({ kycStatus: 'Not started' })]);

        expect(screen.getByLabelText('Complete your KYC')).toBeInTheDocument();
    });

    // They are not the account holder, so nothing here depends on that flag.
    it('does not need isAccountOwner to get the self treatment', () => {
        renderTable([self({ kycStatus: 'Not started' })]);

        expect(screen.queryByLabelText('Remove Priya Admin')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Complete your KYC')).toBeInTheDocument();
    });

    // Everyone else keeps the full action set.
    it('still offers Remove and Resend on another member row', () => {
        renderTable([makeMember({ name: 'Ravi Member', hasSetPassword: false })]);

        expect(screen.getByLabelText('Remove Ravi Member')).toBeInTheDocument();
        expect(screen.getByLabelText('Resend invitation to Ravi Member')).toBeInTheDocument();
    });
});
