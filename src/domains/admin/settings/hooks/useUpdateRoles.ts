import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createRoles, getPermissionsApi, updateRoles } from '../api/partnerPermission';
import {
    activeResponse,
    getPermissionsResp,
    Permission,
    updateRole,
} from '../types/partnerPermission';

const TAX_ALLOWED_SUBSERVICES = ['gst filing', 'tds filing'];

const filterTaxSubServices = (permissions: Permission[]): Permission[] =>
    permissions.map(permission => {
        if (permission.label.toLowerCase().includes('tax')) {
            return {
                ...permission,
                subServices: permission.subServices?.filter(s =>
                    TAX_ALLOWED_SUBSERVICES.includes(s.label.toLowerCase())
                ),
            };
        }
        return permission;
    });

const useUpdateRoles = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [permissionData, setPermissionData] = useState<Permission[]>();
    const [isloading, setIsLoading] = useState(false);
    const getAllPermisiions = useCallback(async () => {
        const data: getPermissionsResp | false = await getPermissionsApi({
            userId: id,
            userType: role,
        });
        if (data) {
            setPermissionData(filterTaxSubServices(data.sidebarData));
        }
    }, [id, role]);

    const createNewRoles = useCallback(
        async (payload: updateRole) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await createRoles({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                setIsLoading(false);
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    const updateRoleApi = useCallback(
        async (payload: updateRole) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await updateRoles({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                setIsLoading(false);
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getAllPermisiions();
    }, [getAllPermisiions]);

    return { permissionData, updateRoleApi, createNewRoles, isloading };
};

export default useUpdateRoles;
