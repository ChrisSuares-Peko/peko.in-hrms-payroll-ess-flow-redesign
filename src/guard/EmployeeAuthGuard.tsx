import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { UserRole } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

type EmployeeAuthGuardProps = {
    children: React.ReactNode;
};

export default function EmployeeAuthGuard({ children }: EmployeeAuthGuardProps) {
    const navigate = useNavigate();
    const { isAuthenticated, role } = useAppSelector(state => state.reducer.auth);
    const [checked, setChecked] = useState(false);

    const check = useCallback(() => {
        if (!isAuthenticated || role !== UserRole.EMPLOYEE) {
            navigate(paths.auth.jwt.login, { replace: true });
        } else {
            setChecked(true);
        }
    }, [isAuthenticated, role, navigate]);

    useEffect(() => {
        check();
    }, [check]);

    if (!checked) {
        return null;
    }

    return <>{children}</>;
}
