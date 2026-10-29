import { ServicesListResponse } from '@customtypes/general';
import { staticPartnerPermissions } from '@domains/admin/settings/utils/staticPartnerPermissions';

/**
 * TEMPORARY static corporate `serviceAccess` data reflecting the new flattened
 * structure — the `"More Services"` category is removed and its services sit at
 * the top level, each carrying `enableMoreService: true` (and an `icon` slot).
 *
 * Used while the backend `user/services/serviceAccess` change is pending. Derived
 * from the shared partner catalogue (`staticPartnerPermissions`) so the admin and
 * corporate mocks stay in sync. Remove this file and switch back to the live
 * `getUserServices()` response once the backend returns the flattened shape.
 *
 * NOTE: every service is marked `hasAccess: true` so the flattened structure is
 * fully visible during development; the backend will drive real access per user.
 */
export const staticCorporateServiceAccess: ServicesListResponse['data'] =
    staticPartnerPermissions.map(permission => ({
        serviceCategory: permission.label,
        label: permission.label,
        hasAccess: true,
        services: [],
        subServices: (permission.subServices ?? []).map(subService => ({
            label: subService.label,
            hasAccess: true,
        })),
        enableMoreService: permission.enableMoreService ?? false,
        icon: permission.icon ?? '',
    }));

export default staticCorporateServiceAccess;
