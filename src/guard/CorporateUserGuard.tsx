import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { UserRole } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

type CorporateUserGuardProps = {
    children: React.ReactNode;
};

export default function CorporateUserGuard({ children }: CorporateUserGuardProps) {
    const navigate = useNavigate();

    const { role } = useAppSelector(state => state.reducer.auth);

    const [checked, setChecked] = useState(false);

    const check = useCallback(() => {
        // /session-expired is shared across roles — let SYSTEM users render it
        // inside DashboardLayout instead of bouncing them to /system-user/dashboard.
        if (window.location.pathname === paths.auth.sessionExpired) {
            setChecked(true);
            return;
        }
        if (role === UserRole.SYSTEM) {
            const href = paths.systemUser.dashboard;
            navigate(href, { replace: true });
            // An employee has their own shell and every service they hold is mounted inside it, Corporate
            // Cards included. Nothing in this tree is theirs, whatever they are a member of.
        } else if (role === UserRole.EMPLOYEE) {
            navigate(paths.employee.home, { replace: true });
        } else {
            setChecked(true);
        }
    }, [navigate, role]);

    useEffect(() => {
        check();
    }, [check]);

    if (!checked) {
        return null;
    }

    return <>{children}</>;
}
