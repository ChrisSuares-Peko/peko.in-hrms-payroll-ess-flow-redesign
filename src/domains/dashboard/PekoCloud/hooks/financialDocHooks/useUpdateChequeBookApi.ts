import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateChequeBook } from '../../api/financialDoc';

export function useUpdateChequeBook(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateCheqBookDetails = async (values: any, chequeBookId: number) => {
        setSubmitLoading(true);

        const payload = {
            ...values,
            chequeBookId,
            document: values.document?.documentFormat
                ? {
                      documentBase: values.documentBase,
                      documentFormat: values.documentFormat,
                  }
                : values.document,
            userId: id,
            userType: role,
        };

        const data = await updateChequeBook(payload);
        if (data && data.data) {
            dispatch(
                showToast({
                    description: data.message,
                    variant: 'success',
                })
            );
            if (handleCancel) {
                handleCancel();
            }
        }
        setSubmitLoading(false);
    };

    return { updateCheqBookDetails, submitLoading };
}
