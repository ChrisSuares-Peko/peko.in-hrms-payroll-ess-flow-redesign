import { useCallback, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createDocument } from '../api/index';

export default function useCreateDocApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const createDoc = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<any> | false = await createDocument({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    return { isLoading, createDoc };
}
