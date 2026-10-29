import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createProjectAPI } from '../api/index';

export function useCreateProjectApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const createProject = async (projectName: string) => {
        setIsLoading(true);

        const response = await createProjectAPI({
            userId: id,
            userType: role,
            projectName,
        });

        if (response) {
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    };
    return { createProject, isLoading };
}
