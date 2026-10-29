import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    deleteLegalTemplate,
    getLegalTemplatesData,
    updateLegalTemplatesStatus,
} from '../api/legalTemplates';
import {
    ApiResponseLegalTemplates,
    LegalTemplatesBody,
    getLegalTemplates,
    updateLegalTemplatesStatusPayload,
} from '../types/legalTemplates';

const useLegalTemplates = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: getLegalTemplates) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refresh, setRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<LegalTemplatesBody[]>();

    const handleRefresh = () => setRefresh(prev => !prev);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseLegalTemplates | false = await getLegalTemplatesData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort, sortField]);

    const updateActiveStatus = useCallback(
        async ({ templateId, status }: updateLegalTemplatesStatusPayload) => {
            setIsLoading(true);
            const data = await updateLegalTemplatesStatus({
                userId: id,
                userType: role,
                templateId,
                status,
            });
            setIsLoading(false);
            if (data) handleRefresh();
        },
        [id, role]
    );

    const deleteTemplate = useCallback(
        async (templateId: string | number) => {
            setIsLoading(true);
            const data = await deleteLegalTemplate({ userId: id, userType: role, templateId });
            setIsLoading(false);
            if (data) {
                dispatch(
                    showToast({
                        description: (data as any).message || 'Template deleted successfully',
                        variant: 'success',
                    })
                );
                handleRefresh();
            } else {
                dispatch(showToast({ description: 'Failed to delete template', variant: 'error' }));
            }
            return !!data;
        },
        [id, role, dispatch]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, updateActiveStatus, deleteTemplate, handleRefresh };
};

export default useLegalTemplates;
