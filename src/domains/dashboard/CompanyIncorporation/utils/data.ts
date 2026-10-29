import { EntityType } from '../types';

export const INDIA_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
].map(s => ({ label: s, value: s.toLowerCase().replace(/\s+/g, '_') }));

// Case-insensitive label filter for the INDIA_STATES Select dropdown.
// Required because INDIA_STATES values are slugged (`andhra_pradesh`) while
// labels stay proper-cased (`Andhra Pradesh`); Antd's default search filter
// matches on value, so typing the visible name wouldn't hit.
export const stateFilterOption = (input: string, option: any): boolean =>
    String(option?.children ?? '').toLowerCase().includes(input.toLowerCase());

export const ENTITY_TYPES = [
    {
        value: EntityType.PRIVATE_LIMITED,
        label: 'Private Limited Company',
        description: '(Most Common)',
        minDirectors: 1,
        maxDirectors: 15,
    },
    {
        value: EntityType.PUBLIC_LIMITED,
        label: 'Public Limited Company',
        description: 'For larger companies',
        minDirectors: 3,
        maxDirectors: 15,
    },
    {
        value: EntityType.OPC,
        label: 'One Person Company (OPC)',
        description: 'For solo entrepreneurs',
        minDirectors: 1,
        maxDirectors: 1,
    },
    {
        value: EntityType.LLP,
        label: 'Limited Liability Partnership (LLP)',
        description: 'Partnership structure',
        minDirectors: 2, // For LLP, these are designated partners
        maxDirectors: 15,
    },
];

export const PROCESS_STEPS = [
    'Basic Details',
    'Directors & DSC/DIN',
    'Capital & Shareholding',
    'Business Activity',
    'MOA & AOA',
    'Document Uploads',
    'Review & Submit',
];

export const ID_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License'];

export const DOCUMENT_TYPES = {
    [EntityType.PRIVATE_LIMITED]: [
        'Proof of Identity (Director)',
        'Proof of Address',
        'MOA & AOA',
        'List of Directors',
    ],
    [EntityType.PUBLIC_LIMITED]: [
        'Proof of Identity (Director)',
        'Proof of Address',
        'MOA & AOA',
        'List of Directors',
        'Memorandum',
    ],
    [EntityType.OPC]: [
        'Proof of Identity (Sole Proprietor)',
        'Proof of Address',
        'MOA & AOA',
    ],
    [EntityType.LLP]: [
        'Proof of Identity (Partner)',
        'Proof of Address',
        'LLP Agreement',
        'List of Partners',
    ],
};

export const POST_INCORPORATION_SERVICES = [
    {
        id: 'open_bank_account',
        name: 'Open Bank Account',
        description: 'Get assistance in opening a current account for your company',
        price: 5000,
    },
    {
        id: 'commencement_business',
        name: 'Commencement of Business',
        description: 'File commencement of business certificate',
        price: 3000,
    },
    {
        id: 'gst_registration',
        name: 'GST Registration',
        description: 'Register for Goods and Services Tax (GST)',
        price: 7000,
    },
];

export const REQUIRED_INFO = [
    '2 proposed company names (avoid names similar to existing companies)',
    'Details of all directors (minimum 2 for private limited)',
    'ID/PAN proofs for directors (PAN, Aadhaar, Passport)',
    'Digital Signature Certificate (DSC) for at least one director',
    'Director Identification Number (DIN) for all directors',
    'Registered office address with proof (rent agreement/utility bill)',
    'Capital structure (authorized and paid-up capital details)',
    'Business activity description and MCA classification codes',
];
