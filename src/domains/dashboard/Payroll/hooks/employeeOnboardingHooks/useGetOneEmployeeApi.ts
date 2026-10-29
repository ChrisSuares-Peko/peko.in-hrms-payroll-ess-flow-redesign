import { useCallback, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getOneEmployee } from '../../api/employeeOnboarding';
import {
    setPersonalInformation,
    setEmployeeInformation,
    setProfileImage,
    setSalaryComponents,
    setIsLoading,
} from '../../slices/employeeSettings';

export default function useGetOneEmployeeApi(employeeId: string) {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { isLoading } = useAppSelector(state => state.reducer.employeeSettings);
    const dispatch = useAppDispatch();

    const getEmployeeList = useCallback(async () => {
        if (!employeeId) return;

        dispatch(setIsLoading(true));

        const res = await getOneEmployee({ userId: id, userType: role, employeeId });

        if (res) {
            dispatch(setPersonalInformation(res.personalInformation));
            dispatch(setEmployeeInformation(res.employeeInformation));
            dispatch(setProfileImage(res.profileImage!));
            dispatch(setSalaryComponents(res.salaryComponents));
        }

        dispatch(setIsLoading(false));
    }, [dispatch, employeeId, id, role]);

    useEffect(() => {
        getEmployeeList();
    }, [getEmployeeList]);

    return { isLoading };
}
