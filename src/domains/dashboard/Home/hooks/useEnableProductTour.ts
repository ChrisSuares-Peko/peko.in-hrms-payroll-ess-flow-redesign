import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { alterProductTour } from '@src/slices/userSlice';

import { updateProductTour } from '../api/index';
import { productTourResponse } from '../types/index';

export default function useEnableProductTour() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoadingTour, setIsLoadingTour] = useState(false);
    const dispatch = useAppDispatch();
    const handleUpdateTour = async (service: string) => {
        setIsLoadingTour(true);
        const data: productTourResponse | false = await updateProductTour({
            userId: id,
            userType: role,
            type: 'Single',
            service,
        });
        if (data) {
            dispatch(alterProductTour(data.result.productTour));
          
        }
        setIsLoadingTour(false);
    };
    return { handleUpdateTour, isLoadingTour };
}
