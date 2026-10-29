import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

// import { encryptDataWithKMS } from '@utils/KMSDecryptEncrypt';

import { createFinancialDoc } from '../../api/financialDoc';

export default function useFinancialDocCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleFinancialDocCreation = async (values: any) => {
        setSubmitLoading(true);

        // if (values.documentBase) {

        //     const fileUrl = await encryptDataWithKMS(values.documentBase);
        //     if (fileUrl) {
        //         values.documentBase = fileUrl;
        //     } else {
        //         return null;
        //     }
        // }
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

        const data = await createFinancialDoc(payload);
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

    return { handleFinancialDocCreation, submitLoading };
}
