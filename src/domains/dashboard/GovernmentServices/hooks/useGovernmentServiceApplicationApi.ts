import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    ApplicationDraft,
    getGovernmentServiceApplicationApi,
    getGovernmentServiceApplicationByIdApi,
    submitGovernmentServiceApplicationApi,
} from '../apis';

export const useGovernmentServiceApplication = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [isDraftLoading, setIsDraftLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const fetchApplicationById = useCallback(
        async (applicationId: number | string): Promise<ApplicationDraft | null> => {
            setIsDraftLoading(true);
            const data = await getGovernmentServiceApplicationByIdApi(id, role, applicationId);
            setIsDraftLoading(false);
            return data;
        },
        [id, role]
    );

    const fetchDraft = useCallback(
        async (accessKey: string): Promise<ApplicationDraft | null> => {
            setIsDraftLoading(true);
            const data = await getGovernmentServiceApplicationApi(id, role, accessKey);
            setIsDraftLoading(false);
            return data;
        },
        [id, role]
    );

    const submitApplication = useCallback(
        async (accessKey: string, formData: Record<string, unknown>, applicationId?: number | null, status?: string) => {
            setIsLoading(true);

            const response = await submitGovernmentServiceApplicationApi({
                userId: id,
                userType: role,
                accessKey,
                formData,
                applicationId,
                status,
            });

            setIsLoading(false);

            if (response) {
                setIsSuccess(true);
                dispatch(
                    showToast({
                        description: 'Application submitted successfully',
                        variant: 'success',
                    })
                );
            }

            return response;
        },
        [id, role, dispatch]
    );

    return { isLoading, isDraftLoading, isSuccess, fetchDraft, fetchApplicationById, submitApplication };
};
