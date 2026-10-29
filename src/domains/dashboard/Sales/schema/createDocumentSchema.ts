import * as Yup from 'yup';

import { calcTotal } from '../utils/documentCalculations';
import { withLetterRequired, withSpaceValidation } from '../utils/yupHelpers';

export const createDocumentSchema = Yup.object({
    buyer: Yup.object({
        name: withLetterRequired(
            withSpaceValidation(
                Yup.string()
                    .required('Please enter the customer name')
                    .min(3, 'Customer name must be at least 3 characters')
                    .max(50, 'Customer name cannot exceed 50 characters'),
                'Customer name'
            ),
            'Customer name'
        ),

        gstNumber: Yup.string().optional(),

        address: withLetterRequired(
            withSpaceValidation(
                Yup.string()
                    .required('Please enter the customer address')
                    .min(3, 'Customer address must be at least 3 characters')
                    .max(100, 'Customer address cannot exceed 100 characters'),
                'Customer address'
            ),
            'Address'
        ),

        city: withLetterRequired(
            withSpaceValidation(
                Yup.string()
                    .required('Please enter the city name')
                    .min(3, 'City name must be at least 3 characters')
                    .max(50, 'City name cannot exceed 50 characters'),
                'City name'
            ),
            'City name'
        ),

        state: Yup.string()
            .required('Please enter the state')
            .max(50, 'State cannot exceed 50 characters'),

        country: Yup.string().optional(),

        pincode: Yup.string().optional(),

        email: Yup.string().email('Please enter a valid email').optional(),

        phoneNumber: Yup.string()
            .required('Please enter the customer mobile number')
            .matches(/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'),

        saveCustomer: Yup.boolean(),
    }),

    document: Yup.object({
        type: Yup.string().oneOf(['DOMESTIC', 'INTERNATIONAL']).required(),

        documentPrefix: Yup.string().required('Prefix is required'),

        documentNumber: Yup.string()
            .required('Please enter the document number')
            .matches(/^[^\s].*$/, 'Document number cannot start with whitespace'),

        currency: Yup.string().when('type', {
            is: 'INTERNATIONAL',
            then: schema => schema.required('Please select the Currency'),
            otherwise: schema => schema.optional(),
        }),

        documentDate: Yup.string()
            .required('Please select the document date')
            .matches(/^\d{4}-\d{2}-\d{2}$/, 'Document date must be in YYYY-MM-DD format'),

        dueDate: Yup.string()
            .required('Please select the due date')
            .test(
                'after-document-date',
                'Due date must be after document date',
                function validateDueDate(dueDate) {
                    const { documentDate } = this.parent;
                    if (!documentDate || !dueDate) return true;
                    return dueDate > documentDate;
                }
            ),
    }),

    items: Yup.array()
        .of(
            Yup.object({
                name: Yup.string()
                    .required('Please select an item')
                    .test(
                        'no-leading-trailing-spaces',
                        'Title cannot start or end with blank space.',
                        v => !/^\s|\s$/.test(v ?? '')
                    )
                    .test(
                        'no-consecutive-spaces',
                        'Title cannot contain consecutive blank spaces.',
                        v => !/\s{2,}/.test(v ?? '')
                    )
                    .matches(/[a-zA-Z]/, 'Title cannot contain only numbers')
                    .min(3, 'Title must be at least 3 characters'),

                hsn: Yup.string()
                    .optional()
                    .test('valid-hsn', 'HSN code must be 2, 4, 6, or 8 numeric digits', v => {
                        if (!v) return true;
                        return /^\d+$/.test(v) && [2, 4, 6, 8].includes(v.length);
                    }),

                quantity: Yup.number()
                    .typeError('Quantity must be a number')
                    .required('Please enter the quantity')
                    .min(1, 'Quantity must be at least 1'),

                unit: Yup.string().required('Please select the unit'),

                unitPrice: Yup.number()
                    .typeError('Price must be a number')
                    .required('Please enter the price')
                    .moreThan(0, 'Price must be greater than zero'),

                discount: Yup.number()
                    .transform((value, originalValue) =>
                        originalValue === '' || originalValue === null ? undefined : value
                    )
                    .typeError('Discount must be a number')
                    .min(0, 'Discount must be 0 or more')
                    .max(100, 'Discount must be at most 100'),

                taxRate: Yup.string().required('Please select the GST tax rate'),
            })
        )
        .min(1, 'Please add at least one item'),

    additional: Yup.object({
        termsAndConditions: Yup.string().optional(),
        notes: Yup.string().optional(),

        shippingCost: Yup.number()
            .transform((val, orig) => (orig === '' || orig == null ? 0 : val))
            .nullable()
            .optional()
            .min(0, 'Shipping must be 0 or more'),

        amountPaid: Yup.number()
            .typeError('Amount paid must be a number')
            .transform((val, orig) => (orig === '' || orig == null ? 0 : val))
            .nullable()
            .optional()
            .min(0, 'Amount paid must be 0 or more'),

        paymentMode: Yup.string().optional(),
    }),
}).test('cross-field-validations', '', function validateCrossFields(values) {
    const errors: Yup.ValidationError[] = [];
    const transactionType = values?.document?.type;

    if (transactionType === 'INTERNATIONAL' && !values?.buyer?.country) {
        errors.push(
            this.createError({ path: 'buyer.country', message: 'Please select the country' })
        );
    }

    if (transactionType === 'DOMESTIC') {
        if (values?.buyer?.gstNumber) {
            if (values.buyer.gstNumber.length !== 15) {
                errors.push(
                    this.createError({
                        path: 'buyer.gstNumber',
                        message: 'GSTIN must be 15 characters',
                    })
                );
            } else if (
                !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
                    values.buyer.gstNumber
                )
            ) {
                errors.push(
                    this.createError({
                        path: 'buyer.gstNumber',
                        message: 'Please enter a valid GST number',
                    })
                );
            }
        }

        if (!values?.buyer?.pincode) {
            errors.push(
                this.createError({ path: 'buyer.pincode', message: 'Please enter the PIN code' })
            );
        } else if (!/^[0-9]{6}$/.test(values.buyer.pincode)) {
            errors.push(
                this.createError({
                    path: 'buyer.pincode',
                    message: 'PIN code must be exactly 6 digits',
                })
            );
        }
    }

    const amountPaid = values?.additional?.amountPaid;
    if (amountPaid != null && amountPaid > 0) {
        const total = parseFloat(
            calcTotal((values?.items ?? []) as any, String(values?.additional?.shippingCost ?? ''))
        );
        if (amountPaid > total) {
            errors.push(
                this.createError({
                    path: 'additional.amountPaid',
                    message: 'Amount Paid cannot be greater than the total',
                })
            );
        }
    }

    if (errors.length > 0) {
        throw new Yup.ValidationError(errors);
    }
    return true;
});
