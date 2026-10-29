import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { gratuityCalculate } from '../../../api/employeeSalaryApi/employeeSalaryProfile';
import {
    gratuityCalculatePayload,
    gratuityCalculateResponse,
} from '../../../types/salaryProfileTypes/employeeSalaryProfile';

export default function GetGratuityAmount() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [GratuityAmount, setGratuityAmount] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const calculateGrauityAmount = useCallback(
        async (payload: gratuityCalculatePayload) => {
            setIsLoading(true);
            const data: gratuityCalculateResponse | false = await gratuityCalculate({
                ...payload,
                userId: id,
                userType: role,
            });
            if (data) {
                setGratuityAmount(Number(data.gratuity).toFixed());
                dispatch(
                    showToast({
                        description: 'Gratuity calculated successfully',
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [dispatch, id, role]
    );

    return { calculateGrauityAmount, GratuityAmount, isLoading };
}
