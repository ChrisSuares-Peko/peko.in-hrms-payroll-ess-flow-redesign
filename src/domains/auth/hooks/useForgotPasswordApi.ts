import { useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/store';

import { forgotPassword } from '../api/index';
import { forgotpasswordnextStep } from '../slices/forgotpasswordSlice';
import { ForgotPasswordRequest } from '../types/index';

export default function useForgotPasswordApi() {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleForgotPassword = async (values: ForgotPasswordRequest) => {
        setIsLoading(true);
        const response: SuccessGenericResponse<{}> | false = await forgotPassword(values);
        if (response) {
            dispatch(forgotpasswordnextStep(values.username));
        }
        setIsLoading(false);
    };

    return { isLoading, handleForgotPassword };
}
