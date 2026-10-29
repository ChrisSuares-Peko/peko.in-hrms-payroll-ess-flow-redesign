import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    createEmailTemplate,
    publishEmailTemplate,
    updateEmailTemplateDraft,
} from '../api/emailTemplates';
import {
    CreateEmailTemplatePayload,
    EmailTemplate,
    UpdateEmailTemplateDraftPayload,
} from '../types/emailTemplate';

export default function useUpdateEmailTemplate() {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const createTemplate = useCallback(
        async (payload: CreateEmailTemplatePayload): Promise<EmailTemplate | false> => {
            setIsSaving(true);
            const response = await createEmailTemplate({ userId, userType: role, ...payload });
            setIsSaving(false);
            return response;
        },
        [userId, role]
    );

    const saveDraft = useCallback(
        async (
            id: number,
            payload: UpdateEmailTemplateDraftPayload
        ): Promise<EmailTemplate | false> => {
            setIsSaving(true);
            const response = await updateEmailTemplateDraft({
                userId,
                userType: role,
                id,
                ...payload,
            });
            setIsSaving(false);
            return response;
        },
        [userId, role]
    );

    const publish = useCallback(
        async (id: number): Promise<EmailTemplate | false> => {
            setIsPublishing(true);
            const response = await publishEmailTemplate({ userId, userType: role, id });
            setIsPublishing(false);
            return response;
        },
        [userId, role]
    );

    return { createTemplate, saveDraft, publish, isSaving, isPublishing };
}
