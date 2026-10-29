import { useCallback, useEffect } from 'react';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { setUserInfo } from '@src/slices/userSlice';

import { changePassword, getBasicInfo, updateBasicInfo } from '../api/basicInfo';
import { setData } from '../slices/basicInfo';
import {
    BasicInfoResponse,
    ChangePasswordRequestPayload,
    UpdateBasicInfoRequestPayload,
    UpdateBasicInfoResponse,
} from '../types/index';

interface useBasicInfoApiProps {
    handleCancel?: () => void;
    handleOtpClose?: () => void;
}

export default function useBasicInfoApi({ handleCancel, handleOtpClose }: useBasicInfoApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { refresh, data, isLoading, isEditLoading } = useAppSelector(
        state => state.reducer.basicInfo
    );
    const { user } = useAppSelector(state => state.reducer.user);

    const dispatch = useAppDispatch();
    const getUserBasicInfo = useCallback(async () => {
        dispatch(setData({ isLoading: true }));
        const resp: BasicInfoResponse | false = await getBasicInfo({
            userId: id,
            userType: role,
        });
        if (resp) {
            dispatch(setData({ data: resp, isLoading: false }));
        } else {
            dispatch(setData({ data: null, isLoading: false }));
        }
    }, [id, role, dispatch]);

    const handleUpdateBasicInfo = async (payload: UpdateBasicInfoRequestPayload) => {
        dispatch(setData({ isEditLoading: true }));
        const response: UpdateBasicInfoResponse | false = await updateBasicInfo(payload);
        if (response) {
            dispatch(setData({ refresh: !refresh, isLoading: false, isEditLoading: false }));
            if (handleCancel && handleOtpClose) {
                handleOtpClose();
                handleCancel();
                dispatch(setUserInfo({ user: { ...user!, logo: response?.docs?.logo } }));
                dispatch(
                    showToast({
                        description: 'Basic info updated successfully',
                        variant: 'success',
                    })
                );
            }
        } else {
            dispatch(setData({ isEditLoading: false }));
            dispatch(
                showToast({
                    description: 'Incorrect OTP, Please enter correct OTP.',
                    variant: 'error',
                })
            );
        }
    };

    const handleChangeUserPassword = async (payload: ChangePasswordRequestPayload) => {
        dispatch(setData({ isEditLoading: true }));
        const response = await changePassword(payload);
        if (response) {
            if (handleCancel) {
                handleCancel();
                dispatch(
                    showToast({
                        description: 'Password updated successfully',
                        variant: 'success',
                    })
                );
                dispatch(setData({ isEditLoading: false }));
                return true;
            }
        } else {
            dispatch(setData({ isEditLoading: false }));
        }
        return false;
    };

    useEffect(() => {
        getUserBasicInfo();
    }, [getUserBasicInfo, refresh]);

    return {
        data,
        isLoading,
        refresh,
        isEditLoading,
        handleUpdateBasicInfo,
        handleChangeUserPassword,
    };
}
