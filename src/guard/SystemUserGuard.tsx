import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { UserRole } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

type SystemUserGuardProps = {
    children: React.ReactNode;
};

export default function SystemUserGuard({ children }: SystemUserGuardProps) {
    const navigate = useNavigate();

    const { role } = useAppSelector(state => state.reducer.auth);

    const [checked, setChecked] = useState(false);

    const check = useCallback(() => {
        if (role === UserRole.CORPORATE) {
            const href = paths.dashboard.home;
            navigate(href, { replace: true });
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
