// PROTOTYPE-SETUP: while the Payroll onboarding flow is open, payrollAuth reflects a first-run account
// (not purchased, progress 0%). On leaving it, the seeded state used by /payroll is restored.
import { ReactNode, useEffect, useState } from 'react';

import { setPayrollProgress } from '@src/domains/dashboard/Payroll/slices/payrollAuth';
import { useAppDispatch } from '@src/hooks/store';

import { PAYROLL_ONBOARDING_PROGRESS, PAYROLL_SEEDED_PROGRESS } from '../payrollSeed';

const PayrollOnboardingState = ({ children }: { children: ReactNode }) => {
    const dispatch = useAppDispatch();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        dispatch(setPayrollProgress(PAYROLL_ONBOARDING_PROGRESS));
        setReady(true);
        return () => {
            dispatch(setPayrollProgress(PAYROLL_SEEDED_PROGRESS));
        };
    }, [dispatch]);

    return ready ? <>{children}</> : null;
};

export default PayrollOnboardingState;
