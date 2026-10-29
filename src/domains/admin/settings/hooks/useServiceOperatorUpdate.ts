import { useCallback, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createServiceOperator, putUpdateServiceOperator } from '../api/serviceOperator';
import { OperatorWithoutID, serviceOperator } from '../types/serviceOperator';

export default function useServiceOperatorUpdate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<serviceOperator | {}>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const handleServiceOperatorCreation = async (payload: OperatorWithoutID) => {
        setIsLoading(true);
        const response: false | SuccessGenericResponse<serviceOperator> =
            await createServiceOperator({
                ...payload,
                userId: id,
                userType: role,
            });
        if (response) {
            if (response.status) {
                setResponseData(response);
                dispatch(
                    showToast({
                        description: `Service operator added successfully`,
                        variant: 'success',
                    })
                );
                return response;
            }
            dispatch(
                showToast({
                    description: `${response.message}`,
                    variant: 'error',
                })
            );
        }
        setIsLoading(false);
        return false;
    };

    const updateServiceOperator = useCallback(
        async (vendorUpdatedData: serviceOperator) => {
            setIsLoading(true);
            const response: SuccessGenericResponse<{}> | false = await putUpdateServiceOperator({
                userId: id,
                userType: role,
                ...vendorUpdatedData,
            });
            if (response) {
                if (response.status) {
                    setResponseData(response);
                    dispatch(
                        showToast({
                            description: `Service operator updated successfully`,
                            variant: 'success',
                        })
                    );
                    return response;
                }
                dispatch(
                    showToast({
                        description: `${response.message}`,
                        variant: 'error',
                    })
                );
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role]
    );

    return { handleServiceOperatorCreation, responseData, isLoading, updateServiceOperator };
}
