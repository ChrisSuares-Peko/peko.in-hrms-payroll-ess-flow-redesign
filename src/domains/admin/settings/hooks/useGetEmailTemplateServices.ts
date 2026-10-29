import { useCallback, useEffect, useMemo, useState } from 'react';

import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createEmailTemplateService,
    getEmailTemplateServiceList,
    setEmailTemplateServiceActive,
} from '../api/emailTemplateServices';
import {
    CreateEmailTemplateServicePayload,
    EmailTemplateService,
    EmailTemplateServiceListParams,
} from '../types/emailTemplateService';

// Matches the page size used everywhere else (see useGetEmailTemplates). A caller
// that needs every service instead of one page of them — a dropdown, e.g. — passes
// its own large itemsPerPage explicitly rather than relying on a hidden default here.
const DEFAULT_ITEMS_PER_PAGE = 10;

export default function useGetEmailTemplateServices(filters: EmailTemplateServiceListParams) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [services, setServices] = useState<EmailTemplateService[]>([]);
    const [count, setCount] = useState(0);
    const dispatch = useDispatch();

    const { search, isActive, page = 1, itemsPerPage = DEFAULT_ITEMS_PER_PAGE } = filters;

    const fetchServices = useCallback(async () => {
        const response = await getEmailTemplateServiceList({
            userId: id,
            userType: role,
            search: search || undefined,
            isActive,
            page,
            itemsPerPage,
        });
        if (response) {
            setServices(response.rows);
            setCount(response.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, search, isActive, page, itemsPerPage]);

    const debouncedFetchServices = useMemo(() => debounce(fetchServices, 400), [fetchServices]);

    const createService = useCallback(
        async (payload: CreateEmailTemplateServicePayload) => {
            const response = await createEmailTemplateService({
                userId: id,
                userType: role,
                ...payload,
            });
            if (response) {
                dispatch(
                    showToast({
                        description: 'Email template service created successfully.',
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
            return Boolean(response);
        },
        [dispatch, id, role]
    );

    const setServiceActiveStatus = useCallback(
        async (serviceId: number, active: boolean) => {
            const response = await setEmailTemplateServiceActive({
                userId: id,
                userType: role,
                id: serviceId,
                isActive: active,
            });
            if (response) {
                dispatch(
                    showToast({
                        description: active
                            ? 'Email template service activated successfully.'
                            : 'Email template service deactivated successfully.',
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
        debouncedFetchServices();
        return () => {
            debouncedFetchServices.cancel();
        };
    }, [debouncedFetchServices, refresh]);

    return { services, isLoading, count, setRefresh, createService, setServiceActiveStatus };
}
