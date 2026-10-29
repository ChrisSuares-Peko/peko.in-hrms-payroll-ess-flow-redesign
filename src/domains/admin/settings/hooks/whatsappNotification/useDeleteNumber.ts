import { useState } from 'react';

import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

import { deleteNumber } from '../../api/whasappNotification';

const useDeleteNumber = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const handleDeleteNumber = async (whatsappNumber: string) => {
        setLoading(true);
        try {
            const result = await deleteNumber(whatsappNumber);
            setLoading(false);
            if (result) {
                dispatch(
                    showToast({
                        description: 'WhatsApp number deleted successfully',
                        variant: 'success',
                    })
                );
                return true;
            }
            dispatch(
                showToast({ description: 'Failed to delete WhatsApp number', variant: 'error' })
            );
            return false;
        } catch (err) {
            setLoading(false);
            return false;
        }
    };

    return {
        handleDeleteNumber,
        loading,
    };
};

export default useDeleteNumber;
