import { KybLandingFeature } from './types';
import approvalsArt from '../assets/kybLanding/approvals.png';
import cardsArt from '../assets/kybLanding/cards.png';
import spendControlsArt from '../assets/kybLanding/spend-controls.png';
import trackingArt from '../assets/kybLanding/tracking.png';
import walletArt from '../assets/kybLanding/wallet.png';

export const KYB_LANDING = {
    badge: 'Corporate Cards',
    title: 'Give your team spending power, without losing control',
    description:
        'Get virtual and physical corporate cards, set spend limits and merchant controls per card, and track every rupee in real time - with cards issued by Pine Labs on the RuPay network.',
    footerNote: 'Get started with a simple business verification process.',
    ctaLabel: 'Get Started',
};

export const KYB_LANDING_FEATURES: KybLandingFeature[] = [
    {
        key: 'cards',
        title: 'Virtual & Physical Cards',
        description: 'Get virtual cards for online spends and RuPay physical cards for your team.',
        image: cardsArt,
        media: 'tiltedCard',
    },
    {
        key: 'spend-controls',
        title: 'Smart Spend Controls',
        description:
            'Set per-card limits, restrict merchant categories, control ATM access, freeze instantly.',
        image: spendControlsArt,
        imageWidth: 277,
    },
    {
        key: 'tracking',
        title: 'Real-Time Tracking',
        description: 'Track transactions, receipts, and spend categories in real time.',
        image: trackingArt,
        imageWidth: 283,
    },
    {
        key: 'approvals',
        title: 'Approval Workflows',
        description:
            'Route transactions, card requests, and limit increases through custom approvals.',
        image: approvalsArt,
        imageWidth: 232,
    },
    {
        key: 'wallet',
        title: 'Prepaid Wallet',
        description:
            'Fund your program through a simple prepaid wallet, with corporate-controlled loading.',
        image: walletArt,
        imageWidth: 192,
    },
    // {
    //     key: 'accounting',
    //     title: 'Accounting-Ready',
    //     description: 'Sync transactions with QuickBooks, Xero, and export GST-ready reports.',
    //     image: accountingArt,
    //     imageWidth: 283,
    // },
];

export const DEFAULT_BUSINESS_TYPE = 'PRIVATE_LIMITED';

export const DEFAULT_MAX_SIZE_KB = 10 * 1024;

export const KYB_INTRO = {
    badge: 'Business Verification Required',
    title: 'Verify Your Business Identity',
    description:
        'Complete your KYB process to unlock exclusive corporate features. This digital verification usually takes about 15 minutes to complete, and 4–7 working days to review.',
    businessTypeLabel: 'What type of business are you?',
    businessTypePlaceholder: 'Select your business type',
    optionalSuffix: '(optional)',
    checklistEmpty: 'Choose your business type to see the documents you will need.',
    checklistUnavailable:
        'We could not load the document checklist for your business type. Please try again.',
    retryLabel: 'Retry',
    businessTypeSaveFailed: 'Could not save your business type. Please try again.',
    checklistTitle: 'Before you begin, keep the following ready:',
    ctaLabel: 'Initiate KYB',
    securityNote: 'Your data is encrypted and protected under RBI guidelines',
    infoNotes: [
        "Documents must carry the company seal and the authorised signatory's signature – except MoA/AoA, where a signature on the first and last page is enough (the complete document must still be submitted).",
        "The same authorised signatory must sign every document, and their name must match what's on the Corporate Agreement.",
        'Aadhaar copies must be masked - only the last 4 digits visible, the rest starred out.',
        'Scans must be clear and legible - blurred, faded, or blacked-out documents will be rejected.',
    ],
    infoNotesLabel: 'Note',
    infoNotesTop: [
        "The same authorised signatory must sign every document, and their name must match what's on the Corporate Agreement.",
        'Scans must be clear and legible - blurred, faded, or blacked-out documents will be rejected.',
    ],
};

