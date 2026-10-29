import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCurrentSalaryComponent } from '../../api/organizationSettings';
import { AllSalaryComponentListResponse } from '../../types/organizationSettings';

export function useGetSalaryComponent(reloadTrigger?: unknown) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [salaryComp, setSalaryComp] = useState<any[]>([]);
    const employeeList = useCallback(async () => {
        const data: AllSalaryComponentListResponse | false = await getCurrentSalaryComponent({
            userId: id,
            userType: role,
        });
        if (data) {
            setSalaryComp(data?.componentData);
        }
    }, [id, role]);

    useEffect(() => {
        employeeList();
    }, [employeeList, reloadTrigger]);

    const generateSalaryCompDropdown = (data: any[]) =>
        data.map(component => ({
            value: component.id,
            label: `${component?.componentName}`,
        }));
    return { data: salaryComp, generateSalaryCompDropdown };
}
