import { render, screen } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import GeneralTab from '../../../components/settings/GeneralTab';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

// The notification controls have their own suite; here they must not reach for auth state.
vi.mock('../../../hooks/admin/useNotificationControls', () => ({
    useNotificationControls: () => ({
        controls: {
            requireReceipts: true,
            autoDeclineOverLimit: true,
            notifyPendingKyc: true,
            weeklySpendDigest: true,
        },
        isLoading: false,
        saving: null,
        toggle: vi.fn(),
    }),
}));

// The closure card has its own suite; here it must not reach for auth state or the network.
vi.mock('../../../hooks/admin/useAccountClosureApi', () => ({
    useAccountClosureApi: () => ({
        request: null,
        reasons: [],
        isLoading: false,
        submit: vi.fn(),
        submitLoading: false,
        hasPendingRequest: false,
    }),
}));

type Account = { companyName: string; email: string } | null;
type Auth = { role?: string };

// Only the Corporate account may close the account. An employee Admin runs the programme but does not own it.
const OWNER: Auth = { role: 'corporate' };
const EMPLOYEE_ADMIN: Auth = { role: 'user' };

const mockAccount = (user: Account, auth: Auth = OWNER) => {
    (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
        fn({ reducer: { user: { user }, auth } })
    );
};

const setup = (user: Account, auth: Auth = OWNER) => {
    mockAccount(user, auth);
    const view = render(<GeneralTab />);
    const fields = () => Array.from(view.container.querySelectorAll('input'));
    return { ...view, fields };
};

const closureButton = () => screen.queryByRole('button', { name: /request account closure/i });

const ACCOUNT = { companyName: 'Peko Technologies Pvt Ltd', email: 'billing@peko.one' };

beforeEach(() => vi.clearAllMocks());

describe('GeneralTab company details', () => {
    it('pre-populates both fields from the account', () => {
        const { fields } = setup(ACCOUNT);

        const [company, billing] = fields();
        expect(company).toHaveValue('Peko Technologies Pvt Ltd');
        expect(billing).toHaveValue('billing@peko.one');
    });

    it('offers no way to edit them — they are managed on the account, not here', () => {
        const { fields } = setup(ACCOUNT);

        fields().forEach(field => expect(field).toBeDisabled());
    });

    // The user slice is not persisted, so a hard refresh onto this tab renders before the fetch lands.
    // Without enableReinitialize the fields would stay blank for the rest of the session.
    it('fills in once the account details arrive after mount', () => {
        const { fields, rerender } = setup(null);

        expect(fields()[0]).toHaveValue('');

        mockAccount(ACCOUNT);
        rerender(<GeneralTab />);

        expect(fields()[0]).toHaveValue('Peko Technologies Pvt Ltd');
        expect(fields()[1]).toHaveValue('billing@peko.one');
    });

    it('shows no misleading prompt to type when the account has no company name yet', () => {
        const { fields } = setup({ companyName: '', email: '' });

        expect(fields()[0]).toHaveValue('');
        expect(fields()[0]).toHaveAttribute('placeholder', 'Not available');
        expect(screen.queryByPlaceholderText('Enter')).not.toBeInTheDocument();
    });
});

// Closing the account ends it for everyone in the corporate, so it belongs to the owner alone. An assigned
// Admin holds every other admin power on this screen, which is exactly why the card has to be hidden from
// them rather than left to fail on submit.
describe('GeneralTab account closure', () => {
    it('offers closure to the account owner', () => {
        setup(ACCOUNT, OWNER);

        expect(closureButton()).toBeInTheDocument();
    });

    it('hides it from an assigned sub-corporate Admin', () => {
        setup(ACCOUNT, EMPLOYEE_ADMIN);

        expect(closureButton()).not.toBeInTheDocument();
    });

    it('hides it from a session whose role is not corporate at all', () => {
        setup(ACCOUNT, { role: 'system_user' });

        expect(closureButton()).not.toBeInTheDocument();
    });

    it('keeps the rest of the tab intact for an assigned Admin', () => {
        const { fields } = setup(ACCOUNT, EMPLOYEE_ADMIN);

        expect(fields()[0]).toHaveValue('Peko Technologies Pvt Ltd');
        expect(fields()[1]).toHaveValue('billing@peko.one');
        expect(screen.getByText('Company')).toBeInTheDocument();
    });
});
