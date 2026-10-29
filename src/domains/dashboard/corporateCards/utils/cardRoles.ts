/**
 * The Corporate Cards role vocabulary — the single frontend copy.
 *
 * A card role is an authorization input, not a job title: the server resolves it to a permission preset and
 * 'Admin' grants corporate-wide card authority. It therefore comes from a fixed list everywhere it is offered
 * (invite, edit) rather than being typed freehand.
 *
 * Mirrors the values in `Peko-IN/users/constants/employeeServices.js`, which is where the server decides what
 * roles a service has. This lives in the domain rather than shared utils because the role belongs to THIS
 * service's membership entry: another service granted to the same employee carries its own, or none.
 */
export const ADMIN_ROLE = 'Admin';
export const EMPLOYEE_ROLE = 'Employee';
