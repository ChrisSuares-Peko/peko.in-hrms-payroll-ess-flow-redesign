import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { complaintRegister } from '../api/index';
import { setComplaintResponse } from '../slices/beneficiary';

export default function useComplaintRegistrationApi(categoryName?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const complaintRegistration = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: any | false = await complaintRegister({
                userId: id,
                userType: role,
                payload,
            });
            if (data) {
                if (data.responseReason === 'SUCCESS') {
                    dispatch(setComplaintResponse(data));
                    navigate(
                        `/${paths.billPayments.index}/${paths.billPayments.complaintRegistration}/${paths.billPayments.success}`
                    );
                } else {
                    dispatch(
                        showToast({
                            description: 'Something went wront',
                            variant: 'error',
                        })
                    );
                }
                setIsLoading(false);
            }
            setIsLoading(false);
        },
        [dispatch, id, navigate, role]
    );

    return { isLoading, complaintRegistration };
}
