import React, { useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';

import { setPurchaseRequestDraft } from '../../../slices/purchaseRequestDraftSlice';

const AutoSaveDraft: React.FC = () => {
    const { values } = useFormikContext<any>();
    const dispatch = useAppDispatch();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            dispatch(setPurchaseRequestDraft(values));
        }, 800);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [values, dispatch]);

    return null;
};

export default AutoSaveDraft;
