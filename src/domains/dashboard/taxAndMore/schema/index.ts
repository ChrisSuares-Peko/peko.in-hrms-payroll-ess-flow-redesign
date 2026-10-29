import * as Yup from 'yup';

// ─── Shared regex ─────────────────────────────────────────────────────────────

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}$/;
const FY_REGEX = /^\d{4}-\d{2}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// ─── Shared validators ────────────────────────────────────────────────────────

const addWhitespaceTests = (schema: Yup.StringSchema, fieldName?: string) => {
    const prefix = fieldName ? `${fieldName} cannot` : 'Field cannot';
    const name = fieldName ?? 'Field';
    return schema
        .test(
            'no-leading-trailing-whitespace',
            `${prefix} start or end with whitespace`,
            value => value === undefined || value.trim() === value
        )
        .test(
            'no-consecutive-whitespace',
            `${prefix} contain consecutive whitespaces`,
            value => value === undefined || !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            `${name} cannot be only whitespace`,
            value => value === undefined || !/^\s*$/.test(value)
        );
};

const optionalGstin = () =>
    addWhitespaceTests(Yup.string(), 'GSTIN').test(
        'valid-gstin',
        'Please enter a valid 15-character GSTIN',
        v => {
            if (!v) return true;
            if (v.length !== 15) return false;
            return GSTIN_REGEX.test(v);
        }
    );

const requiredDate = (label: string) =>
    Yup.string()
        .required(`Please select the ${label}`)
        .matches(DATE_REGEX, `Please select a valid ${label}`);

const optionalDate = (label: string) =>
    Yup.string()
        .optional()
        .matches(DATE_REGEX, {
            message: `Please select a valid ${label}`,
            excludeEmptyString: true,
        });

const positiveAmount = (label: string) =>
    Yup.string()
        .required(`Please enter the ${label}`)
        .test('is-positive', `${label} must be greater than 0`, v => !!v && parseFloat(v) > 0);

const nonNegativeCount = (label: string) =>
    Yup.string()
        .required(`Please enter the ${label}`)
        .test(
            'is-non-negative',
            `${label} must be 0 or more`,
            v => v !== undefined && parseInt(v, 10) >= 0
        );

const requiredSelect = (label: string) => Yup.mixed().required(`Please select the ${label}`);

const requiredText = (label: string, max = 100) =>
    addWhitespaceTests(Yup.string(), label)
        .required(`Please enter the ${label}`)
        .max(max, `${label} cannot exceed ${max} characters`);

const optionalText = (max = 100, fieldName?: string) =>
    addWhitespaceTests(Yup.string(), fieldName).optional().max(max);

// ─── ConnectGstModal ──────────────────────────────────────────────────────────

export const gstCredentialsSchema = Yup.object({
    gstin: Yup.string()
        .required('Please enter the GSTIN')
        .length(15, 'GSTIN must be exactly 15 characters')
        .matches(GSTIN_REGEX, 'Please enter a valid GSTIN (e.g. 29ABCDE1234F1Z5)'),
    financialYear: Yup.string()
        .required('Please enter the financial year')
        .matches(FY_REGEX, 'Please enter a valid financial year (e.g. 2024-25)'),
    username: addWhitespaceTests(Yup.string(), 'Username').required(
        'Please enter your GST portal username'
    ),
});

// ─── B2B inline add form ──────────────────────────────────────────────────────

export const b2bFormSchema = Yup.object({
    receiverGstin: addWhitespaceTests(Yup.string(), 'GSTIN')
        .required('Please enter the receiver GSTIN')
        .length(15, 'GSTIN must be exactly 15 characters')
        .matches(GSTIN_REGEX, 'Please enter a valid GSTIN (e.g. 29ABCDE1234F1Z5)'),
    receiverName: addWhitespaceTests(Yup.string(), 'Receiver name')
        .required('Please enter the receiver name')
        .max(100, 'Receiver name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]*$/, {
            message: 'Receiver name should not contain numbers or special characters',
            excludeEmptyString: true,
        }),
    invoiceNo: requiredText('invoice number', 16),
    invoiceDate: requiredDate('invoice date'),
    placeOfSupply: addWhitespaceTests(Yup.string(), 'Place of supply')
        .required('Please select the place of supply')
        .min(3, 'Place of supply must be at least 3 characters')
        .max(50, 'Place of supply cannot exceed 50 characters'),
    taxRate: requiredSelect('tax rate'),
    taxableValue: Yup.mixed()
        .test(
            'is-positive',
            'Taxable value must be greater than 0',
            v => !!v && parseFloat(String(v)) > 0
        )
        .required('Please enter the taxable value'),
    reverseCharge: Yup.boolean(),
});

