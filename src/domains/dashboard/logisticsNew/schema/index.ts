import * as Yup from 'yup';

import { emailRegex } from '@utils/regex';

const startWithSpaceRegex = /^(?!\s)(.*\S)?$/;

export const calculateShipmentSchema = Yup.object().shape({
    originAddressKey: Yup.string().required('Please select origin address'),
    destinationAddressKey: Yup.string().required('Please select destination address'),
    originPostCode: Yup.string()
        .required('Please enter origin PIN code')
        .matches(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit PIN code'),
    destinationPostCode: Yup.string()
        .required('Please enter destination PIN code')
        .matches(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit PIN code'),
    weight: Yup.number()
        .typeError('Please enter a valid weight')
        .required('Please enter total weight')
        .min(0.5, 'Minimum chargeable wt is 0.5 kg'),
    length: Yup.number()
        .typeError('Please enter a valid length')
        .required('Please enter length')
        .min(0.5, 'Value should be greater than 0.50 cm'),
    width: Yup.number()
        .typeError('Please enter a valid width')
        .required('Please enter width')
        .min(0.5, 'Value should be greater than 0.50 cm'),
    height: Yup.number()
        .typeError('Please enter a valid height')
        .required('Please enter height')
        .min(0.5, 'Value should be greater than 0.50 cm'),
});

export const calculateInternationalShipmentSchema = Yup.object().shape({
    originAddressKey: Yup.string().required('Please select origin address'),
    destinationAddressKey: Yup.string().required('Please select destination address'),
    originPostCode: Yup.string()
        .required('Please enter origin PIN code')
        .matches(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit PIN code'),
    destinationCountryCode: Yup.string().required('Please select a destination country'),
    weight: Yup.number()
        .typeError('Please enter a valid weight')
        .required('Please enter total weight')
        .min(0.5, 'Minimum chargeable wt is 0.5 kg'),
    length: Yup.number()
        .typeError('Please enter a valid length')
        .required('Please enter length')
        .min(0.5, 'Value should be greater than 0.50 cm'),
    width: Yup.number()
        .typeError('Please enter a valid width')
        .required('Please enter width')
        .min(0.5, 'Value should be greater than 0.50 cm'),
    height: Yup.number()
        .typeError('Please enter a valid height')
        .required('Please enter height')
        .min(0.5, 'Value should be greater than 0.50 cm'),
});

export const getShipmentDetailsSchema = (isInternational: boolean) =>
    Yup.object().shape({
        senderEmail: Yup.string()
            .email('Please enter a valid sender email address')
            .required('Please enter sender email address'),
        receiverEmail: Yup.string()
            .email('Please enter a valid receiver email address')
            .required('Please enter receiver email address'),
        consentAgreed: Yup.boolean()
            .oneOf([true], 'You must agree to the terms before proceeding')
            .required('You must agree to the terms before proceeding'),
        items: Yup.array()
            .of(
                Yup.object().shape({
                    name: Yup.string()
                        .matches(
                            startWithSpaceRegex,
                            'Package content cannot start or end with a blank space'
                        )
                        .test(
                            'no-multiple-spaces',
                            'Package content cannot contain consecutive blank spaces',
                            isConsecutiveSpaces
                        )
                        .test(
                            'at-least-3-valid-chars',
                            'Package content must contain at least 3 letters or numbers',
                            value => {
                                if (!value) return false;
                                const alphanumericCount = (value.match(/[a-zA-Z0-9]/g) || []).length;
                                return alphanumericCount >= 3;
                            }
                        )
                        .min(3, 'Package content must be at least 3 characters')
                        .required('Please enter the package content'),

                    price: Yup.number()
                        .typeError('package value must be a valid number')
                        .required('Please enter the package value')
                        .positive('Package value must be greater than zero'),

                    quantity: Yup.number()
                        .typeError('Package quantity must be a valid number')
                        .required('Please enter the package quantity ')
                        .positive('Package quantity must be greater than zero')
                        .integer('Package quantity must be a whole number'),

                    hsn: isInternational
                        ? Yup.string()
                              .required('Please enter the HSN code')
                              .matches(/^\d+$/, 'HSN code must contain only digits')
                        : Yup.string().optional(),
                })
            )
            .min(1, 'Please add at least one item'),
    });

export const shipmentDetailsSchema = getShipmentDetailsSchema(false);

export const buildAddressSchema = (isInternational: boolean) =>
    Yup.object().shape({
        name: Yup.string()
            .required('Please enter the full name')
            .min(3, 'Full name must be at least 3 characters')
            .max(50, 'Full name must not exceed 50 characters')
            .matches(startWithSpaceRegex, 'Full name cannot start or end with whitespace'),
        phone: Yup.string()
            .required('Please enter the mobile number')
            .matches(
                isInternational ? /^[0-9]{7,15}$/ : /^[0-9]{10}$/,
                isInternational
                    ? 'Enter a valid phone number (7–15 digits)'
                    : 'Please enter a valid 10-digit mobile number'
            ),
        email: Yup.string()
            .email('Please enter the valid email ID')
            .matches(emailRegex, 'Please enter the valid email ID')
            .required('Please enter email address'),
        pinCode: isInternational
            ? Yup.string().required('Please enter the PIN code')
            : Yup.string()
                  .required('Please enter the PIN code')
                  .matches(/^[1-9][0-9]{5}$/, 'Pincode must be a 6-digit number'),
        addressLine1: Yup.string()
            .required('Please enter the address line 1')
            .min(10, 'Address line 1 must be at least 10 characters')
            .max(100, 'Address line 1 must not exceed 100 characters')
            .matches(/\d/, 'Address line 1 must include a house / flat / road number')
            .matches(startWithSpaceRegex, 'Address line 1 cannot start or end with blank space'),
        addressLine2: Yup.string()
            .min(3, 'Address line 2 must be at least 3 characters')
            .max(100, 'Address line 2 must not exceed 100 characters')
            .matches(startWithSpaceRegex, 'Address line 2 cannot start or end with blank space'),
        city: Yup.string()
            .min(3, 'City name must be at least 3 characters')
            .matches(startWithSpaceRegex, 'City cannot start or end with a blank space'),
        state: Yup.string().required('Please select the state'),
    });

function isConsecutiveSpaces(value: any) {
    if (value && typeof value === 'string') {
        return !/\s{2,}/.test(value);
    }
    return true;
}
