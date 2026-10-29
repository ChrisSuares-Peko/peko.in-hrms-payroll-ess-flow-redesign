import { UserRole } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

const useShowWalletBalance = () => {
    const { user } = useAppSelector(state => state.reducer.user);
    const { role, roleName } = useAppSelector(state => state.reducer.auth);

    return (
        role === UserRole.CORPORATE &&
        roleName !== 'corporate sub user' &&
        !!user?.isWalletPaymentAvailable
    );
};

export default useShowWalletBalance;