// ─── B2C Large add form ───────────────────────────────────────────────────────

export const b2cLargeSchema = Yup.object({
    invoiceNo: requiredText('invoice number', 16),
    date: requiredDate('invoice date'),
    placeOfSupply: addWhitespaceTests(Yup.string(), 'Place of supply')
        .required('Please select the place of supply')
        .min(3, 'Place of supply must be at least 3 characters')
        .max(50, 'Place of supply cannot exceed 50 characters'),
    taxable: positiveAmount('taxable value'),
    rate: requiredSelect('tax rate'),
});

// ─── B2C Small add form ───────────────────────────────────────────────────────

export const b2cSmallSchema = Yup.object({
    placeOfSupply: addWhitespaceTests(Yup.string(), 'Place of supply')
        .required('Please select the place of supply')
        .min(3, 'Place of supply must be at least 3 characters')
        .max(50, 'Place of supply cannot exceed 50 characters'),
    rate: requiredSelect('tax rate'),
    taxable: positiveAmount('taxable value'),
});

// ─── CDNR add form ────────────────────────────────────────────────────────────

export const cdnrSchema = Yup.object({
    buyerGstin: optionalGstin(),
    invoiceNo: requiredText('note number', 16),
    date: requiredDate('note date'),
    noteType: Yup.string().required('Please select the note type'),
    taxable: positiveAmount('taxable value'),
    rate: requiredSelect('tax rate'),
    placeOfSupply: addWhitespaceTests(Yup.string(), 'Place of supply')
        .required('Please select the place of supply')
        .min(3, 'Place of supply must be at least 3 characters')
        .max(50, 'Place of supply cannot exceed 50 characters'),
});

// ─── CDNUR add form ───────────────────────────────────────────────────────────

export const cdnurSchema = Yup.object({
    supplyType: Yup.string().required('Please select the supply type'),
    invoiceNo: requiredText('note number', 16),
    date: requiredDate('note date'),
    noteType: Yup.string().required('Please select the note type'),
    taxable: positiveAmount('taxable value'),
    rate: requiredSelect('tax rate'),
    placeOfSupply: addWhitespaceTests(Yup.string(), 'Place of supply')
        .required('Please select the place of supply')
        .min(3, 'Place of supply must be at least 3 characters')
        .max(50, 'Place of supply cannot exceed 50 characters'),
});

// ─── Advances add form ────────────────────────────────────────────────────────

export const advancesSchema = Yup.object({
    placeOfSupply: addWhitespaceTests(Yup.string(), 'Place of supply')
        .required('Please select the place of supply')
        .min(3, 'Place of supply must be at least 3 characters')
        .max(50, 'Place of supply cannot exceed 50 characters'),
    rate: requiredSelect('tax rate'),
    taxable: positiveAmount('taxable value'),
});

// ─── Exports add form ─────────────────────────────────────────────────────────

export const exportsSchema = Yup.object({
    exportType: Yup.string().required('Please select the export type'),
    invoiceNo: requiredText('invoice number', 16),
    date: requiredDate('invoice date'),
    portCode: optionalText(6),
    sbNo: optionalText(20),
    sbDate: optionalDate('shipping bill date'),
    taxable: positiveAmount('taxable value'),
});

// ─── HSN/SAC manual add form ──────────────────────────────────────────────────

export const hsnSchema = Yup.object({
    hsnCode: Yup.string()
        .required('Please enter the HSN/SAC code')
        .matches(/^(\d{2}){1,4}$/, 'HSN code must be 2, 4, 6, or 8 numeric digits'),
    description: optionalText(100),
    uqc: Yup.string().required('Please select the unit of quantity (UQC)'),
    qty: positiveAmount('quantity'),
    taxable: positiveAmount('taxable value'),
    rate: requiredSelect('tax rate'),
});

// ─── Documents issued add form ────────────────────────────────────────────────

