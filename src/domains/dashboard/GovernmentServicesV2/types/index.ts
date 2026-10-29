export interface Application {
    id: number;
    serviceId: number;
    name: string;
    applicationId: string;
    status: 'Approved' | 'Under Review' | 'Action Required';
    progress: number;
    appliedOn: string;
    updatedOn: string;
    expectedCompletion: string;
}

export type ServiceTab = 'Mandatory' | 'Regulatory Dependent' | 'Good-to-have';
export type ServiceAuthority = 'All' | 'Central' | 'State';
export type ServiceCategory =
    | 'All'
    | 'Tax & Compliance'
    | 'Licenses & Permits'
    | 'Certifications'
    | 'Trade Enablement'
    | 'Pharma & Drugs'
    | 'Pesticides'
    | 'Fertilizers'
    | 'Hospital & Healthcare'
    | 'Hotels & Hospitality'
    | 'Data Security'
    | 'Financial Services'
    | 'Telecom & IT'
    | 'Education'
    | 'Transport & Logistics'
    | 'Business Recognition'
    | 'Intellectual Property';

export interface Service {
    id: number;
    // Vendor's numeric service_id (distinct from id/accessKey, the vendorCatalogId) — null if not sourced from the vendor catalog.
    serviceId: number | null;
    name: string;
    slug: string;
    accessKey: string;
    description: string;
    category: string;
    tab: ServiceTab;
    duration: string;
    price: number;
    govtFee: number | 'Free';
}

export type FieldType =
    | 'text'
    | 'select'
    | 'textarea'
    | 'date'
    | 'time'
    | 'checkbox'
    | 'multi-text'
    | 'radio';
export type StepType = 'form' | 'upload' | 'review' | 'payment';

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    helperText?: string;
    required?: boolean;
    multiple?: boolean;
    options?: string[];
    rows?: number;
    maxToday?: boolean;
    minToday?: boolean;
    maxDaysFromToday?: number;
    showTime?: boolean;
    dependsOn?: { field: string; values: string[] };
    maxLength?: number;
    minLength?: number;
    convertToUppercase?: boolean;
    allowNumbersOnly?: boolean;
    minValue?: number;
    maxValue?: number;
    allowAlphabetsAndSpaceOnly?: boolean;
    readOnly?: boolean;
    defaultValue?: string;
    dynamicOptions?: { dependsOnField: string; queryParam: string; endpoint: string };
    staticEndpoint?: string;
    conditionalText?: { dependsOnField: string; triggerValue: string; textPlaceholder?: string };
    dependentOptions?: { dependsOnField: string; optionsMap: Record<string, string[]> };
}

export interface FormStep {
    title: string;
    stepType: StepType;
    infoBanner?: string;
    fields: FormField[];
}

export interface TimelineStep {
    title: string;
    description: string;
}

export interface ServiceDetail {
    serviceId: number;
    subtitle: string;
    governmentFee: 'Free' | number;
    timeline: TimelineStep[];
    deliverables: string[];
    documents: string[];
}

// Trademark Registration form values (Steps 1-3) — kept here, not in the page component, to avoid an import/no-cycle violation.
export interface ApplicantDetailsValues {
    trademarkOwner: string;
    entityType: string;
    salutation: string;
    authorizedPerson: string;
    address: string;
    pincode: string;
    state: string;
    district: string;
    country: string;
    // Not shown in the UI — required by the vendor Smart Form separately from address; sourced the same way as the other address fields.
    city: string;
    // Step 2 — Main Goods/Service search, Class, and Description.
    mainGoodsOrService: string;
    trademarkClass: string;
    description: string[];
    brand: string;
    language: string;
    // Only shown/required when Language isn't English.
    transliterationOfMark: string;
    translationOfMark: string;
    trademarkInUse: boolean;
    // Only shown when trademarkInUse is checked — optional even then. Stored/sent as
    // YYYY-MM-DD (see used_since in the Smart Form payload); usedSinceDisplay is the
    // DD-MM-YYYY mirror the shared DatePickerInput actually binds to, kept in sync via
    // its handleChange — UI-only, never read at submission time.
    usedSince: string;
    usedSinceDisplay: string;
    associatedMarks: string;
    // Step 3 (Logo Upload) — optional; word on the logo must match Step 2's Brand.
    logo: string | null;
    logoFormat: string | undefined;
}

