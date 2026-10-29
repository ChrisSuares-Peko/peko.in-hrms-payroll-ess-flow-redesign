import { Choice, PARTNER_DUTIES, PARTNER_RIGHTS } from './constants';
import { FormValuesMap } from '../../useFormValues';

const asFilledString = (value: unknown) =>
    value !== undefined && value !== null && String(value).trim() !== ''
        ? String(value)
        : undefined;

/** LLP name from the mapped field → common field names. */
export const resolveCompanyName = (values: FormValuesMap, config: Record<string, unknown>) =>
    asFilledString(values.get(config.company_name_field as string)) ||
    asFilledString(values.get('proposed_company_name')) ||
    asFilledString(values.get('proposed_name')) ||
    '';

export type Activity = {
    code: string;
    section?: string;
    division?: string;
    group?: string;
    nic_class?: string;
};

/** Business activity (NIC) from the mapped field. `sourced` is false when absent. */
export const resolveActivity = (
    values: FormValuesMap,
    config: Record<string, unknown>
): { activity: Activity; sourced: boolean } => {
    const raw = values.get(config.business_activity_field as string);

    if (Array.isArray(raw) && raw.length > 0) {
        const [section, division, group, nic_class] = raw.map(String);

        return {
            activity: {
                code: nic_class || group || division || section,
                section,
                division,
                group,
                nic_class,
            },
            sourced: true,
        };
    }

    if (typeof raw === 'string' && raw.trim() !== '')
        return { activity: { code: raw }, sourced: true };

    return { activity: { code: '' }, sourced: false };
};

export type Partner = {
    name: string;
    contribution: string;
    profitShare: string;
    designation: string;
};

/** Partners come from a repeating section — zip the mapped columns by index. */
export const buildPartners = (
    values: FormValuesMap,
    config: Record<string, unknown>
): Partner[] => {
    const column = (configKey: string): unknown[] => {
        const fieldName = config[configKey];

        return typeof fieldName === 'string' ? values.allByName[fieldName] || [] : [];
    };

    const names = column('partner_name_field');
    const contributions = column('partner_contribution_field');
    const shares = column('partner_profit_share_field');
    const designations = column('partner_designation_field');
    const cell = (arr: unknown[], i: number) =>
        arr[i] === undefined || arr[i] === null ? '' : String(arr[i]);

    return names
        .map((name, i) => ({
            name: String(name ?? ''),
            contribution: cell(contributions, i),
            profitShare: cell(shares, i),
            designation: cell(designations, i),
        }))
        .filter(p => p.name.trim() !== '');
};

export const buildLlpData = (values: FormValuesMap, config: Record<string, unknown>) => {
    const companyName = resolveCompanyName(values, config);
    const { activity, sourced } = resolveActivity(values, config);
    const partners = buildPartners(values, config);

    return { companyName, activity, sourced, partners };
};

/**
 * Resolve the component's selections from its stored fields, falling back to the
 * spec defaults when uninitialized (sentinel: `meeting_quorum`). Shared by the live
 * controller and the submit-time generator so both build the same document.
 */
export const resolveLlpInputs = (getField: (name: string) => unknown) => {
    const initialized = !!getField('meeting_quorum');
    const selectedLabels = (choices: Choice[], prefix: string) =>
        initialized
            ? choices.filter(c => !!getField(`${prefix}_${c.key}`)).map(c => c.label)
            : choices.filter(c => c.default).map(c => c.label);

    return {
        llpType: (getField('llp_type') as string) || 'standard',
        totalCapital: (getField('total_capital') as string) || '100000',
        rights: selectedLabels(PARTNER_RIGHTS, 'right'),
        duties: selectedLabels(PARTNER_DUTIES, 'duty'),
        meetingQuorum: (getField('meeting_quorum') as string) || '2',
        votingThreshold: (getField('voting_threshold') as string) || 'simple_majority',
        disputeMethod: (getField('dispute_method') as string) || 'arbitration',
        jurisdiction: (getField('jurisdiction') as string) || '',
    };
};
