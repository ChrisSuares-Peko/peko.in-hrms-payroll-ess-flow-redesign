// IndiaFilings' Create Business by PAN requires an entity_type — matches the vendor's accepted
// values, including the non-company PAN holder types (Individual/HUF/AOP/BOI/Local Authority/
// Artificial Juridical Person/Government) alongside the business-registration ones (PAN-Based
// Business Entity Classification Logic doc §2). Not exported — only ENTITY_TYPE_OPTIONS (derived
// below) is used outside this file.
//
// 'Individual' confirmed against IndiaFilings_PEKO_API_Integration_Guide_v1.1.pdf Table 14.3
// (Allowed relationship Roles by Entity Type) — it lists the bare entity type as "Individual", not
// "Individual / Person". Live-tested: "Individual / Person" is rejected by /v4/startup (Create
// Business) with EB005 "Please Enter Valid Entity Type"; "Individual" is the documented value.
// The remaining non-company types (HUF/Association of Persons/Local Authority/Artificial Juridical
// Person/Government) are NOT confirmed against that table — its OCR text is visibly misaligned for
// those rows — so they're left as-is pending a live test of each.
const VALID_ENTITIES = [
    'Private Limited Company',
    'Limited Liability Partnership',
    'One Person Company',
    'Partnership',
    'Proprietorship',
    'Section 8 Company',
    'Public Limited Company',
    'Nidhi Company',
    'Producer Company',
    'Trust',
    'Indian Subsidiary',
    'Partnership Firm',
];
export const ENTITY_TYPE_OPTIONS = VALID_ENTITIES.map((entity) => ({ label: entity, value: entity }));


export const deriveEntityTypeFromPan = (pan: string, holderName?: string): string | null => {
    const fourthChar = pan.charAt(3).toUpperCase();
    const name = (holderName ?? '').toUpperCase();
    switch (fourthChar) {
        case 'C': // Company — business name refines which specific company type (doc §4).
            if (name.includes('OPC') || name.includes('ONE PERSON COMPANY')) return 'One Person Company';
            if (name.includes('PRIVATE LIMITED') || name.includes('PVT LTD') || name.includes('PVT. LTD')) {
                return 'Private Limited Company';
            }
            if (name.includes('SECTION 8')) return 'Section 8 Company';
            if (name.includes('NIDHI')) return 'Nidhi Company';
            if (name.includes('PRODUCER')) return 'Producer Company';
            if (name.includes('INDIAN SUBSIDIARY')) return 'Indian Subsidiary';
            // Public Limited check last — Nidhi/Producer/Section 8 companies are also commonly
            // suffixed "Limited" in their legal name (doc §4's ordering note).
            if (name.includes('LIMITED') || name.includes('LTD')) return 'Public Limited Company';
            return null;
        case 'F': // Firm / LLP (doc §5) — "Partnership Firm" here, distinct from the plain
            // "Partnership" option, which stays manual-selection-only.
            if (name.includes('LLP') || name.includes('LIMITED LIABILITY PARTNERSHIP')) {
                return 'Limited Liability Partnership';
            }
            return 'Partnership Firm';
        case 'T': // Trust (doc §7)
            return 'Trust';
        default:
            return null;
    }
};
export interface ProfileValues {
    legalBusinessName: string;
    stateOfRegistration: string;
    name: string;
    email: string;
    phoneNumber: string;
    pan: string;
    entityType: string;
    // GST Registration only (GST_Registration.pdf §A2) — the trade name proposed for the new GST
    // registration, distinct from legalBusinessName (an existing business identity, prefilled
    // from the company profile / a matched vendor business). proposedName is what's actually sent
    // as Create Business's proposed_name for this service; alternateName is carried through to the
    // engagement only, used by the RM if the Proposed Name is unavailable/objected to.
    proposedName: string;
    alternateName: string;
}

export const EMPTY_PROFILE_VALUES: ProfileValues = {
    legalBusinessName: '',
    stateOfRegistration: '',
    name: '',
    email: '',
    phoneNumber: '',
    pan: '',
    entityType: '',
    proposedName: '',
    alternateName: '',
};
