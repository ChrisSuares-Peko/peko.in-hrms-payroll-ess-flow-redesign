import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    postClonePartnerPermission,
    postCopyPartnerPermissionIcons,
} from '../api/partnerPermission';
import { ClonePermissionPayload } from '../types/partnerPermission';

const useClonePartnerPermission = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isCloning, setIsCloning] = useState(false);
    const [isCopyingIcons, setIsCopyingIcons] = useState(false);

    const clonePermission = useCallback(
        async (payload: ClonePermissionPayload) => {
            setIsCloning(true);
            const resp = await postClonePartnerPermission({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsCloning(false);
            return resp;
        },
        [id, role]
    );

    const copyIcons = useCallback(
        async (payload: ClonePermissionPayload) => {
            setIsCopyingIcons(true);
            const resp = await postCopyPartnerPermissionIcons({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsCopyingIcons(false);
            return resp;
        },
        [id, role]
    );

    return { clonePermission, copyIcons, isCloning, isCopyingIcons };
};

export default useClonePartnerPermission;
