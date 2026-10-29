import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { alterProductTour } from '@src/slices/userSlice';

import { updateProductTour } from '../api/index';
import { productTourResponse } from '../types/type';

export default function useEnableProductTour() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const handleUpdateTour = async () => {
        setIsLoading(true);
        const data: productTourResponse | false = await updateProductTour({
            userId: id,
            userType: role,
            type: 'All',
        });
        if (data) {
            dispatch(alterProductTour(data.result.productTour));
            navigate(`${paths.dashboard.home}`);
        }
        setIsLoading(false);
    };
    return { handleUpdateTour, isLoading };
}
