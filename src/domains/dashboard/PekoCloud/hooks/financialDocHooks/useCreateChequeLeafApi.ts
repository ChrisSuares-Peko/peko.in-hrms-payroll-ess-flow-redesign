import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createChequeLeaf } from '../../api/financialDoc';

export default function useChequeLeafCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleChequeLeafCreation = async (values: any) => {
        setSubmitLoading(true);

        const payload = {
            ...values,
            cloudChequeBookId: values?.cloudChequeBookId || null,
            document: values.document
                ? {
                      documentBase: values.documentBase,
                      documentFormat: values.documentFormat,
                  }
                : null,
            userId: id,
            userType: role,
        };

        const data = await createChequeLeaf(payload);
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

        return data;
    };

    return { handleChequeLeafCreation, submitLoading };
}
