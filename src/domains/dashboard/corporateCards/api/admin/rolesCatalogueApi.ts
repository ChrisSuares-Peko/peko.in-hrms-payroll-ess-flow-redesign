import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/** One permission. `key` is namespaced by its service accessKey, e.g. `corporate_cards.view-cards`. */
export interface RolePermission {
    key: string;
    label: string;
    enabled: boolean;
}

export interface RolePermissionCategory {
    category: string;
    permissions: RolePermission[];
}

/** Permissions nest under a service so a second product can be added without reshaping the roles. */
export interface RolePermissionService {
    service: string;
    accessKey: string;
    categories: RolePermissionCategory[];
}

export interface RolePermissionTree {
    version: number;
    services: RolePermissionService[];
}

/** A role preset. These are fixed on the server — there is no create/update/delete. */
export interface RolePreset {
    roleName: string;
    description: string | null;
    isDefault: boolean;
    /** true when the role grants corporate-wide capability (Admin). */
    actsAsCorporateAdmin: boolean;
    permissionCount: number;
    permissions: RolePermissionTree;
}

export const getRoleCatalogue = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<{ version: number; count: number; rows: RolePreset[] }> =
            await ApiClient.get(`${userType}/${userId}/corporate-cards/roles`);
        return res;
    } catch {
        return false;
    }
};
