const EMPLOYEE_SERVICE = {
    PAYROLL: "Payroll",
    CORPORATE_CARDS: "Corporate Cards",
};

const MEMBERSHIP_STATUS = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
};

const MEMBERSHIP_STATUS_VALUES = Object.values(MEMBERSHIP_STATUS);

/**
 * The role vocabulary each service accepts on its own membership, and the role it falls back to.
 *
 * A service with no roles of its own has an empty list and stores null. Adding a service is an entry here
 * plus the label above — no column, no migration, no branch in a use-case.
 *
 * Every consumer fails closed: a role not in the list resolves to the default, so drift loses authority
 * rather than granting it.
 */
const SERVICE_ROLES = {
    [EMPLOYEE_SERVICE.CORPORATE_CARDS]: { values: ["Admin", "Employee"], default: "Employee" },
    [EMPLOYEE_SERVICE.PAYROLL]: { values: [], default: null },
};

const rolesForService = (label) => SERVICE_ROLES[label]?.values || [];

const resolveServiceRole = (label, raw) => {
    const spec = SERVICE_ROLES[label];
    if (!spec) return null;
    const value = typeof raw === "string" ? raw.trim() : "";
    return spec.values.includes(value) ? value : spec.default;
};

module.exports = {
    EMPLOYEE_SERVICE,
    MEMBERSHIP_STATUS,
    MEMBERSHIP_STATUS_VALUES,
    SERVICE_ROLES,
    rolesForService,
    resolveServiceRole,
};
