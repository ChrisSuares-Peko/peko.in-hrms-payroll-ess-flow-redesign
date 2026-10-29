const { MEMBERSHIP_STATUS } = require("../../constants/employeeServices");

/**
 * An employee's service memberships, held as entries on `users.userAccessService.permission`.
 *
 * Nothing here names a service. A service is a label in the data, so granting one tomorrow is a row edit
 * rather than a column, a migration and a branch per consumer. `role`, `status` and `ref` are per-service and
 * mean whatever that service decides: Corporate Cards reads `role` as its Admin/Employee permission set,
 * Payroll carries its own employee id in `ref`.
 */

const entriesOf = (userAccessService) =>
    (Array.isArray(userAccessService?.permission) ? userAccessService.permission : []);

// Entries written before this shape existed carry only `label`/`hasAccess`. They default to an active
// membership with no role, which is what they behaved as.
const normalise = (entry) => ({
    ...entry,
    label: entry?.label ?? null,
    hasAccess: entry?.hasAccess !== false,
    role: entry?.role ?? null,
    status: entry?.status || MEMBERSHIP_STATUS.ACTIVE,
    ref: entry?.ref ?? null,
});

const sameLabel = (a, b) =>
    typeof a === "string" && typeof b === "string" && a.trim().toLowerCase() === b.trim().toLowerCase();

const listMemberships = (userAccessService) => entriesOf(userAccessService).map(normalise);

const membershipFor = (userAccessService, label) =>
    listMemberships(userAccessService).find((entry) => sameLabel(entry.label, label)) || null;

/** Whether the employee may use a service right now. A revoked or not-yet-accepted membership may not. */
const holdsService = (userAccessService, label) => {
    const membership = membershipFor(userAccessService, label);
    if (!membership) return false;
    return membership.hasAccess === true && membership.status !== MEMBERSHIP_STATUS.INACTIVE;
};

const roleInService = (userAccessService, label) => membershipFor(userAccessService, label)?.role ?? null;

const statusInService = (userAccessService, label) => membershipFor(userAccessService, label)?.status ?? null;

const refInService = (userAccessService, label) => membershipFor(userAccessService, label)?.ref ?? null;

const activeServiceLabels = (userAccessService) =>
    listMemberships(userAccessService)
        .filter((entry) => entry.hasAccess === true && entry.status !== MEMBERSHIP_STATUS.INACTIVE)
        .map((entry) => entry.label)
        .filter(Boolean);

const holdsAnyService = (userAccessService) => activeServiceLabels(userAccessService).length > 0;

/**
 * Upserts one membership and returns a NEW userAccessService — the caller persists it.
 *
 * Merges onto an existing entry rather than replacing it, so granting Corporate Cards to someone who already
 * holds Payroll cannot drop whatever that service stored alongside its own entry.
 */
const grantService = (userAccessService, { label, role, status, ref, ...rest }) => {
    if (!label) return userAccessService || { permission: [] };

    const existing = entriesOf(userAccessService);
    const index = existing.findIndex((entry) => sameLabel(entry?.label, label));
    const current = index >= 0 ? existing[index] : {};

    const merged = normalise({
        ...current,
        ...rest,
        label: current?.label || label,
        hasAccess: true,
        role: role !== undefined ? role : current?.role,
        status: status || current?.status || MEMBERSHIP_STATUS.ACTIVE,
        ref: ref !== undefined ? ref : current?.ref,
    });

    const permission = index >= 0
        ? existing.map((entry, i) => (i === index ? merged : entry))
        : [...existing, merged];

    return { ...(userAccessService || {}), permission };
};

/**
 * Revokes a membership without forgetting it ever existed: `hasAccess: false` plus an INACTIVE status, so a
 * service that keys records on the membership can still resolve a departed member.
 */
const revokeService = (userAccessService, label) => {
    const existing = entriesOf(userAccessService);
    const index = existing.findIndex((entry) => sameLabel(entry?.label, label));
    if (index < 0) return userAccessService || { permission: [] };

    const permission = existing.map((entry, i) => (i === index
        ? normalise({ ...entry, hasAccess: false, status: MEMBERSHIP_STATUS.INACTIVE })
        : entry));

    return { ...(userAccessService || {}), permission };
};

const setServiceStatus = (userAccessService, label, status) => {
    const existing = entriesOf(userAccessService);
    const index = existing.findIndex((entry) => sameLabel(entry?.label, label));
    if (index < 0) return userAccessService || { permission: [] };

    const permission = existing.map((entry, i) => (i === index
        ? normalise({ ...entry, status, hasAccess: status !== MEMBERSHIP_STATUS.INACTIVE })
        : entry));

    return { ...(userAccessService || {}), permission };
};

module.exports = {
    listMemberships,
    membershipFor,
    holdsService,
    holdsAnyService,
    roleInService,
    statusInService,
    refInService,
    activeServiceLabels,
    grantService,
    revokeService,
    setServiceStatus,
};
