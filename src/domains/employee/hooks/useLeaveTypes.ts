import { useEffect, useState } from 'react';

import { useEssAuth } from '@src/prototype/essSession';

import { getLeaveBalance } from '../api/leaves';

export const useLeaveTypes = () => {
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { role, id } = useEssAuth();
    const [leaveTypes, setLeaveTypes] = useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaveBalance({ userType: role, userId: id })
            .then(balance => setLeaveTypes(balance.map(b => ({ label: b.label, value: b.value }))))
            .finally(() => setLoading(false));
    }, [role, id]);

    return { leaveTypes, loading };
};
