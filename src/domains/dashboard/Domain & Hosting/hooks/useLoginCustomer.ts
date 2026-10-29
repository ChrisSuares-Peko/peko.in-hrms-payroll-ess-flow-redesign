import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { loginCustomer } from '../api/index';
import { setCustomerData, setCustomerId } from '../slices/domainHostingSlice';

export default function useLoginCustomer() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleLogin = useCallback(
        async (username: string, passwd: string) => {
            setIsLoading(true);
            const data = await loginCustomer({ username, passwd, userId: id, userType: role });
            if (data) {
                dispatch(setCustomerData(data));
                const customerId = data.customerid ?? data.userid ?? data.id ?? data;
                dispatch(setCustomerId(String(customerId)));
            }
            setIsLoading(false);
            return data;
        },
        [dispatch, id, role]
    );

    return { handleLogin, isLoading };
}
