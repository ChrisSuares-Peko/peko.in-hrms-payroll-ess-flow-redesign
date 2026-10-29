import { EntityType } from '../types';

// People that make up the shareholding pattern. Private Limited / LLP use the
// single Promoters list (`directors`), which now holds every promoter type
// (Director, Director & Shareholder/Representative, Shareholder, Representative);
// OPC has its single member. Order matters — the backend chain aligns
// shareholding rows by the same index order.
export const shareholdingPeople = (values: Record<string, unknown>): unknown[] => {
    if (
        values.entityType === EntityType.PRIVATE_LIMITED ||
        values.entityType === EntityType.LLP
    ) {
        return (values.directors as unknown[]) || [];
    }
    return [values.director];
};

// A shareholding row: shares typed for the person at the same index; directors
// can be EXCLUDED (a director need not hold shares).
export const shareholdingRow = (
    values: Record<string, unknown>,
    index: number
): { shares: number; excluded: boolean } => {
    const row = (values.shareholding as Record<string, { shares?: unknown; excluded?: boolean }>)?.[
        index
    ];
    return { shares: Number(row?.shares) || 0, excluded: Boolean(row?.excluded) };
};

// Total allotted shares across non-excluded rows.
export const shareholdingTotal = (values: Record<string, unknown>): number =>
    shareholdingPeople(values).reduce<number>((sum, _, i) => {
        const { shares, excluded } = shareholdingRow(values, i);
        return excluded ? sum : sum + shares;
    }, 0);

// A blank person (director / nominee / shareholder) for KYC forms & FieldArrays.
export const EMPTY_PERSON = {
    nationality: '',
    // Country the person LIVES in — drives the address behaviour (India = PIN
    // lookup, else manual), separate from nationality which drives the identity
    // proof (PAN vs passport). Defaults to India.
    residency: 'INDIA',
    pan: '',
    // The PAN value that was successfully verified against the vendor. Verify is
    // mandatory: the person is "verified" only while pan === verifiedPan, so
    // editing the PAN after verifying clears it and forces a re-verify.
    verifiedPan: '',
    // Foreign nationals: passport replaces PAN (vendor doc §14).
    passportNumber: '',
    citizenship: '',
    // Place of birth — vendor fields: birth_place = state, birth_district = district.
    birthPlace: '',
    birthDistrict: '',
    promoterType: '',
    firstName: '',
    middleName: '',
    lastName: '',
    salutation: '',
    fullName: '',
    fathersName: '',
    dob: '',
    qualification: '',
    occupation: '',
    gender: '',
    din: '',
    aadhaar: '',
    email: '',
    isdCode: '91',
    mobile: '',
    // Residential address (vendor doc §14 address block) — feeds the people
    // record, smart form 2 partner/promoter details and the MOA subscribers.
    address: {
        line1: '',
        line2: '',
        pincode: '',
        area: '',
        city: '',
        district: '',
        state: '',
        // Foreign directors live abroad — Indians are implicitly INDIA.
        country: '',
        durationYears: '',
        durationMonths: '',
    },
    // Body corporate a "Director and Representative" represents (vendor doc). For
    // an Indian company the details come from the MCA Name API; for a foreign one
    // they are typed manually. Only captured when promoterType is
    // director_representative. TODO(vendor blocker #1): send to the vendor once
    // they support a body-corporate representative.
    representedCompany: {
        country: 'INDIA',
        name: '',
        cin: '',
        registeredOffice: '',
        contact: '',
    },
};
