import { fireEvent, render, screen } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import RolesPermissionsTab from '../../../components/settings/RolesPermissionsTab';
import { useRoleCatalogue } from '../../../hooks/admin/useRoleCatalogue';

vi.mock('../../../hooks/admin/useRoleCatalogue', () => ({
    useRoleCatalogue: vi.fn(),
}));

const tree = (enabled: string[]) => ({
    version: 1,
    services: [
        {
            service: 'Corporate Cards',
            accessKey: 'corporate_cards',
            categories: [
                {
                    category: 'Self-service',
                    permissions: [
                        {
                            key: 'corporate_cards.view-own-cards',
                            label: 'View their own cards',
                            enabled: enabled.includes('corporate_cards.view-own-cards'),
                        },
                    ],
                },
                {
                    category: 'Cards',
                    permissions: [
                        {
                            key: 'corporate_cards.view-cards',
                            label: 'View all cards',
                            enabled: enabled.includes('corporate_cards.view-cards'),
                        },
                    ],
                },
            ],
        },
    ],
});

const ADMIN = {
    roleName: 'Admin',
    description: "Full control of the company's cards.",
    isDefault: false,
    actsAsCorporateAdmin: true,
    permissionCount: 2,
    permissions: tree(['corporate_cards.view-own-cards', 'corporate_cards.view-cards']),
};

const EMPLOYEE = {
    roleName: 'Employee',
    description: 'Self-service only.',
    isDefault: true,
    actsAsCorporateAdmin: false,
    permissionCount: 1,
    permissions: tree(['corporate_cards.view-own-cards']),
};

const setup = (over: Record<string, unknown> = {}) => {
    const setActiveRoleName = vi.fn();
    const value = {
        roles: [ADMIN, EMPLOYEE],
        activeRoleName: 'Admin',
        setActiveRoleName,
        activeRole: ADMIN,
        isLoading: false,
        ...over,
    };
    (useRoleCatalogue as unknown as Mock).mockReturnValue(value);
    render(<RolesPermissionsTab />);
    return value;
};

beforeEach(() => vi.clearAllMocks());

describe('RolesPermissionsTab', () => {
    it('lists the roles the server returned, not a hardcoded set', () => {
        setup();

        // Scoped to the list buttons — the selected role's name also appears as the panel heading.
        const names = screen.getAllByRole('button').map(b => b.textContent);
        expect(names.some(n => n?.includes('Admin'))).toBe(true);
        expect(names.some(n => n?.includes('Employee'))).toBe(true);
        // Names the old static mock shipped — none may survive.
        expect(screen.queryByText('Accountant')).not.toBeInTheDocument();
        expect(screen.queryByText('Developer')).not.toBeInTheDocument();
    });

    it('shows each role permission count, singularised', () => {
        setup();

        expect(screen.getByText('2 permissions')).toBeInTheDocument();
        expect(screen.getByText('1 permission')).toBeInTheDocument();
    });

    it('marks the default role so it is clear what a new member gets', () => {
        setup();

        expect(screen.getByText(/default for new members/i)).toBeInTheDocument();
    });

    it('renders the selected role description and its permissions by category', () => {
        setup();

        expect(screen.getByText("Full control of the company's cards.")).toBeInTheDocument();
        expect(screen.getByText('Self-service')).toBeInTheDocument();
        expect(screen.getByText('Cards')).toBeInTheDocument();
        expect(screen.getByText('View all cards')).toBeInTheDocument();
    });

    it('switches the panel when another role is picked', () => {
        const { setActiveRoleName } = setup();

        fireEvent.click(screen.getByText('Employee'));

        expect(setActiveRoleName).toHaveBeenCalledWith('Employee');
    });

    it('distinguishes allowed from not-allowed per permission', () => {
        setup({ activeRoleName: 'Employee', activeRole: EMPLOYEE });

        expect(screen.getByLabelText('Allowed')).toBeInTheDocument();
        expect(screen.getByLabelText('Not allowed')).toBeInTheDocument();
    });

    // Roles are server presets. Any control implying otherwise is the regression a future contributor
    // would reintroduce, so assert their ABSENCE explicitly.
    it('offers no way to edit — no toggles, no add, no save, no delete', () => {
        setup();

        expect(screen.queryAllByRole('switch')).toHaveLength(0);
        expect(screen.queryByRole('button', { name: /add new/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /create role/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('shows an empty state, not a spinner, when the roles could not be loaded', () => {
        setup({ roles: [], activeRoleName: null, activeRole: null, isLoading: false });

        expect(screen.getByText(/roles could not be loaded/i)).toBeInTheDocument();
        expect(screen.getByText(/permissions could not be loaded/i)).toBeInTheDocument();
    });

    it('spins while loading, without flashing the empty state', () => {
        setup({ roles: [], activeRoleName: null, activeRole: null, isLoading: true });

        expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
        expect(screen.queryByText('View all cards')).not.toBeInTheDocument();
    });
});
