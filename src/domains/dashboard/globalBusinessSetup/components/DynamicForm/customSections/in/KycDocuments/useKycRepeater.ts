import { useEffect } from 'react';

import { getIn, useFormikContext } from 'formik';

import { MAX_DIRECTORS } from './constants';
import { ISection } from '../../../../../types/forms';
import { useCustomSectionFields } from '../../useCustomSectionFields';
import { useFormValues } from '../../useFormValues';

const str = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0];

    return '';
};

const filledValue = (v: unknown) => v !== undefined && v !== null && v !== '';

/**
 * Repeater-mode state for KYC Documents (one instance per director/partner),
 * inline display. `instancePath` is the section path
 * (`pages.{pageId}.{sectionId}`); instances are numeric-keyed children with flat
 * field names (`{instancePath}.{idx}.{name}`).
 *
 * Unlike the summary-mode engine, nothing else manages the instance count here,
 * so with `sync` the hook:
 *   1. seeds/prunes numeric-keyed instances to match the mapped director count
 *      (writing the mirrored leaf fields auto-creates each instance object);
 *   2. mirrors external values into every instance — the nationality ctrl gates
 *      (ctrl_indian / ctrl_foreign) and the director name (row label);
 *   3. maintains the hidden `kyc_docs_valid` sentinel on every instance, which
 *      enforces the one-time documents (stored on instance 0) via the standard
 *      required-field schema instead of per-field `required`.
 *
 * One instance (OneTimeDocs) opts into `sync`; the read-only view does not, so
 * the sync effect runs exactly once per commit.
 */
export function useKycRepeater(
    section: ISection,
    instancePath: string,
    config: Record<string, unknown>,
    { sync = false } = {}
) {
    const { values, setFieldValue } = useFormikContext<any>();
    // One-time docs live on instance 0.
    const { get, set, error } = useCustomSectionFields(section, `${instancePath}.0`);
    const formValues = useFormValues();

    const officeYesValue = str(config.office_yes_value).toLowerCase();
    const ownedOfficeValue = str(config.owned_office_value).toLowerCase();
    const indianNationalityValue = str(config.indian_nationality_value).toLowerCase();
    const isLLP = config.is_llp === true;

    const rawOfficeValue = str(formValues.get(str(config.office_availability_field)));
    const hasOffice = rawOfficeValue.toLowerCase() === officeYesValue && officeYesValue !== '';
    const officeType = str(formValues.get(str(config.office_type_field))).toLowerCase();
    const isOwned = officeType === ownedOfficeValue && ownedOfficeValue !== '';

    const directorNames = (formValues.allByName[config.director_name_field as string] ?? []).map(
        str
    );
    const nationalities = (formValues.allByName[config.nationality_field as string] ?? []).map(str);

    // Instance count mirrors the mapped director/partner data (the field_value
    // source the admin maps the repeater to), capped for safety.
    const requiredCount = Math.min(directorNames.length, MAX_DIRECTORS);

    const sectionValues = (getIn(values, instancePath) as Record<string, any>) || {};
    const instanceIndices = Object.keys(sectionValues)
        .filter(key => !Number.isNaN(Number(key)))
        .map(Number)
        .sort((a, b) => a - b);

    // Instance objects for the render/progress layer (flat field shape).
    const instanceValues: Array<Record<string, unknown>> = Array.from(
        { length: requiredCount },
        (_, i) => (sectionValues[i] as Record<string, unknown>) || {}
    );

    // One-time docs completeness — read from instance 0 via get().
    const officeDocsComplete =
        !hasOffice ||
        (filledValue(get('noc_from_owner')) &&
            (isOwned
                ? filledValue(get('title_utility_doc'))
                : filledValue(get('utility_bill')) && filledValue(get('rent_lease_deed'))));
    const oneTimeDocsValid = officeDocsComplete && filledValue(get('name_availability_cert'));
    const sentinel = oneTimeDocsValid ? 'valid' : '';

    // Seed/prune + mirror gates. Runs every render, diff-guarded, so it settles
    // once every instance carries the expected leaf values (same convergence
    // pattern as useShareholdingPattern's sync effect). setFieldValue writes
    // compose through Formik's reducer, so writing a leaf path materialises its
    // parent instance object.
    useEffect(() => {
        if (!sync) return;

        const write = (path: string, value: unknown) => {
            if (getIn(values, path) !== value) setFieldValue(path, value);
        };

        // Prune instances beyond the required count.
        instanceIndices.forEach(idx => {
            if (idx >= requiredCount) setFieldValue(`${instancePath}.${idx}`, undefined);
        });

        // Seed + mirror external values onto every required instance.
        for (let i = 0; i < requiredCount; i += 1) {
            const nat = (nationalities[i] ?? '').toLowerCase();
            const isIndian = nat !== '' && nat === indianNationalityValue;

            write(`${instancePath}.${i}.ctrl_indian`, isIndian ? 'yes' : '');
            write(`${instancePath}.${i}.ctrl_foreign`, nat !== '' && !isIndian ? 'yes' : '');
            write(`${instancePath}.${i}.director_name`, directorNames[i] ?? '');
            write(`${instancePath}.${i}.kyc_docs_valid`, sentinel);
        }
    });

    return {
        isLLP,
        personLabel: isLLP ? 'Partner' : 'Director',
        hasOffice,
        isOwned,
        directorNames,
        nationalities,
        indianNationalityValue,
        requiredCount,
        instanceValues,
        oneTimeDocsValid,
        get,
        set,
        error,
    };
}

export type KycRepeaterController = ReturnType<typeof useKycRepeater>;
