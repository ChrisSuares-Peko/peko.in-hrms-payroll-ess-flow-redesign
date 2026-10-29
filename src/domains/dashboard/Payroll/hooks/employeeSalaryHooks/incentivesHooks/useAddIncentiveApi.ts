import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createIncentive } from '../../../api/employeeSalaryApi/incentiveApi';
import {
    createIncentivesPayload,
    createIncentivesResponse,
} from '../../../types/salaryProfileTypes/incentiveTypes';

export default function useIncentivesCreate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const[isAdding,setIsAdding]=useState(false);
    const [responseData, setResponseData] = useState<createIncentivesResponse | false>();
    const dispatch = useAppDispatch();

    const handleIncentivesCreation = async (payload: createIncentivesPayload) => {
        setIsAdding(true);
        const response: false | createIncentivesResponse = await createIncentive({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            dispatch(
                showToast({
                    description: 'Incentive added succesfully',
                    variant: 'success',
                })
            );
            setResponseData(response);
        }
        setIsAdding(false)
    };
    return { handleIncentivesCreation, responseData,isAdding };
}
