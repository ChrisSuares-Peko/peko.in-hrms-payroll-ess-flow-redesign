import * as Yup from 'yup';

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const mobileRegex = /^[6-9]\d{9}$/;

const noLeadingOrTrailingWhitespace = {
    test: 'no-leading-or-trailing-whitespace',
    message: 'Cannot start or end with whitespace',
    testFn: (value?: string) => !value || value === value.trim(),
};

// A real application number is never all zeros (e.g. "00000000000") — the vendor's own TM Search
// lookup isn't a reliable enough gate on its own since it can return a truthy result for malformed
// input, so this catches it before that lookup ever fires.
const notAllZeros = {
    test: 'not-all-zeros',
    message: 'Please enter a valid application number',
    testFn: (value?: string) => !value || !/^0+$/.test(value),
};

// GST Registration — one Authorized Person's own fields (§gstApplicantDetailsSchema below and
// AuthorizedPersonModal both validate against this single definition, so the modal's "Save" and the
// step's own Next can never disagree on what counts as a complete person).
export const gstAuthorizedPersonSchema = Yup.object().shape({
    salutation: Yup.string().required('Please select a salutation'),
    fullName: Yup.string()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Name cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .required('Please enter the full name'),
    pan: Yup.string()
        .matches(panRegex, 'Please enter a valid PAN (e.g., ABCDE1234F)')
        .required('PAN Number is required'),
    dob: Yup.string().required('Please enter the date of birth'),
    mobile: Yup.string()
        .matches(mobileRegex, 'Please enter a valid 10-digit mobile number starting with 6–9')
        .required('Mobile Number is required'),
    email: Yup.string().email('Please enter a valid email address').required('Email is required'),
    relationship: Yup.string().required('Please select a relationship'),
});

export const profileDetailsSchema = Yup.object().shape({
    legalBusinessName: Yup.string()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Legal Business Name cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .min(3, 'Legal Business Name must be at least 3 characters')
        .max(200, 'Maximum 200 characters are allowed')
        .required('Please enter legal business name'),
    stateOfRegistration: Yup.string().required('Please select state of registration'),
    name: Yup.string()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Name cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .matches(/^[a-zA-Z\s]+$/, 'Name must contain only alphabets and spaces')
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Maximum 100 characters are allowed')
        .required('Please enter name'),
    email: Yup.string().email('Please enter a valid email address').required('Please enter email'),
    phoneNumber: Yup.string()
        .matches(mobileRegex, 'Please enter a valid 10-digit mobile number starting with 6–9')
        .required('Please enter phone number'),
    pan: Yup.string()
        .matches(panRegex, 'Please enter a valid PAN (e.g., ABCDE1234F)')
        .required('Please enter PAN'),
    entityType: Yup.string().required('Please select entity type'),
});

export type ProfileDetailsValues = Yup.InferType<typeof profileDetailsSchema>;

const indianPincodeRegex = /^[1-9]\d{5}$/;
const containsLetterRegex = /[a-zA-Z]/;

const nameOnlyRegex = /^[a-zA-Z\s]+$/;

const noLongRepeatedCharRegex = /^(?!.*(.)\1{4,}).*$/;

// Applicant Details (step 1). Address/PIN/State/District/Country are normally prefilled from the
// selected business, but the fields themselves are editable (not read-only), so they still need
// their own format checks rather than relying on that prefill.
export const trademarkApplicantDetailsSchema = Yup.object().shape({
    trademarkOwner: Yup.string().required('Please select the Trademark Owner'),
    entityType: Yup.string().required('Please enter the entity type'),
    salutation: Yup.string().required('Please select a salutation'),
    authorizedPerson: Yup.string()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Authorized Person cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .matches(nameOnlyRegex, 'Please enter a valid name')
        .required('Please enter the authorized person'),
    address: Yup.string()
        .matches(containsLetterRegex, 'Please enter a valid address')
        .matches(noLongRepeatedCharRegex, 'Please enter a valid address')
        .required('Please enter the address'),
    pincode: Yup.string()
        .matches(indianPincodeRegex, 'Please enter a valid 6-digit PIN code')
        .required('Please enter the PIN code'),
    state: Yup.string()
        .matches(nameOnlyRegex, 'Please enter a valid state')
        .required('Please enter the state'),
    district: Yup.string()
        .matches(nameOnlyRegex, 'Please enter a valid district')
        .required('Please enter the district'),
    country: Yup.string()
        .matches(nameOnlyRegex, 'Please enter a valid country')
        .required('Please enter the country'),
});

