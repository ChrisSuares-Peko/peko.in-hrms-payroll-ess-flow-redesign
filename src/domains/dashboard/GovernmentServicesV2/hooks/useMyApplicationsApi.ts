import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { ApplicationListItem, getAllGovernmentServiceApplicationsApi } from '../apis';

export default function useMyApplicationsApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [applications, setApplications] = useState<ApplicationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getAllGovernmentServiceApplicationsApi(id, role).then((data) => {
            setApplications(data);
            setIsLoading(false);
        });
    }, [id, role]);

    return { applications, isLoading };
}
