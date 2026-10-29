import { useState } from 'react';

import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

import { editNumber } from '../../api/whasappNotification';

const useEditNumber = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const handleEditNumber = async (currentNumber: string, updatedDetails: any) => {
        setLoading(true);

        try {
            const response = await editNumber(currentNumber, updatedDetails);
            setLoading(false);
            if (response) {
                dispatch(
                    showToast({
                        description: 'WhatsApp number updated successfully',
                        variant: 'success',
                    })
                );
                return response;
            }
            throw new Error('Failed to edit WhatsApp number');
        } catch (err) {
            setLoading(false);
            return false; // Return false in case of an error
        }
    };

    return { handleEditNumber, loading };
};

export default useEditNumber;