export type TrademarkApplicantDetailsValues = Yup.InferType<typeof trademarkApplicantDetailsSchema>;

export const trademarkDetailsSchema = Yup.object().shape({
    brand: Yup.string().required('Please enter the brand name'),
    language: Yup.string().required('Please select a language'),
    transliterationOfMark: Yup.string().when('language', {
        is: (language?: string) => Boolean(language) && language !== 'English',
        then: schema => schema.required('Please enter the transliteration of the mark'),
    }),
    translationOfMark: Yup.string().when('language', {
        is: (language?: string) => Boolean(language) && language !== 'English',
        then: schema => schema.required('Please enter the translation of the mark'),
    }),
    mainGoodsOrService: Yup.string().required('Please enter the main goods or service'),
    trademarkClass: Yup.string().required('Please select a class'),
    description: Yup.array().min(1, 'Please select at least one description'),
});

export type TrademarkDetailsValues = Yup.InferType<typeof trademarkDetailsSchema>;

export const objectionApplicationDetailsSchema = Yup.object().shape({
    applicationNumber: Yup.string()
        .matches(/^\d+$/, 'Application number must contain numbers only')
        .test(notAllZeros.test, notAllZeros.message, notAllZeros.testFn)
        .required('Applicant Number is required'),
    brand: Yup.string().required(''),
    trademarkClass: Yup.string().required(''),
    applicationDate: Yup.string().required(''),
    applicantName: Yup.string().required(''),
    applicantAddress: Yup.string().required(''),
    // Unlike the fields above, Notice Date is genuinely user-picked (see
    // ObjectionApplicationDetailsStep's own comment — the vendor lookup has no notice-date
    // concept), so it gets a real, visible message instead of the blank one those use.
    noticeDate: Yup.string().required('Please select the notice date'),
    salutation: Yup.string().required('Please select a salutation'),
    authorizedPerson: Yup.string()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Authorized Person cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .matches(nameOnlyRegex, 'Please enter a valid name')
        .required('Please select the authorized person'),
    objectionSections: Yup.array().min(1, 'Objection Section is required'),
    proofAvailable: Yup.array(),
});

// Import Export Code — Application Details (doc §9.2). Each detail list is only required while
// its own Preferred Sector chip is selected; a detail list for a deselected sector is hidden and
// cleared by the step component itself, so it's never actually present here to fail validation.
export const iecApplicationDetailsSchema = Yup.object().shape({
    businessApplicationId: Yup.string().required('Please select the business'),
    salutation: Yup.string().required('Please select a salutation'),
    entityType: Yup.string().required('Please select the entity type'),
    authorizedPersonId: Yup.string().required('Please select the authorized person'),
    preferredSectors: Yup.array().min(1, 'Select preferred sector'),
    importDetails: Yup.array().when('preferredSectors', {
        is: (sectors?: string[]) => Boolean(sectors?.includes('Import')),
        then: (schema) => schema.min(1, 'Select import details'),
    }),
    exportDetails: Yup.array().when('preferredSectors', {
        is: (sectors?: string[]) => Boolean(sectors?.includes('Export')),
        then: (schema) => schema.min(1, 'Select export details'),
    }),
    othersDetails: Yup.array().when('preferredSectors', {
        is: (sectors?: string[]) => Boolean(sectors?.includes('Others')),
        then: (schema) => schema.min(1, 'Enter others details'),
    }),
});

// GST Registration Cancellation — Step 1 (GST_Cancellation_Implementation_Plan.md §5.2). Only the
// 3 fields the source docx confirms; see types/index.ts's GstCancellationValues comment for why
// authorizedPerson isn't the richer GstAuthorizedPerson shape. selectedDirectorId (not
// authorizedPerson) is what the common VendorDirectorSelect picker actually binds to and validates
// — authorizedPerson is just its derived display name, always set alongside it.
export const gstCancellationDetailsSchema = Yup.object().shape({
    selectedVendorBusinessId: Yup.string().required('Please select the business to cancel'),
    salutation: Yup.string().required('Please select a salutation'),
    selectedDirectorId: Yup.string().required('Please select the authorized person'),
    reasonForCancellation: Yup.string()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Reason for Cancellation cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .min(10, 'Please describe the reason in at least 10 characters')
        .required('Please enter the reason for cancellation'),
});

