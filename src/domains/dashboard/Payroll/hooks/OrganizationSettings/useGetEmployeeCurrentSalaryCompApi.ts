import { useCallback, useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';

import { getCurrentEmployeeSalaryComponent } from '../../api/organizationSettings';
import { AllSalaryComponentListResponse } from '../../types/organizationSettings';

export function useGetEmployeeSalaryComponent() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [salaryComp, setSalaryComp] = useState<any[]>([]);
    const location = useLocation();
    const { id: reduxEmployeeId } = useAppSelector(state => state.reducer.employeeSettings);
    const eId = reduxEmployeeId || location.state?.employeeId;
    const employeeList = useCallback(async () => {
        const data: AllSalaryComponentListResponse | false =
            await getCurrentEmployeeSalaryComponent({
                userId: id,
                userType: role,
                eId,
            });
        if (data) {
            setSalaryComp(data?.componentData);
        }
    }, [id, role, eId]);

    useEffect(() => {
        employeeList();
    }, [employeeList]);

    const generateEmployeeSalaryCompDropdown = (data: any[]) =>
        data.map(component => ({
            value: component.id,
            label: `${component?.componentName}`,
        }));
    return { data: salaryComp, generateEmployeeSalaryCompDropdown };
}
