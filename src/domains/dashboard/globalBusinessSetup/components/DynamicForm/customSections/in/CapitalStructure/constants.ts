type ComponentFieldSpec = {
    name: string;
    label: string;
    type: string;
    default_value?: string;
    options?: { label: string; value: string }[];
    required?: boolean;
    hidden?: boolean;
    conditional?: { field: string; operator: string; value: string };
};

// Data fields the Capital Structure component manages. Auto-provisioned as real
// fields on the section, so the inputs are stored via the normal field path. The
// hidden sentinel field stays empty while any cross-field rule fails, so its
// required-validation blocks navigation until the capital structure is consistent.
export const CAPITAL_FIELD_SPECS: ComponentFieldSpec[] = [
    { name: 'authorized_capital', label: 'Authorized Capital', type: 'number', required: true },
    { name: 'paid_up_capital', label: 'Paid-up Capital', type: 'number', required: true },
    { name: 'face_value_per_share', label: 'Face Value per Share', type: 'number', required: true },
    {
        name: 'capital_cross_valid',
        label: 'Capital cross-field validation',
        type: 'text',
        required: true,
        hidden: true,
    },
];
