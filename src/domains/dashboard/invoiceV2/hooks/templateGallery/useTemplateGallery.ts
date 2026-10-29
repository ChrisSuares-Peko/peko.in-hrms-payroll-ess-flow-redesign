import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getSettingsApi } from '../../api/settings';
import { fetchTemplateSettings, InvoiceTemplate, saveTemplateSettings } from '../../api/template';

export const useTemplateGallery = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector((s: any) => s.reducer.auth);

    const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const [templateResult, settingsResult] = await Promise.all([
                fetchTemplateSettings({ userId: id, userType: role }),
                getSettingsApi({ userId: id, userType: role }),
            ]);

            if (templateResult) {
                const savedId =
                    settingsResult && settingsResult.data?.templateSettings?.templateId
                        ? settingsResult.data.templateSettings.templateId
                        : null;

                // Sort: selected template first, rest in original order
                const sorted = savedId
                    ? [
                          ...templateResult.filter(t => t.id === savedId),
                          ...templateResult.filter(t => t.id !== savedId),
                      ]
                    : templateResult;

                setTemplates(sorted);
                setSelectedId(savedId);
            }
            setIsLoading(false);
        };
        load();
    }, [id, role]);

    const handleUseTemplate = useCallback(async () => {
        if (!selectedId) {
            dispatch(showToast({ description: 'Please select a template first', variant: 'warning' }));
            return;
        }
        setIsSaving(true);
        const result = await saveTemplateSettings({ userId: id, userType: role, templateId: selectedId });
        if (result) {
            dispatch(showToast({ description: 'Template saved successfully', variant: 'success' }));
        } else {
            dispatch(showToast({ description: 'Failed to save template', variant: 'error' }));
        }
        setIsSaving(false);
    }, [id, role, selectedId, dispatch]);

    return {
        templates,
        selectedId,
        setSelectedId,
        isLoading,
        isSaving,
        handleUseTemplate,
    };
};
