import { useCallback, useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllInvoices } from '../../api/invoices';
import { createRecurringSchedule } from '../../api/recurring';
import { InvoiceRow } from '../../types/invoice';
import type {
    RecurringEndCondition,
    RecurringFrequency,
    RecurringFrequencyUnit,
    RecurringScheduleApiData,
} from '../../types/recurring';
import { RecurrenceRule } from '../../types/recurring';
import { computeNextRuns } from '../../utils/recurrenceEngine';

const FREQ_TO_UNIT: Record<string, RecurringFrequencyUnit> = {
    DAILY: 'DAYS',
    WEEKLY: 'WEEKS',
    MONTHLY: 'MONTHS',
    QUARTERLY: 'QUARTERS',
    YEARLY: 'YEARS',
};

const ruleToApiFrequency = (rule: RecurrenceRule): RecurringFrequency => ({
    unit: FREQ_TO_UNIT[rule.frequency] ?? 'MONTHS',
    every: rule.interval,
});

const ruleToApiEndCondition = (rule: RecurrenceRule): RecurringEndCondition => {
    if (rule.endCondition.type === 'AFTER') return { type: 'AFTER', runs: rule.endCondition.count };
    if (rule.endCondition.type === 'ON') return { type: 'ON', date: rule.endCondition.date };
    return { type: 'FOREVER' };
};

const DEFAULT_RULE: RecurrenceRule = {
    frequency: 'MONTHLY',
    interval: 1,
    startDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    endCondition: { type: 'NEVER' },
};

type Props = {
    open: boolean;
    sourceInvoice?: InvoiceRow | null;
    onClose: () => void;
    onCreated?: (schedule: RecurringScheduleApiData) => void;
};

export const useMakeRecurring = ({ open, sourceInvoice, onClose, onCreated }: Props) => {
    const { role, id } = useAppSelector(s => s.reducer.auth);
    const dispatch = useDispatch();

    const [invoiceOptions, setInvoiceOptions] = useState<InvoiceRow[]>([]);
    const [isFetchingInvoices, setIsFetchingInvoices] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
    const [name, setName] = useState('');
    const [rule, setRule] = useState<RecurrenceRule>(DEFAULT_RULE);
    const [autoSend, setAutoSend] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const activeInvoice = sourceInvoice ?? selectedInvoice;

    const fetchInvoiceOptions = useCallback(async () => {
        setIsFetchingInvoices(true);
        const result = await getAllInvoices({
            userId: id,
            userType: role,
            page: 1,
            itemsPerPage: 100,
            sort: 'DESC',
            sortField: 'createdAt',
        });
        if (result) setInvoiceOptions(result.invoiceData);
        setIsFetchingInvoices(false);
    }, [id, role]);

    useEffect(() => {
        if (open) {
            setName('');
            setRule(DEFAULT_RULE);
            setAutoSend(true);
            setSelectedInvoice(null);
            if (!sourceInvoice) fetchInvoiceOptions();
        }
    }, [open, sourceInvoice, fetchInvoiceOptions]);

    useEffect(() => {
        if (activeInvoice && !name) {
            setName(`Recurring — ${activeInvoice.name ?? ''}`);
        }
    }, [activeInvoice, name]);

    const nextRuns = useMemo(() => computeNextRuns(rule, 0, undefined, 4), [rule]);

    const handleSave = async () => {
        if (!activeInvoice) {
            dispatch(
                showToast({
                    description: 'Pick an invoice to base the schedule on',
                    variant: 'error',
                })
            );
            return;
        }
        setIsSaving(true);
        const result = await createRecurringSchedule({
            userId: id,
            userType: role,
            scheduleName: name.trim() || `Recurring — ${activeInvoice.name ?? ''}`,
            frequency: ruleToApiFrequency(rule),
            startDate: rule.startDate,
            endCondition: ruleToApiEndCondition(rule),
            autoSend,
            sourceInvoiceId: activeInvoice.id,
        });
        setIsSaving(false);

        if (result && result.status) {
            dispatch(showToast({ description: 'Recurring schedule created', variant: 'success' }));
            onCreated?.(result.data);
            onClose();
        } else {
            dispatch(
                showToast({ description: 'Failed to create recurring schedule', variant: 'error' })
            );
        }
    };

    let selectValue: string | undefined;
    if (sourceInvoice) selectValue = String(sourceInvoice.id);
    else if (selectedInvoice) selectValue = String(selectedInvoice.id);

    const handleSelectInvoice = (val: string) => {
        const inv = invoiceOptions.find(i => String(i.id) === val) ?? null;
        setSelectedInvoice(inv);
        if (inv) setName(`Recurring — ${inv.name ?? ''}`);
    };

    return {
        invoiceOptions,
        isFetchingInvoices,
        activeInvoice,
        name,
        setName,
        rule,
        setRule,
        autoSend,
        setAutoSend,
        isSaving,
        nextRuns,
        selectValue,
        handleSave,
        handleSelectInvoice,
    };
};
