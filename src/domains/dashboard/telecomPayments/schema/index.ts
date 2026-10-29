import * as Yup from 'yup';

import { accessKeys } from '@utils/accessKeys';
import { alphabets, indianMobileRegex } from '@utils/regex';

import { CustomerParam } from '../types/index';

export const prepaidSchema = Yup.object().shape({
    serviceProvider: Yup.string().required('Please select the service provider'),
    circle: Yup.string().required('Please select the circle'),
    mobileNumber: Yup.string()
        .required('Please enter the mobile number')
        .matches(/^\d{10}$/, 'Mobile number must be 10 digits'),
    amount: Yup.number()
        .required('Please select plan')
        .min(1, 'Amount should be greater than or equal to ₹ 1')
        .max(9999, 'Amount should be less than or equal to ₹ 9999'),
});

export const prepaidFormSchema = Yup.object().shape({
    serviceProvider: Yup.string().required('Please select the service provider'),
    circle: Yup.string().required('Please select the circle'),
    mobileNumber: Yup.string()
        .required('Please enter the mobile number')
        .matches(/^\d{10}$/, 'Mobile number must be 10 digits'),
    saveToBeneficiaries: Yup.boolean().optional(),
    beneficiaryName: Yup.string().when('saveToBeneficiaries', {
        is: true,
        then: schema =>
            schema
                .required('Beneficiary name is required')
                .min(3, "Beneficiary's name must have at least 3 characters")
                .max(50, 'Max 50 characters')
                .matches(alphabets, 'Please enter a valid name')
                .test(
                    'no-leading-trailing-space',
                    "Beneficiary's name cannot start or end with a blank space.",
                    value => {
                        if (!value) return true; // Let required handle empty values
                        return value.trim() === value;
                    }
                )
                .test(
                    'no-consecutive-spaces',
                    "Beneficiary's name cannot contain consecutive blank spaces.",
                    value => {
                        if (!value) return true; // Let required handle empty values
                        return !/\s{2,}/.test(value);
                    }
                ),
        otherwise: schema => schema.optional(),
    }),
});

export const prepaidAddBeneficiarySchema = Yup.object().shape({
    name: Yup.string().required("Please enter the beneficiary's name"),
    phoneNo: Yup.string()
        .matches(indianMobileRegex, 'Please enter a valid mobile number.')
        .required('Please enter your Mobile Number.'),
    serviceProvider: Yup.string().required('Please select operator.'),
    providerCircle: Yup.string().required('Please select circle'),
});

export const postpaidAddBeneficiarySchema = Yup.object().shape({
    name: Yup.string().required("Please enter the beneficiary's name"),
    serviceProvider: Yup.string().required('Please select the service provider'),
});

export const generateDynamicSchema = (inputs?: CustomerParam[]) => {
    let yupObject: any = Yup.object().shape({
        serviceProvider: Yup.string().required('Please select the service provider'),
    });

    if (inputs && inputs.length > 0) {
        inputs.forEach(input => {
            // BBPS uses "0" to mean "no upper bound" — treat 0/non-positive as unbounded.
            const effectiveMax = Number(input.maxLength) > 0 ? Number(input.maxLength) : 20;
            const effectiveMin = Number(input.minLength) > 0 ? Number(input.minLength) : 5;
            let fieldValidation = Yup.string()
                .trim()
                .min(effectiveMin, `${input.paramName} must be ${effectiveMin} digits`)
                .max(effectiveMax, `${input.paramName} must be ${effectiveMax} digits`);

            if (input.regex) {
                fieldValidation = fieldValidation.matches(
                    new RegExp(input.regex),
                    `Invalid ${input.paramName}`
                );
            }
            if (input.isOptional === 'false') {
                fieldValidation = fieldValidation.required(
                    `Please enter the ${input.paramName.toLowerCase()}`
                );
            }

            yupObject = yupObject.shape({
                ...yupObject.fields,
                [input.paramName]: fieldValidation,
            });
        });
    }
    return yupObject;
};

export const generateBeneficaryDynamicSchema = (inputs: CustomerParam[], accessKey?: string) => {
    let yupObject: any = Yup.object();

    if (!accessKey) {
        yupObject = yupObject.shape({
            accessKey: Yup.string().required('Please select the service'),
        });
    }

    if (accessKey === accessKeys.prepaid) {
        yupObject = yupObject.shape({
            ...yupObject.fields,
            name: Yup.string()
                .required('Please enter the beneficiary name')
                .min(3, "Beneficiary's name must have at least 3 characters")
                .test(
                    'no-leading-trailing-space',
                    "Beneficiary's name cannot start or end with a blank space.",
                    value => {
                        if (!value) return true; // Let required handle empty values
                        return value.trim() === value;
                    }
                )
                .test(
                    'no-consecutive-spaces',
                    "Beneficiary's name cannot contain consecutive blank spaces.",
                    value => {
                        if (!value) return true; // Let required handle empty values
                        return !/\s{2,}/.test(value);
                    }
                ),
            phoneNo: Yup.string()
                .matches(indianMobileRegex, 'Please enter a valid mobile number')
                .required('Please enter the mobile number'),
            serviceProvider: Yup.string().required('Please select the service provider'),
            providerCircle: Yup.string().required('Please select the circle'),
        });
        return yupObject;
    }

    yupObject = yupObject.shape({
        name: Yup.string()
            .required('Please enter the beneficiary name')
            .min(3, "Beneficiary's name must have at least 3 characters")
            .test(
                'no-leading-trailing-space',
                "Beneficiary's name cannot start or end with a blank space.",
                value => {
                    if (!value) return true; // Let required handle empty values
                    return value.trim() === value;
                }
            )
            .test(
                'no-consecutive-spaces',
                "Beneficiary's name cannot contain consecutive blank spaces.",
                value => {
                    if (!value) return true; // Let required handle empty values
                    return !/\s{2,}/.test(value);
                }
            ),
        billerId: Yup.string().required('Please select the service provider'),
    });

    if (inputs && inputs.length > 0) {
        inputs.forEach(input => {
            const formattedParamName = input.paramName
                .split(' ')
                .map((word, index) =>
                    index === 0
                        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        : word.toLowerCase()
                )
                .join(' ');

            // BBPS uses "0" to mean "no upper bound" — treat 0/non-positive as unbounded.
            const effectiveMax = Number(input.maxLength) > 0 ? Number(input.maxLength) : 50;
            let fieldValidation = Yup.string()
                .trim()
                .min(input.minLength, `${formattedParamName} must be ${input.minLength} digits`)
                .max(
                    effectiveMax,
                    `${formattedParamName} cannot exceed ${effectiveMax} characters`
                );

            if (input.regex) {
                fieldValidation = fieldValidation.matches(
                    new RegExp(input.regex),
                    `Invalid ${formattedParamName}`
                );
            }
            // Biller regex is often just a length check — enforce a valid Indian mobile number
            if (input.paramName.toLowerCase().includes('mobile')) {
                fieldValidation = fieldValidation.matches(
                    indianMobileRegex,
                    'Please enter a valid mobile number'
                );
            }
            if (input.isOptional === 'false') {
                fieldValidation = fieldValidation.required(
                    `Please enter the ${formattedParamName.toLowerCase()}`
                );
            }

            yupObject = yupObject.shape({
                [input.paramName]: fieldValidation,
            });
        });
    }
    return yupObject;
};
