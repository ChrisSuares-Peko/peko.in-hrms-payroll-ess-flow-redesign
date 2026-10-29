import * as Yup from 'yup';

// ─── Reusable field validators ────────────────────────────────────────────────

const noConsecutiveSpaces = (label: string) => ({
    name: 'no-consecutive-spaces' as const,
    message: 'Please remove consecutive spaces in the text',
    test: (value: string | undefined) => !value || !/\s{2,}/.test(value),
});

const noEdgeWhitespace = (label: string) => ({
    name: 'no-edge-whitespace' as const,
    message: 'Please remove any extra spaces at the beginning or end of the text',
    test: (value: string | undefined) => value == null || (!/^\s/.test(value) && !/\s$/.test(value)),
});

const notOnlyWhitespace = (label: string) => ({
    name: 'not-only-whitespace' as const,
    message: `${label} cannot contain only spaces`,
    test: (value: string | undefined) => value == null || !/^\s*$/.test(value),
});

const phoneValidation = Yup.string()
    .trim()
    .min(10, 'Mobile number must be 10 digits')
    .max(10, 'Mobile number must be 10 digits')
    .matches(/^[6-9][0-9]{9}$/, 'Please enter a valid 10 digit mobile number starting with 6, 7, 8 or 9')
    .nullable();

const gstinValidation = Yup.string()
    .trim()
    .test(
        'empty-or-valid-gstin',
        'Enter a valid 15-character GSTIN',
        value => !value || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)
    )
    .nullable();

const accountNumberValidation = Yup.string()
    .min(9, 'Account number must be at least 9 to 18 digits')
    .max(18, 'Account number cannot exceed 18 digits')
    .test(
        'empty-or-valid-account',
        'Account number must contain only digits',
        value => !value || /^\d+$/.test(value)
    )
    .nullable();

const ifscValidation = Yup.string()
    .min(11, 'IFSC code must be 11 characters')
    .max(11, 'IFSC code cannot exceed 11 characters')
    .matches(/^[A-Z0-9]*$/, 'IFSC code must be alphanumeric and uppercase')
    .test(
        'empty-or-valid-ifsc',
        'Enter a valid IFSC code (e.g. SBIN0001234)',
        value => !value || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)
    )
    .nullable();

// ─── Add Employee (modal inside Purchase Request) ────────────────────────────

export const addEmployeeSchema = Yup.object({
    name: Yup.string()
        .matches(/^[a-zA-Z ]+$/, 'Please enter a valid name using only letters')
        .test(noEdgeWhitespace('Name'))
        .test(noConsecutiveSpaces('Name'))
        .test(notOnlyWhitespace('Name'))
        .min(2, 'Name must be at least 2 characters')
        .max(80, 'Name must be at most 80 characters')
        .required('Please enter the employee name'),
    department: Yup.string()
        .test(noEdgeWhitespace('Department'))
        .test(noConsecutiveSpaces('Department'))
        .test(notOnlyWhitespace('Department'))
        .max(80, 'Department must be at most 80 characters')
        .required('Please enter the department'),
});

// ─── Purchase Request ─────────────────────────────────────────────────────────

export const newPurchaseRequestSchema = Yup.object({
    requestedBy: Yup.string()
        .test(noEdgeWhitespace('Requested by'))
        .test(noConsecutiveSpaces('Requested by'))
        .test(notOnlyWhitespace('Requested by'))
        .required('Please enter or select a Requested By'),
    department: Yup.string()
        .test(noEdgeWhitespace('Department'))
        .test(noConsecutiveSpaces('Department'))
        .test(notOnlyWhitespace('Department')),
    category: Yup.string()
        .test(noEdgeWhitespace('Category'))
        .test(noConsecutiveSpaces('Category'))
        .test(notOnlyWhitespace('Category'))
        .required('Please enter a category'),
    neededBy: Yup.string().nullable(),
    lineItems: Yup.array()
        .of(
            Yup.object({
                key: Yup.string(),
                itemName: Yup.string()
                    .test(notOnlyWhitespace('Item name'))
                    .test(noEdgeWhitespace('Item name'))
                    .test(noConsecutiveSpaces('Item name'))
                    .min(2, 'Item name must be at least 2 characters')
                    .required('Please enter the item name'),
                description: Yup.string()
                    .test(noEdgeWhitespace('Description'))
                    .test(noConsecutiveSpaces('Description'))
                    .test(notOnlyWhitespace('Description'))
                    .max(2000, 'Description must be at most 2000 characters')
                    .notRequired(),
                qty: Yup.number()
                    .typeError('Quantity must be a number')
                    .min(1, 'Quantity must be at least 1')
                    .required('Please enter the quantity'),
                unit: Yup.string().required('Unit is required'),
                estUnitCost: Yup.number()
                    .transform((value, original) => (original === '' ? undefined : value))
                    .typeError('Cost must be a number')
                    .min(0, 'Cost must be 0 or greater')
                    .notRequired(),
            })
        )
        .min(1, 'At least one item is required'),
    attachments: Yup.array().notRequired(),
    newAttachments: Yup.array().notRequired(),
    notes: Yup.string()
        .test(noEdgeWhitespace('Notes'))
        .test(noConsecutiveSpaces('Notes'))
        .test(notOnlyWhitespace('Notes'))
        .min(3, 'Notes must be at least 3 characters')
        .max(2000, 'Notes must be at most 2000 characters')
        .notRequired(),
});

