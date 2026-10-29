import { useCallback, useEffect, useState } from 'react';

import { commonSelectType } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createWorkspace, getWorkspacePlans, putUpdateWorkspace } from '../api/workpace';
import { WorkspaceBody, WorkspaceWithoutID } from '../types/workspace';

export default function useWorkspaceUpdate() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<WorkspaceBody | {}>();
    const [plans, setPlans] = useState<commonSelectType[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleWorkspaceCreation = async (payload: WorkspaceWithoutID) => {
        setIsLoading(true);
        const response: false | WorkspaceBody = await createWorkspace({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            setResponseData(response);
            dispatch(
                showToast({ description: 'Workspace added successfully', variant: 'success' })
            );
        }
        setIsLoading(false);
        return response;
    };

    const updateWorkspaceDetails = useCallback(
        async (vendorUpdatedData: WorkspaceBody) => {
            setIsLoading(true);
            const response: {} | false = await putUpdateWorkspace({
                userId: id,
                userType: role,
                ...vendorUpdatedData,
            });
            if (response) {
                setResponseData(response);
                dispatch(
                    showToast({ description: 'Workspace updated successfully', variant: 'success' })
                );
            }
            setIsLoading(false);
            return response;
        },
        [dispatch, id, role]
    );

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getWorkspacePlans({
            userId: id,
            userType: role,
        });
        if (data) {
            setPlans(
                data?.map((item: any) => ({
                    oName: item.name,
                    oValue: item.id,
                }))
            );
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getData();
    }, [getData]);

    return { handleWorkspaceCreation, responseData, isLoading, updateWorkspaceDetails, plans };
}
