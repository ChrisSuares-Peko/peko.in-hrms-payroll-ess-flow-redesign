import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getReminderRulesApi, updateAutomaticRemindersApi, updateReminderRuleApi } from '../api/payments';
import { REMINDER_RULE_META, REMINDER_RULE_SUBTITLE } from '../constants/payments';
import { ReminderRule, ReminderTiming } from '../types/payments';
import { parseEmailTemplate } from '../utils/helperFunctions';

const useReminderRules = () => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [rules, setRules] = useState<ReminderRule[]>([]);
    const [automaticReminders, setAutomaticReminders] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    // Mirror of rules state — always up-to-date without waiting for re-render
    const rulesRef = useRef<ReminderRule[]>([]);
    // Per-rule debounce timers
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const fetchRules = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const data = await getReminderRulesApi({ userId, userType });
            if (!data) { setIsError(true); return; }
            setAutomaticReminders(data.automaticReminders);
            const mapped = data.rules.map(r => {
                const meta = REMINDER_RULE_META[r.ruleType] ?? {
                    id: String(r.id),
                    title: r.ruleType,
                    timing: 'after' as ReminderTiming,
                };
                const emailTemplate = r.emailTemplate
                    ? `Subject: ${r.emailTemplate.subject}\n\n${r.emailTemplate.body}`
                    : '';
                return {
                    id: meta.id,
                    apiId: r.id,
                    title: meta.title,
                    subtitle: REMINDER_RULE_SUBTITLE,
                    timing: meta.timing,
                    days: r.days,
                    isEnabled: r.enabled,
                    emailEnabled: r.sendEmail,
                    whatsappEnabled: r.sendWhatsApp,
                    emailTemplate,
                    whatsappTemplate: r.whatsappTemplate?.body ?? '',
                };
            });
            rulesRef.current = mapped;
            setRules(mapped);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [userId, userType]);

    const updateRule = useCallback(
        (id: string, patch: Partial<ReminderRule>) => {
            // Update state immediately (optimistic)
            const next = rulesRef.current.map(r => (r.id === id ? { ...r, ...patch } : r));
            rulesRef.current = next;
            setRules(next);

            // Debounce API call per rule — rapid changes (e.g. email + whatsapp)
            // collapse into one call with the latest merged state
            const existing = timersRef.current.get(id);
            if (existing) clearTimeout(existing);

            const timer = setTimeout(() => {
                const rule = rulesRef.current.find(r => r.id === id);
                if (!rule) return;
                const { subject, body } = parseEmailTemplate(rule.emailTemplate);
                updateReminderRuleApi({
                    userId,
                    userType,
                    ruleId: rule.apiId,
                    enabled: rule.isEnabled,
                    days: rule.days,
                    sendEmail: rule.emailEnabled,
                    sendWhatsApp: rule.whatsappEnabled,
                    emailTemplate: { subject, body },
                    whatsappTemplate: { body: rule.whatsappTemplate },
                });
                timersRef.current.delete(id);
            }, 300);

            timersRef.current.set(id, timer);
        },
        [userId, userType]
    );

    const saveTemplate = useCallback(
        async (id: string, channel: 'email' | 'whatsapp') => {
            const pending = timersRef.current.get(id);
            if (pending) {
                clearTimeout(pending);
                timersRef.current.delete(id);
            }
            const rule = rulesRef.current.find(r => r.id === id);
            if (!rule) return;
            const { subject, body } = parseEmailTemplate(rule.emailTemplate);
            const result = await updateReminderRuleApi({
                userId,
                userType,
                ruleId: rule.apiId,
                enabled: rule.isEnabled,
                days: rule.days,
                sendEmail: rule.emailEnabled,
                sendWhatsApp: rule.whatsappEnabled,
                emailTemplate: { subject, body },
                whatsappTemplate: { body: rule.whatsappTemplate },
            });
            if (result) {
                dispatch(
                    showToast({
                        description:
                            channel === 'email'
                                ? 'Email template saved successfully'
                                : 'Whatsapp template saved successfully',
                        variant: 'success',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description: 'Failed to save template',
                        variant: 'error',
                    })
                );
            }
        },
        [userId, userType, dispatch]
    );

    useEffect(() => {
        fetchRules();
        const timers = timersRef.current;
        return () => { timers.forEach(clearTimeout); };
    }, [fetchRules]);

    const toggleAutomaticReminders = useCallback(
        (value: boolean) => {
            setAutomaticReminders(value);
            updateAutomaticRemindersApi({ userId, userType, automaticReminders: value });
        },
        [userId, userType]
    );

    return { rules, automaticReminders, isLoading, isError, updateRule, saveTemplate, toggleAutomaticReminders };
};

export default useReminderRules;
