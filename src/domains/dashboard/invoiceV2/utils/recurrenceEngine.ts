import dayjs from 'dayjs';

import { RECURRING_FREQ_LABEL, UNIT_TO_FREQ } from './constants/recurring';
import type {
    RecurringEndCondition,
    RecurringFrequency,
    RecurringScheduleApiData,
} from '../types/recurring';
import { RecurrenceRule } from '../types/recurring';

export const addInterval = (
    date: string,
    frequency: RecurrenceRule['frequency'],
    interval: number
): string => {
    const d = dayjs(date);
    switch (frequency) {
        case 'DAILY':
            return d.add(interval, 'day').format('YYYY-MM-DD');
        case 'WEEKLY':
            return d.add(interval, 'week').format('YYYY-MM-DD');
        case 'MONTHLY':
            return d.add(interval, 'month').format('YYYY-MM-DD');
        case 'QUARTERLY':
            return d.add(interval * 3, 'month').format('YYYY-MM-DD');
        case 'YEARLY':
            return d.add(interval, 'year').format('YYYY-MM-DD');
        default:
            return d.format('YYYY-MM-DD');
    }
};

export const computeNextRuns = (
    rule: RecurrenceRule,
    completedRuns: number,
    fromDate?: string,
    maxRuns: number = 12
): string[] => {
    const runs: string[] = [];
    let cursor = fromDate ?? rule.startDate;

    if (completedRuns === 0) {
        runs.push(cursor);
    }

    while (runs.length < maxRuns) {
        cursor = addInterval(cursor, rule.frequency, rule.interval);
        if (rule.endCondition.type === 'ON') {
            if (dayjs(cursor).isAfter(rule.endCondition.date)) break;
        }
        if (rule.endCondition.type === 'AFTER') {
            const allRuns = completedRuns + runs.length;
            if (allRuns >= (rule.endCondition.count ?? Infinity)) break;
        }
        runs.push(cursor);
    }

    return runs;
};

export const frequencyLabel = (rule: RecurrenceRule): string => {
    const every = rule.interval > 1 ? `Every ${rule.interval} ` : 'Every ';
    const unit = {
        DAILY: rule.interval > 1 ? 'days' : 'day',
        WEEKLY: rule.interval > 1 ? 'weeks' : 'week',
        MONTHLY: rule.interval > 1 ? 'months' : 'month',
        QUARTERLY: rule.interval > 1 ? 'quarters' : 'quarter',
        YEARLY: rule.interval > 1 ? 'years' : 'year',
    }[rule.frequency];
    return `${every}${unit}`;
};

export const endConditionLabel = (rule: RecurrenceRule): string => {
    switch (rule.endCondition.type) {
        case 'NEVER':
            return 'Runs forever';
        case 'AFTER':
            return `Ends after ${rule.endCondition.count} runs`;
        case 'ON':
            return `Ends on ${dayjs(rule.endCondition.date).format('DD MMM YYYY')}`;
        default:
            return '';
    }
};

export const freqTextFromApi = ({ unit, every }: RecurringFrequency): string => {
    const label = RECURRING_FREQ_LABEL[unit] ?? unit.toLowerCase();
    return every === 1 ? `Every ${label}` : `Every ${every} ${label}s`;
};

export const endTextFromApi = (cond: RecurringEndCondition): string => {
    if (cond.type === 'FOREVER') return 'Runs forever';
    if (cond.type === 'AFTER') return `After ${cond.runs} run${cond.runs === 1 ? '' : 's'}`;
    if (cond.type === 'ON' && cond.date) return `Until ${dayjs(cond.date).format('DD MMM YYYY')}`;
    return '—';
};

export const toRule = (s: RecurringScheduleApiData): RecurrenceRule => ({
    frequency: UNIT_TO_FREQ[s.frequency.unit] ?? 'MONTHLY',
    interval: s.frequency.every,
    startDate: s.startDate,
    endCondition: (() => {
        if (s.endCondition.type === 'AFTER')
            return { type: 'AFTER' as const, count: s.endCondition.runs ?? 0 };
        if (s.endCondition.type === 'ON')
            return { type: 'ON' as const, date: s.endCondition.date ?? '' };
        return { type: 'NEVER' as const };
    })(),
});
