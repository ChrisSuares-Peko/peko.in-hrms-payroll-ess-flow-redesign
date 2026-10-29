import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createENachMandate } from '../api';
import {
    ENachMandateData,
    ENachMandatePayload,
    ENachMandateValidationError,
} from '../types/paymentLinkTypes';

type CreateENachMandateInput = Omit<ENachMandatePayload, 'userId' | 'userType'>;

interface ENachMandateResult {
    success: boolean;
    data?: ENachMandateData;
    errors?: string[];
}

export const useCreateENachMandate = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const submitMandate = useCallback(
        async (payload: CreateENachMandateInput): Promise<ENachMandateResult> => {
            setLoading(true);
            console.log(";")
            const response = await createENachMandate({
                userId: id,
                userType: role,
                ...payload,
            });
            setLoading(false);

            if (!response) {
                return {
                    success: false,
                    errors: ['Failed to create eNACH mandate. Please try again.'],
                };
            }

            if ('errors' in response) {
                console.log(response)
                dispatch(showToast({
                    description: response?.errors[0],
                    variant: 'error',
                }));
                return {
                    success: false,
                    errors: (response as ENachMandateValidationError).errors,
                };
            }

            return {
                success: true,
                data: response as ENachMandateData,
            };
        },
        [dispatch, id, role]
    );

    return { loading, submitMandate };
};
