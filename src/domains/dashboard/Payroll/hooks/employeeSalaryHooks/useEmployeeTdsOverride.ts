import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getTdsOverride, updateTdsOverride } from '../../api/employeeSalaryApi/employeeSalary';
import { TdsOverrideInfo } from '../../types/salaryProfileTypes/employeeSalaryTable';

// Old Tax Regime employees: the HR-entered monthly TDS in force this month, and saving a
// new amount from a chosen month onward. `info.isOldRegime` false → nothing to edit.
export const useEmployeeTdsOverride = (employeeId?: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [info, setInfo] = useState<TdsOverrideInfo | null>(null);

    const fetchInfo = useCallback(async () => {
        if (!employeeId) {
            setInfo(null);
            return;
        }
        setInfo(await getTdsOverride({ userId: id, userType: role, employeeId }));
    }, [employeeId, id, role]);

    useEffect(() => {
        fetchInfo();
    }, [fetchInfo]);

    const saveTds = useCallback(
        async (amount: number, month: number, year: number, applyToFutureMonths: boolean) => {
            if (!employeeId) return false;
            const response = await updateTdsOverride({
                userId: id,
                userType: role,
                employeeId,
                month,
                year,
                amount,
                applyToFutureMonths,
            });
            dispatch(
                showToast({
                    description: response.success ? 'Income Tax (TDS) updated successfully' : response.errorMessage,
                    variant: response.success ? 'success' : 'error',
                })
            );
            if (response.success) await fetchInfo();
            return response.success;
        },
        [dispatch, employeeId, fetchInfo, id, role]
    );

    return { info, saveTds };
};
