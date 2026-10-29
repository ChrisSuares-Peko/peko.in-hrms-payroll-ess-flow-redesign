import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateDocument } from '../../api/docAndAssetsApi/index';
import { DocResponse } from '../../types/docAndAssetsTypes';

export default function useDocumentUpdate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<DocResponse | false>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleDocumentUpdate = async (
        documentId: string | undefined,
        employeeId: string | undefined,
        values: any
    ) => {
        setIsLoading(true);
        const payload = {
            ...values,
            url: values.attachmentFormat
                ? {
                      base64: values.url,
                      format: values.attachmentFormat,
                  }
                : values.url,
        };
        const response = await updateDocument({
            ...payload,
            userId: id,
            userType: role,
            documentId,
            employeeId,
        });
        if (response) {
            dispatch(
                showToast({
                    description: 'Document updated succesfully',
                    variant: 'success',
                })
            );
            if (handleCancel) handleCancel();
            setResponseData(response);
        }
        setIsLoading(false);
    };
    return { handleDocumentUpdate, responseData, isLoading };
}
