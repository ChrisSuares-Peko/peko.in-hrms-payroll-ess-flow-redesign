import { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { useNavData } from '../SidebarData';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

const service = (label: string, extra: Record<string, unknown> = {}) => ({
    label,
    hasAccess: true,
    subServices: [],
    enableMoreService: false,
    ...extra,
});

const SERVICES = [
    service('Dashboard'),
    service('Payroll'),
    service('Corporate Cards'),
    service('Corporate Travel'),
    service('Reports'),
    service('Need Help'),
    service('Settings'),
];

const mockState = (
    auth: Record<string, unknown>,
    services = SERVICES,
    cardKybComplete: boolean | null = null
) => {
    const state = {
        reducer: {
            auth: { role: 'corporate', ...auth },
            services: { services: { data: services } },
            corporateCards: { cardKybComplete },
        },
    };
    (useAppSelector as Mock).mockImplementation((selector: (s: typeof state) => unknown) =>
        selector(state)
    );
};

const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/corporate-cards']}>{children}</MemoryRouter>
);

const labelsOf = (items: ReturnType<typeof useNavData>) =>
    (items ?? []).map(item => item.stringLabel).filter(Boolean);

describe('useNavData — corporate sidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lists every accessible service for the owner acting as Admin', () => {
        mockState({ subCorporateId: 0, subCorporateRole: 'Admin', activeSubRole: 'Admin' });
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(labelsOf(result.current)).toEqual([
            'Dashboard',
            'Payroll',
            'Corporate Cards',
            'Corporate Travel',
            'Reports',
            'Need Help',
            'Settings',
        ]);
    });

    // The Admin/Employee mode belongs to an EMPLOYEE session now — an employee's sidebar is already only
    // what their own grant covers, so there is nothing further to restrict. A corporate session has no mode
    // at all: the account holder reaches their cardholder view by switching IDENTITY, which lands them on an
    // employee session with an employee sidebar.
    it('leaves a corporate session unrestricted, whatever mode the session carries', () => {
        mockState({ subCorporateId: 0, subCorporateRole: 'Admin', activeSubRole: 'Employee' });
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(labelsOf(result.current)).toEqual([
            'Dashboard',
            'Payroll',
            'Corporate Cards',
            'Corporate Travel',
            'Reports',
            'Need Help',
            'Settings',
        ]);
    });

    it('leaves a member assigned Employee with every service they were actually granted', () => {
        mockState({ subCorporateId: 42, subCorporateRole: 'Employee', activeSubRole: 'Employee' }, [
            service('Payroll'),
            service('Corporate Cards'),
            service('Need Help'),
        ]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(labelsOf(result.current)).toEqual(['Payroll', 'Corporate Cards', 'Need Help']);
    });

    it('still respects hasAccess and enableMoreService', () => {
        mockState({ subCorporateId: 0, subCorporateRole: 'Admin' }, [
            service('Corporate Cards', { hasAccess: false }),
            service('Need Help', { enableMoreService: true }),
            service('Payroll'),
        ]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(labelsOf(result.current)).toEqual(['Payroll']);
    });
});

const keysOf = (items: ReturnType<typeof useNavData>) => (items ?? []).map(item => item.key);

const membership = (label: string, role: string | null = 'Employee') => ({
    label,
    hasAccess: true,
    role,
    status: 'ACTIVE',
    ref: null,
});

/**
 * An employee's Payroll is the ESS portal — payslips, attendance, leaves — not the corporate payroll module.
 * Their services grant covers Payroll once they hold both invites, so the tree emits its own entry too and
 * the label appeared twice, one of them routing somewhere an employee has no business in.
 */
