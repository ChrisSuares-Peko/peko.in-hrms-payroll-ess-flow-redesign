import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createDynamicQr } from '../api';
import { CreateDynamicQrPayload, CreateDynamicQrResponse } from '../types/paymentLinkTypes';

type CreateDynamicQrInput = Omit<CreateDynamicQrPayload, 'userId' | 'userType'>;

export const useCreateDynamicQr = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);

    const generateQr = useCallback(
        async (payload: CreateDynamicQrInput) => {
            setLoading(true);
            const response = await createDynamicQr({
                userId: id,
                userType: role,
                ...payload,
            });
            setLoading(false);

            if (!response) {
                return false;
            }

            return response as CreateDynamicQrResponse;
        },
        [id, role]
    );

    return { loading, generateQr };
};

export default useCreateDynamicQr;
