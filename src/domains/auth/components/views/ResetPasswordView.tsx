import { Skeleton } from 'antd';
import { useSearchParams } from 'react-router-dom';

import useCheckTokenValidity from '../../hooks/useCheckTokenValidity';
import useGetPasswordPolicies from '../../hooks/useGetPasswordPolicies';
import usePasswordPolicyValidation from '../../hooks/usePasswordPolicyValidation';
import useResetPasswordApi from '../../hooks/useResetPasswordApi';
import ResetPassword from '../sections/ResetPassword';
import TokenValidityExpiredView from '../sections/TokenValidityExpiredView';

const ResetPasswordView = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const isForgot = searchParams.get('isForgot');
    const { loader, validtoken } = useCheckTokenValidity({ token, username });
    const { respData } = useGetPasswordPolicies(username);

    const { validatePassword } = usePasswordPolicyValidation(respData);
    const { handleResettPassword, isLoading } = useResetPasswordApi();

    const handleSubmit = (password: string) => {
        if (token && username && isForgot) {
            const payload = {
                password,
                token,
                username,
                isForgot,
            };
            handleResettPassword(payload);
        }
    };

    // eslint-disable-next-line no-nested-ternary
    return loader ? (
        <Skeleton />
    ) : validtoken ? (
        <ResetPassword
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            validatePassword={validatePassword}
            isForgot={isForgot?.toLowerCase() === 'true'}
        />
    ) : (
        <TokenValidityExpiredView isForgot={isForgot} />
    );
};
export default ResetPasswordView;
