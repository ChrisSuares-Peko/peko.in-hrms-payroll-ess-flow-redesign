// Constants for the Proprietor KYC step (Figma 1808:21171).

export const KYC_TITLE = 'Proprietor KYC';
export const KYC_SUBTITLE = 'Proprietor identity and PAN details';

export const numberRangeOptions = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => ({
        label: String(from + i),
        value: from + i,
    }));

// Companies Act limits for Private Limited.
export const PVT_DIRECTOR_LIMITS = { min: 2, max: 15 };
export const PVT_SHAREHOLDER_LIMITS = { min: 2, max: 200 };

export const NATIONALITY_OPTIONS = [
    { label: 'Indian', value: 'indian' },
    { label: 'Foreign National', value: 'foreign' },
];

// Promoter role (vendor doc "Director Page"). Drives the Shareholder page:
// a "Director" only never appears there; "Director and Shareholder" and
// "Director and Representative" both do. NOTE: the vendor will eventually serve
// these values from a related entity (blocker #1) — until then this canonical
// list drives the role rules and the values are FE-only (never sent verbatim).
export const PROMOTER_ROLE = {
    DIRECTOR: 'director',
    DIRECTOR_SHAREHOLDER: 'director_shareholder',
    DIRECTOR_REPRESENTATIVE: 'director_representative',
    // Non-director promoters (vendor review 2026): a pure shareholder or a pure
    // body-corporate representative — no directorship, so no DIN.
    SHAREHOLDER: 'shareholder',
    REPRESENTATIVE: 'representative',
} as const;

export const PROMOTER_TYPE_OPTIONS = [
    { label: 'Director', value: PROMOTER_ROLE.DIRECTOR },
    { label: 'Director and Shareholder', value: PROMOTER_ROLE.DIRECTOR_SHAREHOLDER },
    { label: 'Director and Representative', value: PROMOTER_ROLE.DIRECTOR_REPRESENTATIVE },
    { label: 'Shareholder', value: PROMOTER_ROLE.SHAREHOLDER },
    { label: 'Representative', value: PROMOTER_ROLE.REPRESENTATIVE },
];

// LLP partner designations (vendor doc, 2026-08-17). Reuses the `promoterType`
// field; only the "Designated Partner" variants carry a DIN/DPIN.
export const LLP_DESIGNATION = {
    DESIGNATED_PARTNER: 'designated_partner',
    PARTNER: 'partner',
    PARTNER_REPRESENTATIVE: 'partner_representative',
    DESIGNATED_PARTNER_REPRESENTATIVE: 'designated_partner_representative',
} as const;

export const LLP_DESIGNATION_OPTIONS = [
    { label: 'Designated Partner', value: LLP_DESIGNATION.DESIGNATED_PARTNER },
    { label: 'Partner', value: LLP_DESIGNATION.PARTNER },
    { label: 'Partner and Representative', value: LLP_DESIGNATION.PARTNER_REPRESENTATIVE },
    {
        label: 'Designated Partner and Representative',
        value: LLP_DESIGNATION.DESIGNATED_PARTNER_REPRESENTATIVE,
    },
];

// A designated partner (DIN/DPIN required) — the plain "Partner" variants aren't.
export const isDesignatedPartnerRole = (role?: string): boolean =>
    role === LLP_DESIGNATION.DESIGNATED_PARTNER ||
    role === LLP_DESIGNATION.DESIGNATED_PARTNER_REPRESENTATIVE;

// A role that makes the person a SHAREHOLDER (shown on the Shareholder page and
// counted toward the shareholder minimum). Everyone except a pure "Director".
export const isShareholderRole = (role?: string): boolean =>
    role === PROMOTER_ROLE.DIRECTOR_SHAREHOLDER ||
    role === PROMOTER_ROLE.DIRECTOR_REPRESENTATIVE ||
    role === PROMOTER_ROLE.SHAREHOLDER ||
    role === PROMOTER_ROLE.REPRESENTATIVE;

