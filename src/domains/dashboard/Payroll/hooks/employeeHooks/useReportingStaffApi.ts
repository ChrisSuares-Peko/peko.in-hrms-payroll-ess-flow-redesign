import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getReportingStaff } from '../../api/employeeApi';
import { staffSelect } from '../../types/types';

export default function GetEmployeeDetails(searchText: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeDetails, setEmployeeDetails] = useState<staffSelect[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getStaffDetails = useCallback(async () => {
        const data = await getReportingStaff({
            userId: id,
            userType: role,
            searchText,
        });

        if (data && data.data && data.data.employees) {
            const transformedData: staffSelect[] = data.data.employees.map((employee, index) => ({
                key: index,
                value: employee._id,
                label: employee.fullName,
            }));
            setEmployeeDetails(transformedData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, searchText]);

    useEffect(() => {
        getStaffDetails();
    }, [getStaffDetails]);

    return { data: employeeDetails, isLoading };
}
