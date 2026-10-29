import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createCompanyDoc } from '../../api/companyDoc';

export default function useCompanyDocCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleCompanyDocCreation = async (values: any) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            document: values.document
                ? {
                      documentBase: values.documentBase,
                      documentFormat: values.documentFormat,
                  }
                : null,
            userId: id,
            userType: role,
        };

        const data = await createCompanyDoc(payload);
        if (data && data.data) {
            dispatch(
                showToast({
                    description: 'Document added successfully',
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

    return { handleCompanyDocCreation, submitLoading };
}
