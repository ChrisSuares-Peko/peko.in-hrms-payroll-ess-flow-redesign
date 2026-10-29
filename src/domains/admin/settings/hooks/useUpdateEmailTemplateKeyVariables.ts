import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateEmailTemplateKeyVariables } from '../api/emailTemplateKeys';
import { EmailTemplateKeyVariables } from '../types/emailTemplateKey';

export default function useUpdateEmailTemplateKeyVariables() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isSaving, setIsSaving] = useState(false);
    const dispatch = useDispatch();

    const updateVariables = useCallback(
        async (service: string, key: string, variables: EmailTemplateKeyVariables) => {
            setIsSaving(true);
            const response = await updateEmailTemplateKeyVariables({
                userId: id,
                userType: role,
                service,
                key,
                variables,
            });
            setIsSaving(false);
            if (response) {
                dispatch(
                    showToast({
                        description: 'Variables updated successfully.',
                        variant: 'success',
                    })
                );
            }
            return Boolean(response);
        },
        [dispatch, id, role]
    );

    return { updateVariables, isSaving };
}
