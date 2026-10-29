import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { GovernmentServiceApplicationV2Item, getAllGovernmentServiceApplicationsV2Api } from '../apis';

// Backs the "My Applications" list page — Gov Services V2 applications, not the old fixed-catalog ones useMyApplicationsApi covers.
export default function useApplicationsListApi() {
    const { role, id: userId } = useAppSelector((state) => state.reducer.auth);
    const [applications, setApplications] = useState<GovernmentServiceApplicationV2Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getAllGovernmentServiceApplicationsV2Api(userId, role).then((data) => {
            setApplications(data.applications);
            setIsLoading(false);
        });
    }, [userId, role]);

    return { applications, isLoading };
}
