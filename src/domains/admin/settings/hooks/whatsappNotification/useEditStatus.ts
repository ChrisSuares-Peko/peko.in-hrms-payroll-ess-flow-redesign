import { useState } from 'react';

import { editStatus } from '../../api/whasappNotification';

const useEditStatus = () => {
    const [loading, setLoading] = useState<boolean>(false);

    const handleEditStatus = async (whatsappNumber: string, status: boolean) => {
        setLoading(true);
        try {
            const response = await editStatus(whatsappNumber, status);
            setLoading(false);
            if (!response) {
                throw new Error('Failed to update status.');
            }
            return response;
        } catch (err: any) {
            setLoading(false);
            return false;
        }
    };

    return { handleEditStatus, loading };
};

export default useEditStatus;
