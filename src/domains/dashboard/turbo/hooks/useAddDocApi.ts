import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { addDoc } from '../api';

export default function useAddDocApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [details, setDetails] = useState<any>();

    const addDocApi = useCallback(
        async (payload: any, vehicleId?: undefined | number) => {
            setIsLoading(true);
            const data: any = await addDoc({
                userId: id,
                userType: role,
                doc_identity_no: payload.doc_identity_no,
                type: payload.type,
                dob: payload.dob,
                vehicleId,
            });

            if (data) {
                if (payload.type === 'dl') {
                    setDetails(data);

                    // dispatch(setverifyResponse(data.data))
                } else {
                    setDetails(data);

                    // dispatch(setRcVerifyResponse(data.data))
                }
                setIsLoading(false);
                // return the created record so callers can use the new id (e.g. FASTag save)
                return data;
            }

            setRefresh(false);
            setIsLoading(false);

            return false;
        },
        [id, role]
    );

    return { details, loading: isLoading, addDocApi,refresh };
}
