import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getDashboardData } from '../api/index';
import { Project, counter, dashboardResponse } from '../types/dashboard';

const useGetDashboardData = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [projectData, setProjectData] = useState<Project[]>();
    const [counterData, setCounterData] = useState<counter>();
    const getData = useCallback(async () => {
        const data: dashboardResponse | false = await getDashboardData({
            userId: id,
            userType: role,
        });
        if (data) {
            setProjectData(data.projects);
            setCounterData({
                co2FootPrint: parseFloat(data?.counters?.co2FootPrint).toFixed(2) ?? 0,
                communityOffset: data?.counters?.communityOffset ?? 0,
                projectsInvested: data?.counters?.projectsInvested ?? 0,
                totalProjects: data?.counters?.totalProjects ?? 0,
                userOffset: data?.counters?.userOffset?.toFixed(2) ?? 0,
            });
        }
        setIsLoading(false);
    }, [role, id]);

    useEffect(() => {
        getData();
    }, [getData]);

    return { projectData, counterData, isLoading };
};

export default useGetDashboardData;
