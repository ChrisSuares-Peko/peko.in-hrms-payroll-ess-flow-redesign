import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { OffBoardEmployee } from '../../api/employeeApi';
import { OffBoardEmployeePayload } from '../../types/types';

export function useOffBoardEmployeeApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const offBoardEmployee = async (
        employeeId: number,
        offBoardData: Partial<OffBoardEmployeePayload>
    ) => {
        setIsLoading(true);

        // Construct the payload
        const payload: OffBoardEmployeePayload = {
            userId: id,
            userType: role,
            employeeId,
            ...offBoardData,
        };

        try {
            const response = await OffBoardEmployee(payload);

            if (response) {
                dispatch(
                    showToast({
                        variant: 'success',
                        description: 'Employee offboarded successfully',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Something went wrong while offboarding the employee.',
                    })
                );

                console.error('OffBoarding failed');
                // Handle failure here, for example by dispatching an error action
            }
        } catch (error) {
            console.error('Error in offboarding:', error);
            // Handle API call error here
        } finally {
            setIsLoading(false);
        }
    };

    return { offBoardEmployee, isLoading };
}
