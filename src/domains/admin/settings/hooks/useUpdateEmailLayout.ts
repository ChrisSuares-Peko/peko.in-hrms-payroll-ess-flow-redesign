import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createEmailLayout, publishEmailLayout, updateEmailLayoutDraft } from '../api/emailLayouts';
import {
    CreateEmailLayoutPayload,
    EmailLayout,
    UpdateEmailLayoutDraftPayload,
} from '../types/emailLayout';

export default function useUpdateEmailLayout() {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const createLayout = useCallback(
        async (payload: CreateEmailLayoutPayload): Promise<EmailLayout | false> => {
            setIsSaving(true);
            const response = await createEmailLayout({ userId, userType: role, ...payload });
            setIsSaving(false);
            return response;
        },
        [userId, role]
    );

    const saveDraft = useCallback(
        async (
            id: number,
            payload: UpdateEmailLayoutDraftPayload
        ): Promise<EmailLayout | false> => {
            setIsSaving(true);
            const response = await updateEmailLayoutDraft({
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
        async (id: number): Promise<EmailLayout | false> => {
            setIsPublishing(true);
            const response = await publishEmailLayout({ userId, userType: role, id });
            setIsPublishing(false);
            return response;
        },
        [userId, role]
    );

    return { createLayout, saveDraft, publish, isSaving, isPublishing };
}
