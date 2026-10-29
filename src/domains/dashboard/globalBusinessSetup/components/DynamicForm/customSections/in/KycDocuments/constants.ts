// Legacy (non-repeater) sections provision one numbered block per director.
export const MAX_DIRECTORS = 100;

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

// Hidden text field used as a conditional gate for Yup — set programmatically by the component.
const ctrl = (name: string): ComponentFieldSpec => ({
    name,
    label: name,
    type: 'text',
    hidden: true,
    required: false,
});

const directorFields = (i: number): ComponentFieldSpec[] => [
    ctrl(`ctrl_dir_${i}`),
    ctrl(`ctrl_indian_${i}`),
    ctrl(`ctrl_foreign_${i}`),
    {
        name: `director_${i}_photo`,
        label: `Director ${i + 1} Photo`,
        type: 'image',
        required: true,
        conditional: { field: `ctrl_dir_${i}`, operator: 'equals', value: 'yes' },
    },
    {
        name: `director_${i}_proof_identity`,
        label: `Director ${i + 1} Proof of Identity`,
        type: 'file',
        required: true,
        conditional: { field: `ctrl_indian_${i}`, operator: 'equals', value: 'yes' },
    },
    {
        name: `director_${i}_proof_address`,
        label: `Director ${i + 1} Proof of Address`,
        type: 'file',
        required: true,
        conditional: { field: `ctrl_indian_${i}`, operator: 'equals', value: 'yes' },
    },
    {
        name: `director_${i}_passport`,
        label: `Director ${i + 1} Passport`,
        type: 'file',
        required: true,
        conditional: { field: `ctrl_foreign_${i}`, operator: 'equals', value: 'yes' },
    },
];

// Legacy (repeater-off) data fields — one numbered block per director. Kept for
// the KycLegacy path; the hidden ctrl_* gates drive conditional (Yup) validation
// of the office and per-director document fields.
export const KYC_LEGACY_FIELD_SPECS: ComponentFieldSpec[] = [
    ctrl('ctrl_has_office'),
    ctrl('ctrl_office_owned'),
    ctrl('ctrl_office_rented'),
    {
        name: 'noc_from_owner',
        label: 'NOC from Owner',
        type: 'file',
        required: true,
        conditional: { field: 'ctrl_has_office', operator: 'equals', value: 'yes' },
    },
    {
        name: 'title_utility_doc',
        label: 'Title Document or Utility Bill',
        type: 'file',
        required: true,
        conditional: { field: 'ctrl_office_owned', operator: 'equals', value: 'yes' },
    },
    {
        name: 'utility_bill',
        label: 'Utility Bill',
        type: 'file',
        required: true,
        conditional: { field: 'ctrl_office_rented', operator: 'equals', value: 'yes' },
    },
    {
        name: 'rent_lease_deed',
        label: 'Rent / Lease Deed',
        type: 'file',
        required: true,
        conditional: { field: 'ctrl_office_rented', operator: 'equals', value: 'yes' },
    },
    {
        name: 'name_availability_cert',
        label: 'Name Availability Certificate',
        type: 'file',
        required: true,
    },
    {
        name: 'trademark_certificate',
        label: 'Trademark Certificate',
        type: 'file',
        required: false,
    },
    ...Array.from({ length: MAX_DIRECTORS }, (_, i) => directorFields(i)).flat(),
];

/**
 * Repeater mode: one instance per director/partner (count driven by the mapped
 * director data / admin-selected field_value source). Director docs are
 * per-instance and validated per instance; the one-time documents (registered
 * office, name approval) live on instance 0, rendered inline below the director
 * blocks, and are enforced by the hidden `kyc_docs_valid` sentinel instead of
 * per-field `required` (which would wrongly apply to every instance).
 *
 * This single-instance spec is what the registry provisions for repeater mode.
 */
export const KYC_FIELD_SPECS: ComponentFieldSpec[] = [
    {
        name: 'kyc_docs_valid',
        label: 'KYC documents validation',
        type: 'text',
        required: true,
        hidden: true,
    },
    ctrl('ctrl_indian'),
    ctrl('ctrl_foreign'),
    // Mirrored from the mapped director/partner section so each instance shows
    // who it belongs to.
    { name: 'director_name', label: 'Name', type: 'text' },
    {
        name: 'director_photo',
        label: 'Photo',
        type: 'image',
        required: true,
    },
    {
        name: 'director_proof_identity',
        label: 'Proof of Identity',
        type: 'file',
        required: true,
        conditional: { field: 'ctrl_indian', operator: 'equals', value: 'yes' },
    },
    {
        name: 'director_proof_address',
        label: 'Proof of Address',
        type: 'file',
        required: true,
        conditional: { field: 'ctrl_indian', operator: 'equals', value: 'yes' },
    },
    {
        name: 'director_passport',
        label: 'Passport',
        type: 'file',
        required: true,
        conditional: { field: 'ctrl_foreign', operator: 'equals', value: 'yes' },
    },
    // One-time documents — stored on instance 0, enforced by the sentinel.
    { name: 'noc_from_owner', label: 'NOC from Owner', type: 'file' },
    { name: 'title_utility_doc', label: 'Title Document or Utility Bill', type: 'file' },
    { name: 'utility_bill', label: 'Utility Bill', type: 'file' },
    { name: 'rent_lease_deed', label: 'Rent / Lease Deed', type: 'file' },
    { name: 'name_availability_cert', label: 'Name Availability Certificate', type: 'file' },
    { name: 'trademark_certificate', label: 'Trademark Certificate', type: 'file' },
];