export const KYB_UPLOAD = {
    title: 'Verify Your Business Identity',
    badge: 'Business Verification Required',
    description:
        'Complete your KYB process to unlock exclusive corporate features. This digital verification usually takes about 15 minutes to complete, and 4–7 working days to review.',
    sectionTitle: 'Upload Business Documents',
    sectionSubtitle: 'Please upload the required documents to verify your business identity.',
    infoNote:
        'Please note that all the documents must be signed by the authorised signatory along with the company seal.\nExcept for AoA and MOA only the first two pages and the last page need to be signed and stamped.',
    submitLabel: 'Submit for Verification',
    backLabel: 'Go Back',
    securityNote: 'Your data is encrypted and protected under RBI guidelines',
    savedChip: 'Your progress till now is saved',
    savedFallbackName: 'Uploaded document',
    removeFailed: 'Could not remove the document. Please try again.',
    restoreFailed:
        'We could not load the documents you have already uploaded. Please retry before continuing, so you do not upload them twice.',
    retryLabel: 'Retry',
    uploadingNote: 'Please wait until every document finishes saving.',
    checklistPending: 'Loading your document checklist and the documents already on file.',
    submitHint:
        'Upload all required documents, fill in the agreement details, and complete the corporate agreement signing to continue.',
};

export const KYB_SUBMITTED = {
    title: 'KYB Submitted Successfully',
    description:
        'Thank you for submitting your business documents. Our team is reviewing your submission. You will be notified via email and SMS once your KYB is approved.',
    statusLabel: 'Submitted',
    expectedCompletionPrefix: 'Expected completion:',
    expectedCompletion: 'Within 4-7 working days',
};

export const KYB_PENDING = {
    title: 'KYB Verification',
    description:
        'Thank you for completing your KYB verification. Our team is reviewing your documents. You will be notified via email once your KYB is approved.',
    statusLabel: 'Under review',
    expectedCompletionPrefix: 'Expected completion:',
    expectedCompletion: 'Within 4-7 working days',
};

export const KYB_VERIFIED = {
    title: 'KYB Verified Successfully',
    description:
        'Your business identity has been verified. You now have full access to all corporate card features.',
    ctaLabel: 'Go to Dashboard',
    verifiedWithPrefix: 'Verified with:',
    verifiedWithValue: 'Full Access Level',
};

export const KYB_REJECTED = {
    title: 'KYB Verification Failed',
    description:
        'Your KYB verification was unsuccessful. Please review the reason below and resubmit with the correct documents.',
    ctaLabel: 'Resubmit KYB',
    reasonPrefix: 'Reason:',
};

export const CORPORATE_AGREEMENT_DOCUMENT = {
    key: 'corporate-agreement',
    documentName: 'Corporate_Agreement',
    label: 'Corporate Agreement',
    uploadLabel: 'Upload the signed & sealed copy',
    hint: 'Company seal + authorised signatory signature required',
    required: true,
    maxSizeKb: 2048,
};

export const ADDRESS_PROOF_DOCUMENT = {
    key: 'address-proof',
    documentName: 'Address_Proof',
    label: 'Address Proof',
    uploadLabel: 'Upload a copy of your registered address proof',
    hint: 'Self-attested',
    required: true,
    maxSizeKb: 500,
};

export const KYB_AGREEMENT = {
    sectionTitle: 'Sign Your Corporate Agreement',
    sectionSubtitle: "Choose how you'd like to sign your corporate agreement with Pine Labs.",
    savedChip: 'Your progress till now is saved',
    methodESign: 'e-Sign with Aadhaar',
    methodUpload: 'Upload signed copy',
    uploadInstructions:
        "Download the corporate agreement template below. Print it, sign with your authorised signatory's signature and the company seal, then upload a clear scanned copy along with your other documents.",
    downloadLabel: 'Download Agreement Template',
    templateUnavailable:
        'The agreement template is not available right now. Please try again later.',
    signedCopyLabel: 'Signed Corporate Agreement',
    signedCopyHint: 'Upload the signed & sealed copy',
    detailsTitle: 'Corporate Agreement Details',
    detailsSubtitle:
        "Fill in your organisation's details below - Peko will use them to pre-fill your corporate agreement before sending it to you for signature.",
    esignNote:
        'Peko will send your corporate agreement for e-signature, using Aadhaar-based e-sign, to your registered email and mobile number.',
    esignCta: 'Send for e-Signature',
    esignIncomplete: 'Fill in all required agreement details to continue.',
    esignBlockedTitle: 'Sort these out first:',
    signMethodSaveFailed: 'Could not switch the signing method. Please try again.',
    esignQueued: 'Your agreement has been sent for e-signature.',
    esignPreparing: {
        badge: 'Preparing',
        title: 'Preparing Your Agreement',
        description:
            'We are getting your corporate agreement ready to send for signature. This usually takes a few moments.',
    },
    esignAwaiting: {
        badge: 'Sent for e-Signature',
        title: 'Awaiting Signature',
        description:
            "We've sent the corporate agreement to your registered email and mobile number. Complete the Aadhaar-based e-sign — we'll detect it automatically and update this status.",
    },
    esignSigned: {
        badge: 'Signed',
        title: 'e-Signature Completed',
        description: "You've completed the Aadhaar-based e-signature for your corporate agreement.",
    },
    esignFailed: {
        badge: 'Not Signed',
        title: 'e-Signature Not Completed',
        description:
            'Your corporate agreement was not signed. You can send it again to receive a fresh signing link.',
    },
    esignChecking: 'Checking automatically...',
    esignSignNow: 'Sign now',
    esignSentOn: 'Sent on',
    draftSaveFailed: 'Could not save your progress just now. We will keep trying as you type.',
    groups: {
        entity: 'Entity Details',
        registered: 'Registered Address',
        billing: 'Billing Address',
        registration: 'Registration Details',
        bank: 'Bank Details',
        official: 'Contact Details for Official Communication',
        salesperson: 'Salesperson Contact Details',
        signatory: 'Authorised Signatory Details',
    },
    sameAsRegistered: 'Same as registered address',
    sameAsGstAddress: 'Same as Registered Address on GST Certificate',
    sameAsGstAddressNote:
        'No additional address proof is required if the billing address matches the address on your GST certificate. If the billing address is different, you will need to provide a separate address proof based on your firm type.',
    pepQuestion: 'Is the Authorised Signatory a Politically Exposed Person (PEP)?',
    ifApplicable: 'If applicable',
    addressProofHint: 'Upload a copy of your registered address proof',
    addressProofExamples:
        '(Incorporation certificate , GST certificate, License of local authority to run the business)',
    consentPrivacy:
        'I consent to Peko collecting, using and sharing my information with Pine Labs and relevant service providers for Corporate Card onboarding, KYB/KYC, eligibility assessment, issuance and servicing, in accordance with the Privacy Policy.',
    submitBlocked:
        'Upload all required documents, fill in the agreement details, and complete the corporate agreement signing to continue.',
};

