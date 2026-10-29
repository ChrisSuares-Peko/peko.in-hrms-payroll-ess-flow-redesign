import { IForm, ISection } from '../../../types/forms';

// Overrides derived from the pricing quote (see useQuoteBindings): field values
// keyed by form-field `_id`, and repeater instance counts keyed by section `_id`.
export type DefaultValueOverrides = {
    field_values: Record<string, unknown>;
    section_counts: Record<string, number>;
};

// `false` counts as empty: a checkbox with no saved value falls back to `false`,
// indistinguishable from "nothing set", so a pricing-bound override (e.g. a
// toggle component that should default checked) must still be able to win.
const isEmpty = (value: unknown) =>
    value === undefined ||
    value === null ||
    value === '' ||
    value === false ||
    (Array.isArray(value) && value.length === 0);

const emptyFieldValue = (type: string): unknown => {
    switch (type) {
        case 'checkbox':
            return false;
        case 'number':
        case 'currency':
            return undefined;
        case 'nested_select':
            return [];
        default:
            return '';
    }
};

const buildEmptyInstance = (section: ISection): Record<string, unknown> => {
    const instance: Record<string, unknown> = {};
    (section.fields ?? []).forEach(field => {
        instance[field.name] =
            field.type === 'select' && field.allow_multiple ? [] : emptyFieldValue(field.type);
    });
    return instance;
};

/**
 * Seed Formik initial values from pricing-driven overrides. Applied AFTER
 * `generateInitialValues`, over Peko's value shape
 * (`values.pages[pageId][sectionId][.idx].name`):
 *  - `section_counts`: for user-controlled repeaters, materialize empty instances
 *    up to the priced count (capped at max_instances).
 *  - `field_values`: seed a field ONLY when currently empty (never clobber saved
 *    or user-entered data). Repeater fields seed on instance 0.
 * Mutates and returns `values`.
 */
export function applyDefaultOverrides(values: any, form: IForm, overrides?: DefaultValueOverrides) {
    if (!overrides) return values;

    const hasFieldOverrides = Object.keys(overrides.field_values ?? {}).length > 0;
    const hasCountOverrides = Object.keys(overrides.section_counts ?? {}).length > 0;

    if (!hasFieldOverrides && !hasCountOverrides) return values;

    (form.pages ?? []).forEach(page => {
        (page.sections ?? []).forEach(section => {
            const sectionVals = values?.pages?.[page._id]?.[section._id];

            if (!sectionVals || typeof sectionVals !== 'object') return;

            const targetCount = overrides.section_counts?.[String(section._id)];

            if (
                targetCount !== undefined &&
                section.repeater?.enabled &&
                section.repeater.source_type === 'user_controlled'
            ) {
                const max = section.repeater.max_instances ?? targetCount;
                const desired = Math.min(targetCount, max);
                let existing = Object.keys(sectionVals).filter(
                    k => !Number.isNaN(Number(k))
                ).length;

                while (existing < desired) {
                    sectionVals[existing] = buildEmptyInstance(section);
                    existing += 1;
                }
            }

            (section.fields ?? []).forEach(field => {
                const override = overrides.field_values?.[String(field._id)];

                if (override === undefined) return;

                if (section.repeater?.enabled) {
                    const inst = sectionVals[0];

                    if (inst && isEmpty(inst[field.name])) inst[field.name] = override;
                } else if (isEmpty(sectionVals[field.name])) {
                    sectionVals[field.name] = override;
                }
            });
        });
    });

    return values;
}
