const asyncHandler = require("./async");
const systemUser = require("../models/entities/systemUser");
const roleAndPermissions = require("../models/entities/roleAndPermissions");
const { customLog } = require("../utils/loggerHelper");

const FORBIDDEN = "Sorry, you do not have permission to perform this action";

const deny = (req, res, reason, context) => {
    customLog(req, "warn", { message: "Permission denied", reason, ...context });
    return res.status(403).json({
        status: false,
        message: FORBIDDEN,
        data: {},
        responseCode: "001",
    });
};

// Walks the same permission blob the admin UI walks: a service category holding
// categories, each holding services that carry view / write / update flags.
const nodesOf = value => (Array.isArray(value) ? value : []);

const findServiceNode = (permissions, { category, group, service }) => {
    const categoryNode = nodesOf(permissions).find(
        node => node && node.serviceCategory === category
    );
    if (!categoryNode || categoryNode.hasAccess === false) return null;

    const groupNode = nodesOf(categoryNode.services).find(node => node && node.category === group);
    if (!groupNode || groupNode.hasAccess === false) return null;

    return nodesOf(groupNode.services).find(node => node && node.service === service) || null;
};

const allows = (node, action) => action === "view" || node[action] === true;

const loadRole = async credentialId => {
    const user = await systemUser.findOne({
        where: { credentialId },
        attributes: ["id", "roleAndPermissionId"],
        raw: true,
    });
    if (!user || !user.roleAndPermissionId) return null;

    return roleAndPermissions.findOne({
        where: { id: user.roleAndPermissionId },
        attributes: ["roleName", "permissions", "isAdmin", "status"],
        raw: true,
    });
};

const requirePermission = ({ category, group, service, action }) =>
    asyncHandler(async (req, res, next) => {
        const context = { category, group, service, action, credentialId: req.user && req.user.id };

        const role = await loadRole(req.user && req.user.id);
        if (!role) return deny(req, res, "no role on the acting user", context);
        if (role.status === false) return deny(req, res, "role is disabled", context);
        if (role.isAdmin) return next();

        const node = findServiceNode(role.permissions, { category, group, service });
        if (!node || node.hasAccess === false) {
            return deny(req, res, "service not granted", { ...context, role: role.roleName });
        }
        if (!allows(node, action)) {
            return deny(req, res, `${action} not granted`, { ...context, role: role.roleName });
        }

        return next();
    });

const grants = (role, { category, group, service, action }) => {
    const node = findServiceNode(role.permissions, { category, group, service });
    return Boolean(node) && node.hasAccess !== false && allows(node, action);
};

const requireAnyPermission = nodes =>
    asyncHandler(async (req, res, next) => {
        const context = { nodes, credentialId: req.user && req.user.id };

        const role = await loadRole(req.user && req.user.id);
        if (!role) return deny(req, res, "no role on the acting user", context);
        if (role.status === false) return deny(req, res, "role is disabled", context);
        if (role.isAdmin) return next();
        if (nodes.some(node => grants(role, node))) return next();

        return deny(req, res, "none of the services grants the action", { ...context, role: role.roleName });
    });

const requireCategoryAccess = category =>
    asyncHandler(async (req, res, next) => {
        const context = { category, credentialId: req.user && req.user.id };

        const role = await loadRole(req.user && req.user.id);
        if (!role) return deny(req, res, "no role on the acting user", context);
        if (role.status === false) return deny(req, res, "role is disabled", context);
        if (role.isAdmin) return next();

        const categoryNode = nodesOf(role.permissions).find(node => node && node.serviceCategory === category);
        if (!categoryNode || categoryNode.hasAccess === false) {
            return deny(req, res, "category not granted", { ...context, role: role.roleName });
        }

        return next();
    });

// Moving the accounting go-live date restates every balance in the portal, so it is not a
// per-service grant: it sits with whoever administers the role that granted the rest.
const requireAdminRole = asyncHandler(async (req, res, next) => {
    const context = { credentialId: req.user && req.user.id };

    const role = await loadRole(req.user && req.user.id);
    if (!role) return deny(req, res, "no role on the acting user", context);
    if (role.status === false) return deny(req, res, "role is disabled", context);
    if (!role.isAdmin) {
        return deny(req, res, "role is not an administrator", { ...context, role: role.roleName });
    }

    return next();
});

module.exports = {
    requirePermission,
    requireAnyPermission,
    requireCategoryAccess,
    requireAdminRole,
    findServiceNode,
    FORBIDDEN,
};
