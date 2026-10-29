import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { registerCustomer } from '../api/index';
import { setCustomerId } from '../slices/domainHostingSlice';
import { RegisterCustomerPayload } from '../types/index';

type RegisterPayload = Omit<RegisterCustomerPayload, 'userId' | 'userType'>;

export default function useRegisterCustomer() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleRegister = useCallback(
        async (payload: RegisterPayload) => {
            setIsLoading(true);
            const data = await registerCustomer({ ...payload, userId: id, userType: role });
            if (data) {
                dispatch(setCustomerId(String(data.customerId)));
            }
            setIsLoading(false);
            return data;
        },
        [dispatch, id, role]
    );

    return { handleRegister, isLoading };
}
