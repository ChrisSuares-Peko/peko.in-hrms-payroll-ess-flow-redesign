import { useCallback, useEffect, useMemo, useState } from 'react';

import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getEmailTemplates, setEmailTemplateActive } from '../api/emailTemplates';
import { EmailTemplateListItem, EmailTemplateListParams } from '../types/emailTemplate';

export default function useGetEmailTemplates(filters: EmailTemplateListParams) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<EmailTemplateListItem[]>([]);
    const dispatch = useDispatch();

    // Destructured to primitives so fetchTemplateData only gets a new identity
    // when a filter value actually changes — not on every render of the caller,
    // which passes a fresh `filters` object literal each time. Depending on the
    // whole object by reference here previously caused an infinite fetch loop:
    // each successful fetch updates state → caller re-renders → new `filters`
    // reference → new fetchTemplateData → effect re-fires → fetch again.
    const { page, itemsPerPage, searchText, service, partnerId, status, sort, sortField } = filters;

    const fetchTemplateData = useCallback(async () => {
        const response = await getEmailTemplates({
            userId: id,
            userType: role,
            page,
            itemsPerPage,
            searchText,
            sort,
            sortField,
            // Omit empty-string filters rather than sending e.g. `status=` —
            // the API treats an absent param as "no filter", same intent.
            service: service || undefined,
            // `null` is a deliberate filter value here (the "Default"/no-partner
            // option) and must survive as-is — only an absent filter (`undefined`)
            // means "don't filter by partner at all".
            partnerId,
            status: status || undefined,
        });
        if (response) {
            setTableData(response.rows);
            setCount(response.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, page, itemsPerPage, searchText, service, partnerId, status, sort, sortField]);

    // Every filter change (search text, service text, status/pagination) is
    // debounced uniformly — this keeps typing in the free-text Service filter
    // from firing a request per keystroke without needing a separate
    // instant-vs-debounced code path per field.
    const debouncedFetchTemplateData = useMemo(
        () => debounce(fetchTemplateData, 400),
        [fetchTemplateData]
    );

    const setTemplateActiveStatus = useCallback(
        async (templateId: number, isActive: boolean) => {
            const response = await setEmailTemplateActive({
                userId: id,
                userType: role,
                id: templateId,
                isActive,
            });
            if (response) {
                dispatch(
                    showToast({
                        description: isActive
                            ? 'Email template activated successfully.'
                            : 'Email template deactivated successfully.',
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
        debouncedFetchTemplateData();
        return () => {
            debouncedFetchTemplateData.cancel();
        };
        // `refresh` deliberately included so setTemplateActiveStatus can force
        // an immediate re-fetch after mutating a row.
    }, [debouncedFetchTemplateData, refresh]);

    return { tableData, isLoading, setRefresh, count, setTemplateActiveStatus };
}
