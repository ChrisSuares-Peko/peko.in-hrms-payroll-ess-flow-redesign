import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    fetchIncorporationConfig,
    saveIncorporationConfig,
    IncorporationConfig,
    ServiceConfig,
} from '../api/companyIncorporation';

export interface ConfigFormValues {
    incorporationFee: number;
    services: ServiceConfig[];
}

export const useCompanyIncorporationConfig = () => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [config, setConfig] = useState<IncorporationConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchIncorporationConfig({ userId: id, userType: role });
        if (data) setConfig(data as IncorporationConfig);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleSave = async (values: ConfigFormValues) => {
        setIsSaving(true);
        const result = await saveIncorporationConfig({ userId: id, userType: role, ...values });
        if (result) {
            setConfig(result as IncorporationConfig);
            dispatch(
                showToast({ description: 'Configuration saved successfully', variant: 'success' })
            );
        } else {
            dispatch(showToast({ description: 'Failed to save configuration', variant: 'error' }));
        }
        setIsSaving(false);
    };

    return { config, isLoading, isSaving, handleSave };
};
