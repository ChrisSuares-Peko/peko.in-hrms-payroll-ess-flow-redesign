import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getOneEmployee } from '../../api/employeeOnboarding';
import { setEmployeeInformation } from '../../slices/employeeSettings';

export default function GetEmployeeDetails(empID: string) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeDetails, setEmployeeDetails] = useState<any>();
    const [isLoading, setIsLoading] = useState(true);

    const getEmployeeDetails = useCallback(async () => {
        const data = await getOneEmployee({
            userId: id,
            userType: role,
            employeeId: empID,
        });

        if (data) {
            dispatch(setEmployeeInformation(data.employeeInformation));
            setEmployeeDetails(data);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, empID, dispatch]);

    useEffect(() => {
        getEmployeeDetails();
    }, [getEmployeeDetails]);

    return { data: employeeDetails, isLoading, getEmployeeDetails };
}
