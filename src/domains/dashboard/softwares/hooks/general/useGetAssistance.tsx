import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getAssistance } from '../../api';

const useGetAssistance = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const requestAssistance = useCallback(
        async (productName: string) => {
            setIsLoading(true);
            const data = await getAssistance({
                userId: id,
                userType: role,
                productName,
            });
            if (data && data.status) {
                navigate(`${paths.softwares.getAssistanceSuccess}`);
            } else {
                dispatch(
                    showToast({
                        description: 'Something went wrong try again',
                        variant: 'error',
                    })
                );
            }
            setIsLoading(false);
        },
        [dispatch, id, navigate, role]
    );
    return { isLoading, requestAssistance };
};

export default useGetAssistance;
