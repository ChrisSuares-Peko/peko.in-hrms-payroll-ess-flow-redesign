import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { createRequest } from '../api/index';
import { CreateRequest, RequestFormValues } from '../types/index';

export default function useRequestDemoApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { paytmBpos } = paths;
    const navigate = useNavigate();
    const [responseData, setResponseData] = useState<CreateRequest | {}>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleRequestCreation = async (payload: RequestFormValues) => {
        setIsLoading(true);
        const response: false | CreateRequest = await createRequest({
            ...payload,
            userId: id,
            userType: role,
        });

        if (response) {
            dispatch(
                showToast({
                    description: `Demo Request submitted successfully`,
                    variant: 'success',
                })
            );
            setResponseData(response);
            const successPath = `/${paytmBpos.index}/${paytmBpos.submitted}`;
            navigate(successPath);
        }
        setIsLoading(false);

        return response;
    };

    return { handleRequestCreation, responseData, isLoading };
}
