import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getSingleProjectData } from '../api/index';
import { Project, singleViewResponse } from '../types/dashboard';

export default function useGetProjectDetails(projectId: string | undefined) {
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [projectData, setProjectData] = useState<Project>();
    const getData = useCallback(async () => {
        const data: singleViewResponse | false = await getSingleProjectData({
            userId: id,
            userType: role,
            projectId,
        });
        if (data && data.data) {
            setProjectData(data.data);
        } else navigate(`/${paths.zeroCarbon.index}/${paths.zeroCarbon.projectListing}`);
        setIsLoading(false);
    }, [role, id, projectId, navigate]);

    useEffect(() => {
        getData();
    }, [getData]);

    return { projectData, isLoading };
}
