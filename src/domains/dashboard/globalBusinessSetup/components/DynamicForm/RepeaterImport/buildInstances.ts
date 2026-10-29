import { coerceCellToFieldValue, NON_IMPORTABLE_TYPES } from './coerceCell';
import { ColumnMapping, CountryResolver, ImportInstance, RowValidation } from './types';
import { IForm, IRepeater, ISection } from '../../../types/forms';
import { buildFieldValidator } from '../../../utils/generateYupSchema';
import { getDefaultValue } from '../utils/fieldDefaults';

// A fully-defaulted instance object (every section field, hidden included).
export const buildBlankInstance = (section: ISection): ImportInstance => {
    const obj: ImportInstance = {};
    (section.fields ?? []).forEach(f => {
        obj[f.name] = getDefaultValue(f.type);
    });
    return obj;
};

// One instance object per data row: mapped columns are coerced per field type,
// everything else gets the field default. Warnings are deduped.
export function buildInstancesFromRows(
    rows: unknown[][],
    mappings: ColumnMapping[],
    section: ISection,
    countryResolver?: CountryResolver
): { instances: ImportInstance[]; warnings: string[] } {
    const warnings = new Set<string>();

    const instances = rows.map(row => {
        const obj = buildBlankInstance(section);
        mappings.forEach(({ columnIndex, field }) => {
            const { value, warning } = coerceCellToFieldValue(
                field,
                row[columnIndex],
                countryResolver
            );
            obj[field.name] = value;
            if (warning) warnings.add(warning);
        });
        return obj;
    });

    return { instances, warnings: Array.from(warnings) };
}

// Run each visible, non-conditional field's REAL Yup rule against the imported
// value so the preview can flag invalid rows. Conditional fields can't be
// resolved from a single row — they validate on submit, like the vendor.
// Validators that need full-form context are ignored defensively.
export function validateInstances(
    instances: ImportInstance[],
    section: ISection,
    form: IForm
): RowValidation[] {
    const fields = (section.fields ?? []).filter(
        f => !f.view?.is_hidden && !NON_IMPORTABLE_TYPES.includes(f.type) && !f.conditional?.enabled
    );

    return instances.map(inst => {
        const errors: string[] = [];
        fields.forEach(field => {
            try {
                buildFieldValidator(field, form).validateSync(inst[field.name]);
            } catch (err: any) {
                if (err?.name === 'ValidationError' && err?.message) {
                    errors.push(String(err.message));
                }
            }
        });
        return { valid: errors.length === 0, errors };
    });
}

// Clamp/pad the imported rows to the count the repeater's own CONFIG allows —
// and only that (vendor-exact): fixed_count slices/pads; user_controlled slices
// only when max_instances is set; field_value is never clamped here (the caller
// writes the driver field and the section's sync effect reconciles).
export function enforceInstanceCount(
    instances: ImportInstance[],
    section: ISection,
    repeater: IRepeater
): { instances: ImportInstance[]; note?: string } {
    if (repeater.source_type === 'fixed_count') {
        const fixed = repeater.fixed_count || 0;

        if (instances.length > fixed) {
            return {
                instances: instances.slice(0, fixed),
                note: `Only the first ${fixed} row(s) were used (this section has a fixed count).`,
            };
        }
        if (instances.length < fixed) {
            return {
                instances: [
                    ...instances,
                    ...Array.from({ length: fixed - instances.length }, () =>
                        buildBlankInstance(section)
                    ),
                ],
            };
        }
        return { instances };
    }

    if (repeater.source_type === 'user_controlled') {
        const max = repeater.max_instances;
        const min = repeater.min_instances || 0;

        if (max && instances.length > max) {
            return {
                instances: instances.slice(0, max),
                note: `Only the first ${max} row(s) were used (maximum allowed).`,
            };
        }
        if (instances.length < min) {
            return {
                instances,
                note: `This section requires at least ${min} item(s).`,
            };
        }
        return { instances };
    }

    return { instances };
}
