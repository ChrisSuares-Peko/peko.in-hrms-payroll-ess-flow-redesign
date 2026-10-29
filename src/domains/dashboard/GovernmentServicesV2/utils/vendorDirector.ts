import { VendorDirector } from '../apis';

export const SALUTATION_OPTIONS = [
    { label: 'Mr.', value: 'Mr.' },
    { label: 'Mrs.', value: 'Mrs.' },
    { label: 'Dr.', value: 'Dr.' },
    { label: 'Ms.', value: 'Ms.' },
    { label: 'Miss.', value: 'Miss.' },
    { label: 'Prof.', value: 'Prof.' },
];

export const QUALIFICATION_OPTIONS = [
    { label: 'None', value: 'None' },
    { label: 'Primary Education', value: 'Primary Education' },
    { label: 'Secondary Education', value: 'Secondary Education' },
    { label: 'Vocational/Technical Qualification', value: 'Vocational/Technical Qualification' },
    { label: 'Diploma', value: 'Diploma' },
    { label: "Bachelor's Degree", value: "Bachelor's Degree" },
    { label: "Master's Degree", value: "Master's Degree" },
    { label: 'Doctorate or Higher', value: 'Doctorate or Higher' },
    { label: 'Professional Certification/Licensure', value: 'Professional Certification/Licensure' },
    { label: 'Other', value: 'Other' },
];

export const OCCUPATION_OPTIONS = [
    { label: 'Business Owner', value: 'Business Owner' },
    { label: 'Professional', value: 'Professional' },
    { label: 'Government Employee', value: 'Government Employee' },
    { label: 'Private Sector Employee', value: 'Private Sector Employee' },
    { label: 'Homemaker', value: 'Homemaker' },
    { label: 'Student', value: 'Student' },
    { label: 'Retired', value: 'Retired' },
    { label: 'Unemployed', value: 'Unemployed' },
    { label: 'Other', value: 'Other' },
];

export const ALLOWED_RELATIONSHIP_ROLES_BY_ENTITY_TYPE: Record<string, string[]> = {
    Proprietorship: ['Proprietor', 'Representative', 'Witness'],
    Partnership: ['Partner', 'Witness'],
    'Partnership Firm': ['Partner', 'Witness'],
    'Limited Liability Partnership': [
        'Designated Partner',
        'Partner',
        'Partner and Representative',
        'Designated Partner and Representative',
        'Witness',
    ],
    'Private Limited Company': [
        'Director',
        'Director and Shareholder',
        'Nominee',
        'Shareholder',
        'Director and Representative',
        'Representative',
        'Witness',
    ],
    'One Person Company': ['Director', 'Director and Shareholder', 'Nominee', 'Shareholder', 'Witness'],
    'Indian Subsidiary': [
        'Director',
        'Director and Shareholder',
        'Nominee',
        'Shareholder',
        'Representative',
        'Director and Representative',
        'Witness',
    ],
    'Nidhi Company': ['Director', 'Director and Shareholder', 'Representative', 'Shareholder', 'Witness'],
    Trust: ['Trustee', 'Witness'],
    'Public Limited Company': [
        'Director',
        'Director and Shareholder',
        'Director and Representative',
        'Representative',
        'Shareholder',
        'Witness',
    ],
    'Section 8 Company': [
        'Director',
        'Director and Shareholder',
        'Director and Representative',
        'Representative',
        'Shareholder',
        'Witness',
    ],
    'Producer Company': [
        'Director',
        'Director and Shareholder',
        'Director and Representative',
        'Representative',
        'Shareholder',
        'Witness',
    ],
};

export const relationshipOptionsForEntityType = (entityType: string) =>
    (ALLOWED_RELATIONSHIP_ROLES_BY_ENTITY_TYPE[entityType] ?? []).map((role) => ({ label: role, value: role }));

export const directorDisplayName = (director: VendorDirector): string => {
    const parts = [director.salutation, director.first_name, director.middle_name, director.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return director.email || director.mobile || 'Director';
};

export const directorOptionValue = (director: VendorDirector, index: number): string =>
    director.people_id ?? director.id ?? `director-${index}`;
