import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateChequeLeaf } from '../../api/financialDoc';

export function useUpdateChequeLeaf(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateChequeLeafDetails = async (values: any, chequeLeafId: number) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            chequeLeafId,
            cloudChequeBookId: values?.cloudChequeBookId || null,
            document: values.document?.documentFormat
                ? {
                      documentBase: values.documentBase,
                      documentFormat: values.documentFormat,
                  }
                : values.document,
            userId: id,
            userType: role,
        };

        const data = await updateChequeLeaf(payload);
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

    return { updateChequeLeafDetails, submitLoading };
}
