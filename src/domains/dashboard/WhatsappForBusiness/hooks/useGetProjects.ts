import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllProjects } from '../api/index';
import { Project } from '../types/types';

export default function GetAllProjects(refresh?: boolean, Page?: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [projectDetails, setprojectDetails] = useState<Project[]>();
    const [isLoading, setIsLoading] = useState(true);

    const getprojectInfo = useCallback(async () => {
        setIsLoading(true); // Set loading state to true when fetching starts
        const data: Project[] | false = await getAllProjects({
            userId: id,
            userType: role,
        });
        if (data) {
            setprojectDetails(data);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getprojectInfo();
    }, [getprojectInfo, refresh]);

    return { projectData: projectDetails, isLoading };
}