describe('useNavData — an employee holding Corporate Cards', () => {
    beforeEach(() => vi.clearAllMocks());

    const employee = (memberships: ReturnType<typeof membership>[]) =>
        mockState({
            role: 'user',
            employeeProfileId: 900,
            serviceMemberships: memberships,
        });

    it('shows Payroll exactly once for someone invited to both', () => {
        employee([membership('Payroll'), membership('Corporate Cards')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current).filter(key => String(key).includes('payroll'))).toHaveLength(0);
        expect(keysOf(result.current).filter(key => key === '/employee')).toHaveLength(1);
    });

    it('routes their Payroll to the ESS portal, not the corporate module', () => {
        employee([membership('Payroll'), membership('Corporate Cards')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current)[0]).toBe('/employee');
    });

    it('still lists the services they hold alongside it', () => {
        employee([membership('Payroll'), membership('Corporate Cards')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(labelsOf(result.current)).toContain('Corporate Cards');
    });

    // A cards-only invite must not offer a portal they have no record in.
    it('offers no Payroll at all to a cards-only member', () => {
        employee([membership('Corporate Cards')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current)).not.toContain('/employee');
        expect(labelsOf(result.current)).toContain('Corporate Cards');
    });
});

describe('useNavData — a payroll-only employee whose employer has finished KYB', () => {
    beforeEach(() => vi.clearAllMocks());

    const payrollOnly = (cardKybComplete: boolean | null, services = SERVICES) =>
        mockState(
            { role: 'user', employeeProfileId: 900, serviceMemberships: [membership('Payroll')] },
            services,
            cardKybComplete
        );

    it('shows Corporate Cards although they hold no card membership', () => {
        payrollOnly(true, [service('Payroll'), service('Need Help')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(labelsOf(result.current)).toContain('Corporate Cards');
    });

    // The services tree carries no card entry for a non-member, so the item is built by the sidebar. If the
    // tree does carry one it must not be added a second time.
    it('adds the entry once when the services tree already carries it', () => {
        payrollOnly(true, [service('Payroll'), service('Corporate Cards'), service('Need Help')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(labelsOf(result.current).filter(label => label === 'Corporate Cards')).toHaveLength(
            1
        );
    });

    it('places it ahead of the trailing utility group, not after it', () => {
        payrollOnly(true, [service('Payroll'), service('Need Help'), service('Settings')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        const labels = labelsOf(result.current);
        expect(labels.indexOf('Corporate Cards')).toBeLessThan(labels.indexOf('Need Help'));
    });

    // Corporate Cards is mounted inside the employee shell, not the corporate one — an employee has a
    // single portal, so the entry must not route them into the corporate layout halfway through.
    it('routes Corporate Cards inside the employee shell', () => {
        payrollOnly(true, [service('Payroll'), service('Need Help')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current)).toContain('/employee/corporate-cards');
        expect(keysOf(result.current)).not.toContain('/corporate-cards');
    });

    // The services tree emits its own card entry for a member, pointed at the corporate route.
    it('does not leave the corporate card route in a member sidebar', () => {
        mockState(
            {
                role: 'user',
                employeeProfileId: 900,
                serviceMemberships: [membership('Payroll'), membership('Corporate Cards')],
            },
            [service('Payroll'), service('Corporate Cards'), service('Need Help')]
        );
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current)).toContain('/employee/corporate-cards');
        expect(keysOf(result.current)).not.toContain('/corporate-cards');
        expect(labelsOf(result.current).filter(l => l === 'Corporate Cards')).toHaveLength(1);
    });

    // Need Help is no longer appended to an employee's services tree, so the trailing utility group is
    // empty for them — the divider that group carries must not be emitted on its own.
    it('draws no trailing divider when the tree has no utility services', () => {
        payrollOnly(true, [service('Payroll')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current)).toEqual(['/employee', '/employee/corporate-cards']);
        expect((result.current ?? []).some(item => item.key === '')).toBe(false);
    });

    it('keeps their Payroll pointed at the ESS portal', () => {
        payrollOnly(true, [service('Payroll'), service('Corporate Cards'), service('Need Help')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current)[0]).toBe('/employee');
        expect(keysOf(result.current).filter(key => String(key).includes('payroll'))).toHaveLength(
            0
        );
    });

    it('falls back to the ESS portal alone when the employer has not finished KYB', () => {
        payrollOnly(false, [service('Payroll'), service('Need Help')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current)).toEqual(['/employee']);
    });

    // The entry no longer comes from the services tree, so it must not wait on one — services load async
    // and the employee would otherwise watch Corporate Cards appear a beat after the rest of the sidebar.
    it('shows it before the services tree has loaded', () => {
        payrollOnly(true, []);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(labelsOf(result.current)).toContain('Corporate Cards');
    });

    // null is not false: until kyb-state answers, the employee sees their portal and nothing is claimed.
    it('shows the ESS portal alone while the answer is still unknown', () => {
        payrollOnly(null, [service('Payroll'), service('Need Help')]);
        const { result } = renderHook(() => useNavData(), { wrapper });

        expect(keysOf(result.current)).toEqual(['/employee']);
    });
});