// A role whose person represents a body corporate (needs the represented
// company's details captured — "Director and Representative" or "Representative").
export const isRepresentativeRole = (role?: string): boolean =>
    role === PROMOTER_ROLE.DIRECTOR_REPRESENTATIVE || role === PROMOTER_ROLE.REPRESENTATIVE;

// A role that IS a director (counts toward the min-2-directors requirement).
// Pure Shareholder / Representative are NOT directors.
export const isDirectorRole = (role?: string): boolean =>
    role === PROMOTER_ROLE.DIRECTOR ||
    role === PROMOTER_ROLE.DIRECTOR_SHAREHOLDER ||
    role === PROMOTER_ROLE.DIRECTOR_REPRESENTATIVE;

// Roles subject to the "max 3 promoters without a DIN" cap (Summary of Changes:
// only "Director" and "Director and Shareholder" — NOT Director and Representative).
export const isDinLimitedRole = (role?: string): boolean =>
    role === PROMOTER_ROLE.DIRECTOR || role === PROMOTER_ROLE.DIRECTOR_SHAREHOLDER;

// Explicitly a "Director" only → must NOT appear on the Shareholder page. An
// empty role stays included (the default before roles existed), so resumed
// drafts keep showing every director until a role is chosen.
export const isDirectorOnly = (role?: string): boolean => role === PROMOTER_ROLE.DIRECTOR;

// Mirrors the vendor's strict salutation enum (people API): Mr., Mrs., Miss.,
// Ms., Dr., Prof. — the BE maps these values to the dotted format.
export const SALUTATION_OPTIONS = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof'].map(s => ({
    label: s,
    value: s.toLowerCase(),
}));

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'].map(s => ({
    label: s,
    value: s.toLowerCase(),
}));

// Vendor-defined enums (people API, doc §14.2) — values are sent VERBATIM to
// the vendor, so they must match the doc's strings exactly.
export const QUALIFICATION_OPTIONS = [
    'None',
    'Primary Education',
    'Secondary Education',
    'Vocational/Technical Qualification',
    'Diploma',
    "Bachelor's Degree",
    "Master's Degree",
    'Doctorate or Higher',
    'Professional Certification/Licensure',
    'Other',
].map(s => ({ label: s, value: s }));

export const OCCUPATION_OPTIONS = [
    'Business Owner',
    'Professional',
    'Government Employee',
    'Private Sector Employee',
    'Homemaker',
    'Student',
    'Retired',
    'Unemployed',
    'Other',
].map(s => ({ label: s, value: s }));

export const VIDEO_KYC_NOTE =
    'On submission, a video KYC request is triggered for this person. They will receive an email with a secure link to complete their video KYC.';

export const IMPORTANT_REQUIREMENTS = [
    'Each promoter must provide a unique email address and mobile number — shared or common contact details are not permitted',
    'Digital Signature Certificates (DSC) are arranged by your Relationship Manager after submission — no action needed now',
    'Foreign directors require additional documentation and review',
];

// Partnership wording — promoter/director → partner (no DSC/company concepts).
export const PARTNERSHIP_IMPORTANT_REQUIREMENTS = [
    'Each partner must provide a unique email address and mobile number — shared or common contact details are not permitted',
    'Digital Signature Certificates (DSC) are arranged by your Relationship Manager after submission — no action needed now',
    'Foreign partners require additional documentation and review',
];

// Placeholder RM details — replaced by the assigned RM from the API later.
export const RELATIONSHIP_MANAGER = {
    name: 'Priya Nair',
    role: 'Relationship Manager — Incorporation',
    phone: '+91 98450 12345',
    email: 'priya.nair@peko.one',
    status: 'Ongoing',
    statusNote: 'KYC links sent to directors — awaiting completion of video KYC.',
    nextUpdate: '2026-06-25',
    footerNote: 'Your RM will guide you through the rest of the registration. Reach out anytime.',
};
