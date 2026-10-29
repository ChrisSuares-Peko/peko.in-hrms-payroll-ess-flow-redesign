import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOpenIssuesCountApi } from '../api/issues';

/** The "Issues (N)" badge on the shared OrdersTabBar — used by every tab that isn't Issues itself. */
const useOpenIssuesCount = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [openIssuesCount, setOpenIssuesCount] = useState<number>(0);

    useEffect(() => {
        (async () => {
            const data = await getOpenIssuesCountApi({ userId: id, userType: role });
            if (data) setOpenIssuesCount(data.count);
        })();
    }, [id, role]);

    return openIssuesCount;
};

export default useOpenIssuesCount;