// Entity types where the CIN/LLPIN + Date of Incorporation section is HIDDEN and never validated
// (GST_Registration.pdf §E1). Kept in sync by hand with utils/gstForm.ts's requiresCinDoi — this
// file can't import from there (utils/gstForm.ts imports the schemas below, not the reverse).
const GST_ENTITY_TYPES_WITHOUT_CIN_DOI = ['proprietorship', 'individual', 'trust', 'partnership'];
const gstRequiresCinDoi = (entityType?: string) =>
    Boolean(entityType) &&
    !GST_ENTITY_TYPES_WITHOUT_CIN_DOI.includes(entityType!.trim().toLowerCase());

// GST Registration — Applicant Details (step 1). businessName/entityType are prefilled from the
// Business API and not retyped, but still validated as a safety net against a failed prefill.
export const gstApplicantDetailsSchema = Yup.object().shape({
    applicantType: Yup.string().required('Applicant Type is required'),
    premises: Yup.string().required('Nature of possession of premises is required'),
    businessName: Yup.string().required('Business Name is required'),
    salutation: Yup.string().required('Please select a salutation'),
    authorizedPersons: Yup.array()
        .min(1, 'Please add at least one authorized person')
        .of(gstAuthorizedPersonSchema),
    // Must name one of authorizedPersons' own keys — guards against a stale/dangling reference
    // left over from removing whichever person was previously marked primary.
    primaryAuthorizedPersonKey: Yup.string()
        .required('Please select the Authorized Person')
        .test(
            'is-a-real-person',
            'Please select the Authorized Person',
            (value, context) =>
                Array.isArray(context.parent.authorizedPersons) &&
                context.parent.authorizedPersons.some((p: { key: string }) => p.key === value)
        ),
    pan: Yup.string()
        .matches(panRegex, 'Please enter a valid PAN (e.g., ABCDE1234F)')
        .required('PAN Number is required'),
    mobileNumber: Yup.string()
        .matches(mobileRegex, 'Please enter a valid 10-digit mobile number starting with 6–9')
        .required('Mobile Number is required'),
    email: Yup.string().email('Please enter a valid email address').required('Email is required'),
    entityType: Yup.string().required('Please select the entity type'),
    cin: Yup.string().when('entityType', {
        is: gstRequiresCinDoi,
        then: schema => schema.required('Please enter the CIN/LLPIN'),
    }),
    doi: Yup.string().when('entityType', {
        is: gstRequiresCinDoi,
        then: schema => schema.required('Please enter the Date of Incorporation'),
    }),
});

export type GstApplicantDetailsValues = Yup.InferType<typeof gstApplicantDetailsSchema>;

// Maharashtra-only Electricity Board / CA Number fields (GST_Registration.pdf §E4). Kept in sync
// by hand with utils/gstForm.ts's isMaharashtra, same reason as gstRequiresCinDoi above.
const isGstMaharashtra = (state?: string) => (state ?? '').trim().toLowerCase() === 'maharashtra';

// GST Registration — Address Details (step 2). Circle/Commissionerate/Division/Range are
// populated from the jurisdiction lookup, not typed — required() still guards Next until a
// lookup has actually resolved them, same reasoning as Objection's fetched-not-typed fields above.
export const gstAddressDetailsSchema = Yup.object().shape({
    gstApplyingState: Yup.string().required('Please select the GST applying state'),
    district: Yup.string().required('District is required'),
    pincode: Yup.string()
        .matches(/^\d{6}$/, 'Please enter a valid 6-digit pincode')
        .required('Pincode is required'),
    circleId: Yup.string().required('Please select the Circle'),
    commissionerateId: Yup.string().required('Please select the Commissionerate'),
    divisionId: Yup.string().required('Please select the Division'),
    rangeId: Yup.string().required('Please select the Range'),
    address: Yup.string().required('Address is required'),
    electricityBoard: Yup.string().when('gstApplyingState', {
        is: isGstMaharashtra,
        then: schema => schema.required('Please select the Electricity Board'),
    }),
    caNumber: Yup.string().when('gstApplyingState', {
        is: isGstMaharashtra,
        then: schema => schema.required('Please enter the CA Number'),
    }),
});

export type GstAddressDetailsValues = Yup.InferType<typeof gstAddressDetailsSchema>;

