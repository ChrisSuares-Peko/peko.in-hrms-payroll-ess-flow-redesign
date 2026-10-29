import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { importEmailTemplates } from '../api/emailTemplates';
import { CreateEmailTemplatePayload, ImportEmailTemplatesResponse } from '../types/emailTemplate';

export default function useImportEmailTemplates() {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [isImporting, setIsImporting] = useState(false);

    const importFile = useCallback(
        async (
            templates: CreateEmailTemplatePayload[],
            overwrite: boolean
        ): Promise<ImportEmailTemplatesResponse | false> => {
            setIsImporting(true);
            const response = await importEmailTemplates({
                userId,
                userType: role,
                templates,
                overwrite,
            });
            setIsImporting(false);
            return response;
        },
        [userId, role]
    );

    return { importFile, isImporting };
}
