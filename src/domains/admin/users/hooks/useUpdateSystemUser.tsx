import { useCallback, useEffect, useState } from 'react';

import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllRoles, createUser, updateUser } from '../api/index';
import { activeResponse } from '../types/corporateUserTypes';
import { getAllRolesResp, userUpdateBody } from '../types/systemUserTypes';

const useUpdateSystemUser = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [roleData, setRoleData] = useState<DropDown>();
    const [isloading, setIsLoading] = useState(false);
    const getAllRolesApi = useCallback(async () => {
        setIsLoading(true);
        const data: getAllRolesResp | false = await getAllRoles({
            userId: id,
            userType: role,
        });
        if (data) {
            setRoleData(data.roles);
        }
        setIsLoading(false);
    }, [id, role]);

    const createSystemUser = useCallback(
        async (payload: userUpdateBody) => {
            const data: SuccessGenericResponse<activeResponse> | false = await createUser({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                return data;
            }
            return false;
        },
        [id, role]
    );
    const updateSystemUser = useCallback(
        async (payload: userUpdateBody) => {
            const data: SuccessGenericResponse<activeResponse> | false = await updateUser({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                return data;
            }
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getAllRolesApi();
    }, [getAllRolesApi]);

    return { roleData, updateSystemUser, createSystemUser, isloading };
};

export default useUpdateSystemUser;
