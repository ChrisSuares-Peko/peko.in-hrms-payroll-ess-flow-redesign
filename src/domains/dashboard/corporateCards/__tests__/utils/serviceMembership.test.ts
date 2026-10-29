import { describe, expect, it } from 'vitest';

import { UserRole } from '@customtypes/general';
import { ServiceMembership } from '@src/domains/auth/slices/loginSlice';

import {
    actsAsAdminUi,
    ADMIN_ROLE,
    CARD_SERVICE_LABEL,
    cardsVisibleToEmployee,
    EMPLOYEE_ROLE,
    holdsCardMembership,
    holdsPayrollMembership,
    isCardServiceLabel,
    isUtilityRoute,
    PAYROLL_SERVICE_LABEL,
} from '../../utils/activeRole';

const membership = (label: string, over: Partial<ServiceMembership> = {}): ServiceMembership => ({
    label,
    hasAccess: true,
    role: null,
    status: 'ACTIVE',
    ref: null,
    ...over,
});

const CARDS = [membership(CARD_SERVICE_LABEL, { role: EMPLOYEE_ROLE })];
const PAYROLL = [membership(PAYROLL_SERVICE_LABEL, { ref: '65f0c1a2b3' })];
const BOTH = [...PAYROLL, membership(CARD_SERVICE_LABEL, { role: ADMIN_ROLE })];

describe('holdsCardMembership', () => {
    it('is true for an employee holding the card service', () => {
        expect(holdsCardMembership(UserRole.EMPLOYEE, 900, CARDS)).toBe(true);
    });

    // An employee may hold several services; holding one must not imply holding this one.
    it('is false for an employee granted only other services', () => {
        expect(holdsCardMembership(UserRole.EMPLOYEE, 900, PAYROLL)).toBe(false);
        expect(holdsCardMembership(UserRole.EMPLOYEE, 900, [])).toBe(false);
        expect(holdsCardMembership(UserRole.EMPLOYEE, 900, null)).toBe(false);
    });

    it('is false without an employee identity to exercise it as', () => {
        expect(holdsCardMembership(UserRole.EMPLOYEE, null, CARDS)).toBe(false);
    });

    it('is false for a revoked or suspended membership', () => {
        expect(
            holdsCardMembership(UserRole.EMPLOYEE, 900, [
                membership(CARD_SERVICE_LABEL, { hasAccess: false }),
            ])
        ).toBe(false);
        expect(
            holdsCardMembership(UserRole.EMPLOYEE, 900, [
                membership(CARD_SERVICE_LABEL, { status: 'INACTIVE' }),
            ])
        ).toBe(false);
    });

    it('is false for a corporate or system session, whatever it carries', () => {
        expect(holdsCardMembership(UserRole.CORPORATE, 900, CARDS)).toBe(false);
        expect(holdsCardMembership(UserRole.SYSTEM, 900, CARDS)).toBe(false);
    });
});

// The three cases the sidebar has to tell apart: invited from cards, invited from payroll, invited from both.
describe('the three invite combinations', () => {
    it('cards-only: card membership, no payroll', () => {
        expect(holdsCardMembership(UserRole.EMPLOYEE, 900, CARDS)).toBe(true);
        expect(holdsPayrollMembership(UserRole.EMPLOYEE, CARDS)).toBe(false);
    });

    it('payroll-only: payroll, no card membership', () => {
        expect(holdsCardMembership(UserRole.EMPLOYEE, 900, PAYROLL)).toBe(false);
        expect(holdsPayrollMembership(UserRole.EMPLOYEE, PAYROLL)).toBe(true);
    });

    it('both: both', () => {
        expect(holdsCardMembership(UserRole.EMPLOYEE, 900, BOTH)).toBe(true);
        expect(holdsPayrollMembership(UserRole.EMPLOYEE, BOTH)).toBe(true);
    });
});

