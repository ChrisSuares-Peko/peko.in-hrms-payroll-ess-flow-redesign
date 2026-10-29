/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { progress } from '../../api/dashBoardIndex';
import { setBasicSalaryData } from '../../slices/orgSettings';
import { setPayrollProgress } from '../../slices/payrollAuth';
import { progressResponse } from '../../types/dashboardTypes';

export function useProgressApi() {
    const { role, id, token } = useAppSelector(state => state.reducer.auth);
    const { refreshBasicSalary } = useAppSelector(state => state.reducer.orgSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [refresh, setRefresh] = useState(true);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const getProgress = useCallback(async () => {
        const data: progressResponse | false = await progress({
            userId: id,
            userType: role,
        });

        if (data) {
            dispatch(setPayrollProgress(data));
            dispatch(
                setBasicSalaryData({
                    hasBasicSalaryComponent: data?.hasBasicSalaryComponent,
                    basicSalaryAmount: data?.basicSalaryAmount,
                })
            );
        } else if (token) {
            // PROTOTYPE-SETUP: only a real session is sent to /service-not-available; the tokenless
            // prototype keeps the seeded payrollAuth state (same pattern as /session-expired).
            navigate(paths.dashboard.serviceNotAvailable);
        }
        setIsLoading(false);
    }, [id, role, token, dispatch]);

    useEffect(() => {
        getProgress();
    }, [getProgress, refreshBasicSalary, refresh]);
    return { isLoading, setRefresh };
}
