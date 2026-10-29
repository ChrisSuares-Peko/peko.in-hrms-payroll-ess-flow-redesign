import { useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';

import { CorporateAgreementValues } from '../../../api/admin/kybStatusApi';

const DEBOUNCE_MS = 800;

/** The address proof is a file saved on its own; only the text fields belong in the draft. */
export const agreementValuesOnly = (values: CorporateAgreementValues): CorporateAgreementValues => {
    const draft = { ...values } as CorporateAgreementValues & { addressProof?: unknown };
    delete draft.addressProof;
    return draft;
};

interface AgreementDraftAutoSaveProps {
    onSaveDraft: (values: CorporateAgreementValues) => void;
    ready: boolean;
}

const AgreementDraftAutoSave = ({ onSaveDraft, ready }: AgreementDraftAutoSaveProps) => {
    const { values, dirty } = useFormikContext<CorporateAgreementValues>();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!ready || !dirty) return undefined;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onSaveDraft(agreementValuesOnly(values));
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [values, dirty, ready, onSaveDraft]);

    return null;
};

export default AgreementDraftAutoSave;