// ─── Vendor ───────────────────────────────────────────────────────────────────

export const addVendorSchema = Yup.object({
    businessName: Yup.string()
        .test(noEdgeWhitespace('Business name'))
        .test(noConsecutiveSpaces('Business name'))
        .test(notOnlyWhitespace('Business name'))
        .min(2, 'Business name must be at least 2 characters')
        .max(100, 'Business name must be at most 100 characters')
        .required('Please enter the business name'),
    gstin: gstinValidation,
    contactPerson: Yup.string()
        .matches(/^[a-zA-Z ]+$/, 'Please enter a valid name using only letters')
        .test(noEdgeWhitespace('Contact person'))
        .test(noConsecutiveSpaces('Contact person'))
        .test(notOnlyWhitespace('Contact person'))
        .min(3, 'Contact person must be at least 3 characters')
        .max(80, 'Contact person must be at most 80 characters')
        .required('Please enter the contact person name'),
    email: Yup.string()
        .test(noEdgeWhitespace('Email'))
        .test(notOnlyWhitespace('Email'))
        .email('Please enter a valid email address')
        .required('Please enter an email address'),
    phone: phoneValidation,
    tags: Yup.array().of(Yup.string()).notRequired(),
    paymentTerms: Yup.string()
        .test(noEdgeWhitespace('Payment terms'))
        .test(noConsecutiveSpaces('Payment terms'))
        .test(notOnlyWhitespace('Payment terms'))
        .nullable(),
    status: Yup.string().required('Please select a status'),
    bankName: Yup.string()
        .test(noEdgeWhitespace('Bank name'))
        .test(noConsecutiveSpaces('Bank name'))
        .test(notOnlyWhitespace('Bank name'))
        .nullable(),
    accountNumber: accountNumberValidation,
    ifscCode: ifscValidation,
    notes: Yup.string()
        .test(noEdgeWhitespace('Notes'))
        .test(noConsecutiveSpaces('Notes'))
        .test(notOnlyWhitespace('Notes'))
        .max(500, 'Notes must be at most 500 characters')
        .nullable(),
});

// ─── RFQ ──────────────────────────────────────────────────────────────────────

export const newRFQSchema = Yup.object({
    title: Yup.string()
        .test(noEdgeWhitespace('Title'))
        .test(noConsecutiveSpaces('Title'))
        .test(notOnlyWhitespace('Title'))
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must be at most 200 characters')
        .required('Please enter a title'),
    prRef: Yup.string().nullable(),
    deadline: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
        .test(
            'future-date',
            'Submission deadline must be today or a future date',
            value => {
                if (!value) return true;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(value) >= today;
            }
        )
        .required('Please select a submission deadline'),
    terms: Yup.string()
        .test(noEdgeWhitespace('Terms & Conditions'))
        .test(noConsecutiveSpaces('Terms & Conditions'))
        .test(notOnlyWhitespace('Terms & Conditions'))
        .min(3, 'Terms & Conditions must be at least 3 characters')
        .max(5000, 'Terms & Conditions must be at most 5000 characters')
        .notRequired(),
    notes: Yup.string()
        .test(noEdgeWhitespace('Notes'))
        .test(noConsecutiveSpaces('Notes'))
        .test(notOnlyWhitespace('Notes'))
        .min(3, 'Notes must be at least 3 characters')
        .max(2000, 'Notes must be at most 2000 characters')
        .notRequired(),
    lineItems: Yup.array()
        .of(
            Yup.object({
                key: Yup.string(),
                description: Yup.string()
                    .test(notOnlyWhitespace('Item Name'))
                    .required('Please enter the item name')
                    .min(3, 'Item Name must be at least 3 characters')
                    .test(noEdgeWhitespace('Item Name'))
                    .test(noConsecutiveSpaces('Item Name')),
                qty: Yup.number()
                    .typeError('Quantity must be a number')
                    .min(1, 'Quantity must be at least 1')
                    .required('Please enter the quantity'),
                unit: Yup.string().required('Unit is required'),
                price: Yup.number()
                    .transform((value, original) => (original === '' ? undefined : value))
                    .typeError('Price must be a number')
                    .min(0, 'Price must be 0 or greater')
                    .notRequired(),
            })
        )
        .min(1, 'At least one line item is required'),
    invitedVendors: Yup.array().of(Yup.number().required()),
    invitedEmails: Yup.array().of(Yup.string().email()),
}).test(
    'at-least-one-invite',
    'Please select at least one supplier or invite by email',
    function atLeastOneInvite(values) {
        const hasVendor = (values.invitedVendors?.length ?? 0) > 0;
        const hasEmail = (values.invitedEmails?.length ?? 0) > 0;
        if (hasVendor || hasEmail) return true;
        return this.createError({
            path: 'invitedVendors',
            message: 'Please select at least one supplier or invite by email',
        });
    }
);

