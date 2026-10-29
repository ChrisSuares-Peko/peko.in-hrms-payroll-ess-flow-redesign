import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createTemplate, updateTemplate } from '../api/invoiceTemplates';
import { newTemplate, Template } from '../types/invoiceTemplates';

export default function useUpdateTemplate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const updateCurrentTemplate = useCallback(
        async (payload: newTemplate) => {
            setIsLoading(true);
            const data: Template | false = await updateTemplate({
                userId: id,
                userType: role,
                ...payload,
            });

            setIsLoading(false);

            if (data) {
                return true;
            }

            return false;
        },
        [id, role]
    );

    const createNewTemplate = useCallback(
        async (payload: newTemplate) => {
            setIsLoading(true);
            const data: Template | false = await createTemplate({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    return { createNewTemplate, updateCurrentTemplate, isLoading };
}
