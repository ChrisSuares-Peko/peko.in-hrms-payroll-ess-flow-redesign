import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { SuccessGenericResponse } from '@customtypes/general';
import { paths } from '@src/routes/paths';

import { ResetPassword } from '../api/index';
import { ResetPasswordRequest } from '../types/index';

export default function useResetPasswordApi() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const handleResettPassword = async (values: ResetPasswordRequest) => {
        setIsLoading(true);
        const response: SuccessGenericResponse<{}> | false = await ResetPassword(values);
        if (response) {
            navigate(paths.auth.passwordSuccess, {
                state: {
                    isForgot: values.isForgot,
                },
            });
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    };

    return { handleResettPassword, isLoading };
}
