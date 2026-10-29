import { useEffect } from 'react';

import { getIn, useFormikContext } from 'formik';

import { ISection } from '../../../../../types/forms';
import { useCustomSectionFields } from '../../useCustomSectionFields';

const toNum = (v: unknown): number | null => {
    const n = Number(v);
    return !Number.isNaN(n) && n > 0 ? n : null;
};

// Avoids floating-point false positives for whole-rupee values by rounding before
// checking divisibility (e.g. 100000 / 10 should always be 10000, not 9999.999...).
const isDivisible = (a: number, b: number): boolean =>
    Number.isInteger(Math.round(a) / Math.round(b));

// Capital inputs are backed by the section's real (declared) fields so they are
// stored and submitted via the normal field-value path. The hidden sentinel field
// (`capital_cross_valid`) stays empty while any cross-field rule fails, so its
// required-validation blocks page navigation until the structure is consistent.
export function useCapitalStructure(section: ISection, instancePath: string) {
    const { touched } = useFormikContext<any>();
    const { get, set, error } = useCustomSectionFields(section, instancePath);

    const authorized = toNum(get('authorized_capital'));
    const paidUp = toNum(get('paid_up_capital'));
    const faceValue = toNum(get('face_value_per_share'));

    // Cross-field rules, computed live from the current values. The authorized
    // minimum also drives the sentinel, so navigation is blocked when
    // authorized < ₹1L even before the user interacts with the field.
    const authorizedRuleError: string | undefined =
        authorized !== null && authorized < 100000
            ? 'Minimum authorized capital is ₹1,00,000'
            : undefined;

    const faceValueRuleError: string | undefined =
        faceValue && authorized && faceValue > authorized
            ? 'Face value cannot exceed authorized capital'
            : undefined;

    const paidUpRuleError: string | undefined = (() => {
        if (!paidUp) return undefined;
        if (authorized && paidUp > authorized) return 'Cannot exceed authorized capital';
        if (faceValue && !faceValueRuleError && !isDivisible(paidUp, faceValue)) {
            return 'Must be exactly divisible by face value per share';
        }
        return undefined;
    })();

    const authorizedShares =
        authorized && faceValue && !faceValueRuleError ? Math.round(authorized / faceValue) : null;
    const paidUpShares =
        paidUp && faceValue && !faceValueRuleError && !paidUpRuleError
            ? Math.round(paidUp / faceValue)
            : null;

    const allCrossValid =
        authorized !== null &&
        paidUp !== null &&
        faceValue !== null &&
        !authorizedRuleError &&
        !faceValueRuleError &&
        !paidUpRuleError;

    // Keep the sentinel in sync on every render, guarded by value equality so it
    // only writes on an actual change (matching the no-deps effect style of the
    // other custom sections).
    useEffect(() => {
        const next = allCrossValid ? 'valid' : '';
        if (get('capital_cross_valid') !== next) set('capital_cross_valid', next);
    });

    // Schema errors (required / valid number) surface only after the field is
    // touched — a failed Next marks the whole page touched — while the live
    // cross-field rule errors above always take precedence.
    const schemaError = (name: string): string | undefined =>
        getIn(touched, `${instancePath}.${name}`) ? error(name) : undefined;

    return {
        get,
        set,
        error,
        authorized,
        paidUp,
        faceValue,
        authorizedShares,
        paidUpShares,
        authorizedError: authorizedRuleError || schemaError('authorized_capital'),
        paidUpError: paidUpRuleError || schemaError('paid_up_capital'),
        faceValueError: faceValueRuleError || schemaError('face_value_per_share'),
    };
}

export type CapitalStructureController = ReturnType<typeof useCapitalStructure>;