export const AGREEMENT_LABELS = {
    entityName: 'Name of the Entity',
    regAddress: 'Address',
    regCity: 'City',
    regState: 'State',
    regPinCode: 'Pin Code',
    regTelephone: 'Telephone',
    regEmail: 'Email ID',
    billAddress: 'Address',
    billCity: 'City',
    billState: 'State',
    billPinCode: 'Pin Code',
    gstNumber: 'GST Registration No.',
    panNumber: 'Permanent Account Number (PAN)',
    cinLlpNumber: 'CIN / LLP Number',
    tanNumber: 'TAN Number',
    bankName: 'Bank',
    bankBranch: 'Branch',
    bankAccountNumber: 'Account Number',
    bankIfsc: 'IFSC Code',
    bankCity: 'City',
    officialContactName: 'Name',
    officialContactMobile: 'Mobile Number',
    officialContactEmail: 'Email',
    salespersonName: 'Name',
    salespersonMobile: 'Mobile Number',
    salespersonEmail: 'Email',
    signatoryName: 'Name',
    signatoryContact: 'Contact Number',
    signatoryEmail: 'Email',
    addressProof: 'Address Proof',
};

/**
 * Which section a field belongs to, for the "why is this disabled" list.
 *
 * AGREEMENT_LABELS reuses one label across sections — City for the registered, billing and bank addresses;
 * Name and Email for all three contacts — so an unqualified list reports three different missing fields as
 * one line. Fields whose label is already unique are left out and render unqualified.
 */
export const AGREEMENT_FIELD_SECTIONS: Record<string, string> = {
    regAddress: 'Registered address',
    regCity: 'Registered address',
    regState: 'Registered address',
    regPinCode: 'Registered address',
    regTelephone: 'Registered address',
    regEmail: 'Registered address',
    billAddress: 'Billing address',
    billCity: 'Billing address',
    billState: 'Billing address',
    billPinCode: 'Billing address',
    bankName: 'Bank details',
    bankBranch: 'Bank details',
    bankAccountNumber: 'Bank details',
    bankIfsc: 'Bank details',
    bankCity: 'Bank details',
    officialContactName: 'Official contact',
    officialContactMobile: 'Official contact',
    officialContactEmail: 'Official contact',
    salespersonName: 'Salesperson',
    salespersonMobile: 'Salesperson',
    salespersonEmail: 'Salesperson',
    signatoryName: 'Authorised signatory',
    signatoryContact: 'Authorised signatory',
    signatoryEmail: 'Authorised signatory',
};

export const AGREEMENT_SIGN_METHOD = {
    E_SIGN: 'E_SIGN',
    UPLOAD: 'UPLOAD',
} as const;