// ─── Offline Proposal ────────────────────────────────────────────────────────

export const uploadOfflineProposalSchema = Yup.object({
    rfqId: Yup.number().nullable().notRequired(),
    invitedVendorId: Yup.number().nullable().notRequired(),
    totalAmount: Yup.number()
        .transform((value, original) => (original === '' ? undefined : value))
        .typeError('Please enter a valid amount')
        .positive('Amount must be greater than 0')
        .required('Please enter the total amount'),
    validUntil: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
        .test('future-date', 'Valid until date must be a future date', value => !value || new Date(value) > new Date())
        .required('Please select a valid until date'),
    paymentTerms: Yup.string()
        .test(noEdgeWhitespace('Payment terms'))
        .test(noConsecutiveSpaces('Payment terms'))
        .test(notOnlyWhitespace('Payment terms'))
        .max(100, 'Payment terms must be at most 100 characters')
        .nullable(),
    notes: Yup.string()
        .test(noEdgeWhitespace('Notes'))
        .test(noConsecutiveSpaces('Notes'))
        .test(notOnlyWhitespace('Notes'))
        .min(3, 'Notes must be at least 3 characters')
        .max(2000, 'Notes must be at most 2000 characters')
        .notRequired(),
    lineItems: Yup.array().of(
        Yup.object({
            description: Yup.string()
                .test(noEdgeWhitespace('Item name'))
                .test(noConsecutiveSpaces('Item name'))
                .test(notOnlyWhitespace('Item name'))
                .min(3, 'Item name must be at least 3 characters')
                .max(200, 'Item name must be at most 200 characters')
                .when('unitPrice', {
                    is: (val: any) => val !== undefined && val !== null && val !== '',
                    then: schema => schema.required('Description is required when a price is entered'),
                    otherwise: schema => schema.notRequired(),
                }),
            qty: Yup.number()
                .transform((value, original) => (original === '' ? undefined : value))
                .typeError('Quantity must be a number')
                .min(1, 'Quantity must be at least 1')
                .max(99999, 'Quantity cannot exceed 99,999')
                .notRequired(),
            unitPrice: Yup.number()
                .transform((value, original) => (original === '' ? undefined : value))
                .typeError('Price must be a number')
                .min(0.01, 'Price must be greater than 0')
                .max(9999999.99, 'Price cannot exceed ₹99,99,999.99')
                .notRequired(),
        })
    ).notRequired(),
});

// ─── Purchase Order ───────────────────────────────────────────────────────────

