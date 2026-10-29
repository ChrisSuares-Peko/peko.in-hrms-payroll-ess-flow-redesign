import { FormValuesMap } from '../../useFormValues';
import { buildTemplateData, CountryEntry, mappedValue, Subscriber } from '../MoaAoa/resolve';

/**
 * OPC subscriber for the Declaration Clause: the shareholder acts as the
 * subscriber when present (holding 100% of shares, no DIN); otherwise fall
 * back to the sole director's details.
 */
const buildOpcSubscribers = (
    values: FormValuesMap,
    config: Record<string, unknown>,
    countries?: CountryEntry[]
): Subscriber[] => {
    const resolveNationality = (id: string) => countries?.find(c => c._id === id)?.name ?? id;

    const shareholderName = mappedValue(values, config, 'shareholder_name_field');

    if (shareholderName) {
        return [
            {
                name: shareholderName,
                nationality: resolveNationality(
                    mappedValue(values, config, 'shareholder_nationality_field')
                ),
                occupation: mappedValue(values, config, 'shareholder_occupation_field'),
                din: '',
                shares: '100%',
            },
        ];
    }

    const directorName = mappedValue(values, config, 'subscriber_name_field');

    if (!directorName) return [];

    return [
        {
            name: directorName,
            nationality: resolveNationality(
                mappedValue(values, config, 'subscriber_nationality_field')
            ),
            occupation: mappedValue(values, config, 'subscriber_occupation_field'),
            din: mappedValue(values, config, 'subscriber_din_field'),
            shares: '100%',
        },
    ];
};

/**
 * OPC variant of the MOA/AOA template data: same resolution as the MOA & AOA
 * component, with the subscribers replaced by the single OPC subscriber
 * (shareholder first, sole director as fallback). Shared by the live component
 * and the submit-time generator so both build identical documents.
 */
export const buildOpcTemplateData = (
    values: FormValuesMap,
    config: Record<string, unknown>,
    countries?: CountryEntry[]
) => {
    const result = buildTemplateData(values, config, countries);

    result.templateData.subscribers = buildOpcSubscribers(values, config, countries);

    return result;
};