// GST Registration — GST Information (step 3). hsnItems/sacItems are validated together (at least
// one code overall) rather than each requiring its own minimum — SAC search isn't confirmed by
// IndiaFilings yet (GST_REGISTRATION_PDF_SPEC.md §E5), so sacItems is always empty for now; once
// it's built, this still validates correctly without changes.
export const gstInformationSchema = Yup.object().shape({
    natureOfBusinessActivity: Yup.array().min(1, 'Please select at least one business activity'),
    othersActivity: Yup.string().when('natureOfBusinessActivity', {
        is: (activities?: string[]) => Array.isArray(activities) && activities.includes('Others'),
        then: schema => schema.required('Please specify the other business activity'),
    }),
    registrationUnderRule14A: Yup.string().required('Please select Yes or No'),
    hsnItems: Yup.array().test(
        'at-least-one-hsn-or-sac',
        'Please select at least one HSN or SAC code',
        function hasAtLeastOne(hsnItems) {
            const sacItems = this.parent.sacItems as unknown[] | undefined;
            return Boolean(hsnItems?.length) || Boolean(sacItems?.length);
        }
    ),
});

export type GstInformationValues = Yup.InferType<typeof gstInformationSchema>;

// GST Registration — Documents (step 4). The vendor's service-79 document checklist (see
// GstDocumentKey in utils/gstForm.ts) has no per-doc "mandatory" flag, and realistically a
// business only has ONE applicable address-proof document (Electricity Bill *or* Lease Agreement
// *or* ...) — so this requires at least one successful upload overall, not every listed type.
export const gstDocumentsSchema = Yup.object().shape({
    documents: Yup.object().test(
        'at-least-one-document',
        'Please upload at least one document',
        value =>
            Boolean(value) &&
            Object.values(
                value as Record<string, { docUrl?: string | null } | null | undefined>
            ).some(doc => Boolean(doc?.docUrl))
    ),
});

export type GstDocumentsValues = Yup.InferType<typeof gstDocumentsSchema>;

// GST Registration — Review & Submit (step 5, read-only summary + confirmation checkbox before
// filing), same gating pattern as Business Registration's RegistrationFiling.tsx.
export const gstReviewSchema = Yup.object().shape({
    filingConfirmed: Yup.boolean().oneOf([true], 'Please confirm the details before submitting'),
});

export type GstReviewValues = Yup.InferType<typeof gstReviewSchema>;

// Expedited Trademark Registration — the one combined Application+Applicant Details screen.
// Brand/Class/Entity Type are fetched/derived (disabled fields, blank required() message like
// Objection's own fetched fields above); Application Date/Applicant Name are picked, not typed, so
// a plain required() with a real message is enough. Authorized Person/Applicant Address are free
// text the corporate types, so they get the same format checks Registration's own fields use.
export const expeditedApplicationDetailsSchema = Yup.object().shape({
    applicationNumber: Yup.string()
        .matches(/^\d+$/, 'Only numbers are allowed')
        .test(notAllZeros.test, notAllZeros.message, notAllZeros.testFn)
        .required('Application number is required'),
    brand: Yup.string().required(''),
    trademarkClass: Yup.string().required(''),
    applicationDate: Yup.string().required('Application date is required'),
    applicantName: Yup.string().required('Please select a business name to proceed'),
    entityType: Yup.string().required(''),
    salutation: Yup.string().required('Please select a salutation'),
    // Always required — Individual/Proprietorship arrive already auto-filled (see
    // ExpeditedApplicationDetailsStep), everyone else must pick one.
    authorizedPerson: Yup.string()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Authorized Person cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .matches(nameOnlyRegex, 'Please enter a valid name')
        .required('Please enter the authorized person'),
    applicantAddress: Yup.string()
        .matches(containsLetterRegex, 'Please enter a valid address')
        .matches(noLongRepeatedCharRegex, 'Please enter a valid address')
        .required('Applicant address is required'),
    // Free-form prose, not a name/address — numbers and punctuation are legitimate here (e.g. "under
    // Rule 34"), so only the whitespace/garbage/length checks apply, not the letters-only regex.
    declarationReason: Yup.string()
        .test(
            noLeadingOrTrailingWhitespace.test,
            'Declaration of reason cannot start or end with a blank space',
            noLeadingOrTrailingWhitespace.testFn
        )
        .matches(noLongRepeatedCharRegex, 'Please enter a valid reason')
        .min(10, 'Please provide at least 10 characters')
        .required('Declaration of reason is required'),
});
