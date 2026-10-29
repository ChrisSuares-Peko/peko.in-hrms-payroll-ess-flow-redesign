import { BankAccountSetupFormValues } from '../types/remittance';

export const DOCUMENT_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
export const DOCUMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg';
export const DOCUMENT_TYPES_LABEL = 'PDF, PNG or JPG';

export const DOC_UPLOAD_CONFIG = {
    allowedTypes: DOCUMENT_MIME_TYPES,
    acceptedTypesLabel: DOCUMENT_TYPES_LABEL,
    accept: DOCUMENT_ACCEPT,
    uploadLabel: 'Click to upload document',
    maxFileSizeMB: 10,
};

export const READONLY_FIELDS: { name: keyof BankAccountSetupFormValues; label: string }[] = [
    { name: 'registeredEmail', label: 'Registered Email' },
    { name: 'phoneNumber', label: 'Phone Number' },
    { name: 'legalName', label: 'Legal Name' },
    { name: 'marketingName', label: 'Marketing Name' },
    { name: 'businessWebsiteUrl', label: 'Business Website URL / Social Media URL / App Store Link' },
    { name: 'averageTransactionValue', label: 'Average Transaction Value' },
    { name: 'averageTransactionVolume', label: 'Average Transaction Volume' },
    { name: 'internationalOrganizationType', label: 'International Organization Type' },
];

export const REQUIRED_DOCS: {
    fieldName: keyof BankAccountSetupFormValues;
    label: string;
    subtitle?: string;
}[] = [
    { fieldName: 'proofOfRegisteredAddress', label: 'Proof of Registered Address' },
    { fieldName: 'localTaxIdentifier', label: 'Local Tax Identifier' },
    { fieldName: 'certificateOfIncorporation', label: 'Certificate of Incorporation' },
    {
        fieldName: 'boardResolution',
        label: 'Board Resolution / Power of Attorney',
        subtitle: 'Board resolution naming the authorized person to sign or power of attorney (Not applicable for public companies)',
    },
    {
        fieldName: 'beneficiaryOwnerInfo',
        label: 'Beneficiary Owner (BO) Information',
        subtitle: 'For those with more than 10% paid up share capital: Name, ID, and Proof of Identity',
    },
    {
        fieldName: 'pciDssCertification',
        label: 'PCI DSS Certification (if applicable)',
        subtitle: 'Only required if merchant requires Server-to-Server integration',
    },
];

export const NEXT_STEPS = [
    {
        step: 1,
        title: 'Document Verification',
        description: 'Our compliance team will verify all submitted documents',
    },
    {
        step: 2,
        title: 'Account Activation',
        description: 'Once approved, your international remittance account will be activated',
    },
    {
        step: 3,
        title: 'Start Accepting Payments',
        description: 'Begin accepting international payments from your customers',
    },
];

export const ADDITIONAL_DOCS: {
    fieldName: keyof BankAccountSetupFormValues;
    label: string;
    subtitle?: string;
}[] = [
    { fieldName: 'lobSpecificDocument', label: 'LOB Specific Document' },
    {
        fieldName: 'gstCertificate',
        label: 'GST Certificate / OIDAR Registration Certificate',
        subtitle: 'Only required for OIDAR Merchant',
    },
];