export const newPurchaseOrderSchema = Yup.object({
    title: Yup.string()
        .test(noEdgeWhitespace('Title'))
        .test(noConsecutiveSpaces('Title'))
        .test(notOnlyWhitespace('Title'))
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must be at most 200 characters')
        .required('Please enter a title'),
    vendor: Yup.string().required('Please select a vendor'),
    linkedRFQ: Yup.string().nullable(),
    deliveryDate: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
        .test(
            'future-or-today',
            'Delivery date must be today or a future date',
            value => {
                if (!value) return true;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(value) >= today;
            }
        )
        .nullable(),
    currency: Yup.string().required('Please select a currency'),
    deliveryAddress: Yup.string()
        .test(noEdgeWhitespace('Delivery address'))
        .test(noConsecutiveSpaces('Delivery address'))
        .test(notOnlyWhitespace('Delivery address'))
        .min(3, 'Delivery address must be at least 3 characters')
        .required('Please enter a delivery address'),
    paymentTerms: Yup.string()
        .test(noEdgeWhitespace('Payment terms'))
        .test(noConsecutiveSpaces('Payment terms'))
        .test(notOnlyWhitespace('Payment terms'))
        .nullable(),
    notes: Yup.string()
        .test(noEdgeWhitespace('Notes'))
        .test(noConsecutiveSpaces('Notes'))
        .test(notOnlyWhitespace('Notes'))
        .min(3, 'Notes must be at least 3 characters')
        .max(250, 'Notes must be at most 250 characters')
        .notRequired(),
    internalNotes: Yup.string()
        .test(noEdgeWhitespace('Internal notes'))
        .test(noConsecutiveSpaces('Internal notes'))
        .test(notOnlyWhitespace('Internal notes'))
        .min(3, 'Internal notes must be at least 3 characters')
        .max(250, 'Internal notes must be at most 250 characters')
        .notRequired(),
    lineItems: Yup.array().of(
        Yup.object({
            description: Yup.string()
                .test(noEdgeWhitespace('Description'))
                .test(noConsecutiveSpaces('Description'))
                .test(notOnlyWhitespace('Item description'))
                .min(3, 'Description must be at least 3 characters')
                .max(200, 'Description must be at most 200 characters')
                .required('Description is required'),
            qty: Yup.number()
                .transform((value, original) => (original === '' ? undefined : value))
                .typeError('Quantity must be a number')
                .min(1, 'Quantity must be at least 1')
                .max(99999, 'Quantity cannot exceed 99,999')
                .required('Please enter the quantity'),
            unit: Yup.string().required('Unit is required'),
            amount: Yup.number()
                .transform((value, original) => (original === '' ? undefined : value))
                .typeError('Amount must be a number')
                .min(0.01, 'Amount must be greater than 0')
                .max(9999999.99, 'Amount cannot exceed ₹99,99,999.99')
                .required('Unit cost is required'),
        })
    ).min(1, 'At least one line item is required'),
});

export const editPurchaseOrderSchema = newPurchaseOrderSchema.shape({
    deliveryDate: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
        .nullable(),
});

// ─── Vendor Proposal Submission ───────────────────────────────────────────────

export const vendorProposalSubmissionSchema = Yup.object({
    vendor: Yup.string()
        .required('Please select a vendor'),
    validUntil: Yup.string()
        .required('Please select a valid until date')
        .test('future-date', 'Valid Until must be a future date', value =>
            !value || new Date(value) >= new Date(new Date().toDateString())
        ),
    contactName: Yup.string()
        .test(noEdgeWhitespace('Contact name'))
        .test(noConsecutiveSpaces('Contact name'))
        .test(notOnlyWhitespace('Contact name'))
        .min(2, 'Contact name must be at least 2 characters')
        .max(100, 'Contact name must be at most 100 characters')
        .required('Please enter the contact name'),
    email: Yup.string()
        .email('Please enter a valid email address')
        .max(150, 'Email must be at most 150 characters')
        .required('Please enter an email address'),
    paymentTerms: Yup.string()
        .test(noEdgeWhitespace('Payment terms'))
        .test(notOnlyWhitespace('Payment terms'))
        .min(2, 'Payment terms must be at least 2 characters')
        .max(100, 'Payment terms must be at most 100 characters')
        .required('Please enter payment terms'),
    coverNote: Yup.string()
        .test(noEdgeWhitespace('Cover note'))
        .test(noConsecutiveSpaces('Cover note'))
        .test(notOnlyWhitespace('Cover note'))
        .max(2000, 'Cover note must be at most 2000 characters')
        .notRequired(),
});

// ─── Online Proposal ──────────────────────────────────────────────────────────

