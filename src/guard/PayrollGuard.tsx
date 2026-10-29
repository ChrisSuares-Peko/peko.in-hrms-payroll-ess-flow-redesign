import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

type AuthGuardProps = {
    children: React.ReactNode;
};

export default function PayrollAuthGuard({ children }: AuthGuardProps) {
    const navigate = useNavigate();

    const { payrollSettings, leaveandAttendance } = useAppSelector(
        state => state.reducer.payrollAuth
    );

    const [checked, setChecked] = useState(false);

    const isAuthenticated = payrollSettings && leaveandAttendance;

    const check = useCallback(() => {
        if (!isAuthenticated) {
            const href = paths.dashboard.payroll;
            navigate(href, { replace: true });
        } else {
            setChecked(true);
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        check();
    }, [check]);

    if (!checked) {
        return null;
    }

    return <>{children}</>;
}
