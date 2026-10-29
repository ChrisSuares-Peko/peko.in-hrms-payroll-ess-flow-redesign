import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { KYBStepsUpdate } from '../api/kyb';

export default function useKYBStepUpdate() {
    const { id, role } = useAppSelector(store => store.reducer.auth);

    const updateStep = useCallback(
        async (value: boolean, businessType: string) => {
            try {
                const response = await KYBStepsUpdate({
                    userId: id,
                    userType: role,
                    isFirstStepCompleted: value,
                    businessType,
                });

                return response; // Ensure the function returns the API response
            } catch (error) {
                console.error('Error updating KYB step:', error);
                return null; // Return null in case of an error
            }
        },
        [id, role]
    );

    return { updateStep };
}
