// Per-field validation the component provisions onto the section so the
// engine's generateYupSchema validates each shareholder field like a standard
// field (mirrors the vendor NEW constants). `required` shorthand is used when
// no richer `validation` object is needed.
type FieldValidationSpec = {
    required?: { value: boolean; error_message?: string };
    min?: { value: number; error_message?: string };
    max?: { value: number; error_message?: string };
};

type ComponentFieldSpec = {
    name: string;
    label: string;
    type: string;
    default_value?: string;
    options?: { label: string; value: string }[];
    required?: boolean;
    validation?: FieldValidationSpec;
    hidden?: boolean;
    conditional?: { field: string; operator: string; value: string };
};

// Formik value keys (section field names) each shareholder is stored under.
export const SH = {
    name: 'shareholder_name',
    nationality: 'shareholder_nationality',
    email: 'shareholder_email',
    phone: 'shareholder_phone',
    pan: 'shareholder_pan',
    sharePercent: 'shareholder_share_percent',
    isDirector: 'shareholder_is_director',
} as const;

// Hidden required field the hook keeps in sync ('valid' | '') so the page's
// Yup schema blocks navigation until the shareholding totals 100%.
export const SENTINEL_FIELD = 'shareholders_valid';

export const NATIONALITY_OPTS = [
    { label: 'Indian', value: 'Indian' },
    { label: 'Foreign National', value: 'Foreign' },
];

// Data fields the component collects — mirrors the `fields` spec of the vendor
// registry's `shareholding_pattern` entry (with per-field validation).
export const SHAREHOLDING_FIELD_SPECS: ComponentFieldSpec[] = [
    {
        name: SENTINEL_FIELD,
        label: 'Shareholders validation',
        type: 'text',
        validation: {
            required: {
                value: true,
                error_message:
                    'Total shareholding must equal 100% and every shareholder must hold at least 1 share',
            },
        },
        hidden: true,
    },
    { name: SH.name, label: 'Name', type: 'text', required: true },
    { name: SH.nationality, label: 'Nationality', type: 'text', required: true },
    { name: SH.email, label: 'Email', type: 'email', required: true },
    { name: SH.phone, label: 'Phone', type: 'phone', required: true },
    { name: SH.pan, label: 'PAN / Passport', type: 'text', required: true },
    {
        name: SH.sharePercent,
        label: '% Holding',
        type: 'number',
        validation: {
            required: { value: true },
            min: { value: 0, error_message: '% holding cannot be negative' },
            max: { value: 100, error_message: '% holding cannot exceed 100' },
        },
    },
    { name: SH.isDirector, label: 'Is Director', type: 'checkbox' },
];
