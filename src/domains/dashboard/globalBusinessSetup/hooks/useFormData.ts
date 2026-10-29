import { useEffect, useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getForm } from '../api/globalBusinessSetup';

export function useFormSchema(countryData: any) {
    const [form, setForm] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const { role, id } = useAppSelector(state => state.reducer.auth);

    const fetchSchema = useCallback(async () => {
        if (!countryData?.country) {
            setForm(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const res = await getForm({
                country: countryData.country,
                company_type: countryData.type,
                region: countryData.freezone,
                userId: id,
                userType: role,
            });

            setForm(res ?? null);
        } finally {
            setLoading(false);
        }
    }, [countryData?.country, countryData?.type, countryData?.freezone, id, role]);

    useEffect(() => {
        fetchSchema();
    }, [fetchSchema]);

    return {
        form,
        Loading: loading,
    };
}
