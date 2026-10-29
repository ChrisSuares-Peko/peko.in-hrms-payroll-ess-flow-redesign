import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createLegalTemplate, updateLegalTemplate } from '../api/legalTemplates';
import { LegalTemplatesFormValues, LegalTemplatesWithoutID } from '../types/legalTemplates';

const useLegalTemplatesUpdate = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreation = async (payload: LegalTemplatesWithoutID) => {
        setIsLoading(true);
        const { documentFile, ...rest } = payload as any;
        const response = await createLegalTemplate({
            bodyPayload: { ...rest, documentBase: documentFile },
            userDetails: { userId: id, userType: role },
        });
        setIsLoading(false);
        if (response) {
            dispatch(
                showToast({
                    description: (response as any).message || 'Template created successfully',
                    variant: 'success',
                })
            );
        } else {
            dispatch(showToast({ description: 'Failed to create template', variant: 'error' }));
        }
        return response;
    };

    const updateDetails = async (payload: LegalTemplatesFormValues) => {
        setIsLoading(true);
        const { documentFile, ...rest } = payload as any;
        const response = await updateLegalTemplate({
            userId: id,
            userType: role,
            ...rest,
            documentBase: documentFile,
        });
        setIsLoading(false);
        if (response) {
            dispatch(
                showToast({
                    description: (response as any).message || 'Template updated successfully',
                    variant: 'success',
                })
            );
        } else {
            dispatch(showToast({ description: 'Failed to update template', variant: 'error' }));
        }
        return response;
    };

    return { isLoading, handleCreation, updateDetails };
};

export default useLegalTemplatesUpdate;
