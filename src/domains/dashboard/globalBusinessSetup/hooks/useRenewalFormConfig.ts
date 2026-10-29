import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getRenewalFormConfig } from '../api/globalBusinessSetup';

export interface RenewalFormField {
    name: string;
    label: string;
    placeholder?: string;
    description?: string;
    type: 'text' | 'email' | 'number' | 'date' | 'file';
    validation?: { required?: boolean };
}

export interface RenewalFormSection {
    title: string;
    fields: RenewalFormField[];
}

export interface RenewalFormConfig {
    renewal_type: string;
    sections: RenewalFormSection[];
}

const useRenewalFormConfig = (jurisdiction: {
    country?: string;
    company_type?: string;
    freezone?: string;
    enabled?: boolean;
}) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { country, company_type, freezone, enabled = true } = jurisdiction;
    const [configs, setConfigs] = useState<RenewalFormConfig[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetched, setIsFetched] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setConfigs([]);
            setIsFetched(false);
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        getRenewalFormConfig({
            userId: id,
            userType: role,
            country,
            company_type,
            freezone,
        })
            .then(res => {
                if (cancelled) return;
                setConfigs(Array.isArray(res) ? res : []);
                setIsFetched(true);
            })
            .catch(() => {
                if (!cancelled) {
                    setConfigs([]);
                    setIsFetched(true);
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        // eslint-disable-next-line consistent-return
        return () => {
            cancelled = true;
        };
    }, [enabled, country, company_type, freezone, id, role]);

    return { configs, isLoading, isFetched };
};

export default useRenewalFormConfig;
