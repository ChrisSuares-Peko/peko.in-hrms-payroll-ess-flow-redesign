import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmailTemplate } from '../api/emailTemplates';
import { EmailTemplate } from '../types/emailTemplate';

export default function useGetEmailTemplate(id: number | undefined) {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [template, setTemplate] = useState<EmailTemplate>();
    const [isLoading, setIsLoading] = useState(Boolean(id));
    const [loadFailed, setLoadFailed] = useState(false);

    const fetchTemplate = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setLoadFailed(false);
        const response = await getEmailTemplate({ userId, userType: role, id });
        if (response) {
            setTemplate(response);
        } else {
            setLoadFailed(true);
        }
        setIsLoading(false);
    }, [id, userId, role]);

    useEffect(() => {
        fetchTemplate();
    }, [fetchTemplate]);

    return { template, setTemplate, isLoading, loadFailed, refetch: fetchTemplate };
}
