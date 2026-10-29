import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getEmailTemplateKeysForService,
    getEmailTemplateKeyVariables,
    getEmailTemplateServices,
} from '../api/emailTemplates';

export function useEmailTemplateServices() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [services, setServices] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getEmailTemplateServices({ userId: id, userType: role }).then(response => {
            if (!isMounted) return;
            if (response) setServices(response);
            setLoading(false);
        });
        return () => {
            isMounted = false;
        };
    }, [id, role]);

    return { services, loading };
}

export function useEmailTemplateKeys(service: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [keys, setKeys] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchKeys = useCallback(async () => {
        if (!service) {
            setKeys([]);
            return;
        }
        setLoading(true);
        const response = await getEmailTemplateKeysForService({
            userId: id,
            userType: role,
            service,
        });
        if (response) setKeys(response);
        setLoading(false);
    }, [id, role, service]);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    return { keys, loading };
}

export function useEmailTemplateKeyVariables(service: string | undefined, key: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [variables, setVariables] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchVariables = useCallback(async () => {
        if (!service || !key) {
            setVariables([]);
            return;
        }
        setLoading(true);
        const response = await getEmailTemplateKeyVariables({
            userId: id,
            userType: role,
            service,
            key,
        });
        setVariables(response || []);
        setLoading(false);
    }, [id, role, service, key]);

    useEffect(() => {
        fetchVariables();
    }, [fetchVariables]);

    return { variables, loading };
}
