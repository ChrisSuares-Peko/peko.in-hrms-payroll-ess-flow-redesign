import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listSalaryRolloutEmployees } from '../../../api/employeeSalaryApi/salaryRolloutApi';
import { SalaryEmployee } from '../../../utils/salaryEmployeesColumns/activeEmployees';
import { AVATAR_COLORS, getInitials } from '../../../utils/salaryEmployeesColumns/data';

export const useListSalaryRolloutEmployees = (
    searchText: string,
    page: number,
    limit: number,
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<SalaryEmployee[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        const data = await listSalaryRolloutEmployees({
            userId: String(id),
            userType: role,
            page,
            limit,
            search: searchText || undefined,
        });

        if (data) {
            const mapped: SalaryEmployee[] = data.rows.map((emp, index) => ({
                key: emp.id,
                empId: emp.employeeId ?? '',
                name: emp.fullName ?? '',
                email: emp.email ?? '',
                initials: getInitials(emp.fullName),
                avatarBg: AVATAR_COLORS[index % AVATAR_COLORS.length],
                profileImage: emp.profileImage ?? null,
                salary: emp.salary ?? 0,
                accountName: emp.accountName,
                accountNumber: emp.accountNumber ?? '',
                bankName: emp.bankName ?? '',
                ifscCode: emp.ifscCode,
                upiId: emp.upiId,
                transactionType: emp.transactionType,
                bankAccountStatus: emp.bankAccountStatus ?? 'Pending Verification',
                beneficiaryStatus: emp.beneficiaryStatus ?? 'Pending',
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
