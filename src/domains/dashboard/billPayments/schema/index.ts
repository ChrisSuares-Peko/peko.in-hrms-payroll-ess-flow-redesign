import * as Yup from 'yup';

import { accessKeys } from '@utils/accessKeys';

import { CustomerParam } from '../types/index';
import { challanVehicleNumberSchema } from '../utils/beneficiaryForm';

const transactionIdPattern = /^[a-zA-Z0-9]{3,50}$/;

const formatFieldName = (name: string) =>
    name
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/\bId\b/i, 'ID')
        .replace(/^./, str => str.toLowerCase());

const formatted = (name: string) => {
    if (!name) return name;

    const words = name.split(' ');

    if (words.length > 0) {
        // Capitalize the first word
        words[0] = words[0][0].toUpperCase() + words[0].slice(1).toLowerCase();
    }

    // Check second and third words
    for (let i = 1; i < words.length; i += 1) {
        if (words[i] !== 'ID' && words[i + 1] !== 'ID') {
            words[i] = words[i].toLowerCase();
        }
    }

    return words.join(' ');
};

export const generateDynamicSchema = (inputs?: CustomerParam[]) => {
    let yupObject: any = Yup.object().shape({
        serviceProvider: Yup.string().required('Please select the service provider'),
    });

    if (inputs && inputs.length > 0) {
        inputs.forEach(input => {
            let fieldValidation = Yup.string();

            const minLength = input.minLength ? Number(input.minLength) : undefined;
            const maxLength = input.maxLength ? Number(input.maxLength) : undefined;
            const isRequired = input.isOptional === 'false';
            const formattedName =
                input.paramName === 'CustomerId'
                    ? formatFieldName(input.paramName)
                    : formatted(input.paramName);

            if (minLength) {
                fieldValidation = fieldValidation.min(
                    minLength,
                    `${formattedName} must be at least ${minLength} characters`
                );
            }

            if (maxLength) {
                fieldValidation = fieldValidation.max(
                    maxLength,
                    `${formattedName} cannot exceed ${maxLength} characters`
                );
            }

            if (input.regEx) {
                fieldValidation = fieldValidation.matches(
                    new RegExp(input.regEx),
                    `Invalid ${formattedName} format`
                );
            }

            if (input.dataType === 'NUMERIC') {
                fieldValidation = fieldValidation.matches(
                    /^[0-9]+$/,
                    `${formattedName} must contain only numbers`
                );
            } else if (input.dataType === 'ALPHANUMERIC') {
                fieldValidation = fieldValidation.matches(
                    /^[a-zA-Z0-9]+$/,
                    `${formattedName} must contain only letters and numbers`
                );
            }

            if (isRequired) {
                fieldValidation = fieldValidation.required(`Please enter ${formattedName}`);
            }

            yupObject = yupObject.shape({
                ...yupObject.fields,
                [input.paramName]: fieldValidation,
            });
        });
    }
    return yupObject;
};

export const generateBeneficaryDynamicSchema = (
    inputs?: CustomerParam[],
    accessKeyName?: string,
    service?: string
) => {
    // Traffic Challan has no BBPS biller, so there is no service provider to require — only the
    // vehicle number.
    const isChallan = (service || accessKeyName) === accessKeys.challan;
    let yupObject: any = Yup.object().shape({
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
        billerId: isChallan
            ? Yup.string()
            : Yup.string().required('Please select the service provider'),
    });

    if (!accessKeyName) {
        yupObject = yupObject.shape({
            ...yupObject.fields,
            accessKey: Yup.string().required('Please select the service'),
        });
    }

    if (isChallan) {
        return yupObject.shape({ ...yupObject.fields, vehicleNumber: challanVehicleNumberSchema });
    }

    if (inputs && inputs.length > 0) {
        inputs.forEach(input => {
            const formattedName =
                input.paramName === 'CustomerId'
                    ? formatFieldName(input.paramName)
                    : formatted(input.paramName);
            // BBPS uses "0" to mean "no upper bound" — treat 0/non-positive as unbounded.
            const effectiveMax = Number(input.maxLength) > 0 ? Number(input.maxLength) : 50;
            let fieldValidation = Yup.string();
            if (formattedName === 'Mobile number') {
                fieldValidation = fieldValidation
                    .min(10, `${formattedName} must be 10 digits`)
                    .max(10, `${formattedName} must be 10 digits`);
            } else {
                fieldValidation = fieldValidation
                    .min(
                        input.minLength,
                        `${formattedName} must be at least ${input.minLength} characters`
                    )
                    .max(
                        effectiveMax,
                        `${formattedName} cannot exceed ${effectiveMax} characters`
                    );
            }
            if (input.regEx) {
                fieldValidation = fieldValidation.matches(
                    new RegExp(input.regEx),
                    `Invalid ${formattedName}`
                );
            }
            if (input.isOptional === 'false') {
                fieldValidation = fieldValidation.required(`Please enter ${formattedName}`);
            }

            yupObject = yupObject.shape({
                ...yupObject.fields,
                [input.paramName]: fieldValidation,
            });
        });
    }
    return yupObject;
};
export const complaintSchema = Yup.object().shape({
    txnRefId: Yup.string()
        .required('Please enter the B-Connect transaction ID')
        .matches(transactionIdPattern, 'Invalid Txn ID')
        .min(3, 'Minimum 3 characters are required')
        .max(50, 'Maximum 50 characters are allowed'),

    complaintDisposition: Yup.string().required('Please select the complaint disposition'),

    complaintDesc: Yup.string()
        .required('Please enter the complaint description')
        .min(10, 'Description must be at least 10 characters')
        .max(200, 'Maximum 200 characters are allowed')
        .test(
            'no-leading-trailing-space',
            'Complaint Description cannot start or end with blank space.',
            value => {
                if (typeof value !== 'string') return true;
                return value.trim() === value;
            }
        )
        .test(
            'no-consecutive-whitespaces',
            'Complaint Description cannot contain consecutive blank spaces.',
            value => {
                if (typeof value !== 'string') return true;
                return !/\s{2,}/.test(value);
            }
        ),
});