// Trademark Objection form values — single Application Details screen (the application number
// drives every fetched field below it) + Documents + Preview. Kept here alongside
// ApplicantDetailsValues for the same import/no-cycle reason.
export interface ObjectionApplicantDetailsValues {
    applicationNumber: string;
    // Brand/class/dates/applicant name+address are fetched FROM applicationNumber — never typed
    // manually (see ObjectionApplicationDetailsStep's lookup gating). Empty until a lookup resolves.
    brand: string;
    trademarkClass: string;
    applicationDate: string;
    noticeDate: string;
    applicantName: string;
    applicantAddress: string;
    // User-selected.
    salutation: string;
    authorizedPerson: string;
    // Multi-select — the applicant can raise more than one ground against the same notice.
    objectionSections: string[];
    // Multi-select, optional — vendor validator has no requirement on this field.
    proofAvailable: string[];
}

// One added-person record on Step 1's Authorized Persons list. Sent to the vendor as
// partner_details[] at filing time (GST_REGISTRATION_PDF_SPEC.md §E7a #30). Which one becomes the
// payload's singular authorized_person/authorized_person_id is decided by
// GstApplicationValues.primaryAuthorizedPersonKey (a flat field, not a per-item boolean, so the
// "pick one" UI is a single RadioGroupInput rather than needing manual cross-item exclusivity
// logic) — people_id itself is assigned server-side at submit (see submitGstFilingV2), not stored
// on the FE value at all, since people are only created with the vendor once, at final submit.
export interface GstAuthorizedPerson {
    key: string;
    salutation: string;
    fullName: string;
    pan: string;
    dob: string;
    mobile: string;
    email: string;
    relationship: string;
}

// GST Registration Smart Form values (Steps 1-3, GST_Registration.pdf §E) — kept here for the
// same import/no-cycle reason as ApplicantDetailsValues above. One flat interface across all
// steps, used as the single <Formik<GstApplicationValues>> generic in GstRegistrationForm.tsx.
export interface GstApplicationValues {
    // Step 1 — Applicant Details
    applicantType: string;
    premises: string;
    businessName: string;
    salutation: string;
    authorizedPersons: GstAuthorizedPerson[];
    // The key of whichever authorizedPersons entry is the primary Authorized Person (§E7a #6).
    primaryAuthorizedPersonKey: string;
    pan: string;
    mobileNumber: string;
    email: string;
    // Entity type is not itself a Smart Form field — it's what decides whether cin/doi are shown
    // (§E1), resolved the same way Trademark's ApplicantDetailsStep resolves entityType.
    entityType: string;
    // Shown/required only when entityType requires it (§E1) — see requiresCinDoi in utils/gstForm.ts.
    cin: string;
    doi: string;
    // Step 2 — Address Details
    gstApplyingState: string;
    district: string;
    // Not shown/edited by the user — populated alongside district from the same pincode lookup,
    // carried through only for the filing payload's city/place fields (§E7a #18/#19).
    city: string;
    place: string;
    pincode: string;
    circle: string;
    circleId: string;
    commissionerate: string;
    commissionerateId: string;
    division: string;
    divisionId: string;
    range: string;
    rangeId: string;
    address: string;
    // Shown/required only when gstApplyingState === 'Maharashtra' (§E4).
    electricityBoard: string;
    caNumber: string;
    // Step 3 — GST Information
    natureOfBusinessActivity: string[];
    // Shown/required only when natureOfBusinessActivity includes 'Others' (§E4).
    othersActivity: string;
    registrationUnderRule14A: string;
    // Split per §E5 — hsnItems/sacItems each capped at 5, submitted separately as
    // top5_goods_and_services (combined) at filing time.
    hsnItems: { code: string; description: string }[];
    sacItems: { code: string; description: string }[];
    // Step 4 — Documents. NOT personal KYC docs (no PAN/photo per Authorized Person) — GST
    // Registration's own vendor document checklist (service 79, confirmed live 2026-09-29 via
    // GET /v4/docs/Service) is business/address-proof documents instead (see GstDocumentKey in
    // utils/gstForm.ts for the full list and why). Uploaded straight to the vendor as "Service
    // Document"s via the already-shipped uploadGstDocumentV2/uploadGstDocumentApi — business-level,
    // not tied to any one Authorized Person, so this is a flat object, not a per-array-item field.
    documents: GstDocuments;
    // Step 5 — Review & Submit. Gates the final Submit button, same pattern as Business
    // Registration's RegistrationFiling.tsx filingConfirmed checkbox.
    filingConfirmed: boolean;
}

