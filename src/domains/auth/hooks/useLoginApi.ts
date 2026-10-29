import { useNavigate } from 'react-router-dom';

import useCompleteLogin from './useCompleteLogin';
import { signIn } from '../api/index';
import { LoginRequest, LoginResponse } from '../types/index';

export default function useLoginApi() {
    const navigate = useNavigate();
    const { completeLogin } = useCompleteLogin();

    const handleLogin = async (payload: LoginRequest) => {
        const response: LoginResponse | false = await signIn(payload);
        if (response) {
            if (response.maxPasswordAge) {
                navigate('/auth/ChangePassword', {
                    state: {
                        userName: payload.username,
                        password: payload.password,
                    },
                });
            } else {
                await completeLogin(response);
            }
        }
    };
    return { handleLogin };
}