export const onlineProposalSchema = Yup.object({
    validUntil: Yup.mixed()
        .required('Please select a Proposal Valid Until date')
        .test('future-date', 'Valid Until must be a future date', (value: any) =>
            value ? !value.isBefore(new Date(), 'day') : false
        ),
    businessName: Yup.string()
        .test(noEdgeWhitespace('Business name'))
        .test(noConsecutiveSpaces('Business name'))
        .test(notOnlyWhitespace('Business name'))
        .min(2, 'Business name must be at least 2 characters')
        .max(200, 'Business name must be at most 200 characters')
        .required('Please enter your business name'),
    contactPerson: Yup.string()
        .test(noEdgeWhitespace('Contact person'))
        .test(noConsecutiveSpaces('Contact person'))
        .test(notOnlyWhitespace('Contact person'))
        .min(2, 'Contact person must be at least 2 characters')
        .max(100, 'Contact person must be at most 100 characters')
        .required('Please enter the contact person name'),
    mobile: Yup.string()
        .trim()
        .min(10, 'Mobile number must be 10 digits')
        .max(10, 'Mobile number must be 10 digits')
        .matches(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit mobile number')
        .required('Please enter a mobile number'),
    gstin: gstinValidation,
    paymentTerms: Yup.string()
        .test(noEdgeWhitespace('Payment terms'))
        .test(notOnlyWhitespace('Payment terms'))
        .required('Please select payment terms'),
    deliveryTimeline: Yup.string()
        .test(noEdgeWhitespace('Delivery timeline'))
        .test(noConsecutiveSpaces('Delivery timeline'))
        .test(notOnlyWhitespace('Delivery timeline'))
        .min(2, 'Delivery timeline must be at least 2 characters')
        .max(200, 'Delivery timeline must be at most 200 characters')
        .required('Please enter the delivery timeline'),
    warranty: Yup.string()
        .test(noEdgeWhitespace('Warranty / Support'))
        .test(noConsecutiveSpaces('Warranty / Support'))
        .test(notOnlyWhitespace('Warranty / Support'))
        .max(500, 'Warranty / Support must be at most 500 characters')
        .notRequired(),
    notesForBuyer: Yup.string()
        .test(noEdgeWhitespace('Notes for buyer'))
        .test(noConsecutiveSpaces('Notes for buyer'))
        .test(notOnlyWhitespace('Notes for buyer'))
        .max(2000, 'Notes for buyer must be at most 2000 characters')
        .notRequired(),
    lineItems: Yup.array().of(
        Yup.object({
            unitCost: Yup.number()
                .typeError('Please enter a valid unit cost')
                .moreThan(0, 'Unit cost must be greater than 0')
                .required('Unit cost is required'),
        })
    ),
});

// ─── Upload Invoice ────────────────────────────────────────────────────────────

export const uploadInvoiceSchema = Yup.object({
    purchaseOrder: Yup.string().required('Please select a purchase order'),
    accountNumber: accountNumberValidation,
    ifscCode: ifscValidation,
    invoiceNumber: Yup.string()
        .test(noEdgeWhitespace('Invoice number'))
        .test(noConsecutiveSpaces('Invoice number'))
        .test(notOnlyWhitespace('Invoice number'))
        .max(50, 'Invoice number must be at most 50 characters')
        .required('Please enter the invoice number'),
    lineItems: Yup.array().of(
        Yup.object({
            description: Yup.string()
                .test(noEdgeWhitespace('Description'))
                .test(noConsecutiveSpaces('Description'))
                .test(notOnlyWhitespace('Description'))
                .min(2, 'Description must be at least 2 characters')
                .max(200, 'Description must be at most 200 characters')
                .required('Please enter the description'),
            qty: Yup.number()
                .transform((value, original) => (original === '' ? undefined : value))
                .typeError('Please enter a valid quantity')
                .min(0.01, 'Quantity must be greater than 0')
                .required('Please enter the quantity'),
            unitPrice: Yup.number()
                .transform((value, original) => (original === '' ? undefined : value))
                .typeError('Please enter a valid unit price')
                .min(0.01, 'Unit price must be greater than 0')
                .required('Please enter the unit price'),
        })
    ).min(1, 'Please add at least one line item'),
    invoiceDate: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
        .test(
            'not-future',
            'Invoice date cannot be a future date',
            value => {
                if (!value) return true;
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return new Date(value) <= today;
            }
        )
        .required('Please select the invoice date'),
    receivedDate: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
        .test(
            'not-future',
            'Received date cannot be a future date',
            value => {
                if (!value) return true;
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                return new Date(value) <= today;
            }
        )
        .required('Please select the received date'),
    dueDate: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
        .test(
            'future-or-today',
            'Due date must be today or a future date',
            value => {
                if (!value) return true;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(value) >= today;
            }
        )
        .nullable(),
    notes: Yup.string()
        .test(noEdgeWhitespace('Notes'))
        .test(noConsecutiveSpaces('Notes'))
        .test(notOnlyWhitespace('Notes'))
        .min(3, 'Notes must be at least 3 characters')
        .max(2000, 'Notes must be at most 2000 characters')
        .notRequired(),
});
