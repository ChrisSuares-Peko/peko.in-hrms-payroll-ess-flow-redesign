import { useCallback, useEffect } from 'react';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getCompanyInfo, updateCompanyInfo } from '../api/companyInfo';
import { setData } from '../slices/companyInfo';
import {
    CompanyInfoResponse,
    UpdateBasicInfoResponse,
    UpdateCompanyInfoRequestPayload,
} from '../types/index';

interface useBasicInfoApiProps {
    handleCancel?: () => void;
    handleOtpClose?: () => void;
}

export default function useCompanyInfoApi({ handleCancel, handleOtpClose }: useBasicInfoApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { refresh, data, isLoading, isEditLoading } = useAppSelector(
        state => state.reducer.companyInfo
    );

    const dispatch = useAppDispatch();
    const getUserCompanyInfo = useCallback(async () => {
        dispatch(setData({ data: null, isLoading: true }));
        const resp: CompanyInfoResponse | false = await getCompanyInfo({
            userId: id,
            userType: role,
        });
        if (resp) {
            dispatch(setData({ data: resp, isLoading: false }));
        } else {
            dispatch(setData({ data: null, isLoading: false }));
        }
    }, [id, role, dispatch]);

    const handleUpdateCompanyInfo = async (payload: UpdateCompanyInfoRequestPayload) => {
        dispatch(setData({ isEditLoading: true }));
        const response: UpdateBasicInfoResponse | false = await updateCompanyInfo(payload);
        if (response) {
            dispatch(setData({ refresh: !refresh, isLoading: false, isEditLoading: false }));
            if (handleCancel && handleOtpClose) {
                handleOtpClose();
                handleCancel();
                dispatch(
                    showToast({
                        description: 'Company info updated successfully',
                        variant: 'success',
                    })
                );
            }
        } else {
            dispatch(setData({ isEditLoading: false }));
            // if (handleOtpClose) {
            //     handleOtpClose();
            // }
        }
    };

    useEffect(() => {
        getUserCompanyInfo();
    }, [getUserCompanyInfo, refresh]);

    return {
        data,
        isLoading,
        refresh,
        isEditLoading,
        handleUpdateCompanyInfo,
    };
}
