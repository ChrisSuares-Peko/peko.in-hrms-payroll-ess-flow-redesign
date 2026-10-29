import { formatNumberWithLocalString } from '@utils/priceFormat';

import { AccountingService } from '../types/services';

export type PillTone = 'success' | 'warning' | 'neutral' | 'danger';

export type PillMeta = { label: string; tone: PillTone };

type CommissionFields = Pick<
    AccountingService,
    'commissionType' | 'providerCommission' | 'fixedCommissionPerTransaction'
>;

const trimNumber = (value: number) => Number(value.toFixed(2)).toString();

// A figure the journal never derived arrives as null and reads as a dash, never as ₹ 0.
export const formatInr = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : `₹ ${formatNumberWithLocalString(value)}`;

export const formatCommissionLabel = (service: CommissionFields): string | null => {
    if (!service.commissionType) return null;
    const rate = Number(service.providerCommission) || 0;
    const fixed = Number(service.fixedCommissionPerTransaction) || 0;
    const parts: string[] = [];

    if (rate > 0 || fixed <= 0) {
        parts.push(
            service.commissionType === 'PERCENTAGE' ? `${trimNumber(rate)}%` : formatInr(rate)
        );
    }
    if (fixed > 0) parts.push(formatInr(fixed));

    return parts.join(' + ');
};

export const toAmountField = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    const amount = Number(value);
    return Number.isNaN(amount) ? '' : String(amount);
};

export const serviceActivityPill = (service: Pick<AccountingService, 'serviceStatus'>): PillMeta =>
    service.serviceStatus
        ? { label: 'Active', tone: 'success' }
        : { label: 'Inactive', tone: 'neutral' };

export type ServiceConfigurationStatus = PillMeta & { notes: string[] };

type ConfigurationFields = Pick<
    AccountingService,
    'serviceStatus' | 'planType' | 'commissionConfigured' | 'configuration'
>;

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export const serviceConfigurationNotes = (service: Omit<ConfigurationFields, 'serviceStatus'>) => {
    const notes: string[] = [];
    const { configuration } = service;
    const plans = service.planType === 'with_plans' ? configuration?.plans : null;

    if (plans) {
        if (plans.notConfigured > 0) {
            notes.push(
                `Commission: ${plans.notConfigured} of ${plans.total} ${plural(plans.total, 'plan', 'plans')} not configured`
            );
        }
        if (configuration?.serviceCommissionItems && !service.commissionConfigured) {
            notes.push(`Commission for ${configuration.serviceCommissionItems} not configured`);
        }
    } else if (!service.commissionConfigured) {
        notes.push('Commission not configured');
    }

    const addOns = service.planType === 'with_plans' ? configuration?.addOns : null;
    if (addOns && addOns.notConfigured > 0) {
        notes.push(
            `Commission: ${addOns.notConfigured} of ${addOns.total} ${plural(addOns.total, 'add-on', 'add-ons')} not configured`
        );
    }

    const fee = configuration?.platformFee;
    if (fee && fee.notConfigured > 0) {
        notes.push(
            `Platform fee: ${fee.notConfigured} of ${fee.total} ${plural(fee.total, 'package', 'packages')} not configured`
        );
    }
    return notes;
};

export const serviceConfigurationStatus = (
    service: ConfigurationFields
): ServiceConfigurationStatus => {
    if (!service.serviceStatus) return { label: 'Inactive', tone: 'neutral', notes: [] };
    const notes = serviceConfigurationNotes(service);
    return notes.length
        ? { label: 'Not configured', tone: 'warning', notes }
        : { label: 'Configured', tone: 'success', notes };
};
