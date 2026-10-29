import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addGuideline, getAllGuidelines, getTemplate, updateGuideline } from '../../api/reminder';

export type ReminderRow = {
    id?: number;
    days: string;
    sms: boolean;
    email: boolean;
    notification: boolean;
    actionDate: string;
    invoiceId: number;
    status?: string;
    templet?: any;
};

const useInvoiceReminders = (invoiceId: number) => {
    const { id, role } = useAppSelector(s => s.reducer.auth);
    const dispatch = useAppDispatch();

    const [guidelines, setGuidelines] = useState<ReminderRow[]>([]);
    const [templateData, setTemplateData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchReminders = useCallback(async () => {
        if (!invoiceId) return;
        setLoading(true);
        const result = await getAllGuidelines({ userId: id, userType: role, invoiceId });
        if (result?.rows) {
            setGuidelines(
                result.rows.map((r: any) => ({
                    id: r.id,
                    days: r.days || '',
                    sms: Boolean(r.sms),
                    email: Boolean(r.email),
                    notification: Boolean(r.notification),
                    actionDate: r.actionDate,
                    invoiceId,
                    status: r.status,
                    templet: r.templet,
                }))
            );
        }
        setLoading(false);
    }, [id, role, invoiceId]);

    const fetchTemplates = useCallback(async () => {
        const result = await getTemplate({ userId: id, userType: role });
        if (result?.rows) setTemplateData(result.rows);
    }, [id, role]);

    useEffect(() => {
        fetchReminders();
        fetchTemplates();
    }, [fetchReminders, fetchTemplates]);

    const submitReminders = useCallback(
        async (data: ReminderRow[], isNew: boolean) => {
            setSubmitLoading(true);
            const fn = isNew ? addGuideline : updateGuideline;
            const result = await fn({ userId: id, userType: role, data, invoiceId });
            if (result) {
                dispatch(
                    showToast({
                        description: isNew
                            ? 'Reminders added successfully'
                            : 'Reminders updated successfully',
                        variant: 'success',
                    })
                );
                fetchReminders();
            }
            setSubmitLoading(false);
        },
        [id, role, invoiceId, dispatch, fetchReminders]
    );

    const validateForm = useCallback(
        (values: any): boolean => {
            const hasNoAction = values.data.some((item: any) => !item.sms && !item.email);
            if (hasNoAction) {
                dispatch(
                    showToast({
                        description: 'Please select at least one action (SMS or Email) to proceed.',
                        variant: 'error',
                    })
                );
                return false;
            }
            const missingTemplate = values.data.some((item: any) => {
                if (!item.templet) return true;
                if (item.email && (!item.templet.email?.subject || !item.templet.email?.body))
                    return true;
                if (item.sms && !item.templet.sms?.body) return true;
                return false;
            });
            if (missingTemplate) {
                dispatch(
                    showToast({
                        description: 'Please select a template for SMS or Email before submitting.',
                        variant: 'error',
                    })
                );
                return false;
            }
            const missingEmail = values.data.some(
                (item: any) => item.email && item.templet?.email && !item.templet.email.emailId
            );
            if (missingEmail) {
                dispatch(
                    showToast({
                        description: 'Customer has no email address. Please uncheck Email to proceed.',
                        variant: 'error',
                    })
                );
                return false;
            }
            const missingPhone = values.data.some(
                (item: any) => item.sms && item.templet?.sms && !item.templet.sms.mobileNo
            );
            if (missingPhone) {
                dispatch(
                    showToast({
                        description: 'Customer has no phone number. Please uncheck SMS to proceed.',
                        variant: 'error',
                    })
                );
                return false;
            }
            return true;
        },
        [dispatch]
    );

    return { guidelines, templateData, loading, submitLoading, submitReminders, validateForm };
};

export default useInvoiceReminders;
