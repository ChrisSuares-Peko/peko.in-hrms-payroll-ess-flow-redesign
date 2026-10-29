import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getForm } from '../api/globalBusinessSetup';
import { SubmittedApplication } from '../types/forms';

export type FormOutdatedStatus = 'none' | 'outdated' | 'unavailable';

/**
 * Detects form-schema drift on a saved application: compares the application's
 * saved form id against the CURRENT latest form for the same
 * country/type/freezone. Alert-only — never blocks anything (mirrors the
 * vendor's useFormOutdated). Errors resolve to 'none' (fail silent).
 */
export function useFormOutdated(application?: SubmittedApplication | null): FormOutdatedStatus {
    const [status, setStatus] = useState<FormOutdatedStatus>('none');
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const savedFormId = application?.form_data?.form;
    const country = application?.country?._id;
    const type = application?.type;
    const freezone = application?.freezone;

    useEffect(() => {
        let cancelled = false;

        if (!savedFormId || !country || !type) {
            setStatus('none');
            return undefined;
        }

        (async () => {
            try {
                const latest = await getForm({
                    country,
                    company_type: type,
                    region: freezone || '',
                    userId: id,
                    userType: role,
                });
                if (cancelled) return;
                if (!latest?._id) {
                    setStatus('unavailable');
                } else {
                    setStatus(String(latest._id) === String(savedFormId) ? 'none' : 'outdated');
                }
            } catch {
                if (!cancelled) setStatus('none');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [savedFormId, country, type, freezone, id, role]);

    return status;
}