describe('actsAsAdminUi for an employee identity', () => {
    it('grants the admin UI on the card role alone', () => {
        expect(actsAsAdminUi({ role: UserRole.EMPLOYEE, serviceMemberships: BOTH })).toBe(true);
    });

    // An employee invited as Employee must land on the cardholder view. This read as Admin while the page
    // still passed the old positional arguments: `role` never matched, so it fell through to the corporate
    // branch, where "no subCorporateId" means "is the account owner".
    it('withholds it from an employee whose card role is Employee', () => {
        expect(actsAsAdminUi({ role: UserRole.EMPLOYEE, serviceMemberships: CARDS })).toBe(false);
    });

    // An employee Admin may switch DOWN to work with their own card; the clamp is what stops an Employee
    // claiming up. Mirrors corporateCard/utils/cardHelpers.js#activeRoleName.
    it('drops to the cardholder view when an Admin switches down', () => {
        expect(
            actsAsAdminUi({
                role: UserRole.EMPLOYEE,
                serviceMemberships: BOTH,
                activeSubRole: EMPLOYEE_ROLE,
            })
        ).toBe(false);
    });

    it('never lets an Employee claim Admin by asking for it', () => {
        expect(
            actsAsAdminUi({
                role: UserRole.EMPLOYEE,
                serviceMemberships: CARDS,
                activeSubRole: ADMIN_ROLE,
            })
        ).toBe(false);
    });

    it('withholds it from an employee holding no card membership', () => {
        expect(actsAsAdminUi({ role: UserRole.EMPLOYEE, serviceMemberships: PAYROLL })).toBe(false);
        expect(actsAsAdminUi({ role: UserRole.EMPLOYEE, serviceMemberships: null })).toBe(false);
    });

    // The role check has to come first: an employee holding only Payroll would otherwise fall through to the
    // corporate branch and be handed the admin dashboard.
    it('never reads an employee as the account owner, whatever else the session carries', () => {
        expect(actsAsAdminUi({ role: UserRole.EMPLOYEE, serviceMemberships: CARDS })).toBe(false);
    });

    // The account holder has no mode: their Corporate account IS the admin view.
    it('leaves the corporate behaviour unchanged, whatever mode the session carries', () => {
        expect(actsAsAdminUi({ role: UserRole.CORPORATE, activeSubRole: EMPLOYEE_ROLE })).toBe(true);
        expect(actsAsAdminUi({ role: UserRole.CORPORATE })).toBe(true);
    });

    /**
     * Stated as an equality rather than a fall-through. The corporate branch used to end in
     * `if (!subCorporateRole) return !subCorporateId`, which answered true for ANY role carrying neither —
     * so an admin or system_user session would have been handed the corporate-cards admin UI.
     */
    it('refuses a role that is neither the corporate account nor an employee', () => {
        expect(actsAsAdminUi({ role: 'system_user' })).toBe(false);
        expect(actsAsAdminUi({ role: 'admin' })).toBe(false);
        expect(actsAsAdminUi({})).toBe(false);
    });
});

describe('isUtilityRoute', () => {
    it('covers the account-level destinations an employee must keep', () => {
        expect(isUtilityRoute('profile')).toBe(true);
        expect(isUtilityRoute('Notifications')).toBe(true);
        expect(isUtilityRoute('need help')).toBe(true);
    });

    it('does not cover product modules', () => {
        expect(isUtilityRoute('procure')).toBe(false);
        expect(isUtilityRoute('compliance')).toBe(false);
        expect(isUtilityRoute('corporate cards')).toBe(false);
    });
});

describe('cardsVisibleToEmployee', () => {
    it('is true for an employee whose employer has finished KYB', () => {
        expect(cardsVisibleToEmployee(UserRole.EMPLOYEE, true)).toBe(true);
    });

    it('is true before the membership exists, which is the case it is there for', () => {
        expect(holdsCardMembership(UserRole.EMPLOYEE, 900, PAYROLL)).toBe(false);
        expect(cardsVisibleToEmployee(UserRole.EMPLOYEE, true)).toBe(true);
    });

    it('is false while the employer has not finished KYB', () => {
        expect(cardsVisibleToEmployee(UserRole.EMPLOYEE, false)).toBe(false);
    });

    // null is "nobody has asked yet". Collapsing it into false tells a session no on the strength of an
    // answer that was never requested, which is what hid the service from every employee.
    it('is false — but never a yes — while the answer is unknown', () => {
        expect(cardsVisibleToEmployee(UserRole.EMPLOYEE, null)).toBe(false);
        expect(cardsVisibleToEmployee(UserRole.EMPLOYEE, undefined)).toBe(false);
    });

    it('is false for a corporate or system session, whatever the answer', () => {
        expect(cardsVisibleToEmployee(UserRole.CORPORATE, true)).toBe(false);
        expect(cardsVisibleToEmployee(UserRole.SYSTEM, true)).toBe(false);
    });
});

describe('isCardServiceLabel', () => {
    it('matches the service label however it is cased or spaced', () => {
        expect(isCardServiceLabel('Corporate Cards')).toBe(true);
        expect(isCardServiceLabel('  corporate cards ')).toBe(true);
    });

    it('does not match anything else', () => {
        expect(isCardServiceLabel('Corporate Travel')).toBe(false);
        expect(isCardServiceLabel('')).toBe(false);
        expect(isCardServiceLabel(null)).toBe(false);
    });
});
