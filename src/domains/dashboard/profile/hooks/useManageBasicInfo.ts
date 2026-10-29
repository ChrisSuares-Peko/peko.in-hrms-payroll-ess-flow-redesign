import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { setUserInfo } from '@src/slices/userSlice';

import { changePassword, updateBasicInfo } from '../api/basicInfo';
import { setData } from '../slices/basicInfo';
import {
    ChangePasswordRequestPayload,
    UpdateBasicInfoRequestPayload,
    UpdateBasicInfoResponse,
} from '../types';

interface useBasicInfoApiProps {
    handleCancel?: () => void;
    handleOtpClose?: () => void;
}

export default function useManageBasicInfo({ handleCancel, handleOtpClose }: useBasicInfoApiProps) {
    const dispatch = useAppDispatch();

    const { refresh, isEditLoading } = useAppSelector(state => state.reducer.basicInfo);
    const { user } = useAppSelector(state => state.reducer.user);

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
                        description: 'Password changed successfully',
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

    return {
        handleChangeUserPassword,
        handleUpdateBasicInfo,
        isEditLoading,
    };
}
