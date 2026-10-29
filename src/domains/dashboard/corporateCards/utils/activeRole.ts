/**
 * Who a session is, for the corporate-cards UI.
 *
 * There is no mode inside a session: the Corporate account IS the admin view and the Employee account IS the
 * cardholder view, so authority follows the identity. This mirrors
 * corporateCard/utils/cardholderIdentity.js — the server enforces the same rules and this exists so the UI
 * does not disagree with it.
 */
import { UserRole } from '@customtypes/general';
import { ServiceMembership } from '@src/domains/auth/slices/loginSlice';
import { paths } from '@src/routes/paths';

import { ADMIN_ROLE, EMPLOYEE_ROLE } from './cardRoles';

export { ADMIN_ROLE, EMPLOYEE_ROLE };

export const CARD_SERVICE_LABEL = 'Corporate Cards';
export const PAYROLL_SERVICE_LABEL = 'Payroll';

/**
 * True for the account owner's own session.
 *
 * The Corporate account is the only one that reaches Corporate Cards as an account rather than a person —
 * the server's CARD_SESSION_ROLES admits CORPORATE and USER and nothing else, so there is no longer a
 * sub-corporate session to tell apart from the owner.
 */
export const isAccountOwner = (role?: string | null): boolean => role === UserRole.CORPORATE;

const sameLabel = (a?: string | null, b?: string | null) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** One service's entry on the session, or null when the employee does not hold it. */
export const membershipFor = (
    memberships?: ServiceMembership[] | null,
    label: string = CARD_SERVICE_LABEL
): ServiceMembership | null =>
    (Array.isArray(memberships) ? memberships : []).find(entry => sameLabel(entry?.label, label)) ??
    null;

export const holdsService = (
    memberships?: ServiceMembership[] | null,
    label: string = CARD_SERVICE_LABEL
): boolean => {
    const membership = membershipFor(memberships, label);
    if (!membership) return false;
    return membership.hasAccess !== false && membership.status !== 'INACTIVE';
};

/**
 * True when this session holds a corporate-cards membership — the cardholder view.
 *
 * An employee may hold several services, so this reads the card entry by label and never the presence of an
 * employee identity alone: one invited only to Payroll is not a cardholder.
 */
export const holdsCardMembership = (
    role?: string | null,
    employeeProfileId?: number | string | null,
    memberships?: ServiceMembership[] | null
): boolean => role === UserRole.EMPLOYEE && !!employeeProfileId && holdsService(memberships);

export const holdsPayrollMembership = (
    role?: string | null,
    memberships?: ServiceMembership[] | null
): boolean => role === UserRole.EMPLOYEE && holdsService(memberships, PAYROLL_SERVICE_LABEL);

/**
 * True when an employee who is NOT a member may still see Corporate Cards: their employer has finished KYB,
 * so the entry leads to the screen that asks for access.
 *
 * Keyed on the answer to `membership/kyb-state` rather than on the services tree, because that endpoint is
 * the one a non-member is allowed to call. `null` means nobody has asked yet and is never a yes.
 */
export const cardsVisibleToEmployee = (
    role?: string | null,
    cardKybComplete?: boolean | null
): boolean => role === UserRole.EMPLOYEE && cardKybComplete === true;

export const isCardServiceLabel = (label?: string | null): boolean =>
    sameLabel(label, CARD_SERVICE_LABEL);

export interface AdminUiSession {
    role?: string | null;
    serviceMemberships?: ServiceMembership[] | null;
    /** The mode an employee Admin has switched into, if any. Only ever reduces what they see. */
    activeSubRole?: string | null;
}

/**
 * True when this session should see the corporate-admin UI.
 *
 * The Corporate account is the admin view; an employee sees it only when their card role is Admin.
 *
 * Takes the session as ONE object rather than four positional arguments. Every argument used to be optional,
 * so a call site left holding a stale argument order still compiled — and an employee, whose `role` then
 * never matched, fell through to the corporate branch and was shown the admin dashboard.
 */
export const actsAsAdminUi = ({
    role,
    serviceMemberships,
    activeSubRole,
}: AdminUiSession): boolean => {
    if (role === UserRole.EMPLOYEE) {
        // CLAMPED to the assigned role, mirroring corporateCard/utils/cardHelpers.js#activeRoleName: an
        // employee Admin may switch down to work with their own card, and an Employee can never claim up.
        if (membershipFor(serviceMemberships)?.role?.trim() !== ADMIN_ROLE) return false;
        return (activeSubRole?.trim() ?? ADMIN_ROLE) === ADMIN_ROLE;
    }
    // The account holder has no mode — their Corporate account IS the admin view. Stated as an equality
    // rather than a fall-through, so an admin or system_user session cannot land in the corporate branch and
    // be handed the corporate-cards admin UI.
    return role === UserRole.CORPORATE;
};

/**
 * The only product module the Employee account may open. The sidebar filters to this set and
 * CorporateAccessGuard refuses everything outside it, so a module cannot be reached by URL.
 */
export const EMPLOYEE_MODE_SERVICE_LABELS = new Set(['corporate cards']);

/**
 * Account-level destinations that stay open on the Employee account: the account menu links to them and a
 * failed route lands on them, so blocking these would strand the session with nowhere to go.
 */
export const EMPLOYEE_MODE_UTILITY_ROUTES = new Set([
    'profile',
    'notifications',
    'need help',
    'payments',
    'service not available',
    'service down',
]);

export const isRouteAllowedInEmployeeMode = (serviceCategory?: string | null): boolean => {
    const key = serviceCategory?.trim().toLowerCase() ?? '';
    return EMPLOYEE_MODE_SERVICE_LABELS.has(key) || EMPLOYEE_MODE_UTILITY_ROUTES.has(key);
};

export const isUtilityRoute = (serviceCategory?: string | null): boolean =>
    EMPLOYEE_MODE_UTILITY_ROUTES.has(serviceCategory?.trim().toLowerCase() ?? '');

/**
 * Where the Employee account lands for Corporate Cards.
 *
 * Inside the employee shell, not the corporate one. An employee has a single portal — the same header,
 * breadcrumb and sidebar across every service they hold — so the card screens are mounted there rather
 * than handing the session to the corporate layout halfway through.
 */
export const EMPLOYEE_MODE_LANDING_ROUTE = paths.employee.corporateCard;
