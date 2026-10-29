import {
    gstAddressDetailsSchema,
    gstApplicantDetailsSchema,
    gstDocumentsSchema,
    gstInformationSchema,
    gstReviewSchema,
} from '../schema';
import { GstApplicationValues, GstAuthorizedPerson } from '../types';

// Shared by GstRegistrationForm.tsx and its useGstApplicationData/useGstFormActions hooks — kept
// here (not in the page) so neither hook needs to import from the page component, same reason as
// utils/trademarkForm.ts.

// IndiaFilings' vendor service_id for GST Registration — PPOB (GST_Registration.pdf §E,
// "Service ID: 79"). Distinct from vendorCatalogId (the per-account catalog row id, which is
// numeric and vendor-assigned per purchase) — this is the fixed service the catalog row maps to,
// used to tell GST Registration apart from Trademark and any other service on the same
// govtServicesV2 rails when deciding which registration-form route to send a corporate to.
export const GST_REGISTRATION_SERVICE_ID = 79;

export const isGstRegistrationService = (serviceId?: number | null) =>
    serviceId === GST_REGISTRATION_SERVICE_ID;

export const GST_STEP_TITLES = [
    'Applicant Details',
    'Address Details',
    'GST Information',
    'Documents',
    'Review & Submit',
];

// One schema per data-entry step, matched to currentStep via Formik's validationSchema prop —
// same pattern as trademarkForm.ts's STEP_VALIDATION_SCHEMAS.
export const GST_STEP_VALIDATION_SCHEMAS = [
    gstApplicantDetailsSchema,
    gstAddressDetailsSchema,
    gstInformationSchema,
    gstDocumentsSchema,
    gstReviewSchema,
];

// Documents collected on Step 4 — vendorDocType is the exact vendor doc_name uploadGstDocumentV2
// matches against the service-79 document-type master. Confirmed live 2026-09-29 via
// GET /v4/docs/Service?id=79 (NOT the PAN/Passport Photo personal-KYC checklist Business
// Registration > Proprietorship's DocumentsStep falls back to — that's a different vendor
// service/catalog. GST Registration's own checklist for service 79 is business/address-proof
// documents instead): Electricity Bill, Telephone Bill, Property Tax Receipt, Lease - Rent
// Agreement (address proof — which one applies depends on gst.premises from Step 1), Partnership
// Deed, Incorporation Certificate (business-constitution proof — only relevant for
// partnerships/companies), Legal Ownership Document. The vendor's response has no per-doc
// "mandatory" flag for this service, so Step 4 requires at least one upload overall rather than
// every type — realistically a business only has one applicable address-proof document.
export type GstDocumentKey =
    | 'electricityBill'
    | 'telephoneBill'
    | 'propertyTaxReceipt'
    | 'leaseRentAgreement'
    | 'partnershipDeed'
    | 'incorporationCertificate'
    | 'legalOwnershipDocument';

export const GST_DOCUMENT_TYPES: { key: GstDocumentKey; vendorDocType: string; label: string }[] = [
    { key: 'electricityBill', vendorDocType: 'Electricity Bill', label: 'Electricity Bill' },
    { key: 'telephoneBill', vendorDocType: 'Telephone Bill', label: 'Telephone Bill' },
    {
        key: 'propertyTaxReceipt',
        vendorDocType: 'Property Tax Receipt',
        label: 'Property Tax Receipt',
    },
    {
        key: 'leaseRentAgreement',
        vendorDocType: 'Lease - Rent Agreement',
        label: 'Lease - Rent Agreement',
    },
    { key: 'partnershipDeed', vendorDocType: 'Partnership Deed', label: 'Partnership Deed' },
    {
        key: 'incorporationCertificate',
        vendorDocType: 'Incorporation Certificate',
        label: 'Incorporation Certificate',
    },
    {
        key: 'legalOwnershipDocument',
        vendorDocType: 'Legal Ownership Document',
        label: 'Legal Ownership Document',
    },
];

// Entity types where the CIN/LLPIN + Date of Incorporation section is HIDDEN and never validated
// (GST_Registration.pdf §E1). Kept in sync by hand with schema/index.ts's gstRequiresCinDoi —
// that file can't import this one (this file imports the schemas, not the reverse).
const ENTITY_TYPES_WITHOUT_CIN_DOI = ['proprietorship', 'individual', 'trust', 'partnership'];
export const requiresCinDoi = (entityType?: string) =>
    Boolean(entityType) && !ENTITY_TYPES_WITHOUT_CIN_DOI.includes(entityType!.trim().toLowerCase());

// Maharashtra-only Electricity Board / CA Number fields (GST_Registration.pdf §E4).
export const isMaharashtra = (state?: string) =>
    (state ?? '').trim().toLowerCase() === 'maharashtra';

// Step 1's Authorized Persons list — the value sent directly as partner_details[].relationship
// (no separate internal-enum indirection, unlike BusinessRegistration's promoterType/designation
// split — a deliberate v1 simplification, one flat list rather than switching options by entity
// type). Covers the vendor's known relationship values (see
// businessRegistrationVendorChain.js's RELATIONSHIP_BY_PROMOTER) minus Witness/Nominee, which
// don't fit an authorized-person-for-GST-filing concept.
export const GST_RELATIONSHIP_OPTIONS = [
    'Director',
    'Director and Shareholder',
    'Director and Representative',
    'Shareholder',
    'Representative',
    'Designated Partner',
    'Partner',
    'Partner and Representative',
    'Proprietor',
].map(option => ({ label: option, value: option }));

// GST_Registration.pdf §E4 — Salutation (6 fixed options). Shared by GstApplicantDetailsStep's own
// Step 1 salutation field and AuthorizedPersonModal (each authorized person has their own).
export const GST_SALUTATION_OPTIONS = ['Mr.', 'Mrs.', 'Dr.', 'Ms.', 'Miss.', 'Prof.'].map(
    option => ({
        label: option,
        value: option,
    })
);

export const EMPTY_AUTHORIZED_PERSON: Omit<GstAuthorizedPerson, 'key'> = {
    salutation: '',
    fullName: '',
    pan: '',
    dob: '',
    mobile: '',
    email: '',
    relationship: '',
};

export const EMPTY_GST_VALUES: GstApplicationValues = {
    applicantType: '',
    premises: '',
    businessName: '',
    salutation: '',
    authorizedPersons: [],
    primaryAuthorizedPersonKey: '',
    pan: '',
    mobileNumber: '',
    email: '',
    entityType: '',
    cin: '',
    doi: '',
    gstApplyingState: '',
    district: '',
    city: '',
    place: '',
    pincode: '',
    circle: '',
    circleId: '',
    commissionerate: '',
    commissionerateId: '',
    division: '',
    divisionId: '',
    range: '',
    rangeId: '',
    address: '',
    electricityBoard: '',
    caNumber: '',
    natureOfBusinessActivity: [],
    othersActivity: '',
    registrationUnderRule14A: '',
    hsnItems: [],
    sacItems: [],
    documents: {},
    filingConfirmed: false,
};
