/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';

import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteTemplate, getTemplate, updateCurrentStatus } from '../api/invoiceTemplates';
import { activeResponse, Data, getData, Template, updateStatus } from '../types/invoiceTemplates';

export default function useGetTemplate(Payload: getData) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Template[]>();
    const dispatch = useDispatch();
    const [previousSearch, setPreviousSearch] = useState(Payload.searchText);

    const fetchTemplateData = useCallback(async () => {
        setIsLoading(true);
        const response: Data | false = await getTemplate({
            userId: id,
            userType: role,
            ...Payload,
        });
        if (response) {
            setTableData(response.data);
            setCount(response.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, Payload]);

    const debouncedFetchTemplateData = useCallback(
        debounce(() => {
            fetchTemplateData();
            setPreviousSearch(Payload.searchText);
        }, 500),
        [fetchTemplateData, Payload.searchText]
    );

    const deleteInvoiceTemplate = useCallback(
        async (templateId: number) => {
            setIsLoading(true);
            const data: activeResponse | false = await deleteTemplate({
                userId: id,
                userType: role,
                id: templateId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: `Template deleted successfully `,
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
        },
        [dispatch, id, role]
    );

    const updateActiveStatus = useCallback(
        async ({ templateId, status }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await updateCurrentStatus({
                userId: id,
                userType: role,
                templateId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
        },
        [id, role]
    );

    useEffect(() => {
        if (previousSearch !== Payload.searchText) {
            debouncedFetchTemplateData();
        } else {
            fetchTemplateData();
        }
        return () => {
            debouncedFetchTemplateData.cancel();
        };
    }, [fetchTemplateData, debouncedFetchTemplateData, Payload, refresh]);

    return { tableData, isLoading, setRefresh, count, deleteInvoiceTemplate, updateActiveStatus };
}
