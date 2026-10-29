const partnerPermission = require("../entities/partnerPermission")
// const { sidebarData: INITIAL_SIDEBAR_DATA } = require("../../utils/sidebar");
const { customLog } = require("../../utils/loggerHelper");
const setting = require("../entities/setting");
const { findOneReferalCode } = require("./referral_codes");
const { findOne: findOneCorporateUser } = require("./corporateUser");

exports.findOnePartnerPermissionData = async (registeredBy=null, attributes = undefined) => {
    try {
        return await partnerPermission.findOne({
            where: {
                registeredBy
            },
            attributes
        })
    } catch (error) {
        console.log(error)
        throw error
    } finally {
        console.log("PARTNER PERMISSION FIND ONE ROUTE CALLED")
    }
}
exports.resolveServicePermissions = async ({ registeredBy, referralCode, attributes = ["permissions"] }) => {
    if (registeredBy) {
        return await exports.findOnePartnerPermissionData(registeredBy, attributes);
    }
    if (referralCode) {
        const referralOwner = await findOneReferalCode(referralCode, null, ["ownerCredentialId"]);
        if (referralOwner?.ownerCredentialId) {
            return await exports.findOnePartnerPermissionData(referralOwner.ownerCredentialId, attributes);
        }
    }
    return await exports.findOnePartnerPermissionData(null, attributes);
}
exports.findPartnerPermissionsForSession = async ({ registeredBy, referralCode, attributes = ["id", "permissions"] }) => {
    const resolved = await exports.resolveServicePermissions({ registeredBy, referralCode, attributes });
    if (resolved?.permissions) {
        customLog(null, "info", {
            action: 'session:partnerPermissionsResolved',
            registeredBy: registeredBy ?? null,
            referralCode: referralCode ?? null,
            source: registeredBy ? 'partner' : (referralCode ? 'referral' : 'default'),
            permissionsLength: Array.isArray(resolved.permissions) ? resolved.permissions.length : null,
            permissionsType: typeof resolved.permissions
        });
        return resolved;
    }
    const defaultPermissions = await exports.findOnePartnerPermissionData(null, attributes);
    customLog(null, "info", {
        action: 'session:partnerPermissionsDefaultFallback',
        registeredBy: registeredBy ?? null,
        referralCode: referralCode ?? null,
        hasDefaultRow: !!defaultPermissions,
        permissionsLength: Array.isArray(defaultPermissions?.permissions) ? defaultPermissions.permissions.length : null,
        permissionsType: typeof defaultPermissions?.permissions
    });
    return defaultPermissions;
}
exports.resolveServicePermissionsForSession = async (user, attributes = ["permissions"]) => {
    let referralCode = null;
    if (!user?.registeredBy) {
        const corporate = await findOneCorporateUser({ id: user?.id });
        referralCode = corporate?.referralCode || null;
    }
    return await exports.resolveServicePermissions({
        registeredBy: user?.registeredBy,
        referralCode,
        attributes
    });
}
// Upserts the partnerInitialAccessesibleServices setting row with the edited
// corporate sidebar tree. The row may not exist yet, so create it on first save.
exports.updatePartnerInitialAccessesibleServices = async (sidebarData = []) => {
    try {
        const [, created] = await setting.findOrCreate({
            where: { name: 'partnerInitialAccessesibleServices' },
            defaults: { name: 'partnerInitialAccessesibleServices', details: sidebarData }
        });
        if (!created) {
            await setting.update(
                { details: sidebarData, updatedAt: new Date() },
                { where: { name: 'partnerInitialAccessesibleServices' } }
            );
        }
        return sidebarData;
    } catch (error) {
      
        return false;
    }
}

// exports.findPartnerInitialAccessesibleServices = async () => {
//     return { details: INITIAL_SIDEBAR_DATA };
// }

exports.findPartnerInitialAccessesibleServices = async (attributes = undefined) => {
    try {
        const settings = await setting.findOne({
            where: { name: 'partnerInitialAccessesibleServices' },
            attributes,
            raw: true,
            nest: true
        });

        return settings
    } catch (error) {
     
        return false
    }
}
exports.findSearchServices = async (attributes = undefined) => {
    try {
        const settings = await setting.findOne({
            where: { name: 'searchServices' },
            attributes,
            raw: true,
            nest: true
        });

        return settings
    } catch (error) {
        customLog(null, "error", { message: "An error occurred", error: error });
        return false
    }
}

// Upserts the searchServices setting row — one entry per service / sub-service
// ({ name, tags, pathKey }) used to power global search-by-tag lookups. The row may
// not exist yet, so create it on first save.
exports.updateSearchServices = async (searchServices = []) => {
    try {
        const [, created] = await setting.findOrCreate({
            where: { name: 'searchServices' },
            defaults: { name: 'searchServices', details: searchServices }
        });
        if (!created) {
            await setting.update(
                { details: searchServices, updatedAt: new Date() },
                { where: { name: 'searchServices' } }
            );
        }
        return searchServices;
    } catch (error) {
        customLog(null, "error", { message: "An error occurred", error: error });
        return false;
    }
}
