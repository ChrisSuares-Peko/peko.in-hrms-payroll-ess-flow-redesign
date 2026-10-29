import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getFormById } from '../api/globalBusinessSetup';

export function useFormSchemaById(formId: any) {
    console.log('🧪 useFormSchemaById render. formId =', formId);

    const [form, setForm] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const fetchSchema = useCallback(async () => {
        if (!formId) return;

        setLoading(true);

        try {
            const res = await getFormById({
                formId,
                userId: id,
                userType: role,
            });

            setForm(res ?? null);
        } finally {
            setLoading(false);
        }
    }, [formId, id, role]);
    useEffect(() => {
        fetchSchema();
    }, [fetchSchema]);

    return { form, loading };
}
