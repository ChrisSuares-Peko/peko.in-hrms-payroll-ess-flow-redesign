import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { SuccessGenericResponse } from '@customtypes/general';
import { paths } from '@src/routes/paths';

import { ChangePassword } from '../api';
import { PasswordExpryReset, passwordUserData } from '../types';

export default function usePasswordExpiryReset(state: any) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<passwordUserData>();
    const handleResettPassword = async (values: PasswordExpryReset) => {
        setIsLoading(true);
        const response: SuccessGenericResponse<{}> | false = await ChangePassword(values);
        if (response) {
            navigate(paths.auth.passwordSuccess, {
                state: {
                    isForgot: true,
                },
            });
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (state) {
            setUserData(state);
        } else {
            navigate(paths.auth.jwt.login);
        }
    }, [navigate, state]);
    return { handleResettPassword, isLoading, userData };
}
