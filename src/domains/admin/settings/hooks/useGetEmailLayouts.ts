import { useCallback, useEffect, useMemo, useState } from 'react';

import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getEmailLayouts, setEmailLayoutActive } from '../api/emailLayouts';
import { EmailLayoutListItem, EmailLayoutListParams } from '../types/emailLayout';

export default function useGetEmailLayouts(filters: EmailLayoutListParams) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<EmailLayoutListItem[]>([]);
    const dispatch = useDispatch();

    // Destructured to primitives — see useGetEmailTemplates.ts for why.
    const { page, itemsPerPage, search, type, status, sort, sortField } = filters;

    const fetchLayoutData = useCallback(async () => {
        const response = await getEmailLayouts({
            userId: id,
            userType: role,
            page,
            itemsPerPage,
            search,
            sort,
            sortField,
            type: type || undefined,
            status: status || undefined,
        });
        if (response) {
            setTableData(response.rows);
            setCount(response.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, page, itemsPerPage, search, type, status, sort, sortField]);

    const debouncedFetchLayoutData = useMemo(
        () => debounce(fetchLayoutData, 400),
        [fetchLayoutData]
    );

    const setLayoutActiveStatus = useCallback(
        async (layoutId: number, isActive: boolean) => {
            const response = await setEmailLayoutActive({
                userId: id,
                userType: role,
                id: layoutId,
                isActive,
            });
            if (response) {
                dispatch(
                    showToast({
                        description: isActive
                            ? 'Email layout activated successfully.'
                            : 'Email layout deactivated successfully.',
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
            return Boolean(response);
        },
        [dispatch, id, role]
    );

    useEffect(() => {
        setIsLoading(true);
        debouncedFetchLayoutData();
        return () => {
            debouncedFetchLayoutData.cancel();
        };
        // `refresh` deliberately included so setLayoutActiveStatus can force
        // an immediate re-fetch after mutating a row.
    }, [debouncedFetchLayoutData, refresh]);

    return { tableData, isLoading, setRefresh, count, setLayoutActiveStatus };
}
