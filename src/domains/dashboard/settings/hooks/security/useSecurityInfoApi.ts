import { useCallback, useEffect } from 'react';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getSecurityInfo, updateSecurityInfo } from '../../api/securityInfo';
import { setData } from '../../slices/securityInfo';
import {
    SecurityInfoResponse,
    SecurityInfoUpdatePayload,
    SecurityInfoUpdateResponse,
} from '../../types/security';

interface useBasicInfoApiProps {
    handleCancel?: () => void;
}

export default function useSecurityInfoApi({ handleCancel }: useBasicInfoApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { refresh, data, isLoading, isEditLoading } = useAppSelector(
        state => state.reducer.securityInfo
    );

    const dispatch = useAppDispatch();
    const getUserSecurityInfo = useCallback(async () => {
        dispatch(setData({ isLoading: true }));
        const resp: SecurityInfoResponse | false = await getSecurityInfo({
            userId: id,
            userType: role,
        });
        if (resp) {
            dispatch(setData({ data: resp, isLoading: false }));
        } else {
            dispatch(setData({ data: null, isLoading: false }));
        }
    }, [id, role, dispatch]);

    const handleUpdateSecurityInfo = async (payload: SecurityInfoUpdatePayload) => {
        dispatch(setData({ isEditLoading: true }));
        const response: SecurityInfoUpdateResponse | false = await updateSecurityInfo(payload);
        if (response) {
            dispatch(setData({ refresh: !refresh, isLoading: false, isEditLoading: false }));
            if (handleCancel) {
                handleCancel();
                dispatch(
                    showToast({
                        description: 'Security info updated successfully',
                        variant: 'success',
                    })
                );
            }
        } else {
            dispatch(setData({ refresh: !refresh, isEditLoading: false }));
            if (handleCancel) {
                handleCancel();
            }
        }
    };

    useEffect(() => {
        getUserSecurityInfo();
    }, [getUserSecurityInfo, refresh]);

    return {
        data,
        isLoading,
        refresh,
        handleUpdateSecurityInfo,
        isEditLoading,
    };
}
