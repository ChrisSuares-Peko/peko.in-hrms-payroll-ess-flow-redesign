import { useState } from 'react';

import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

import { addNumber } from '../../api/whasappNotification';

const useAddNumber = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    const handleAddNumber = async (data: any) => {
        setLoading(true);
        try {
            const result = await addNumber(data);
            if (result) {
                dispatch(
                    showToast({
                        description: 'WhatsApp number added successfully',
                        variant: 'success',
                    })
                );
                return result;
            }
            if (!result) {
                throw new Error('Failed to add number');
            }
            return result; // Return the added number data
        } catch (err) {
            setLoading(false);
            return false;
        }
    };

    return { handleAddNumber, loading };
};

export default useAddNumber;
