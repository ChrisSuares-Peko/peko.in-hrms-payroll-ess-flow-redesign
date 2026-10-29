import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@hooks/store';

import { getAllWorkspaces } from '../api/index';
import { WorkSpaceListResponse, WorkspaceDetail } from '../types/index';

export default function useWorkspacesApi(planId: number) {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [workspaces, setWorkpaces] = useState<WorkspaceDetail[]>();
    const [isLoading, setIsLoading] = useState(true);

    const getWorkspaces = useCallback(async () => {
        const resp: WorkSpaceListResponse | false = await getAllWorkspaces({
            userId: id,
            userType: role,
        });
        if (resp) {
            const workspaceUnderThePlan = resp.data.filter(item => item.planId === planId);
            setWorkpaces(workspaceUnderThePlan);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [role, id, planId]);

    useEffect(() => {
        getWorkspaces();
    }, [getWorkspaces]);

    return { workspaces, isLoading };
}
