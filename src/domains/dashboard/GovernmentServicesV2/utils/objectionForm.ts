import { ObjectionApplicantDetailsValues } from '../types';

export const OBJECTION_STEP_TITLES = ['Application Details', 'Preview'];

// Vendor's own salutation list for the Objection Smart Form — deliberately different from
// Trademark Registration's own copy (that one has "M/s.", this one has "Dr."/"Miss."/"Prof."
// instead), so each keeps its own list rather than sharing one.
export const SALUTATION_OPTIONS = [
    { label: 'Mr.', value: 'Mr.' },
    { label: 'Mrs.', value: 'Mrs.' },
    { label: 'Dr.', value: 'Dr.' },
    { label: 'Ms.', value: 'Ms.' },
    { label: 'Miss.', value: 'Miss.' },
    { label: 'Prof.', value: 'Prof.' },
];

// Vendor's real ground-of-objection master list — value is the exact string the Smart Form's
// objection_section[] payload field expects (see submitTrademarkFilingV2's Objection branch).
export const OBJECTION_SECTION_OPTIONS = [
    { label: 'Section 9(1)(a)', value: '9(1)(a)' },
    { label: 'Section 9(1)(b)', value: '9(1)(b)' },
    { label: 'Section 9(1)(c)', value: '9(1)(c)' },
    { label: 'Section 9(2)(a)', value: '9(2)(a)' },
    { label: 'Section 9(2)(b)', value: '9(2)(b)' },
    { label: 'Section 9(2)(c)', value: '9(2)(c)' },
    { label: 'Section 9(2)(d)', value: '9(2)(d)' },
    { label: 'Section 9(3)', value: '9(3)' },
    { label: 'Section 11(1)', value: '11(1)' },
    { label: 'Other Objection', value: 'Other Objection' },
];

// Vendor's real proof-available master list — value is the exact string the Smart Form's
// proofs_available[] payload field expects, no separate code.
export const PROOF_AVAILABLE_OPTIONS = [
    { label: 'Menu Card', value: 'Menu Card' },
    { label: 'Brochure', value: 'Brochure' },
    { label: 'Newspaper Advertisement', value: 'Newspaper Advertisement' },
    { label: 'Social Media Page', value: 'Social Media Page' },
    { label: 'Product Image', value: 'Product Image' },
    { label: 'Sales Invoice', value: 'Sales Invoice' },
    { label: 'Bills', value: 'Bills' },
    { label: 'MSME Certificate with Brand', value: 'MSME Certificate with Brand' },
    { label: 'FSSAI Certificate with Brand', value: 'FSSAI Certificate with Brand' },
    { label: 'Domain Registration', value: 'Domain Registration' },
    { label: 'Website Screenshot', value: 'Website Screenshot' },
];

export const EMPTY_OBJECTION_VALUES: ObjectionApplicantDetailsValues = {
    applicationNumber: '',
    brand: '',
    trademarkClass: '',
    applicationDate: '',
    noticeDate: '',
    applicantName: '',
    applicantAddress: '',
    salutation: '',
    authorizedPerson: '',
    objectionSections: [],
    proofAvailable: [],
};
