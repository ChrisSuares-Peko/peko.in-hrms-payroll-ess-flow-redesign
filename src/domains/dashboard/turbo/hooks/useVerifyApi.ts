import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verify } from '../api';
import {
    resetRcResponse,
    resetResponse,
    setRcVerifyResponse,
    setverifyResponse,
} from '../slices/turboSlice';

const DL_ERROR_MSG =
    "We couldn't find driving license details. Please check the Driving License Number and Date of Birth and try again.";
const RC_ERROR_MSG =
    'No records found for the entered Registration Number. Please verify the details and try again.';

export default function useVerify() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const verifyApi = useCallback(
        async (payload: any) => {
            const isDL = payload.type === 'dl';
            const errorMsg = isDL ? DL_ERROR_MSG : RC_ERROR_MSG;

            setIsLoading(true);

            try {
                const data: any = await verify({
                    userId: id,
                    userType: role,
                    doc_identity_no: payload.doc_identity_no,
                    type: payload.type,
                    dob: payload?.dob,
                });

                if (!data) {
                    dispatch(showToast({ description: errorMsg, variant: 'error' }));
                    dispatch(isDL ? resetResponse() : resetRcResponse());
                    return false;
                }

                const record = data.data;

                if (isDL) {
                    if (!record || record.dlNumber === null) {
                        dispatch(showToast({ description: errorMsg, variant: 'error' }));
                        return false;
                    }
                    dispatch(setverifyResponse(record));
                } else {
                    if (!record || record.vehicleNumber === null) {
                        dispatch(showToast({ description: errorMsg, variant: 'error' }));
                        return false;
                    }
                    dispatch(setRcVerifyResponse(record));
                }

                return true;
            } catch {
                dispatch(showToast({ description: errorMsg, variant: 'error' }));
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [dispatch, id, role]
    );

    return { loading: isLoading, verifyApi };
}
