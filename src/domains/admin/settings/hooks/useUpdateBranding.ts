import { useCallback, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { updateBrandingData } from '../api/branding';
import { activeResponse } from '../types/branding';

const useUpdateBranding = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isloading, setIsLoading] = useState(false);

    const updateBrandingApi = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await updateBrandingData({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                setIsLoading(false);
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    return { updateBrandingApi, isloading };
};

export default useUpdateBranding;
