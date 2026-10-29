// Clamps the services requested for a sub-corporate user down to what the inviting
// corporate's partner-permission tree actually grants.
//
// This is a SECURITY control, not cosmetics: the result is persisted on
// `subCorporateUsers.services`, copied into the session as `subCorporateServices`
// (routes/API/v1/login.js), and every other microservice authorises API calls straight
// off it via `verifySubCorporate` (`services.some(s => s.label === name && s.hasAccess)`)
// with no re-clamp. Persisting the raw request would let a corporate grant its sub-user a
// service the partner never granted it.
//
// `partnerPermissions` MUST come from `resolveServicePermissionsForSession` — the raw
// `findOnePartnerPermissionData(registeredBy)` resolves a different tree for
// referral-linked corporates and collapses this intersection to [].

const MORE_SERVICES_LABEL = "More Services";

/**
 * @param {Array<{label: string, hasAccess: boolean}>} requestedServices - from the request body
 * @param {Array<object>} partnerPermissions - the resolved partner permission tree
 * @returns {Array<object>} the granted services, in partner-tree shape
 */
const clampRequestedServices = (requestedServices, partnerPermissions) => {
    const requested = Array.isArray(requestedServices) ? requestedServices : [];
    const permissions = Array.isArray(partnerPermissions) ? partnerPermissions : [];

    const allowedServices = new Set(
        requested.filter(service => service.hasAccess).map(service => service.label)
    );

    // Flattened serviceAccess: every service is a top-level entry with its own
    // `enableMoreService` flag (the legacy "More Services" category/sub-tree is gone).
    // Clamp the sub-user to the services granted here, preserving each service's
    // enableMoreService / icon / accessKey and keeping only its accessible sub-services.
    const filteredPartnerPermissions = permissions
        .filter(service => allowedServices.has(service.label) && service.label !== MORE_SERVICES_LABEL)
        .map(service => ({
            ...service,
            subServices: service.subServices ? service.subServices.filter(sub => sub.hasAccess) : []
        }));

    // Surface the "More Services" umbrella entry when at least one granted service is
    // flagged enableMoreService, so the sub-user can still reach the More Services page.
    const grantedMoreService = filteredPartnerPermissions.some(service => service.enableMoreService);
    const moreServiceUmbrella = permissions.find(service => service.label === MORE_SERVICES_LABEL);
    if (grantedMoreService && moreServiceUmbrella) {
        filteredPartnerPermissions.push({ ...moreServiceUmbrella, hasAccess: true, subServices: [] });
    }

    return filteredPartnerPermissions;
};

module.exports = { clampRequestedServices, MORE_SERVICES_LABEL };
