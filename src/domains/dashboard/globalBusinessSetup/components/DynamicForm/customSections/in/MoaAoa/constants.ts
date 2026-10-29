export type ObjectTemplate = { key: string; label: string; clause: string };

export const OBJECT_TEMPLATES: ObjectTemplate[] = [
    {
        key: 'service_provider',
        label: 'Service Provider',
        clause: 'To carry on the business of providing professional services, consulting services, management services, technical services, advisory services, and all related support services of every description.',
    },
    {
        key: 'trading',
        label: 'Trading',
        clause: 'To carry on the business of buying, selling, importing, exporting, distributing, and dealing in goods, merchandise, commodities, and products of every kind and description.',
    },
    {
        key: 'manufacturing',
        label: 'Manufacturing',
        clause: 'To carry on the business of manufacturing, producing, processing, assembling, and fabricating goods, products, and articles of every kind and description.',
    },
    {
        key: 'ecommerce',
        label: 'E-Commerce',
        clause: 'To carry on the business of electronic commerce, online retail, and digital marketplaces, and to sell and distribute goods and services through electronic and digital platforms.',
    },
    {
        key: 'real_estate',
        label: 'Real Estate',
        clause: 'To carry on the business of real estate development, construction, buying, selling, leasing, and management of land, buildings, and immovable properties of every description.',
    },
];

export type AncillaryObject = { key: string; label: string; default: boolean };

export const ANCILLARY_OBJECTS: AncillaryObject[] = [
    {
        key: 'licenses',
        label: 'To acquire, purchase, or otherwise obtain licenses, permits, and registrations necessary for the business',
        default: true,
    },
    {
        key: 'contracts',
        label: 'To enter into contracts, agreements, and arrangements with any person or company for business purposes',
        default: true,
    },
    {
        key: 'borrow',
        label: 'To borrow or raise money in such manner as the Company shall think fit for the purpose of the business',
        default: false,
    },
    {
        key: 'invest',
        label: 'To invest surplus funds of the Company in securities, properties, or other investments as the Board thinks fit',
        default: true,
    },
    {
        key: 'properties',
        label: 'To acquire, hold, and dispose of movable and immovable properties required for the business',
        default: false,
    },
    {
        key: 'goods',
        label: 'To import, export, buy, sell, and deal in goods, materials, and articles as required by the business',
        default: true,
    },
    {
        key: 'franchises',
        label: 'To grant or acquire franchises, licenses, and distribution rights from or to any person or company',
        default: false,
    },
    {
        key: 'collaborate',
        label: 'To collaborate, partner, or form joint ventures with other entities for business purposes',
        default: true,
    },
    {
        key: 'ip',
        label: 'To acquire, protect, and exploit patents, trademarks, copyrights, and other intellectual property rights',
        default: false,
    },
    {
        key: 'rnd',
        label: 'To undertake research and development activities related to the business of the Company',
        default: false,
    },
    {
        key: 'welfare',
        label: 'To provide employee welfare, training, and development programs for the staff of the Company',
        default: false,
    },
    {
        key: 'marketing',
        label: 'To undertake marketing, advertising, and promotional activities to further the business of the Company',
        default: true,
    },
];

// Clause text keyed by template key. Labels and template keys come from the API (section.fields);
// only the clause text is hardcoded here because the API does not carry it.
export const CLAUSE_MAP: Record<string, string> = Object.fromEntries(
    OBJECT_TEMPLATES.map(t => [t.key, t.clause])
);

export const WHATS_NEXT: string[] = [
    'Draft MOA and AOA will be prepared based on your inputs',
    "You'll review and approve the drafts before e-filing",
    'Both documents will be digitally signed by all directors',
    'Final versions will be submitted to MCA as part of SPICe+ form',
];

type ComponentFieldSpec = {
    name: string;
    label: string;
    type: string;
    default_value?: string;
    options?: { label: string; value: string }[];
    required?: boolean;
    conditional?: { field: string; operator: string; value: string };
    hidden?: boolean;
};

// Data fields the MOA & AOA component manages. Auto-provisioned as real fields on
// the section, so the component's selections are stored via the normal field path.
const DOC_CHOICE_OPTIONS = [
    { label: 'Standard', value: 'standard' },
    { label: 'Custom', value: 'custom' },
];

export const MOA_FIELD_SPECS: ComponentFieldSpec[] = [
    {
        name: 'moa_type',
        label: 'MOA Type',
        type: 'radio',
        default_value: 'standard',
        options: DOC_CHOICE_OPTIONS,
        required: true,
        hidden: true,
    },
    {
        name: 'object_template',
        label: 'MOA Object Template',
        type: 'radio',
        default_value: OBJECT_TEMPLATES[0].key,
        options: OBJECT_TEMPLATES.map(t => ({ label: t.label, value: t.key })),
        hidden: true,
    },
    {
        name: 'main_object_clause',
        label: 'Main Object Clause',
        type: 'textarea',
        default_value: OBJECT_TEMPLATES[0].clause,
        hidden: true,
    },
    // One checkbox field per ancillary object (instead of a single checkbox group).
    ...ANCILLARY_OBJECTS.map(
        (o): ComponentFieldSpec => ({
            name: `ancillary_${o.key}`,
            label: o.label,
            type: 'checkbox',
            default_value: o.default ? 'true' : 'false',
            hidden: true,
        })
    ),
    {
        name: 'custom_moa_file',
        label: 'Custom MOA Document',
        type: 'file',
        required: true,
        conditional: { field: 'moa_type', operator: 'equals', value: 'custom' },
    },
    {
        name: 'generated_moa_file',
        label: 'Generated MOA (PDF)',
        type: 'file',
        conditional: { field: 'moa_type', operator: 'equals', value: 'standard' },
    },
    {
        name: 'aoa_type',
        label: 'AOA Type',
        type: 'radio',
        default_value: 'standard',
        options: DOC_CHOICE_OPTIONS,
        required: true,
        hidden: true,
    },
    {
        name: 'custom_aoa_file',
        label: 'Custom AOA Document',
        type: 'file',
        required: true,
        conditional: { field: 'aoa_type', operator: 'equals', value: 'custom' },
    },
    {
        name: 'generated_aoa_file',
        label: 'Generated AOA (PDF)',
        type: 'file',
        conditional: { field: 'aoa_type', operator: 'equals', value: 'standard' },
    },
    {
        name: 'confirmed',
        label: 'MOA & AOA confirmation',
        type: 'checkbox',
        default_value: 'false',
        required: true,
        hidden: true,
    },
];
