import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { listSalaryRolloutPastEmployees } from '../../../api/employeeSalaryApi/salaryRolloutApi';
import { AVATAR_COLORS, getInitials } from '../../../utils/salaryEmployeesColumns/data';
import { PastEmployee } from '../../../utils/salaryEmployeesColumns/pastEmployees';

export const useListSalaryRolloutPastEmployees = (
    searchText: string,
    page: number,
    limit: number,
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<PastEmployee[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        const data = await listSalaryRolloutPastEmployees({
            userId: String(id),
            userType: role,
            page,
            limit,
            search: searchText || undefined,
        });

        if (data) {
            const mapped: PastEmployee[] = data.rows.map((emp, index) => ({
                key: emp.id,
                empId: emp.employeeId ?? '',
                name: emp.fullName ?? '',
                email: emp.email ?? '',
                initials: getInitials(emp.fullName),
                avatarBg: AVATAR_COLORS[index % AVATAR_COLORS.length],
                joiningDate: emp.dateOfJoin ? dayjs(emp.dateOfJoin).format('YYYY-MM-DD') : '',
                offboardingDate: emp.offBoardingDate ? dayjs(emp.offBoardingDate).format('YYYY-MM-DD') : '',
                fullFinalSettlement: emp.fullAndFinalSettlement ?? 0,
                remark: emp.remark ?? '',
            }));
            setRows(mapped);
            setTotal(data.count);
        } else {
            setRows([]);
            setTotal(0);
        }
        setIsLoading(false);
    }, [id, role, searchText, page, limit]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    return { rows, total, isLoading, refetch: fetchEmployees };
};
