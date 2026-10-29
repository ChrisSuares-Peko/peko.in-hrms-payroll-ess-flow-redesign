import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllProjectData } from '../api/index';
import { Project, projectListingResponse } from '../types/dashboard';

export default function useGetAllProjects(searchQuery: string, page: number, itemsPerPage: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [projectData, setProjectData] = useState<Project[]>();
    const [count, setCount] = useState<number>();
    const [totalPage, setTotalPage] = useState<number>();
    const getData = useCallback(async () => {
        const data: projectListingResponse | false = await getAllProjectData({
            userId: id,
            userType: role,
            searchQuery,
            page,
            itemsPerPage,
        });
        if (data && data.data) {
            setProjectData(data.data);
            setCount(data.count);
            setTotalPage(data.totalPages);
        }
        setIsLoading(false);
    }, [role, id, searchQuery, page, itemsPerPage]);

    useEffect(() => {
        getData();
    }, [getData]);

    return { data: projectData, count, totalPage, isLoading };
}
