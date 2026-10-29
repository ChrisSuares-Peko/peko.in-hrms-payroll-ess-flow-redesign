import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    RolePermissionTree,
    RolePreset,
    getRoleCatalogue,
} from '../../api/admin/rolesCatalogueApi';

export const countEnabled = (tree: RolePermissionTree | null): number =>
    tree?.services?.reduce(
        (total, service) =>
            total +
            service.categories.reduce(
                (n, category) => n + category.permissions.filter(p => p.enabled).length,
                0
            ),
        0
    ) ?? 0;

/**
 * The role presets and their permissions. Read-only: roles are fixed on the server, so there is no draft,
 * no dirty state and no save. `isLoading` clears whether the fetch succeeded or failed, so a failure lands
 * on an empty state instead of spinning forever.
 */
export const useRoleCatalogue = () => {
    const { role: userType, id } = useAppSelector(state => state.reducer.auth);

    const [roles, setRoles] = useState<RolePreset[]>([]);
    const [activeRoleName, setActiveRoleName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setIsLoading(true);
            const res = await getRoleCatalogue(userType, id);
            if (cancelled) return;
            const rows = res && res.data ? res.data.rows : [];
            setRoles(rows);
            setActiveRoleName(prev => {
                if (prev && rows.some(r => r.roleName === prev)) return prev;
                return rows.length ? rows[0].roleName : null;
            });
            setIsLoading(false);
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [userType, id]);

    const activeRole = roles.find(r => r.roleName === activeRoleName) ?? null;

    return { roles, activeRoleName, setActiveRoleName, activeRole, isLoading };
};
