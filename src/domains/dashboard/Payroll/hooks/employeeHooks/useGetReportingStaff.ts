import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getReportingStaffAPI } from '../../api/employeeApi';
import { Employee } from '../../types/types';

export default function GetEmployeeReportingStaff(empID: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeDetails, setEmployeeDetails] = useState<Employee | false>();
    const [isLoading, setIsLoading] = useState(true);

    const getEmployeeDetails = useCallback(async () => {
        const data = await getReportingStaffAPI({
            userId: id,
            userType: role,
            employeeID: empID,
        });

        if (data) {
            const employee = data as unknown;
            const giftCardDetailData = employee as Employee;
            setEmployeeDetails(giftCardDetailData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, empID]);

    useEffect(() => {
        getEmployeeDetails();
    }, [getEmployeeDetails]);

    return { data: employeeDetails, isLoading };
}
