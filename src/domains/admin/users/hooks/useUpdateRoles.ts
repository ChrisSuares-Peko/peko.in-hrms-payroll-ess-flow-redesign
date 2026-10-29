import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getPermissionsApi, createRoles, updateRoles, createClonePartner, updateInitialServicePermissions } from '../api/index';
import { activeResponse } from '../types/corporateUserTypes';
import { getPermissionsResp,InitialServicePermissionPayload, Permission, updateRole } from '../types/systemUserTypes';

const useUpdateRoles = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [permissionData, setPermissionData] = useState<Permission[]>();
    const [isloading, setIsLoading] = useState(false);
     const [isSaving, setIsSaving] = useState(false);
    const getAllPermisiions = useCallback(async () => {
        const data: getPermissionsResp | false = await getPermissionsApi({
            userId: id,
            userType: role,
        });
        if (data) {
            setPermissionData(data.permissions);
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
    const createNewPartnerClone = useCallback(
        async (payload: updateRole) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await createClonePartner({
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

       const saveInitialServicePermissions = useCallback(
        async (permissions: InitialServicePermissionPayload[]) => {
            setIsSaving(true);
            const data:
                | SuccessGenericResponse<{ permissions: InitialServicePermissionPayload[] }>
                | false = await updateInitialServicePermissions({
                userId: id,
                userType: role,
                permissions,
            });
            setIsSaving(false);
            return data;
        },
        [id, role]
    );

    useEffect(() => {
        getAllPermisiions();
    }, [getAllPermisiions]);

    return { permissionData, updateRoleApi, createNewRoles, createNewPartnerClone,  saveInitialServicePermissions,
        isloading,
        isSaving, };
};

export default useUpdateRoles;
