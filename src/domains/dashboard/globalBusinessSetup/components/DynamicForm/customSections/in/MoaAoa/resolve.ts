import { toNestedPath } from '../../../utils/nestedSelectValue';
import { FormValuesMap } from '../../useFormValues';

export type Activity = {
    code: string;
    section?: string;
    division?: string;
    group?: string;
    nic_class?: string;
};

const asFilledString = (value: unknown) =>
    value !== undefined && value !== null && String(value).trim() !== ''
        ? String(value)
        : undefined;

/** Company name from the mapped field (by name) → common field names. */
export const resolveCompanyName = (values: FormValuesMap, config: Record<string, unknown>) =>
    asFilledString(values.get(config.company_name_field as string)) ||
    asFilledString(values.get('proposed_company_name')) ||
    asFilledString(values.get('proposed_name')) ||
    '';

/**
 * Business activity from the mapped field (by name). A nested_select stores the
 * NIC hierarchy as an array ([section, division, group, class]); a plain field
 * stores a single code. `sourced` is false when no value is available.
 */
export const resolveActivity = (
    values: FormValuesMap,
    config: Record<string, unknown>
): { activity: Activity; sourced: boolean } => {
    const raw = values.get(config.business_activity_field as string);

    if (Array.isArray(raw) && raw.length > 0) {
        const [section, division, group, nic_class] = toNestedPath(raw);

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

    if (typeof raw === 'string' && raw.trim() !== '') {
        return { activity: { code: raw }, sourced: true };
    }

    return { activity: { code: '' }, sourced: false };
};

/** Value of the field mapped at `config[configKey]` (a field name), as a string. */
export const mappedValue = (
    values: FormValuesMap,
    config: Record<string, unknown>,
    configKey: string
): string => {
    const fieldName = config[configKey];

    return typeof fieldName === 'string' ? asFilledString(values.get(fieldName)) ?? '' : '';
};

export type Subscriber = {
    name: string;
    nationality: string;
    occupation: string;
    din: string;
    shares: string;
};

export type CountryEntry = { _id: string; name: string };

/**
 * Subscribers come from a repeating section: each mapped field name has a value
 * per instance (values.allByName[name]), so we zip them by index into rows.
 */
export const buildSubscribers = (
    values: FormValuesMap,
    config: Record<string, unknown>,
    countries?: CountryEntry[]
): Subscriber[] => {
    const column = (configKey: string): unknown[] => {
        const fieldName = config[configKey];

        return typeof fieldName === 'string' ? values.allByName[fieldName] || [] : [];
    };

    const names = column('subscriber_name_field');
    const nationalities = column('subscriber_nationality_field');
    const occupations = column('subscriber_occupation_field');
    const dins = column('subscriber_din_field');
    const shares = column('subscriber_shares_field');

    const cell = (arr: unknown[], i: number) =>
        arr[i] === undefined || arr[i] === null ? '' : String(arr[i]);

    const NATIONALITY_LABELS: Record<string, string> = {
        indian: 'Indian',
        foreign_national: 'Foreign National',
    };
    const resolveNationality = (id: string) =>
        NATIONALITY_LABELS[id] ?? countries?.find(c => c._id === id)?.name ?? id;

    return names
        .map((name, i) => ({
            name: String(name ?? ''),
            nationality: resolveNationality(cell(nationalities, i)),
            occupation: cell(occupations, i),
            din: cell(dins, i),
            shares: cell(shares, i),
        }))
        .filter(s => s.name.trim() !== '');
};

/**
 * Everything the MOA/AOA templates need, derived from the entered form values and
 * the section's field mappings. Shared by the live component and the submit-time
 * document generator so both build identical documents.
 */
export const buildTemplateData = (
    values: FormValuesMap,
    config: Record<string, unknown>,
    countries?: CountryEntry[]
) => {
    const companyName = resolveCompanyName(values, config);
    const { activity, sourced } = resolveActivity(values, config);

    const templateData: Record<string, unknown> = {
        ...values.byName,
        company_name: companyName,
        nic_code: activity.code,
        subscribers: buildSubscribers(values, config, countries),
    };

    const setMapped = (key: string, configKey: string) => {
        const value = mappedValue(values, config, configKey);

        if (value) templateData[key] = value;
    };

    setMapped('state', 'state_field');
    setMapped('authorised_capital', 'capital_field');
    setMapped('share_value', 'share_value_field');

    const firstFilled = (...names: string[]): unknown =>
        names.reduce<unknown>((found, name) => {
            if (found !== undefined) return found;
            const arr = values.allByName[name];

            return arr?.length
                ? arr.find(x => x !== undefined && x !== null && x !== '')
                : undefined;
        }, undefined);

    const capitalRaw = firstFilled('authorised_capital', 'authorized_capital', 'capital');
    const faceValRaw = firstFilled(
        'share_value',
        'face_value',
        'face_value_per_share',
        'nominal_value'
    );
    const capital = Number(capitalRaw);
    const faceVal = Number(faceValRaw);

    if (capital > 0 && faceVal > 0) {
        templateData.number_of_shares = Math.round(capital / faceVal).toLocaleString('en-IN');
    }

    return { templateData, companyName, activity, sourced };
};

export type AncillaryItem = { key: string; label: string; default: boolean };
export type TemplateOption = { key: string; clause: string };

/**
 * Resolve the component's MOA selections (template, clause, ancillary objects)
 * from its stored field values. `templateOptions` and `ancillaryItems` come from
 * section.fields (API) so labels and defaults reflect the vendor's latest values.
 * `getField` reads a stored value by field name. Shared by the live controller and
 * the submit-time generator so both produce the same document.
 */
export const resolveMoaInputs = (
    getField: (name: string) => unknown,
    templateOptions: TemplateOption[],
    ancillaryItems: AncillaryItem[]
) => {
    // Use main_object_clause as sentinel: textarea fields initialize to '' even when
    // a default_value exists (unlike radio fields which Formik auto-seeds). This
    // ensures ancillary defaults are applied on first open, but not on subsequent
    // loads where the user may have explicitly unchecked items.
    const initialized = !!getField('main_object_clause');
    const objectTemplate = (getField('object_template') as string) || templateOptions[0]?.key || '';
    const templateClause =
        templateOptions.find(t => t.key === objectTemplate)?.clause ??
        templateOptions[0]?.clause ??
        '';
    const mainObjectClause = (getField('main_object_clause') as string) || templateClause;
    const ancillary = initialized
        ? ancillaryItems.filter(o => !!getField(`ancillary_${o.key}`)).map(o => o.key)
        : ancillaryItems.filter(o => o.default).map(o => o.key);

    return { objectTemplate, mainObjectClause, ancillary };
};
