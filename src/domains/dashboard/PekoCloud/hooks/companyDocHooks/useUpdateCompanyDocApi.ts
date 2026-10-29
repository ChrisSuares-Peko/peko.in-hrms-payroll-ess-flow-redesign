import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateCompanyDoc } from '../../api/companyDoc';

export function useUpdateCompanyDoc(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateCompanyDocs = async (values: any, docId: number) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            docId,
            document: values.document?.documentFormat
                ? {
                      documentBase: values.documentBase,
                      documentFormat: values.documentFormat,
                  }
                : values.document,
            userId: id,
            userType: role,
        };

        const data = await updateCompanyDoc(payload);
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
    };

    return { updateCompanyDocs, submitLoading };
}