// GST Registration Cancellation values (service_id 126, confirmed via the synced vendor catalog —
// see GST_Cancellation_Implementation_Plan.md). Deliberately only the 3 fields the source docx
// (GST_Registration_Cancellation_Work_Flow.docx §A1/§B) actually shows — salutation, Authorized
// Person and Reason for Cancellation — plus the pre-payment business selection. Authorized Person
// uses the common vendor-director picker (VendorDirectorSelect/AddVendorDirectorModal/
// useVendorDirectors, shared with the rest of GovernmentServicesV2): selectedDirectorId is the
// picker's own bound value (a director's people_id/id), authorizedPerson is the derived display
// name (directorDisplayName) kept in sync whenever selectedDirectorId changes — every other
// consumer (Preview, the declaration text, the backend payload) reads authorizedPerson, not the id.
export interface GstCancellationValues {
    selectedVendorBusinessId: string;
    salutation: string;
    selectedDirectorId: string;
    authorizedPerson: string;
    reasonForCancellation: string;
    currentStep: number;
}

export interface GstUploadedDocument {
    docUrl: string | null;
    fileName: string;
}

// Keyed by GstDocumentKey (utils/gstForm.ts's GST_DOCUMENT_TYPES) — kept as a plain Partial record
// here (not importing GstDocumentKey) to avoid a utils -> types import cycle, same reasoning as
// this file's other GST interfaces.
export type GstDocuments = Partial<
    Record<
        | 'electricityBill'
        | 'telephoneBill'
        | 'propertyTaxReceipt'
        | 'leaseRentAgreement'
        | 'partnershipDeed'
        | 'incorporationCertificate'
        | 'legalOwnershipDocument',
        GstUploadedDocument | null
    >
>;

// Expedited Trademark Registration form values — one combined Application+Applicant Details
// screen (application number drives brand/class, same as Objection/Protection) + a live side
// preview + an overview/confirm screen, no Documents step. Kept here alongside the other three for
// the same import/no-cycle reason.
export interface ExpeditedApplicantDetailsValues {
    applicationNumber: string;
    // Fetched from the application number (tm_info.tm_applied_for/class) — never typed manually.
    brand: string;
    trademarkClass: string;
    // Calendar-only picker, dd-MM-yyyy.
    applicationDate: string;
    // The selected vendor business's own application_id — the Select's value, not sent as-is.
    applicantBusinessId: string;
    // Derived from the selected business (business name, or "<name> Proprietor of <trade name>"
    // for Proprietorship) — this is what actually goes in the payload as applicant_name.
    applicantName: string;
    // Constitution of the selected business — payload's entity_type; also decides whether
    // authorizedPerson is auto-filled/locked (Individual, Proprietorship) or user-entered.
    entityType: string;
    salutation: string;
    // No confirmed "people mapped to this business" API yet (see
    // ExpeditedApplicationDetailsStep's own comment) — plain text, same placeholder approach
    // Objection's own authorizedPerson uses, except auto-filled/locked for Individual/Proprietorship.
    authorizedPerson: string;
    applicantAddress: string;
    declarationReason: string;
}

// Import Export Code form values — one combined Application Details screen (doc §6.1) + a
// Documents tab + Preview, no payment step. Kept here alongside the other three for the same
// import/no-cycle reason.
export interface IecApplicantDetailsValues {
    // Vendor application_id of the business selected from the Business dropdown (same mechanism
    // as Trademark Registration's own "Trademark Owner" field) — picking one prefills entityType
    // and the business name below, same as ApplicantDetailsStep/applyBusinessToValues does there.
    businessApplicationId: string;
    salutation: string;
    // Prefilled from the selected business's own constitution (doc §7.2's document-requirement
    // matrix reads this) — editable in case the vendor's own data is wrong, same as Trademark's
    // entityType field.
    entityType: string;
    // The selected person's own reference (Picker's value) — not sent as-is, used to re-fetch
    // their profile (Load Authorised Person Profile) and to open People profile (Update).
    authorizedPersonId: string;
    // Display name actually shown in the picker/preview/verification paragraph.
    authorizedPerson: string;
    // At least one of Import, Export, Others (doc §3).
    preferredSectors: string[];
    // Each required only while its own sector is selected (doc §4) — hidden values are cleared,
    // not just hidden, so a deselect doesn't leave stale data behind on save.
    importDetails: string[];
    exportDetails: string[];
    othersDetails: string[];
}
