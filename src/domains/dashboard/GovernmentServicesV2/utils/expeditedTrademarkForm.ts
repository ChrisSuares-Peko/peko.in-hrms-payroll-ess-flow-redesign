import { ExpeditedApplicantDetailsValues } from '../types';

// Doc §1-3: one combined Application+Applicant Details screen with a live side preview, then an
// overview/confirm screen before filing — same 2-entry shape Protection's own step titles use.
export const EXPEDITED_STEP_TITLES = ['Application Details', 'Preview'];

// Vendor's salutation list for this Smart Form — same set Objection's own uses (Dr./Miss./Prof.
// instead of Registration's "M/s."), kept as its own copy per this feature's own convention.
export const SALUTATION_OPTIONS = [
    { label: 'Mr.', value: 'Mr.' },
    { label: 'Mrs.', value: 'Mrs.' },
    { label: 'Dr.', value: 'Dr.' },
    { label: 'Ms.', value: 'Ms.' },
    { label: 'Miss.', value: 'Miss.' },
    { label: 'Prof.', value: 'Prof.' },
];

export const EMPTY_EXPEDITED_VALUES: ExpeditedApplicantDetailsValues = {
    applicationNumber: '',
    brand: '',
    trademarkClass: '',
    applicationDate: '',
    applicantBusinessId: '',
    applicantName: '',
    entityType: '',
    salutation: '',
    authorizedPerson: '',
    applicantAddress: '',
    declarationReason: '',
};

const normalizeConstitution = (value?: string) => (value ?? '').trim().toLowerCase();

// Doc §2 — Individual/Proprietorship have no separate Authorized Person: the business name itself
// is used automatically and filing continues.
export const isSelfSignedEntity = (constitution?: string) => {
    const normalized = normalizeConstitution(constitution);
    return normalized === 'individual' || normalized === 'proprietorship';
};

// Doc §2 — how Applicant Name is built from the selected business's details:
//   Individual      -> business_name
//   Proprietorship  -> business_name + " Proprietor of " + trade_name (trade_name omitted if missing)
//   Other types     -> business_name
export const deriveExpeditedApplicantName = (business: {
    business_name?: string;
    trade_name?: string;
    constitution?: string;
}) => {
    if (normalizeConstitution(business.constitution) === 'proprietorship') {
        return business.trade_name
            ? `${business.business_name ?? ''} Proprietor of ${business.trade_name}`
            : (business.business_name ?? '');
    }
    return business.business_name ?? '';
};
