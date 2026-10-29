import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listPendingBeneficiaryEmployees } from '../../../api/employeeSalaryApi/salaryRolloutApi';
import { PendingVerificationRow } from '../../../types/salaryProfileTypes/salaryRolloutTypes';
import { AVATAR_COLORS, getInitials } from '../../../utils/salaryEmployeesColumns/data';

export const useListPendingBeneficiaryEmployees = (enabled: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<PendingVerificationRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchEmployees = useCallback(async () => {
        if (!enabled) return;
        setIsLoading(true);
        const data = await listPendingBeneficiaryEmployees({ userId: String(id), userType: role });
        if (data) {
            setRows(
                data.map((emp, index) => ({
                    key: emp.id,
                    initials: getInitials(emp.fullName),
                    avatarBg: AVATAR_COLORS[index % AVATAR_COLORS.length],
                    name: emp.fullName ?? '',
                    profileImage: emp.profileImage ?? null,
                    beneficiaryStatus: emp.beneficiaryStatus,
                    bankAccountStatus: emp.bankAccountStatus,
                }))
            );
        } else {
            setRows([]);
        }
        setIsLoading(false);
    }, [id, role, enabled]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    return { rows, isLoading };
};
