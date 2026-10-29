import { useCallback, useEffect, useState } from 'react';

import useUpdatePaymentMethodsApi from './useUpdatePaymentMethods';
import { PaymentMethodsState } from '../../types/paymentMethods';
import { applyGlobalSettingToggle, isSameGlobalSettings } from '../../utils/paymentMethods';

const useGlobalPaymentSettings = (serverSettings: PaymentMethodsState | null) => {
    const [savedSettings, setSavedSettings] = useState<PaymentMethodsState | null>(null);
    const [settings, setSettings] = useState<PaymentMethodsState | null>(null);
    const { updatePaymentMethods, isLoading: isSaving } = useUpdatePaymentMethodsApi();

    useEffect(() => {
        if (!serverSettings || savedSettings) return;
        setSavedSettings(serverSettings);
        setSettings(serverSettings);
    }, [serverSettings, savedSettings]);

    const isDirty = !!settings && !!savedSettings && !isSameGlobalSettings(settings, savedSettings);

    const toggleSetting = useCallback((key: keyof PaymentMethodsState, checked: boolean) => {
        setSettings(current =>
            current ? applyGlobalSettingToggle(current, key, checked) : current
        );
    }, []);

    const discardChanges = useCallback(() => {
        setSettings(savedSettings);
    }, [savedSettings]);

    const saveChanges = useCallback(async () => {
        if (!settings) return;
        const isSaved = await updatePaymentMethods(settings);
        if (isSaved) setSavedSettings(settings);
    }, [settings, updatePaymentMethods]);

    return { settings, isDirty, isSaving, toggleSetting, discardChanges, saveChanges };
};

export default useGlobalPaymentSettings;
