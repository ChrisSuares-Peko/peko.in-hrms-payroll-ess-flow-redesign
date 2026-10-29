import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getLeaveBalance } from '../api/leaves';

export const useLeaveTypes = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [leaveTypes, setLeaveTypes] = useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaveBalance({ userType: role, userId: id })
            .then(balance => setLeaveTypes(balance.map(b => ({ label: b.label, value: b.value }))))
            .finally(() => setLoading(false));
    }, [role, id]);

    return { leaveTypes, loading };
};
