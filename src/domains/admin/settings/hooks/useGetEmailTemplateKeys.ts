import { useCallback, useEffect, useMemo, useState } from 'react';

import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createEmailTemplateKey,
    getEmailTemplateKeyList,
    setEmailTemplateKeyActive,
} from '../api/emailTemplateKeys';
import {
    CreateEmailTemplateKeyPayload,
    EmailTemplateKey,
    EmailTemplateKeyListParams,
} from '../types/emailTemplateKey';

// See useGetEmailTemplateServices — matches the default page size everywhere else.
// A caller that needs every key (a dropdown, or the Variables tab's flattened view)
// passes its own large itemsPerPage explicitly.
const DEFAULT_ITEMS_PER_PAGE = 10;

export default function useGetEmailTemplateKeys(filters: EmailTemplateKeyListParams) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [keys, setKeys] = useState<EmailTemplateKey[]>([]);
    const [count, setCount] = useState(0);
    const dispatch = useDispatch();

    const { search, service, isActive, page = 1, itemsPerPage = DEFAULT_ITEMS_PER_PAGE } = filters;

    const fetchKeys = useCallback(async () => {
        const response = await getEmailTemplateKeyList({
            userId: id,
            userType: role,
            search: search || undefined,
            service: service || undefined,
            isActive,
            page,
            itemsPerPage,
        });
        if (response) {
            setKeys(response.rows);
            setCount(response.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, search, service, isActive, page, itemsPerPage]);

    const debouncedFetchKeys = useMemo(() => debounce(fetchKeys, 400), [fetchKeys]);

    const createKey = useCallback(
        async (payload: CreateEmailTemplateKeyPayload) => {
            const response = await createEmailTemplateKey({
                userId: id,
                userType: role,
                ...payload,
            });
            if (response) {
                dispatch(
                    showToast({
                        description: 'Email template key created successfully.',
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
            return Boolean(response);
        },
        [dispatch, id, role]
    );

    const setKeyActiveStatus = useCallback(
        async (keyId: number, active: boolean) => {
            const response = await setEmailTemplateKeyActive({
                userId: id,
                userType: role,
                id: keyId,
                isActive: active,
            });
            if (response) {
                dispatch(
                    showToast({
                        description: active
                            ? 'Email template key activated successfully.'
                            : 'Email template key deactivated successfully.',
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
        debouncedFetchKeys();
        return () => {
            debouncedFetchKeys.cancel();
        };
    }, [debouncedFetchKeys, refresh]);

    return { keys, isLoading, count, setRefresh, createKey, setKeyActiveStatus };
}
