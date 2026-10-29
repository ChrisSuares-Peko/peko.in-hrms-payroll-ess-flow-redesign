import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createDocument } from '../../api/docAndAssetsApi/index';
import { DocResponse } from '../../types/docAndAssetsTypes';

export default function useDocumentCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<DocResponse | false>();
    const [isLoading,setLoading] = useState(false)
    const dispatch = useAppDispatch();

    const handleDocumentCreation = async (values: any) => {
        setLoading(true)
        const payload = {
            ...values,
            url: values.url
                ? {
                      base64: values.url,
                      format: values.attachmentFormat,
                  }
                : null,
        };
        const response: false | DocResponse = await createDocument({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            dispatch(
                showToast({
                    description: 'Document added succesfully',
                    variant: 'success',
                })
            );
            if (handleCancel) handleCancel();
            setResponseData(response);
        }   
        setLoading(false)
    };
    return { handleDocumentCreation, responseData,isLoading };
}
