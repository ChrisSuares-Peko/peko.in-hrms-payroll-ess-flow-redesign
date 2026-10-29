import * as Yup from 'yup';

import { trnRegex } from '@utils/regex';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const invoiceDetailsSchema = Yup.object().shape({
    billerName: Yup.string()
        .required("Please enter the biller's name")
        .matches(/^[^\s].*$/, 'Biller name cannot start with whitespace')
        .matches(/^[a-zA-Z&.\- ]*$/, 'Biller name can only contain letters, spaces, &, ., and -')
        .test(
            'no-multiple-whitespace',
            'Biller name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Biller name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        )
        .min(3, 'Biller name must be at least 3 characters'),
    billerCompanyAddress: Yup.string()
        .matches(/^[a-zA-Z0-9\s.,/&-:]+$/, 'Please enter valid company address')
        .required('Please enter the company address')
        .matches(/^[^\s].*$/, 'Company address cannot start with whitespace')
        .test(
            'no-multiple-whitespace',
            'Company address cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Company address cannot be only whitespace',
            value => !/^\s*$/.test(value)
        )
        .min(3, 'Company address must be at least 3 characters'),

    billerEmail: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email ID'
        )
        .required("Please enter the biller's email ID"),
    billerPhone: Yup.string()
        .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
        .required("Please enter the biller's mobile number"),

    billerGST: Yup.string().optional(),

    billerTRNNumber: Yup.string()
        .min(10, 'TRN number must be at least 10 digits')
        .matches(trnRegex, 'Please enter a valid TRN number'),

    customerName: Yup.string()
        .matches(/^[a-zA-Z&.\- ]*$/, 'Please enter valid customer name')
        .required("Please enter the customer's name")
        .matches(/^[^\s].*$/, 'Customer name cannot start with whitespace')
        .test(
            'no-multiple-whitespace',
            'Customer name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Customer name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        )
        .min(3, 'Customer name must be at least 3 characters'),
    customerAddress: Yup.string()
        .matches(/^[a-zA-Z0-9\s.,/&-:]+$/, 'Please enter a valid customer address')
        .required("Please enter the customer's address")
        .matches(/^[^\s].*$/, 'Customer address cannot start with whitespace')
        .notOneOf(
            [Yup.ref('billerCompanyAddress')],
            "Address cannot be the same as the biller's address"
        )
        .test(
            'no-multiple-whitespace',
            'Customer address cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Customer address cannot be only whitespace',
            value => !/^\s*$/.test(value)
        )
        .min(3, 'Customer address must be at least 3 characters'),
    customerPhone: Yup.string()
        .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
        .required("Please enter the customer's mobile number"),
    customerEmail: Yup.string()
        .required("Please enter the customer's email ID")
        .email('Please enter a valid email ID')
        .notOneOf([Yup.ref('billerEmail')], "Email cannot be the same as the biller's email")
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter valid email address'
        ),
    customerTRNNumber: Yup.string()
        .min(10, 'TRN number must be at least 10 digits')
        .matches(trnRegex, 'Please enter a valid TRN number'),
    paymentMode: Yup.string().required('Please select a payment mode'),
    invoiceNo: Yup.string()
        .required('Please enter the invoice number')
        .matches(/^[^\s].*$/, 'Invoice number cannot start with whitespace'),
    invoiceDate: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invoice date must be in the format YYYY-MM-DD')
        .required('Please enter the invoice date'),
    dueDate: Yup.string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in the format YYYY-MM-DD')
        .required('Please enter the due date')
        .test(
            'is-a-future-date',
            'Due date must be in the future',
            dueDate => new Date() < new Date(dueDate)
        )
        .when('invoiceDate', (invoiceDate, schema) =>
            schema.test({
                name: 'is-greater-than-invoiceDate',
                message: 'Due date must be greater than invoice date',
                test(dueDate) {
                    const invoiceDateValue = Array.isArray(invoiceDate)
                        ? invoiceDate[0]
                        : invoiceDate;
                    if (!invoiceDateValue || !dueDate) return true;
                    return new Date(dueDate) > new Date(invoiceDateValue);
                },
            })
        ),
    items: Yup.array().of(
        Yup.object().shape({
            item: Yup.string()
                .matches(/^[\w\s.,;:'"-]+$/, 'Please enter a valid title')
                .required("Please enter an item's title")
                .matches(/^[^\s].*$/, 'Title cannot start with a space')
                .test(
                    'no-multiple-whitespace',
                    'Title cannot contain consecutive whitespaces',
                    value => !/\s{2,}/.test(value)
                ) // No consecutive spaces
                .test(
                    'not-only-whitespace',
                    'Title cannot be only whitespace',
                    value => !/^\s*$/.test(value)
                )
                .test(
                    'not-only-numbers',
                    'Title cannot contain only numbers',
                    value => !/^\d+$/.test(value)
                )
                .min(3, 'Title must be at least 3 characters'),
            quantity: Yup.number()
                .typeError('Quantity must be a number')
                .required('Please enter the quantity'),

            price: Yup.number()
                .typeError('Price must be a number')
                .min(0.1, 'Price must be greater than 0')
                .required('Please enter the price'),

            gst: Yup.number()
                .typeError('GST must be a number')
                .max(100, 'GST must be less than or equal to 100'),

            discount: Yup.number()
                .typeError('Discount must be a number')
                .max(100, 'Discount must be less than or equal to 100'),
        })
    ),
    shipping: Yup.number()
        .typeError('Shipping amount must be a number')
        .min(0, 'Shipping amount must be at least 0'),
    amountPaid: Yup.number()
        .typeError('Amount paid must be a number')
        .nullable()
        .test(
            'is-greater-than-total',
            'Amount Paid cannot be greater than the total',
            function isGreaterThanTotal(value: any) {
                if (value === null || value === undefined || value === '') {
                    return true;
                }

                const { items, shipping } = this.parent;
                const total =
                    items.reduce((acc: any, item: any) => acc + (parseFloat(item.amount) || 0), 0) +
                    Number(shipping || 0);

                return value <= total;
            }
        ),
});
// export const DaysSchema = Yup.object().shape({
//     data: Yup.array().of(
//         Yup.object().shape({
//             days: Yup.number()

//                 .required('Days are required')
//                 .min(1, 'Days must be at least 1')
//                 .max(365, 'Days cannot exceed 365'),
//         })
//     ),
// });

export const DaysSchema = Yup.object().shape({
    data: Yup.array().of(
        Yup.object().shape({
            days: Yup.string()
                .matches(/^\d+$/, 'Days must be a number')
                .required('Days are required')
                .test('is-not-zero', 'Days cannot be zero', value => Number(value) !== 0)
                .test('is-valid-number', 'Days cannot exceed 31', value => {
                    const num = Number(value);
                    return num >= 1 && num <= 31;
                }),
        })
    ),
});

export const customersSchema = Yup.object().shape({
    // name: Yup.string()
    //     .required('Please enter the customer name')
    //     .trim()
    //     .min(3, 'Customer name must be at least 3 characters'),
    name: Yup.string()
        .min(3, 'Customer name must be at least 3 characters')
        .matches(
            /^[^\s][a-zA-Z0-9 -]*[a-zA-Z]+[a-zA-Z0-9 -]*$/,
            'Please enter a valid customer name.'
        )
        .matches(/^(?!.*\d{2,}).*$/, 'Customer name cannot contain two consecutive digits')
        .required('Please enter the customer name'),
    email: Yup.string()
        .required('Please enter the email ID')
        .matches(emailRegex, 'Please enter a valid email ID')
        .matches(/^[^\s].*$/, 'Email ID cannot start with a space'),
    address: Yup.string()
        .required('Please enter the address')
        .trim()
        .min(3, 'Address must be at least 3 characters')

        .max(200, 'Maximum 200 characters are allowed')
        .test(
            'no-leading-whitespace',
            'Address cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Address cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Address cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),
    phoneNumber: Yup.string()
        .required('Please enter the mobile number')
        .trim()
        .min(10, 'Mobile number must be atleast 10 digits')
        .max(12, 'Maximum 12 characters are allowed'),
    trnNo: Yup.string()
        .min(10, 'TRN number must be at least 10 digits')
        .matches(trnRegex, 'Please enter a valid TRN number'),
});

export const paymentLinkSchema = Yup.object().shape({
    full_name: Yup.string()
        .min(3, 'Customer name must be at least 3 characters ')
        .required('Please enter the customer name')
        .test(
            'no-leading-whitespace',
            'Customer name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Customer name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Customer name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),

    purpose_message: Yup.string()
        .min(5, 'Purpose message must be at least 5 characters ')
        .required('Please enter the Purpose message')
        .test(
            'no-leading-whitespace',
            'Purpose message cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Purpose message cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Purpose message cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),

    email: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/,
            'Please enter a valid email ID'
        )
        .required('Please enter the email ID')
        .matches(/^[^\s].*$/, 'Email ID cannot start with a space'),

    expires_at: Yup.number()
        .required('Please enter the expiry time')
        .min(1, 'Expiry time must be at least 1 hour')
        .max(24, 'Expiry time cannot exceed 24 hours')
        .typeError('Expiry time must be a valid number'),

    phone_number: Yup.string()
        .required('Please enter the mobile number')
        .trim()
        .min(10, 'Mobile number must be atleast 10 digits')
        .max(12, 'Maximum 12 characters are allowed'),
    amount: Yup.string()
        .matches(
            /^-?\d{1,8}(\.\d{1,2})?$/,
            'Amount must be up to 8 digits before the decimal and 2 digits after'
        )
        .required('Please enter the amount')
        .test('is-not-zero', 'Amount cannot be zero', value => Number(value) !== 0),
});

export const createSupplierSchema = Yup.object().shape({
    bankId: Yup.string()
        .required('Please select the bank name')
        .matches(/^[a-zA-Z0-9]+$/, 'Bank name must be alphanumeric'),
    accountHolderName: Yup.string()
        .required('Please enter the account holder name')
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed')
        .matches(/^[a-zA-Z\s]+$/, 'Please enter a valid name')
        .test(
            'no-leading-whitespace',
            'Name cannot start with whitespace',
            value => !/^\s/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            'Name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces,
    accountNumber: Yup.string()
        .required('Please enter the account number')
        .min(15, 'Account number must be at least 15 digits'),
    ibanNumber: Yup.string()
        .required('Please enter the IBAN number')
        .matches(/^AE/, 'IBAN number must start with "AE"')
        .length(23, 'IBAN number must be 23 characters long')
        .matches(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/, 'Please enter a valid IBAN'),
    companyLogo: Yup.string().required('Please upload the company logo'),
});

export const updateSignerValidation = Yup.object().shape({
    signerName: Yup.string()
        .required('Please enter the signer name')
        .min(3, 'Signer name must be at least 3 characters')
        .test(
            'no-leading-whitespace',
            'Name cannot start with whitespace',
            value => !/^\s/.test(value)
        )
        .test(
            'no-multiple-whitespace',
            'Name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ),
    email: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/,
            'Please enter a valid email ID'
        )
        .required('Please enter the email ID')
        .matches(/^[^\s].*$/, 'Email ID cannot start with a space'),
    designation: Yup.string()
        .required('Please enter the designation')
        .min(3, 'Designation must be at least 3 characters'),

    address: Yup.string()
        .required('Please enter the address')
        .min(5, 'Address must be at least 5 characters'),

    city: Yup.string()
        .required('Please enter the city ')
        .min(2, 'City name must be at least 2 characters')
        .matches(/^[a-zA-Z\s]+$/, 'City name must contain only alphabets'),
});
