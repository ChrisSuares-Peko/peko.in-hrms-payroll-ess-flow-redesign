import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createOvertime } from '../../../api/employeeSalaryApi/overtimeApi';
import {
    createOvertimePayload,
    createOvertimeResponse,
} from '../../../types/salaryProfileTypes/overtimeTypes';

export default function useOvertimeCreate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const[isCreating,setIsCreating]=useState(false)
    const [responseData, setResponseData] = useState<createOvertimeResponse | false>();
    const dispatch = useAppDispatch();

    const handleOvertimeCreation = async (payload: createOvertimePayload) => {
        setIsCreating(true);
        const response: false | createOvertimeResponse = await createOvertime({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            dispatch(
                showToast({
                    description: 'Overtime added succesfully',
                    variant: 'success',
                })
            );
            setResponseData(response);
        }
        setIsCreating(false);
    };
    return { handleOvertimeCreation, responseData ,isCreating};
}