export const documentsSchema = Yup.object({
    documentType: Yup.string().required('Please select the document type'),
    serialFrom: requiredText('serial number from', 50),
    serialTo: optionalText(50),
    totalIssued: nonNegativeCount('total issued count'),
    cancelled: Yup.string()
        .optional()
        .test(
            'is-non-negative',
            'Cancelled count must be 0 or more',
            v => !v || parseInt(v, 10) >= 0
        ),
});

// ─── Amendments add form ──────────────────────────────────────────────────────

export const amendmentSchema = Yup.object({
    origInvNo: requiredText('original invoice number', 16),
    origPeriod: Yup.string()
        .required('Please enter the original filing period')
        .matches(/^\d{6}$/, 'Please enter a valid period in MMYYYY format (e.g. 012024)')
        .test('valid-month', 'Please enter a valid month (01–12)', val => {
            if (!val || val.length !== 6) return true;
            const month = parseInt(val.slice(0, 2), 10);
            return month >= 1 && month <= 12;
        })
        .test('not-future', 'Original period cannot be a future period', val => {
            if (!val || val.length !== 6) return true;
            const month = parseInt(val.slice(0, 2), 10);
            const year = parseInt(val.slice(2), 10);
            if (month < 1 || month > 12) return true;
            const now = new Date();
            const inputDate = new Date(year, month - 1, 1);
            const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return inputDate <= currentMonth;
        }),
    receiverGstin: optionalGstin(),
    receiverName: addWhitespaceTests(Yup.string(), 'Receiver name')
        .optional()
        .max(100, 'Receiver name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]*$/, {
            message: 'Receiver name should not contain numbers or special characters',
            excludeEmptyString: true,
        }),
    revisedInvNo: optionalText(16),
    revisedDate: optionalDate('revised date'),
    taxableAmount: positiveAmount('taxable value'),
    rate: requiredSelect('tax rate'),
});

// ─── KYC PAN verification form (VerifyPanPage) ───────────────────────────────

export const verifyPanSchema = Yup.object({
    panNumber: Yup.string()
        .required('Please enter the PAN')
        .length(10, 'PAN must be exactly 10 characters')
        .matches(PAN_REGEX, 'Please enter a valid PAN (e.g. ABCDE1234F)'),
    fullName: addWhitespaceTests(Yup.string(), 'Full name')
        .required('Please enter the full name')
        .min(3, 'Full name must be at least 3 characters')
        .max(50, 'Full name must be at most 50 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Full name should contain only letters and spaces'),
    dob: Yup.string().required('Please select the date of birth'),
    stateCode: Yup.string().required('Please select your state'),
});

// ─── EVC PAN form (FileReturnStep) ────────────────────────────────────────────

export const panSchema = Yup.object({
    pan: Yup.string()
        .required('Please enter the PAN')
        .length(10, 'PAN must be exactly 10 characters')
        .matches(PAN_REGEX, 'Please enter a valid PAN (e.g. ABCDE1234F)'),
});

// ─── Sales invoice inline add form (UploadSalesInvoicesPage) ─────────────────

export const salesInvoiceInlineSchema = Yup.object({
    invoiceNo: requiredText('invoice number', 16),
    invoiceDate: requiredDate('invoice date'),
    buyerName: addWhitespaceTests(Yup.string(), 'Buyer name')
        .required('Please enter the party name')
        .max(100, 'Buyer name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]*$/, {
            message: 'Buyer name should not contain numbers or special characters',
            excludeEmptyString: true,
        }),
    buyerGstin: optionalGstin(),
    hsnCode: Yup.string().optional().max(8, 'HSN/SAC code cannot exceed 8 characters'),
    placeOfSupply: addWhitespaceTests(Yup.string(), 'Place of supply')
        .required('Please enter the place of supply')
        .min(3, 'Place of supply must be at least 3 characters')
        .max(50, 'Place of supply cannot exceed 50 characters'),
    invoiceType: Yup.string().required('Please select the invoice type'),
    taxableAmount: positiveAmount('taxable amount'),
    cgst: Yup.string()
        .optional()
        .test('non-negative', 'CGST must be 0 or more', v => !v || parseFloat(v) >= 0),
    sgst: Yup.string()
        .optional()
        .test('non-negative', 'SGST must be 0 or more', v => !v || parseFloat(v) >= 0),
    igst: Yup.string()
        .optional()
        .test('non-negative', 'IGST must be 0 or more', v => !v || parseFloat(v) >= 0),
});
