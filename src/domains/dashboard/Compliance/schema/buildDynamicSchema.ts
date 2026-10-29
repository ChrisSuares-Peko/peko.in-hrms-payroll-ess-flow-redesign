import * as Yup from 'yup';

import type { FieldDef } from '../types/formConfig';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const DIN_REGEX = /^[0-9]{8}$/;
const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const CIN_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

function buildFieldSchema(field: FieldDef): Yup.Schema {
    if (field.type === 'repeatable-table') {
        if (!field.columns?.length) return Yup.array();
        const rowShape = field.columns.reduce<Record<string, Yup.StringSchema>>((acc, col) => {
            if (col.type === 'serial' || col.type === 'checkbox') return acc;
            let colSchema = Yup.string();
            if (col.required) colSchema = colSchema.required(`${col.label} is required`);
            switch (col.validation) {
                case 'pan':
                    colSchema = colSchema.test('pan', 'Enter a valid PAN (e.g. ABCDE1234F)', v => !v || PAN_REGEX.test(v));
                    break;
                case 'din':
                    colSchema = colSchema.test('din', 'Enter a valid 8-digit DIN', v => !v || DIN_REGEX.test(v));
                    break;
                case 'dinPan':
                    colSchema = colSchema.test('dinPan', 'Enter a valid DIN (8 digits) or PAN (e.g. ABCDE1234F)', v => !v || DIN_REGEX.test(v) || PAN_REGEX.test(v));
                    break;
                case 'mobile':
                    colSchema = colSchema.test('mobile', 'Enter a valid 10-digit mobile number starting with 6–9', v => !v || MOBILE_REGEX.test(v));
                    break;
                case 'email':
                    colSchema = colSchema.test('email', 'Enter a valid email address', v => !v || EMAIL_REGEX.test(v));
                    break;
                default:
                    break;
            }
            acc[col.key] = colSchema;
            return acc;
        }, {});
        const conditionalCols = field.columns.filter(c => c.requiredIfAnyOtherFilled);
        const allDataColKeys = field.columns
            .filter(c => c.type !== 'serial' && c.type !== 'checkbox')
            .map(c => c.key);

        const dupCheckCols = field.columns
            .filter(c => c.validation === 'pan' || c.validation === 'din')
            .map(c => ({ key: c.key, label: c.validation === 'pan' ? 'PAN' : 'DIN' }));

        const baseSchema = conditionalCols.length > 0
            ? (Yup.array().of(Yup.object().shape(rowShape)) as unknown as Yup.ArraySchema<any, any>).test(
                'required-if-row-has-data',
                'Required fields missing',
                function checkRowRequired(rows: any) {
                    if (!rows) return true;
                    const errs: Yup.ValidationError[] = [];
                    (rows as any[]).forEach((row: any, idx: number) => {
                        const rowHasData = allDataColKeys.some(k => row?.[k] && String(row[k]).trim());
                        if (!rowHasData) return;
                        conditionalCols.forEach(col => {
                            const val = row?.[col.key];
                            if (!val || !String(val).trim()) {
                                errs.push(this.createError({
                                    path: `${this.path}[${idx}].${col.key}`,
                                    message: `${col.label} is required`,
                                }));
                            }
                        });
                    });
                    if (errs.length > 0) throw new Yup.ValidationError(errs);
                    return true;
                },
            )
            : Yup.array().of(Yup.object().shape(rowShape));

        return dupCheckCols.reduce<Yup.Schema>(
            (schema, { key: colKey, label }) =>
                (schema as Yup.ArraySchema<any, any>).test(
                    `unique-row-${colKey}`,
                    `Duplicate ${label}`,
                    function checkUnique(rows: any) {
                        if (!rows) return true;
                        const seen = new Map<string, number>();
                        const errs: Yup.ValidationError[] = [];
                        (rows as any[]).forEach((row: any, idx: number) => {
                            const val: string | undefined = row?.[colKey];
                            if (!val) return;
                            if (seen.has(val)) {
                                errs.push(this.createError({ path: `${this.path}[${idx}].${colKey}`, message: `Duplicate ${label} — each entry must be unique` }));
                                const firstIdx = seen.get(val)!;
                                if (!errs.some(e => e.path === `${this.path}[${firstIdx}].${colKey}`)) {
                                    errs.push(this.createError({ path: `${this.path}[${firstIdx}].${colKey}`, message: `Duplicate ${label} — each entry must be unique` }));
                                }
                            } else {
                                seen.set(val, idx);
                            }
                        });
                        if (errs.length > 0) throw new Yup.ValidationError(errs);
                        return true;
                    },
                ),
            baseSchema,
        );
    }

    if (field.type === 'checkbox') {
        return field.required
            ? Yup.boolean().oneOf([true], `Please confirm ${(field.label ?? '').toLowerCase()}`)
            : Yup.boolean();
    }

    if (field.type === 'multiselect') {
        const arr = Yup.array().of(Yup.string());
        return field.required
            ? arr.min(1, `Please select at least one ${(field.label ?? '').toLowerCase()}`)
            : arr;
    }

    const labelLower = (field.label ?? '').toLowerCase().replace(/\(([a-z]+)\)/g, (_, acronym) => `(${acronym.toUpperCase()})`);
    const isSelectLike = field.type === 'select' || field.type === 'date';
    const requiredMessage = isSelectLike
        ? `Please select ${labelLower}`
        : `Please enter ${labelLower}`;

    const isAmountOrFixed = field.allowNumbersOnly || field.allowTwoDecimalsOnly ||
        field.validation === 'mobile' || field.validation === 'pan' || field.validation === 'tan' ||
        field.validation === 'gst' || field.validation === 'din' || field.validation === 'dinPan' ||
        field.validation === 'cin' || field.validation === 'ifsc' || field.validation === 'email' ||
        field.type === 'number' || field.type === 'phone' || field.type === 'email' ||
        field.type === 'select' || field.type === 'date';

    let schema: Yup.StringSchema = Yup.string();

    if (field.required) {
        schema = schema.required(requiredMessage);
    }

    switch (field.validation) {
        case 'pan':
            schema = schema.test('pan-format', 'Please enter a valid PAN (e.g. ABCDE1234F)', v => !v || PAN_REGEX.test(v));
            break;
        case 'tan':
            schema = schema.test('tan-format', 'Please enter a valid TAN (e.g. ABCD12345E)', v => !v || TAN_REGEX.test(v));
            break;
        case 'gst':
            schema = schema.test('gst-format', 'Please enter a valid GSTIN (15 characters)', v => !v || GST_REGEX.test(v));
            break;
        case 'email':
            schema = schema.email('Please enter a valid email').matches(EMAIL_REGEX, 'Please enter a valid email');
            break;
        case 'mobile':
            if (field.required) {
                schema = schema.required('Please enter the mobile number');
            }
            schema = schema.matches(MOBILE_REGEX, 'Please enter a valid 10-digit mobile number');
            break;
        case 'numeric':
            schema = schema.matches(/^\d+$/, 'Please enter a valid number');
            break;
        case 'alphaSpace':
            schema = schema
                .test('no-consecutive-spaces', 'Cannot contain consecutive spaces', v => !v || !/\s{2,}/.test(v))
                .test('only-alpha-space', 'Only alphabets and spaces allowed', v => !v || /^[a-zA-Z\s]*$/.test(v));
            break;
        case 'fullName':
            schema = schema
                .test('no-consecutive-spaces', 'Cannot contain consecutive spaces', v => !v || !/\s{2,}/.test(v))
                .test('only-alpha-space', 'Only alphabets and spaces allowed', v => !v || /^[a-zA-Z\s]*$/.test(v))
                .test('has-space', 'Please enter a full name (first and last name)', v => !v || /\s/.test(v.trim()));
            break;
        case 'ifsc':
            schema = schema.test('ifsc-format', 'Please enter a valid IFSC code (e.g. SBIN0001234)', v => !v || IFSC_REGEX.test(v));
            break;
        case 'cin':
            schema = schema.length(21, 'CIN must be 21 characters').matches(CIN_REGEX, 'Invalid CIN format');
            break;
        case 'dinPan':
            schema = schema.test('din-pan-format', 'Please enter a valid DIN (8 digits) or PAN (e.g. ABCDE1234F)', v => !v || DIN_REGEX.test(v) || PAN_REGEX.test(v));
            break;
        case 'din':
            schema = schema.test('din-format', 'Please enter a valid 8-digit DIN', v => !v || DIN_REGEX.test(v));
            break;
        default:
            if (!isAmountOrFixed) {
                schema = schema
                    .test('no-edge-whitespace', `${field.label ?? 'This field'} cannot start or end with whitespace`, v => !v || v == null || (!/^\s/.test(v) && !/\s$/.test(v)))
                    .test('no-consecutive-spaces', `${field.label ?? 'This field'} cannot contain consecutive spaces`, v => !v || !/\s{2,}/.test(v))
                    .test('not-only-whitespace', `${field.label ?? 'This field'} cannot be only whitespace`, v => !v || v == null || !/^\s*$/.test(v));
            }
    }

    if (field.maxLength) {
        schema = schema.max(field.maxLength, `Maximum ${field.maxLength} characters`);
    }

    if (field.allowAlphabetsAndNumbersOnly) {
        schema = schema.matches(/^[a-zA-Z0-9]*$/, `${field.label ?? 'This field'} must contain only letters and numbers`);
    }

    if (field.allowAlphabetsSpaceAndNumbers) {
        schema = schema
            .matches(/^[a-zA-Z0-9 ]*$/, `${field.label ?? 'This field'} must contain only letters, numbers, and spaces`)
            .test('has-letter', `Please enter a valid ${(field.label ?? 'value').toLowerCase()}`, v => !v || /[a-zA-Z]/.test(v));
    }

    if (field.allowAlphabetsNumberAndSpecialCharacters) {
        const allowed = field.allowAlphabetsNumberAndSpecialCharacters.map(c => c.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('');
        schema = schema
            .test('has-letter', `${field.label ?? 'This field'} must contain at least one letter`, v => !v || /[a-zA-Z]/.test(v))
            .matches(new RegExp(`^[a-zA-Z0-9 ${allowed}]*$`), `${field.label ?? 'This field'} contains invalid characters`);
    }

    if (!isAmountOrFixed) {
        schema = schema.test('min-length', `${field.label ?? 'This field'} must be at least 3 characters`, v => !v || v.trim().length >= 3);
    }

    if (field.minValue !== undefined) {
        const min = field.minValue;
        schema = schema.test('min-value', `Value must be greater than ${min}`, v => {
            if (!v || v.trim() === '') return true; // empty handled by required
            const num = Number(v);
            return !Number.isNaN(num) && num > min;
        });
    }

    return schema;
}

export function buildInfoSchema(fields: FieldDef[]): Yup.ObjectSchema<Record<string, any>> {
    const shape = fields.reduce<Record<string, Yup.Schema>>((acc, field) => {
        if (field.type !== 'note') acc[field.key] = buildFieldSchema(field);
        return acc;
    }, {});

    // Collect keys needed for cross-field PAN uniqueness
    const topLevelPanFields = fields.filter(f => f.type !== 'repeatable-table' && f.validation === 'pan').map(f => f.key);
    // Also collect dinPan fields (signatory) for cross-field check against company PAN
    const topLevelDinPanFields = fields.filter(f => f.type !== 'repeatable-table' && f.validation === 'dinPan').map(f => f.key);
    const tablesPanCols: Array<{ tableKey: string; colKey: string }> = fields
        .filter(f => f.type === 'repeatable-table' && f.columns?.some(c => c.validation === 'pan'))
        .flatMap(f =>
            (f.columns ?? [])
                .filter(c => c.validation === 'pan')
                .map(c => ({ tableKey: f.key, colKey: c.key })),
        );

    let schema = Yup.object().shape(shape) as Yup.ObjectSchema<Record<string, any>>;

    if (topLevelPanFields.length > 0 && (tablesPanCols.length > 0 || topLevelDinPanFields.length > 0)) {
        schema = schema.test(
            'cross-field-pan-unique',
            'PAN cannot be the same as the Company PAN',
            function crossFieldPanUnique(values) {
                if (!values) return true;
                const topPans = topLevelPanFields.map(k => (values as any)[k]).filter(Boolean) as string[];
                const errors: Yup.ValidationError[] = [];

                // Check table PANs against company PAN
                tablesPanCols.forEach(({ tableKey, colKey }) => {
                    const rows: any[] = (values as any)[tableKey] ?? [];
                    rows.forEach((row, idx) => {
                        const val: string | undefined = row?.[colKey];
                        if (val && topPans.includes(val)) {
                            errors.push(
                                this.createError({
                                    path: `${tableKey}[${idx}].${colKey}`,
                                    message: 'PAN cannot be the same as the Company PAN',
                                }),
                            );
                        }
                    });
                });

                // Check signatory DIN/PAN fields against company PAN
                topLevelDinPanFields.forEach(fieldKey => {
                    const val: string | undefined = (values as any)[fieldKey];
                    if (val && topPans.includes(val)) {
                        errors.push(
                            this.createError({
                                path: fieldKey,
                                message: 'Signatory PAN cannot be the same as the Company PAN',
                            }),
                        );
                    }
                });

                if (errors.length > 0) {
                    throw new Yup.ValidationError(errors);
                }
                return true;
            },
        ) as Yup.ObjectSchema<Record<string, any>>;
    }

    // Cross-table PAN uniqueness: check that the same PAN does not appear in multiple tables
    if (tablesPanCols.length > 1) {
        schema = schema.test(
            'cross-table-pan-unique',
            'The same PAN cannot appear in both directors and shareholders',
            function crossTablePanUnique(values) {
                if (!values) return true;
                // Collect all PANs from all tables with their locations
                const panLocations = new Map<string, { tableKey: string; colKey: string; idx: number }>();
                const errors: Yup.ValidationError[] = [];

                tablesPanCols.forEach(({ tableKey, colKey }) => {
                    const rows: any[] = (values as any)[tableKey] ?? [];
                    rows.forEach((row, idx) => {
                        const val: string | undefined = row?.[colKey];
                        if (!val) return;
                        if (panLocations.has(val)) {
                            const first = panLocations.get(val)!;
                            errors.push(
                                this.createError({
                                    path: `${tableKey}[${idx}].${colKey}`,
                                    message: `This PAN is already used in the ${first.tableKey === 'directorsTable' ? 'Directors' : first.tableKey} table`,
                                }),
                            );
                        } else {
                            panLocations.set(val, { tableKey, colKey, idx });
                        }
                    });
                });

                if (errors.length > 0) {
                    throw new Yup.ValidationError(errors);
                }
                return true;
            },
        ) as Yup.ObjectSchema<Record<string, any>>;
    }

    return schema;
}

export function buildInitialValues(fields: FieldDef[], user?: any): Record<string, string | string[] | boolean | Record<string, string | boolean>[]> {
    return fields.reduce<Record<string, string | string[] | boolean | Record<string, string | boolean>[]>>((acc, field) => {
        if (field.type === 'note') {
            // no value
        } else if (field.type === 'repeatable-table') {
            acc[field.key] = [];
        } else if (field.type === 'multiselect') {
            acc[field.key] = [];
        } else if (field.type === 'checkbox') {
            acc[field.key] = false;
        } else {
            acc[field.key] =
                field.prefillFrom === 'user.contactPersonName' && user?.contactPersonName
                    ? (field.prefillDefault ?? user.contactPersonName)
                    : '';
        }
        return acc;
    }, {});
}
