import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getPasswordPolicies, updatePasswordPolicies } from '../api/PasswordPolicy';
import {
    PasswordPolicy,
    PasswordPolicyResponse,
    updatePasswordPolicy,
} from '../types/PasswordPolicy';

const useGetPasswordPolicies = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, setRefresh] = useState<Boolean>(false);
    const [respData, setRespData] = useState<PasswordPolicy>();
    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: PasswordPolicyResponse | false = await getPasswordPolicies({
            userId: id,
            userType: role,
        });
        if (data) {
            setRespData(data.data[0]);
        }
        setIsLoading(false);
    }, [id, role]);

    const updatePolicies = useCallback(
        async (payload: updatePasswordPolicy) => {
            setIsLoading(true);
            const data: PasswordPolicyResponse | any = await updatePasswordPolicies({
                userId: id,
                userType: role,

                ...payload,
            });
            if (data.status) {
                setIsLoading(false);
                return dispatch(
                    showToast({
                        variant: 'success',
                        description: data.message,
                    })
                );
            }
            setIsLoading(false);
            return dispatch(
                showToast({
                    variant: 'error',
                    description: data.errorMessage,
                })
            );
        },
        [dispatch, id, role]
    );
    const updatePasswordProtection = useCallback(
        async (payload: updatePasswordPolicy) => {
            setIsLoading(true);
            const data: PasswordPolicyResponse | any = await updatePasswordPolicies({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data.status) {
                setIsLoading(false);
                return dispatch(
                    showToast({
                        variant: 'success',
                        description: data.message,
                    })
                );
            }
            setIsLoading(false);
            return dispatch(
                showToast({
                    variant: 'error',
                    description: data.errorMessage,
                })
            );
        },
        [dispatch, id, role]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return {
        respData,
        isLoading,
        updatePolicies,
        setRefresh,
        updatePasswordProtection,
    };
};

export default useGetPasswordPolicies;
