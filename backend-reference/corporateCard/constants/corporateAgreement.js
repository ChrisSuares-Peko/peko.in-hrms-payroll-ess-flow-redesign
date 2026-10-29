/** What a corporate calls each field, so an error never shows it a column name. */
const AGREEMENT_FIELD_LABELS = {
    entityName: 'Name of the Entity',
    regAddress: 'Registered address',
    regCity: 'Registered city',
    regState: 'Registered state',
    regPinCode: 'Registered pin code',
    regTelephone: 'Telephone',
    regEmail: 'Email ID',
    billAddress: 'Billing address',
    billCity: 'Billing city',
    billState: 'Billing state',
    billPinCode: 'Billing pin code',
    gstNumber: 'GST Registration No.',
    panNumber: 'Permanent Account Number (PAN)',
    cinLlpNumber: 'CIN / LLP Number',
    tanNumber: 'TAN Number',
    bankName: 'Bank',
    bankBranch: 'Branch',
    bankAccountNumber: 'Account Number',
    bankIfsc: 'IFSC Code',
    bankCity: 'Bank city',
    officialContactName: 'Contact name for official communication',
    officialContactMobile: 'Contact mobile number',
    officialContactEmail: 'Contact email',
    salespersonName: 'Salesperson name',
    salespersonMobile: 'Salesperson mobile number',
    salespersonEmail: 'Salesperson email',
    signatoryName: 'Authorised signatory name',
    signatoryContact: 'Authorised signatory contact number',
    signatoryEmail: 'Authorised signatory email',
    signatoryIsPep: 'Politically Exposed Person (PEP) declaration',
}

const labelsFor = (fields = []) =>
    fields.map((field) => AGREEMENT_FIELD_LABELS[field] || field).join(', ')

module.exports = {
    AGREEMENT_FIELD_LABELS,
    labelsFor,
    AGREEMENT_SIGN_METHOD: {
        E_SIGN: 'E_SIGN',
        UPLOAD: 'UPLOAD',
    },
    ESIGN_STATUS: {
        PENDING_DISPATCH: 'PENDING_DISPATCH',
        SENT: 'SENT',
        SIGNED: 'SIGNED',
        FAILED: 'FAILED',
    },
}
